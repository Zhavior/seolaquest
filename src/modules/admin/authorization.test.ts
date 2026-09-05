import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), identity: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user }))
vi.mock('@clerk/nextjs/server', () => ({ currentUser: mocks.identity }))
import { getAdminIdentity, requireAdmin } from './authorization'
const identity = (emailAddress: string, status = 'verified') => ({ id: 'owner', primaryEmailAddressId: 'primary',
  emailAddresses: [{ id: 'primary', emailAddress, verification: { status } }] })

describe('owner admin authority', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 'owner', email: 'zhavior@gmail.com' }) })
  it('grants the requested verified primary address', async () => {
    mocks.identity.mockResolvedValue(identity('Zhavior@gmail.com'))
    await expect(requireAdmin()).resolves.toEqual({ id: 'owner', email: 'zhavior@gmail.com' })
  })
  it.each([['zhavior@gmail.com', 'unverified'], ['other@gmail.com', 'verified']])('denies %s with status %s', async (email, status) => {
    mocks.identity.mockResolvedValue(identity(email, status))
    await expect(requireAdmin()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
  it('does not trust a database email or an unrelated identity', async () => {
    mocks.identity.mockResolvedValue({ ...identity('zhavior@gmail.com'), id: 'different-user' })
    await expect(getAdminIdentity()).resolves.toBeNull()
  })
  it('does not grant access through an unselected secondary address', async () => {
    mocks.identity.mockResolvedValue({ ...identity('someone@example.com'),
      emailAddresses: [...identity('someone@example.com').emailAddresses,
        { id: 'secondary', emailAddress: 'zhavior@gmail.com', verification: { status: 'verified' } }] })
    await expect(getAdminIdentity()).resolves.toBeNull()
  })
  it('rejects signed-out requests before loading a profile', async () => {
    mocks.user.mockResolvedValue(null)
    await expect(getAdminIdentity()).resolves.toBeNull()
    expect(mocks.identity).not.toHaveBeenCalled()
  })
})
