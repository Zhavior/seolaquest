import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  protect: vi.fn(),
  has: vi.fn(),
  clerkClient: vi.fn(),
  deleteUser: vi.fn(),
  prepareDeletion: vi.fn(),
  promoteDeletion: vi.fn(),
  reverificationError: vi.fn((level) => ({
    clerk_error: { type: 'forbidden', reason: 'reverification-error', metadata: { reverification: level } },
  })),
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: { protect: mocks.protect },
  clerkClient: mocks.clerkClient,
  reverificationError: mocks.reverificationError,
}))
vi.mock('@/src/modules/lifecycle/application/AccountDeletionService', () => ({
  AccountDeletionService: {
    prepareSelfServiceDeletion: mocks.prepareDeletion,
    promoteSelfServiceDeletion: mocks.promoteDeletion,
  },
}))

import { deleteAccountAction } from './actions'

describe('deleteAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'true')
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_clerk')
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'whsec_clerk')
    vi.stubEnv('DELETION_AUDIT_SECRET', 'audit_secret')
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'true')
    vi.stubEnv('CRON_SECRET', 'cron-secret-0123456789abcdef012345678')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_deletion')
    vi.stubEnv('STRIPE_LIVEMODE', 'false')
    mocks.protect.mockResolvedValue({ userId: 'user_1', has: mocks.has })
    mocks.clerkClient.mockResolvedValue({ users: { deleteUser: mocks.deleteUser } })
    mocks.deleteUser.mockResolvedValue({ id: 'user_1', deleted: true })
    mocks.prepareDeletion.mockResolvedValue({ prepared: true, alreadyAccepted: false })
    mocks.promoteDeletion.mockResolvedValue({ promoted: true, alreadyAccepted: false })
  })

  it('requires strict reverification before asking Clerk to delete the user', async () => {
    mocks.has.mockReturnValue(false)

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toEqual({
      clerk_error: {
        type: 'forbidden',
        reason: 'reverification-error',
        metadata: { reverification: 'strict' },
      },
    })
    expect(mocks.has).toHaveBeenCalledWith({ reverification: 'strict' })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('requires the exact confirmation phrase', async () => {
    mocks.has.mockReturnValue(true)
    await expect(deleteAccountAction('delete my account')).resolves.toMatchObject({ ok: false })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('fails closed when webhook intake is not configured', async () => {
    mocks.has.mockReturnValue(true)
    vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', '')

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toMatchObject({ ok: false })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('fails closed while self-service account deletion is not activated', async () => {
    mocks.has.mockReturnValue(true)
    vi.stubEnv('ACCOUNT_DELETION_ENABLED', 'false')

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toMatchObject({ ok: false })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('deletes only the protected Clerk user and does not claim the local purge finished', async () => {
    mocks.has.mockReturnValue(true)
    const result = await deleteAccountAction('DELETE MY ACCOUNT')

    expect(mocks.prepareDeletion).toHaveBeenCalledWith('user_1')
    expect(mocks.deleteUser).toHaveBeenCalledWith('user_1')
    expect(mocks.promoteDeletion).toHaveBeenCalledWith('user_1')
    expect(result).toMatchObject({ ok: true })
    expect(JSON.stringify(result).toLowerCase()).not.toContain('purge complete')
  })

  it('does not call Clerk unless the durable billing freeze commits first', async () => {
    mocks.has.mockReturnValue(true)
    mocks.prepareDeletion.mockRejectedValue(new Error('database unavailable'))

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toEqual({
      ok: false,
      message: 'Account deletion could not be prepared safely. No identity deletion was requested.',
    })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('keeps the prepared freeze when a Clerk error has an ambiguous outcome', async () => {
    mocks.has.mockReturnValue(true)
    mocks.deleteUser.mockRejectedValue(new Error('Clerk rejected deletion'))

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toEqual({
      ok: false,
      message: 'Identity deletion was not confirmed. Billing remains frozen while deletion state is reconciled.',
    })
    expect(mocks.promoteDeletion).not.toHaveBeenCalled()
  })

  it('keeps billing frozen when Clerk failure is ambiguous and cancellation loses the race', async () => {
    mocks.has.mockReturnValue(true)
    mocks.deleteUser.mockRejectedValue(new Error('connection reset'))
    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toEqual({
      ok: false,
      message: 'Identity deletion was not confirmed. Billing remains frozen while deletion state is reconciled.',
    })
  })

  it('refuses to delete the identity unless the durable worker and cron are enabled', async () => {
    mocks.has.mockReturnValue(true)
    vi.stubEnv('DURABLE_WORKER_ENABLED', 'false')

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toMatchObject({ ok: false })
    expect(mocks.prepareDeletion).not.toHaveBeenCalled()
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })

  it('leaves the freeze for the signed webhook when promotion fails after Clerk succeeds', async () => {
    mocks.has.mockReturnValue(true)
    mocks.promoteDeletion.mockRejectedValue(new Error('database unavailable'))

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toMatchObject({ ok: true })
  })

  it('does not call Clerk while a hosted Checkout can still complete', async () => {
    mocks.has.mockReturnValue(true)
    mocks.prepareDeletion.mockResolvedValue({
      prepared: false,
      alreadyAccepted: false,
      pendingCheckout: true,
    })

    await expect(deleteAccountAction('DELETE MY ACCOUNT')).resolves.toEqual({
      ok: false,
      message: 'Account deletion is blocked while a Stripe Checkout is pending. Finish or cancel it, then wait for payment verification before trying again.',
    })
    expect(mocks.deleteUser).not.toHaveBeenCalled()
  })
})
