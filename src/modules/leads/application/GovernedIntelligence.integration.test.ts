// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import prisma from '@/lib/prisma'
import { AdminService } from '@/src/modules/admin/AdminService'
import { LeadOutcomeService } from './LeadOutcomeService'
import { LeadQueryService } from './LeadQueryService'
import { AuroraService } from '@/src/modules/aurora/AuroraService'
import { DeterministicScorer } from '@/src/modules/aurora/classifiers/DeterministicScorer'
import { CanonicalPolicyScorer } from '@/src/modules/aurora/classifiers/CanonicalPolicyScorer'
import { EventStore } from '@/src/modules/core/events/EventStore'

vi.mock('@/src/modules/admin/authorization', () => ({ requireAdmin: async () => ({ id: owner }) }))
vi.mock('@/lib/env', () => ({ getServerEnv: () => ({ GEMINI_MODEL: 'test-model' }) }))

const enabled = process.env.GOVERNED_INTEGRATION_TEST === 'true'
if (enabled && new URL(process.env.DATABASE_URL!).hostname !== '127.0.0.1') {
  throw new Error('Governed integration checks require an explicitly configured disposable loopback database')
}
const owner = `governed_${randomUUID()}`
const stranger = `governed_${randomUUID()}`
let keywordId: string
const leadIds: string[] = []

async function lead(sourceCreatedAt = new Date(), userId = owner) {
  const row = await prisma.lead.create({ data: {
    userId, keywordId, platform: 'TWITTER', externalPostId: randomUUID(),
    author: 'test-author', content: 'Looking to buy CRM software for my agency',
    matched: 'CRM', url: 'https://example.com/source', sourceCreatedAt,
  } })
  leadIds.push(row.id)
  return row
}
async function decision(leadId: string, status = 'LIVE', createdAt = new Date()) {
  return prisma.auroraDecision.create({ data: {
    leadId, opportunityId: leadId, sourceEventId: randomUUID(), finalScore: 95,
    confidence: 0.85, priority: 'HIGH', recommendedAction: 'ENGAGE',
    deterministicSignals: {}, semanticSignals: { commercialIntent: true },
    reasons: ['Author asks to purchase CRM'], policyFlags: ['HEURISTIC_SCORE'],
    classifierVersion: 'v2', deterministicScorerVersion: 'v1', policyVersion: 'v2',
    evaluationStatus: status, createdAt,
  } })
}

