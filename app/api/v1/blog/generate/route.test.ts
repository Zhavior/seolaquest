import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  generateAndSaveBlogPost: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/aiBlogger', () => ({
  generateAndSaveBlogPost: mocks.generateAndSaveBlogPost,
}))

import { POST } from './route'

function request(body: unknown) {
  return new Request('https://seolaquest.test/api/v1/blog/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('blog generation boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('BLOG_ADMIN_USER_IDS', 'user-admin')
    vi.stubEnv('OPENAI_API_KEY', 'server-owned-key')
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-admin' })
    mocks.generateAndSaveBlogPost.mockResolvedValue({
      slug: 'safe-post',
      title: 'Safe post',
      filePath: '/secret/runtime/path/safe-post.mdx',
      readTimeMinutes: 5,
      message: 'Published',
    })
  })

  it('rejects unauthenticated and non-admin callers before generation', async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null)
    expect((await POST(request({ topic: 'A safe topic' }))).status).toBe(401)

    mocks.getCurrentUser.mockResolvedValueOnce({ id: 'user-customer' })
    expect((await POST(request({ topic: 'A safe topic' }))).status).toBe(403)
    expect(mocks.generateAndSaveBlogPost).not.toHaveBeenCalled()
  })

  it('fails closed in production until durable publishing is explicitly enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('BLOG_PUBLISHING_ENABLED', 'false')

    const response = await POST(request({ topic: 'A safe topic' }))

    expect(response.status).toBe(503)
    expect(mocks.generateAndSaveBlogPost).not.toHaveBeenCalled()
  })

  it('ignores a caller API key and never returns the runtime file path', async () => {
    const response = await POST(request({
      topic: 'A safe topic',
      category: 'SaaS',
      apiKey: 'caller-controlled-key',
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.generateAndSaveBlogPost).toHaveBeenCalledWith({
      topic: 'A safe topic',
      tag: 'SaaS',
      author: undefined,
      authorRole: undefined,
      apiKey: 'server-owned-key',
    })
    expect(body).not.toHaveProperty('filePath')
    expect(JSON.stringify(body)).not.toContain('/secret/runtime/path')
  })

  it('rejects invalid payloads without invoking generation', async () => {
    const response = await POST(request({ topic: 'x' }))

    expect(response.status).toBe(400)
    expect(mocks.generateAndSaveBlogPost).not.toHaveBeenCalled()
  })
})
