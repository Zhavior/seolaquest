import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  middlewareHandler: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: vi.fn((patterns: string[]) => (request: { nextUrl: { pathname: string } }) => {
    return patterns.some((pattern) => {
      if (pattern.endsWith('(.*)')) {
        return request.nextUrl.pathname.startsWith(pattern.slice(0, -4))
      }
      return request.nextUrl.pathname === pattern
    })
  }),
  clerkMiddleware: vi.fn((middleware) => {
    mocks.middlewareHandler.mockImplementation(middleware)
    return vi.fn()
  }),
}))

import { PUBLIC_ROUTE_PATTERNS } from './proxy'

const ORIGIN = 'https://hypequest.example'

async function invokeProxy(path: string) {
  const protect = vi.fn()
  const requestUrl = new URL(path, ORIGIN)
  const response = await mocks.middlewareHandler(
    { protect },
    {
      nextUrl: { pathname: requestUrl.pathname },
      url: requestUrl.href,
    },
  )

  return { protect, response }
}

describe('Clerk public route boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exempts only the exact self-authenticating machine endpoints', () => {
    expect(PUBLIC_ROUTE_PATTERNS).toContain('/api/v1/cron/jobs')
    expect(PUBLIC_ROUTE_PATTERNS).toContain('/api/v1/webhooks/clerk')
    expect(PUBLIC_ROUTE_PATTERNS).toContain('/api/v1/webhooks/stripe')
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain('/api/v1(.*)')
    expect(PUBLIC_ROUTE_PATTERNS).not.toContain('/api/webhooks(.*)')
  })

  it.each([
    '/onboarding',
    '/app',
    '/app/keywords',
    '/api/v1/user/me',
    '/api/v1/cron/jobs/extra',
    '/api/v1/cron/scan',
    '/api/v1/webhooks/clerk/extra',
    '/api/v1/webhooks/stripe/extra',
    '/api/v1/billing/checkout',
  ])('executes auth.protect for protected route %s', async (pathname) => {
    const { protect } = await invokeProxy(pathname)

    expect(protect).toHaveBeenCalledTimes(1)
  })

  it.each([
    '/',
    '/pricing',
    '/blog',
    '/blog/phase-zero',
    '/status',
    '/login',
    '/sign-in',
    '/sign-in/account',
    '/sign-up',
    '/sign-up/account',
    '/api/v1/cron/jobs',
    '/api/v1/health/live',
    '/api/v1/health/ready',
    '/api/v1/internal/dead-letters',
    '/api/v1/webhooks/clerk',
    '/api/v1/webhooks/stripe',
    '/privacy',
    '/terms',
    '/api-terms',
  ])('does not call auth.protect for public route %s', async (pathname) => {
    const { protect, response } = await invokeProxy(pathname)

    expect(protect).not.toHaveBeenCalled()
    expect(response).toBeUndefined()
  })

  it.each([
    ['/landing', '/'],
    ['/dashboard', '/app'],
    ['/dashboard/keywords', '/app/keywords'],
    ['/billing', '/app/billing'],
    ['/profile', '/app/profile'],
    ['/guild', '/app/guild'],
    ['/keys', '/app/keys'],
    ['/settings', '/app/settings'],
    ['/specs', '/status'],
  ])('permanently redirects legacy route %s to %s', async (pathname, destination) => {
    const { protect, response } = await invokeProxy(pathname)

    expect(protect).not.toHaveBeenCalled()
    expect(response).toBeInstanceOf(Response)
    expect(response?.status).toBe(308)
    expect(response?.headers.get('location')).toBe(new URL(destination, ORIGIN).href)
  })

  it('preserves a checkout return query while redirecting the legacy billing route', async () => {
    const { protect, response } = await invokeProxy('/billing?checkout=verifying&session_id=cs_test_1')

    expect(protect).not.toHaveBeenCalled()
    expect(response?.status).toBe(308)
    expect(response?.headers.get('location')).toBe(
      `${ORIGIN}/app/billing?checkout=verifying&session_id=cs_test_1`,
    )
  })
})