describe.skipIf(!enabled)('governed intelligence against PostgreSQL', () => {
  beforeAll(async () => {
    await prisma.user.createMany({ data: [owner, stranger].map(id => ({ id, email: `${id}@example.test` })) })
    keywordId = (await prisma.trackedKeyword.create({ data: { userId: owner, phrase: 'CRM' } })).id
  })
  afterAll(async () => {
    await prisma.domainEventLog.deleteMany({ where: { actorId: { in: [owner, stranger] } } })
    await prisma.user.deleteMany({ where: { id: { in: [owner, stranger] } } })
    await prisma.$disconnect()
  })

  it('persists decision provenance with its outbox and reuses the same evaluation receipt', async () => {
    const item = await lead()
    const classifier = { classify: vi.fn(async () => ({ confidence: 0.9,
      semanticSignals: { commercialIntent: true, relevance: 'HIGH', businessFit: 'HIGH', businessContextAvailable: true },
      reasons: ['Explicit request to buy CRM'] })) }
    const service = new AuroraService(prisma, new DeterministicScorer(), classifier, new CanonicalPolicyScorer())
    const context = { opportunityId: item.id, sourceEventId: randomUUID(), policyVersion: 'v2',
      text: item.content, source: item.platform, discoveredAt: new Date().toISOString(),
      additionalData: { leadId: item.id, userId: owner, keywordPhrase: 'CRM', exactMatch: true,
        businessDescription: 'CRM software', targetCustomer: 'Agencies' } }
    await service.evaluate(context)
    await service.evaluate(context)
    const evidence = await prisma.auroraDecision.findFirstOrThrow({ where: { opportunityId: item.id } })
    expect(evidence).toMatchObject({ leadId: item.id, classifierVersion: 'v2', policyVersion: 'v2',
      evaluationStatus: 'LIVE', recommendedAction: 'ENGAGE', inputSnapshot: context })
    expect(evidence.inputFingerprint).toMatch(/^[a-f0-9]{64}$/)
    expect(classifier.classify).toHaveBeenCalledTimes(1)
    expect(await prisma.domainEventLog.count({ where: { correlationId: context.sourceEventId } })).toBe(1)
    await expect(prisma.auroraDecision.update({ where: { id: evidence.id }, data: { finalScore: 1 } })).rejects.toThrow()
    await prisma.domainEventLog.deleteMany({ where: { correlationId: context.sourceEventId } })
    await prisma.lead.delete({ where: { id: item.id } })
  })

  it('ranks before LIMIT, respects ownership, and uses the latest decision rather than the best old score', async () => {
    for (let i = 0; i < 26; i++) await lead(new Date(Date.now() - i * 1000))
    const valuable = await lead(new Date(Date.now() - 2 * 86400000))
    await decision(valuable.id, 'LIVE', new Date(Date.now() - 10000))
    const other = await lead(new Date(), stranger)
    await decision(other.id)
    const stale = await lead(new Date(Date.now() - 10 * 86400000))
    await decision(stale.id)
    const queue = await LeadQueryService.openQueue(owner)
    expect(queue).toHaveLength(24)
    expect(queue[0]).toMatchObject({ id: valuable.id, recommendation: { eligible: true },
      aurora: { reasons: ['Author asks to purchase CRM'], confidenceMeaning: 'UNCALIBRATED' } })
    expect(queue.some(item => item.id === other.id)).toBe(false)
    await decision(valuable.id, 'FALLBACK')
    expect((await LeadQueryService.openQueue(owner)).some(item => item.recommendation?.eligible)).toBe(false)
  })

  it('serializes retries, rejects key reuse, and never turns a claim into contact', async () => {
    const item = await lead()
    const command = { userId: owner, leadId: item.id, idempotencyKey: 'same_request', input: { action: 'CLAIM' as const } }
    const responses = await Promise.all([LeadOutcomeService.record(command), LeadOutcomeService.record(command)])
    expect(new Set(responses.map(result => result.outcome.id)).size).toBe(1)
    expect(responses.map(result => result.replayed).sort()).toEqual([false, true])
    expect(await prisma.lead.findUnique({ where: { id: item.id } })).toMatchObject({ status: 'CLAIMED', contactedAt: null })
    expect(await prisma.domainEventLog.count({ where: { idempotencyKey: `opportunity.engaged:${item.id}` } })).toBe(1)
    await expect(LeadOutcomeService.record({ ...command, input: { action: 'DISMISS' } })).rejects.toMatchObject({ code: 'CONFLICT' })
    await expect(LeadOutcomeService.record({ ...command, userId: stranger })).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('records customer-reported outcomes without issuing conversion rewards, and rejects regressions', async () => {
    const item = await lead()
    const evidence = await decision(item.id)
    for (const action of ['CONTACT', 'REPLY', 'QUALIFY', 'CONVERT'] as const) {
      const result = await LeadOutcomeService.record({ userId: owner, leadId: item.id,
        idempotencyKey: `report_${action}`, input: { action, notes: 'Reported by the customer' } })
      expect(result.outcome).toMatchObject({ decisionId: evidence.id, evidenceKind: 'CUSTOMER_REPORTED' })
    }
    expect((await LeadOutcomeService.history(owner, item.id)).outcomes).toHaveLength(4)
    const tracked = await LeadQueryService.tracked(owner)
    expect(tracked.find(row => row.id === item.id)).toMatchObject({ status: 'CONVERTED', outcomes: expect.arrayContaining([expect.objectContaining({ action: 'CONVERT', evidenceKind: 'CUSTOMER_REPORTED' })]) })
    expect((await LeadQueryService.tracked(stranger)).some(row => row.id === item.id)).toBe(false)
    await expect(LeadOutcomeService.history(stranger, item.id)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(LeadOutcomeService.record({ userId: owner, leadId: item.id,
      idempotencyKey: 'regression', input: { action: 'CONTACT' } })).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(await prisma.domainEventLog.count({ where: { actorId: owner, type: 'lead.converted' } })).toBe(0)
    expect(await prisma.gamifyXpTransaction.count({ where: { actorId: owner } })).toBe(0)
  })

  it('rolls back the state and journal when the outbox cannot be written', async () => {
    const item = await lead()
    const spy = vi.spyOn(EventStore, 'writeOutbox').mockRejectedValueOnce(new Error('forced outbox failure'))
    try {
      await expect(LeadOutcomeService.record({ userId: owner, leadId: item.id,
        idempotencyKey: 'rollback_test', input: { action: 'CLAIM' } })).rejects.toThrow('forced outbox failure')
    } finally { spy.mockRestore() }
    expect(await prisma.lead.findUnique({ where: { id: item.id } })).toMatchObject({ status: 'NEW', claimedAt: null })
    expect(await prisma.leadOutcome.count({ where: { leadId: item.id } })).toBe(0)
  })

  it('reads real admin counts and atomically audits a schedule pause', async () => {
    await prisma.tenantScanSchedule.create({ data: { userId: stranger, enabled: true } })
    expect((await AdminService.overview()).users).toBeGreaterThanOrEqual(2)
    const users = await AdminService.users(owner, 1)
    expect(users.users[0].id).toBe(owner)
    expect(users.users[0]).not.toHaveProperty('crmWebhookUrl')
    expect((await AdminService.operations()).outcomes.length).toBeGreaterThan(0)
    await expect(AdminService.pauseScheduledScans(stranger)).resolves.toEqual({ paused: true })
    expect(await prisma.tenantScanSchedule.findUnique({ where: { userId: stranger } })).toMatchObject({ enabled: false })
    expect(await prisma.auditTrail.count({ where: { userId: owner, action: 'ADMIN_PAUSE_SCAN_SCHEDULE' } })).toBe(1)
    await prisma.tenantScanSchedule.update({ where: { userId: stranger }, data: { enabled: true } })
    await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_admin_audit_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced admin audit failure'; END $$`)
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_admin_audit_test BEFORE INSERT ON "AuditTrail" FOR EACH ROW EXECUTE FUNCTION fail_admin_audit_test()`)
    try { await expect(AdminService.pauseScheduledScans(stranger)).rejects.toThrow() }
    finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER fail_admin_audit_test ON "AuditTrail"')
      await prisma.$executeRawUnsafe('DROP FUNCTION fail_admin_audit_test()')
    }
    expect(await prisma.tenantScanSchedule.findUnique({ where: { userId: stranger } })).toMatchObject({ enabled: true })
  })

  it('protects journal updates, denies direct client reads, and cascades private evidence on deletion', async () => {
    const item = await lead()
    const evidence = await decision(item.id)
    const result = await LeadOutcomeService.record({ userId: owner, leadId: item.id,
      idempotencyKey: 'immutable_test', input: { action: 'CLAIM' } })
    await expect(prisma.leadOutcome.update({ where: { id: result.outcome.id }, data: { notes: 'rewritten' } })).rejects.toThrow()
    await expect(prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated')
      await tx.$queryRaw`SELECT * FROM "LeadOutcome"`
    })).rejects.toThrow()
    await prisma.lead.delete({ where: { id: item.id } })
    expect(await prisma.auroraDecision.findUnique({ where: { id: evidence.id } })).toBeNull()
    expect(await prisma.leadOutcome.findUnique({ where: { id: result.outcome.id } })).toBeNull()
  })
})
