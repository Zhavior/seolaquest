import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  middlewareHandler: vi.fn(),
  clerkEntry: vi.fn(),
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
    return mocks.clerkEntry
  }),
}))

import type { NextFetchEvent, NextRequest } from 'next/server'
import middleware, { PUBLIC_ROUTE_PATTERNS, SESSIONLESS_ROUTE_PATTERNS } from './middleware'

const ORIGIN = 'https://seolaquest.example'

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

function route(path: string) {
  const url = new URL(path, ORIGIN)
  const request = { nextUrl: { pathname: url.pathname }, url: url.href } as unknown as NextRequest
  return middleware(request, {} as NextFetchEvent)
}

describe('routes that skip Clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('answers a marketing page without touching Clerk', () => {
    for (const path of ['/', '/pricing', '/radar', '/blog', '/status', '/privacy']) {
      expect(route(path)).toBeInstanceOf(Response)
    }
    expect(mocks.clerkEntry).not.toHaveBeenCalled()
  })

  it('sends the signed-in app, auth pages and APIs through Clerk', () => {
    for (const path of ['/app', '/app/settings', '/welcome', '/sign-in', '/sign-up', '/api/v1/geo/scans', '/admin']) {
      route(path)
    }
    expect(mocks.clerkEntry).toHaveBeenCalledTimes(7)
  })

  it('still answers an unknown article with a real 404', () => {
    expect((route('/blog/no-such-post') as Response).status).toBe(404)
    expect(mocks.clerkEntry).not.toHaveBeenCalled()
  })

  it('is a subset of the public routes, so it can never expose a protected page', () => {
    for (const pattern of SESSIONLESS_ROUTE_PATTERNS) expect(PUBLIC_ROUTE_PATTERNS).toContain(pattern)
  })
})

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

  it('never exposes the /dev design previews in a production build', async () => {
    // The pattern list is read at module load, so the guard is asserted through
    // a fresh import under a production environment rather than by mutating it.
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()

    const { PUBLIC_ROUTE_PATTERNS: productionPatterns } = await import('./middleware')
    expect(productionPatterns).not.toContain('/dev(.*)')

    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each([
    '/onboarding',
    '/app',
    '/app/keywords',
    '/radar-admin',
    '/radar/extra',
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
    '/radar',
    '/blog',
    '/blog/guild-lore-origin',
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
    // These three shipped and then served 404 in production, because .txt and
    // .xml are absent from the matcher's extension allow-list and
    // auth.protect() 404s a non-document request instead of redirecting it.
    // A blocked robots.txt is invisible until someone thinks to fetch it.
    '/robots.txt',
    '/sitemap.xml',
    '/opengraph-image',
    // Sentry's browser tunnel. Protecting it would silently discard every
    // client-side error report from a logged-out visitor — which is most of
    // the traffic the marketing pages exist to receive.
    '/monitoring',
    '/monitoring/envelope',
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

  it.each(['/blog/does-not-exist', '/blog/phase-zero', '/blog/does-not-exist/', '/blog/100%', '/blog/%FF'])(
    'answers an unknown article %s with a real 404, without auth',
    (path) => {
      expect((route(path) as Response).status).toBe(404)
      expect(mocks.clerkEntry).not.toHaveBeenCalled()
    },
  )

  it('preserves a checkout return query while redirecting the legacy billing route', async () => {
    const { protect, response } = await invokeProxy('/billing?checkout=verifying&session_id=cs_test_1')

    expect(protect).not.toHaveBeenCalled()
    expect(response?.status).toBe(308)
    expect(response?.headers.get('location')).toBe(
      `${ORIGIN}/app/billing?checkout=verifying&session_id=cs_test_1`,
    )
  })
})
