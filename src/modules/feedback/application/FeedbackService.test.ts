import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireCurrentUser: mocks.requireCurrentUser }))
vi.mock('@/src/modules/core/infrastructure/logger', () => ({ logger: { info: mocks.info } }))

import { FeedbackService } from './FeedbackService'

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireCurrentUser.mockResolvedValue({ id: 'clerk-secret-id', email: 'private@example.com' })
  })

  it('fails closed when bug reports have no durable destination', async () => {
    const result = await FeedbackService.submitBugReport({
      category: 'billing',
      severity: 'high',
      description: 'My private invoice says 4242',
    })

    expect(result).toEqual({
      ok: false,
      message: 'Bug report delivery is not available yet. Nothing was submitted.',
    })
    const logged = JSON.stringify(mocks.info.mock.calls)
    expect(logged).not.toContain('clerk-secret-id')
    expect(logged).not.toContain('private@example.com')
    expect(logged).not.toContain('private invoice')
    expect(mocks.info).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'bug_report', contentLength: 28 }),
      'Feedback persistence is unavailable',
    )
  })

  it('does not claim empty feedback was submitted', async () => {
    await expect(FeedbackService.submitFeedbackScroll({
      title: '',
      category: 'idea',
      description: '',
    })).resolves.toEqual({
      ok: false,
      message: 'Please provide both a title and description for your scroll.',
    })
    expect(mocks.info).not.toHaveBeenCalled()
  })
})
