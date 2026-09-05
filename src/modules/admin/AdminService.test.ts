import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ admin: vi.fn(), count: vi.fn(), transaction: vi.fn(), pause: vi.fn(), audit: vi.fn() }))
vi.mock('./authorization', () => ({ requireAdmin: mocks.admin }))
vi.mock('@/src/modules/leads/application/ScanSchedulerService', () => ({ ScanSchedulerService: { pauseSchedule: mocks.pause } }))
vi.mock('@/lib/prisma', () => ({ default: { user: { count: mocks.count }, $transaction: mocks.transaction } }))
import { AdminService } from './AdminService'
const tx = { auditTrail: { create: mocks.audit } }
describe('admin service boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.admin.mockResolvedValue({ id: 'owner' });
    mocks.transaction.mockImplementation(async fn => fn(tx)); mocks.pause.mockResolvedValue({ count: 1 }) })
  it('denies reads and mutations before accessing the database', async () => {
    mocks.admin.mockRejectedValue(new Error('Forbidden'))
    await expect(AdminService.overview()).rejects.toThrow('Forbidden')
    await expect(AdminService.users('', 1)).rejects.toThrow('Forbidden')
    await expect(AdminService.operations()).rejects.toThrow('Forbidden')
    await expect(AdminService.pauseScheduledScans('target')).rejects.toThrow('Forbidden')
    expect(mocks.count).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
  it('keeps the owner audit and domain mutation in the same transaction', async () => {
    await expect(AdminService.pauseScheduledScans('target')).resolves.toEqual({ paused: true })
    expect(mocks.pause).toHaveBeenCalledWith('target', tx)
    expect(mocks.audit).toHaveBeenCalledWith({ data: { userId: 'owner', action: 'ADMIN_PAUSE_SCAN_SCHEDULE',
      entityType: 'TenantScanSchedule', entityId: 'target', status: 'SUCCESS', metadata: { changed: 1 } } })
  })
  it('fails the transaction when the audit cannot be saved', async () => {
    mocks.audit.mockRejectedValueOnce(new Error('audit unavailable'))
    await expect(AdminService.pauseScheduledScans('target')).rejects.toThrow('audit unavailable')
  })
})
