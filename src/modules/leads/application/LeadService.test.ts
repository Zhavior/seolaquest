import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  recordOutcome: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  leadFindUnique: vi.fn(),
  leadUpdateMany: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
  revalidatePath: vi.fn(),
  loggerError: vi.fn(),
  entitlementsForUser: vi.fn(),
  crmEnqueue: vi.fn(),
  aiUsageCheck: vi.fn(),
  domainEventCreate: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('./CrmDeliveryService', () => ({
  CrmDeliveryService: { enqueue: mocks.crmEnqueue },
}))
vi.mock('@/src/modules/core/security/AiUsageLimiter', () => ({
  AiUsageLimiter: { check: mocks.aiUsageCheck },
}))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({
  logger: { error: mocks.loggerError },
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
    lead: {
      findUnique: mocks.leadFindUnique,
      updateMany: mocks.leadUpdateMany,
    },
    $transaction: mocks.transaction,
  },
}))

vi.mock('./LeadOutcomeService', () => ({ LeadOutcomeService: { record: mocks.recordOutcome } }))

import { LeadService } from './LeadService'

/*
 * The claim transaction no longer touches the User row at all — no `SELECT ...
 * FOR UPDATE`, no read of `User.xp`, no write back. `user` and `$queryRaw` are
 * still on this double so the tests below can assert that absence rather than
 * pass by accident because the property was missing.
 */
const tx = {
  $queryRaw: mocks.queryRaw,
  user: {
    findUnique: mocks.userFindUnique,
    update: mocks.userUpdate,
  },
  lead: {
    updateMany: mocks.leadUpdateMany,
  },
  // `opportunity.engaged` is written through EventStore.writeOutbox on THIS client, so the
  // double has to carry it — that is the point: the event shares the claim's transaction.
  domainEventLog: {
    create: mocks.domainEventCreate,
  },
}

describe('LeadService tenant boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.recordOutcome.mockReset().mockResolvedValue({ replayed: false })
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
    mocks.requireCurrentUser.mockResolvedValue({
      id: 'user-1',
      crmWebhookUrl: 'https://hooks.example.com/crm',
    })
    mocks.transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx))
    mocks.queryRaw.mockResolvedValue([{ id: 'user-1' }])
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' })
    mocks.crmEnqueue.mockResolvedValue({
      ok: true,
      queued: true,
      deliveryId: 'delivery-1',
      existing: false,
      status: 'QUEUED',
    })
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'BETA',
      subscriptionStatus: 'active',
      canUsePaidScans: true,
      canGenerateAIReplies: true,
      canExportToCRM: true,
    })
    mocks.aiUsageCheck.mockResolvedValue({ allowed: true })
  })

  it.each([['CLAIM', 'claimQuest'], ['DISMISS', 'dismissLead']] as const)('routes %s through the owning domain command', async (action, method) => {
    await expect(LeadService[method]('lead-1')).resolves.toEqual({ ok: true })
    expect(mocks.recordOutcome).toHaveBeenCalledWith({ userId: 'user-1', leadId: 'lead-1',
      idempotencyKey: `${action.toLowerCase()}_lead-1`, input: { action } })
    expect(mocks.userUpdate).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/app')
  })

  it('cannot read or export a lead belonging to another tenant', async () => {
    mocks.crmEnqueue.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' })

    await expect(LeadService.exportToCRM('other-tenant-lead')).resolves.toEqual({
      ok: false,
      message: 'Lead not found.',
    })
    expect(mocks.crmEnqueue).toHaveBeenCalledWith({
      userId: 'user-1',
      leadId: 'other-tenant-lead',
      normalizedDestination: 'https://hooks.example.com/crm',
    })
  })

  it('denies AI replies to a free user before reading data or calling OpenAI', async () => {
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'FREE',
      subscriptionStatus: 'inactive',
      canUsePaidScans: false,
      canGenerateAIReplies: false,
      canExportToCRM: false,
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.generateAIReply('lead-1')).resolves.toEqual({
      ok: false,
      message: 'AI replies require an active paid subscription.',
    })
    expect(mocks.entitlementsForUser).toHaveBeenCalledWith('user-1')
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.leadFindUnique).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed before reading lead data when the OpenAI key is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.generateAIReply('lead-1')).resolves.toEqual({
      ok: false,
      message: 'AI replies are temporarily unavailable.',
    })
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.leadFindUnique).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the configured OpenAI key with a bounded request', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', name: 'Hunter' })
    mocks.leadFindUnique.mockResolvedValue({
      id: 'lead-1',
      platform: 'REDDIT',
      content: 'Need a CRM',
      keyword: { phrase: 'need a CRM' },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'A helpful response.' } }],
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.generateAIReply('lead-1')).resolves.toEqual({
      ok: true,
      reply: 'A helpful response.',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-openai-key' }),
        signal: expect.any(AbortSignal),
      }),
    )
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body)).toMatchObject({ model: 'gpt-4o-mini', max_tokens: 180 })
    expect(mocks.aiUsageCheck).toHaveBeenCalledWith('user-1')
  })

  it('fails closed before OpenAI when the distributed AI limit is unavailable', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', name: 'Hunter' })
    mocks.leadFindUnique.mockResolvedValue({
      id: 'lead-1', platform: 'REDDIT', content: 'Need a CRM', keyword: { phrase: 'CRM' },
    })
    mocks.aiUsageCheck.mockResolvedValue({ allowed: false, reason: 'UNAVAILABLE' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.generateAIReply('lead-1')).resolves.toEqual({
      ok: false,
      message: 'AI replies are temporarily unavailable.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stops OpenAI cost after the daily tenant quota', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'user-1', name: 'Hunter' })
    mocks.leadFindUnique.mockResolvedValue({
      id: 'lead-1', platform: 'REDDIT', content: 'Need a CRM', keyword: { phrase: 'CRM' },
    })
    mocks.aiUsageCheck.mockResolvedValue({ allowed: false, reason: 'LIMITED' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.generateAIReply('lead-1')).resolves.toEqual({
      ok: false,
      message: 'Daily AI reply limit reached. Try again after the limit resets.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('denies CRM export to a past-due user before reading a lead or calling the webhook', async () => {
    mocks.entitlementsForUser.mockResolvedValue({
      plan: 'FREE',
      subscriptionStatus: 'past_due',
      canUsePaidScans: false,
      canGenerateAIReplies: false,
      canExportToCRM: false,
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(LeadService.exportToCRM('lead-1')).resolves.toEqual({
      ok: false,
      message: 'CRM export requires an active paid subscription.',
    })
    expect(mocks.entitlementsForUser).toHaveBeenCalledWith('user-1')
    expect(mocks.crmEnqueue).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('queues an immutable CRM delivery instead of claiming synchronous success', async () => {
    await expect(LeadService.exportToCRM('lead-1')).resolves.toEqual({
      ok: true,
      queued: true,
      deliveryId: 'delivery-1',
      message: 'Lead queued for CRM delivery.',
    })
    expect(mocks.entitlementsForUser).toHaveBeenCalledWith('user-1')
    expect(mocks.crmEnqueue).toHaveBeenCalledWith({
      userId: 'user-1',
      leadId: 'lead-1',
      normalizedDestination: 'https://hooks.example.com/crm',
    })
  })

  it('refuses a legacy unsafe webhook before reading a lead or making a request', async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: 'user-1',
      crmWebhookUrl: 'https://169.254.169.254/latest/meta-data',
    })
    await expect(LeadService.exportToCRM('lead-1')).resolves.toMatchObject({ ok: false })
    expect(mocks.crmEnqueue).not.toHaveBeenCalled()
  })
})
