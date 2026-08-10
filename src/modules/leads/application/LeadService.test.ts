import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
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

  it('atomically claims only a NEW lead owned by the current user', async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    await expect(LeadService.claimQuest('lead-1')).resolves.toEqual({ ok: true })
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith({
      where: { id: 'lead-1', userId: 'user-1', status: 'NEW' },
      data: {
        status: 'CONTACTED',
        claimedAt: expect.any(Date),
        contactedAt: expect.any(Date),
      },
    })
  })

  /**
   * Claiming pays nothing here any more, and that is the point of this test.
   *
   * Progression belongs to `GamifyProfile`; XP for this claim is minted later by
   * `GamifyLedgerService` when the outbox delivers `opportunity.engaged`, behind
   * the eligibility rules every other award goes through. If the claim also wrote
   * `User.xp` there would be two owners of one number, and two owners of one
   * number always end up disagreeing. So: no row lock, no read, no write, and no
   * progression handed back for the client to render optimistically — the ledger
   * has not decided yet, and it is entitled to decline.
   */
  it('claims without locking, reading or writing the user progression columns', async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    const result = await LeadService.claimQuest('lead-1')

    expect(result).not.toHaveProperty('user')
    expect(mocks.queryRaw).not.toHaveBeenCalled()
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  /**
   * Gamify pays XP for `opportunity.engaged`, so this event is the user's reward. It has to
   * ride the claim's own transaction — if the status update commits and the event does not,
   * the user did the work and silently earned nothing, with no failure anywhere to notice.
   */
  it('emits opportunity.engaged inside the claim transaction', async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    await LeadService.claimQuest('lead-1')

    expect(mocks.domainEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'opportunity.engaged',
          actorId: 'user-1',
          status: 'PENDING',
          // Keyed on the lead, so a replay cannot mint a second reward for one engagement.
          idempotencyKey: 'opportunity.engaged:lead-1',
          payload: expect.objectContaining({ leadId: 'lead-1', actionTaken: 'CLAIMED' }),
        }),
      }),
    )
  })

  it('does not emit opportunity.engaged when the lead was already claimed', async () => {
    // The `status: 'NEW'` predicate matched nothing: someone else claimed it first.
    mocks.leadUpdateMany.mockResolvedValue({ count: 0 })

    await expect(LeadService.claimQuest('lead-1')).resolves.toMatchObject({ ok: false })

    expect(mocks.domainEventCreate).not.toHaveBeenCalled()
    expect(mocks.userUpdate).not.toHaveBeenCalled()
  })

  /**
   * Two leads claimed at once must produce two engagement events.
   *
   * This used to be the read-modify-write race on `User.xp`, where interleaved
   * claims could overwrite each other's total and lose an award. Dropping the
   * column dropped the race, but not the requirement behind it: each claim is a
   * separate earned reward, so each has to reach the ledger under its own
   * lead-keyed idempotency key. One event for two claims would still lose XP,
   * just one layer further down.
   */
  it('emits one engagement event per lead when claims overlap', async () => {
    let transactionQueue = Promise.resolve()
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => {
      const result = transactionQueue.then(() => callback(tx))
      transactionQueue = result.then(() => undefined, () => undefined)
      return result
    })
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    const results = await Promise.all([
      LeadService.claimQuest('lead-1'),
      LeadService.claimQuest('lead-2'),
    ])

    expect(results).toEqual([{ ok: true }, { ok: true }])
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-1', userId: 'user-1', status: 'NEW' },
    }))
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-2', userId: 'user-1', status: 'NEW' },
    }))
    expect(mocks.domainEventCreate).toHaveBeenCalledTimes(2)
    expect(
      mocks.domainEventCreate.mock.calls.map(([call]) => call.data.idempotencyKey).sort(),
    ).toEqual(['opportunity.engaged:lead-1', 'opportunity.engaged:lead-2'])
  })

  it('does not reach the ledger when another request already changed the lead', async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 0 })

    await expect(LeadService.claimQuest('lead-1')).resolves.toMatchObject({ ok: false })
    expect(mocks.domainEventCreate).not.toHaveBeenCalled()
    expect(mocks.userUpdate).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it('dismisses with one atomic owner and state predicate', async () => {
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    await expect(LeadService.dismissLead('lead-1')).resolves.toEqual({ ok: true })
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith({
      where: { id: 'lead-1', userId: 'user-1', status: 'NEW' },
      data: { status: 'DISMISSED', dismissedAt: expect.any(Date) },
    })
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
