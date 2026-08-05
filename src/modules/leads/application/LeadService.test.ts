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

const tx = {
  $queryRaw: mocks.queryRaw,
  user: {
    findUnique: mocks.userFindUnique,
    update: mocks.userUpdate,
  },
  lead: {
    updateMany: mocks.leadUpdateMany,
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
    mocks.userFindUnique.mockResolvedValue({ xp: 95, level: 1, xpRequired: 100 })
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })

    await expect(LeadService.claimQuest('lead-1')).resolves.toEqual({
      ok: true,
      user: { xp: 5, level: 2, xpRequired: 150, xpMultiplier: 1.1, didLevelUp: true },
    })
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith({
      where: { id: 'lead-1', userId: 'user-1', status: 'NEW' },
      data: {
        status: 'CONTACTED',
        claimedAt: expect.any(Date),
        contactedAt: expect.any(Date),
      },
    })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { xp: 5, level: 2, xpRequired: 150, xpMultiplier: 1.1, didLevelUp: true },
    })
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1)
    expect(mocks.queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.userFindUnique.mock.invocationCallOrder[0],
    )
  })

  it('preserves both XP awards when different leads are claimed concurrently', async () => {
    let progression = { xp: 0, level: 1, xpRequired: 100 }
    let transactionQueue = Promise.resolve()
    mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => {
      const result = transactionQueue.then(() => callback(tx))
      transactionQueue = result.then(() => undefined, () => undefined)
      return result
    })
    mocks.userFindUnique.mockImplementation(async () => progression)
    mocks.leadUpdateMany.mockResolvedValue({ count: 1 })
    mocks.userUpdate.mockImplementation(async ({ data }) => {
      progression = data
      return { id: 'user-1', ...progression }
    })

    const results = await Promise.all([
      LeadService.claimQuest('lead-1'),
      LeadService.claimQuest('lead-2'),
    ])

    expect(results).toEqual([
      { ok: true, user: { xp: 10, level: 1, xpRequired: 100, xpMultiplier: 1, didLevelUp: false } },
      { ok: true, user: { xp: 20, level: 1, xpRequired: 100, xpMultiplier: 1, didLevelUp: false } },
    ])
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2)
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-1', userId: 'user-1', status: 'NEW' },
    }))
    expect(mocks.leadUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'lead-2', userId: 'user-1', status: 'NEW' },
    }))
    expect(progression.xp).toBe(20)
  })

  it('does not award XP when another request already changed the lead', async () => {
    mocks.userFindUnique.mockResolvedValue({ xp: 10, level: 1, xpRequired: 100 })
    mocks.leadUpdateMany.mockResolvedValue({ count: 0 })

    await expect(LeadService.claimQuest('lead-1')).resolves.toMatchObject({ ok: false })
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
