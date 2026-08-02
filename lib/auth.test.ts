import { Prisma } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  deletionAuditFind: vi.fn(),
  deletionRequestFind: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@clerk/nextjs/server', () => ({
  auth: mocks.auth,
  currentUser: mocks.currentUser,
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      update: mocks.update,
      create: mocks.create,
    },
    accountDeletionAudit: { findUnique: mocks.deletionAuditFind },
    accountDeletionRequest: { findUnique: mocks.deletionRequestFind },
    $transaction: mocks.transaction,
  },
}))

import { getCurrentUser } from './auth'

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ userId: 'clerk-user-1' })
    mocks.findUnique.mockResolvedValue(null)
    mocks.findFirst.mockResolvedValue(null)
    mocks.deletionAuditFind.mockResolvedValue(null)
    mocks.deletionRequestFind.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (callback) => callback({
      user: {
        findUnique: mocks.findUnique,
        findFirst: mocks.findFirst,
        update: mocks.update,
        create: mocks.create,
      },
      accountDeletionAudit: { findUnique: mocks.deletionAuditFind },
      accountDeletionRequest: { findUnique: mocks.deletionRequestFind },
      $queryRaw: mocks.queryRaw,
    }))
    vi.stubEnv('DELETION_AUDIT_SECRET', 'test-deletion-audit-secret')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('does not touch Prisma without an authenticated Clerk user', async () => {
    mocks.auth.mockResolvedValue({ userId: null })

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.currentUser).not.toHaveBeenCalled()
  })

  it('returns an existing user without reprovisioning it', async () => {
    const existing = { id: 'clerk-user-1', email: 'hunter@example.com' }
    mocks.findUnique.mockResolvedValue(existing)

    await expect(getCurrentUser()).resolves.toBe(existing)
    expect(mocks.currentUser).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('keeps existing-account auth available before lifecycle activation is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DELETION_AUDIT_SECRET', '')
    const existing = { id: 'clerk-user-1', email: 'hunter@example.com' }
    mocks.findUnique.mockResolvedValue(existing)

    await expect(getCurrentUser()).resolves.toBe(existing)
    expect(mocks.deletionAuditFind).not.toHaveBeenCalled()
  })

  it('does not recreate a user with a completed deletion tombstone', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'clerk-user-1', email: 'hunter@example.com' })
    mocks.deletionAuditFind.mockResolvedValue({ id: 'audit_1' })

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(mocks.deletionAuditFind).toHaveBeenCalledWith({
      where: { subjectDigest: expect.stringMatching(/^[a-f0-9]{64}$/) },
      select: { id: true },
    })
    expect(mocks.currentUser).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('idempotently provisions from the verified primary Clerk email only', async () => {
    mocks.currentUser.mockResolvedValue({
      id: 'clerk-user-1',
      primaryEmailAddressId: 'email-primary',
      emailAddresses: [
        { id: 'email-secondary', emailAddress: 'other@example.com', verification: { status: 'verified' } },
        { id: 'email-primary', emailAddress: ' Hunter@Example.com ', verification: { status: 'verified' } },
      ],
      fullName: 'Verified Hunter',
      firstName: 'Hunter',
    })
    const provisioned = { id: 'clerk-user-1', email: 'hunter@example.com' }
    mocks.create.mockResolvedValue(provisioned)

    await expect(getCurrentUser()).resolves.toBe(provisioned)
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        id: 'clerk-user-1',
        email: 'hunter@example.com',
        name: 'Verified Hunter',
      },
    })
  })

  it('reconciles a verified legacy email row to the Clerk user ID', async () => {
    mocks.findUnique
      .mockResolvedValueOnce(null)
    mocks.findFirst.mockResolvedValueOnce({ id: 'legacy-random-uuid', email: 'Hunter@Example.com' })
    mocks.currentUser.mockResolvedValue({
      id: 'clerk-user-1',
      primaryEmailAddressId: 'email-primary',
      emailAddresses: [
        { id: 'email-primary', emailAddress: 'hunter@example.com', verification: { status: 'verified' } },
      ],
      fullName: 'Verified Hunter',
      firstName: 'Hunter',
    })
    const reconciled = { id: 'clerk-user-1', email: 'hunter@example.com' }
    mocks.update.mockResolvedValue(reconciled)

    await expect(getCurrentUser()).resolves.toBe(reconciled)
    expect(mocks.update).toHaveBeenCalledWith({
      where: { email: 'Hunter@Example.com' },
      data: { id: 'clerk-user-1' },
    })
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'hunter@example.com', mode: 'insensitive' } },
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('recovers when a parallel first request wins a unique create race', async () => {
    const concurrent = { id: 'clerk-user-1', email: 'hunter@example.com' }
    mocks.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent)
    mocks.currentUser.mockResolvedValue({
      id: 'clerk-user-1',
      primaryEmailAddressId: 'email-primary',
      emailAddresses: [
        { id: 'email-primary', emailAddress: 'hunter@example.com', verification: { status: 'verified' } },
      ],
      fullName: 'Verified Hunter',
      firstName: 'Hunter',
    })
    mocks.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique race', {
      code: 'P2002',
      clientVersion: '5.10.2',
    }))

    await expect(getCurrentUser()).resolves.toBe(concurrent)
    expect(mocks.findUnique).toHaveBeenLastCalledWith({ where: { id: 'clerk-user-1' } })
  })

  it('fails closed when the primary email is not verified', async () => {
    mocks.currentUser.mockResolvedValue({
      id: 'clerk-user-1',
      primaryEmailAddressId: 'email-primary',
      emailAddresses: [
        { id: 'email-primary', emailAddress: 'hunter@example.com', verification: { status: 'unverified' } },
      ],
      fullName: 'Hunter',
      firstName: 'Hunter',
    })

    await expect(getCurrentUser()).resolves.toBeNull()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('fails closed on new production provisioning without the deletion audit key', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DELETION_AUDIT_SECRET', '')
    mocks.currentUser.mockResolvedValue({
      id: 'clerk-user-1',
      primaryEmailAddressId: 'email-primary',
      emailAddresses: [
        { id: 'email-primary', emailAddress: 'hunter@example.com', verification: { status: 'verified' } },
      ],
      fullName: 'Hunter',
      firstName: 'Hunter',
    })

    await expect(getCurrentUser()).rejects.toThrow('lifecycle protection is not configured')
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
