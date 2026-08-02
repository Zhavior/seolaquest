import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  entitlementsForUser: vi.fn(),
  enqueueManual: vi.fn(),
  addKeyword: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/billing/application/EntitlementService', () => ({
  EntitlementService: { forUser: mocks.entitlementsForUser },
}))
vi.mock('@/src/modules/leads/application/ScanRunService', () => ({
  ScanRunService: { enqueueManual: mocks.enqueueManual },
}))
vi.mock('@/src/modules/keywords/application/KeywordService', () => ({
  KeywordService: { addKeyword: mocks.addKeyword },
}))

import { addKeywordAction, scanForLeadsAction } from './actions'

describe('scanForLeadsAction durable acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.entitlementsForUser.mockResolvedValue({ canUsePaidScans: true })
    mocks.enqueueManual.mockResolvedValue({ queued: true, runId: 'run-1' })
    mocks.addKeyword.mockResolvedValue({ id: 'keyword-db-id', phrase: 'CRM', active: true })
  })

  it('denies an unentitled caller before accepting durable work', async () => {
    mocks.entitlementsForUser.mockResolvedValue({ canUsePaidScans: false })
    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: false,
      message: 'Manual scanning requires an active paid subscription.',
    })
    expect(mocks.enqueueManual).not.toHaveBeenCalled()
  })

  it('returns the truthful queued state instead of fake completed results', async () => {
    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: true,
      queued: true,
      runId: 'run-1',
      message: 'Scan queued. Results will appear after processing.',
    })
    expect(mocks.enqueueManual).toHaveBeenCalledWith('user-1')
  })

  it.each([
    ['NO_ACTIVE_KEYWORDS', 'Add a keyword before scanning.'],
    ['NOT_ENTITLED', 'Manual scanning requires an active paid subscription.'],
    ['NO_CREDITS', 'No scan credits remaining.'],
  ])('maps %s acceptance failure without claiming completion', async (reason, message) => {
    mocks.enqueueManual.mockResolvedValue({ queued: false, reason })
    await expect(scanForLeadsAction()).resolves.toEqual({ ok: false, message })
  })

  it('reports an already accepted scan as queued without creating a second run', async () => {
    mocks.enqueueManual.mockResolvedValue({ queued: false, existing: true, runId: 'run-existing' })
    await expect(scanForLeadsAction()).resolves.toEqual({
      ok: true,
      queued: true,
      runId: 'run-existing',
      message: 'A scan is already queued for this window.',
    })
  })

  it('returns the persisted keyword DTO to the browser', async () => {
    await expect(addKeywordAction('CRM')).resolves.toEqual({
      ok: true,
      keyword: { id: 'keyword-db-id', phrase: 'CRM', active: true },
    })
  })
})
