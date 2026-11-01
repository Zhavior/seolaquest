// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getClaudeClient: vi.fn(),
  create: vi.fn(),
  writeFileSync: vi.fn(),
}))

vi.mock('./anthropic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./anthropic')>()),
  getClaudeClient: mocks.getClaudeClient,
}))
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  const fs = { ...actual, existsSync: () => true, writeFileSync: mocks.writeFileSync }
  return { ...fs, default: fs }
})

import { generateAndSaveBlogPost } from './aiBlogger'

describe('generateAndSaveBlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClaudeClient.mockReturnValue({ beta: { messages: { create: mocks.create } } })
  })

  it('makes one paid attempt, with SDK retries off', async () => {
    mocks.create.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: '# Body' }] })

    await generateAndSaveBlogPost({ topic: 'A safe topic' })

    expect(mocks.create).toHaveBeenCalledTimes(1)
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-5-5' }),
      { timeout: 120_000, maxRetries: 0 },
    )
    expect(mocks.writeFileSync.mock.calls[0][1]).toContain('# Body')
  })

  it('saves the claim-free template when the call fails', async () => {
    mocks.create.mockRejectedValue(new Error('upstream'))

    await generateAndSaveBlogPost({ topic: 'A safe topic' })

    expect(mocks.writeFileSync.mock.calls[0][1]).toContain('created without a configured language-model provider')
  })
})
