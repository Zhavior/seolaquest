import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/lib/prisma', () => ({ default: { user: { update: mocks.update } } }))

import { UserService } from './UserService'

describe('UserService.updateSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.update.mockResolvedValue({ id: 'user-1' })
  })

  it('fails closed before persistence for an unsafe CRM webhook', async () => {
    await expect(UserService.updateSettings({
      name: 'Hunter',
      title: 'Founder',
      emailDigest: true,
      radarAlerts: true,
      crmWebhookUrl: 'https://127.0.0.1/internal',
    })).resolves.toMatchObject({ ok: false })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('stores only the normalized safe URL for the current user', async () => {
    await expect(UserService.updateSettings({
      name: ' Hunter ',
      title: ' Founder ',
      emailDigest: false,
      radarAlerts: true,
      crmWebhookUrl: ' https://hooks.example.com/crm#fragment ',
    })).resolves.toEqual({ ok: true })

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Hunter',
        title: 'Founder',
        emailDigest: false,
        radarAlerts: true,
        crmWebhookUrl: 'https://hooks.example.com/crm',
      },
    })
  })
})
