import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const PUBLIC_ROUTE_PATTERNS = [
  '/',
  '/pricing',
  // Subtree, not prefix. '/blog(.*)' would also have made /blogadmin, /blog-internal
  // and any future /blog<suffix> route public.
  '/blog',
  '/blog/(.*)',
  '/status',
  '/login',
  // These two MUST keep the broad prefix form. <SignIn/> and <SignUp/> are mounted in
  // Next.js optional catch-all segments (app/sign-in/[[...sign-in]]), and Clerk probes
  // '<path>/<Component>_clerk_catchall_check_<ts>' at runtime; if that child 404s or is
  // protected, Clerk throws a configuration error. See useEnforceCatchAllRoute in
  // @clerk/nextjs, which explicitly prescribes adding '(.*)' to the route pattern.
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy',
  '/terms',
  '/api-terms',
  // Sentry's browser tunnel (`tunnelRoute` in next.config.ts). Client-side
  // error reports POST here instead of to sentry.io so ad-blockers do not eat
  // them. It MUST be public: the visitors whose crashes matter most are the
  // logged-out ones on the marketing pages, and auth.protect() would bounce
  // their reports to /sign-in where Sentry never sees them.
  '/monitoring(.*)',
  // These machine endpoints authenticate themselves. Keep the exceptions exact.
  '/api/v1/cron/jobs',
  '/api/v1/health/live',
  '/api/v1/health/ready',
  '/api/v1/internal/dead-letters',
  '/api/v1/webhooks/clerk',
  '/api/v1/webhooks/stripe',
  // Design previews under /dev render real components against fixed props and
  // touch no account data. They are public only outside production, and the
  // pages themselves 404 there, so this can never widen the live boundary.
  ...(process.env.NODE_ENV === 'production' ? [] : ['/dev(.*)']),
]

const isPublicRoute = createRouteMatcher(PUBLIC_ROUTE_PATTERNS)

export default clerkMiddleware(async (auth, request) => {
  const legacyRedirects: Record<string, string> = {
    '/landing': '/',
    '/dashboard': '/app',
    '/dashboard/keywords': '/app/keywords',
    '/billing': '/app/billing',
    '/profile': '/app/profile',
    '/guild': '/app/guild',
    '/keys': '/app/keys',
    '/settings': '/app/settings',
    '/specs': '/status',
  }
  const destination = legacyRedirects[request.nextUrl.pathname]
  if (destination) {
    const redirectUrl = new URL(request.url)
    redirectUrl.pathname = destination
    return NextResponse.redirect(redirectUrl, 308)
  }
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
