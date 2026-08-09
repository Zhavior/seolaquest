// No `@vitest-environment` docblock on purpose: this file must run in the project default
// (jsdom, see vitest.config.ts) using the GLOBAL `next/navigation` mock from vitest.setup.ts.
//
// That is the whole point of the file. `withServerAction`'s catch opens with
// `unstable_rethrow`, and the global mock used to omit it, so any jsdom test that drove a
// wrapped action into that catch died on `TypeError: unstable_rethrow is not a function`
// before it could assert anything. The redirect hazard was therefore only reachable from
// `server-action.test.ts`, which shadows the global mock with `importActual` and pins the
// node environment — nothing else could test it, and no component test could either.
//
// These cases deliberately do NOT import the real implementation. If someone strips
// `unstable_rethrow`, `redirect` or `notFound` back out of vitest.setup.ts, or replaces the
// digest matching with a stub that returns instead of throwing, these fail.
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

// Same reasoning as server-action.test.ts: without a request scope the caller is
// UNIDENTIFIED and the action's own tier is bypassed.
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }),
}))

import { notFound, redirect } from 'next/navigation'

import { RateLimiterService } from '@/src/modules/core/security/RateLimiter'
import { baseLogger } from './logger'
import { withServerAction } from './server-action'

const enforce = vi.mocked(RateLimiterService.enforce)
const error = vi.spyOn(baseLogger, 'error').mockImplementation(() => undefined)
vi.spyOn(baseLogger, 'warn').mockImplementation(() => undefined)

beforeEach(() => {
  vi.clearAllMocks()
  enforce.mockResolvedValue(undefined)
})

describe('the global next/navigation mock supports the redirect hazard under jsdom', () => {
  it('exposes a callable unstable_rethrow', async () => {
    const { unstable_rethrow } = await import('next/navigation')

    expect(typeof unstable_rethrow).toBe('function')
    // A non-control-flow error must pass straight through without throwing, or the wrapper
    // could never reach `classify` and every failure would surface as the original error.
    expect(() => unstable_rethrow(new Error('ordinary failure'))).not.toThrow()
  })

  it('lets a redirect() throw propagate out of a wrapped action instead of being swallowed', async () => {
    const action = withServerAction({ name: 'jsdom-redirects' }, async () => {
      redirect('/dashboard')
      return 'unreachable'
    })

    const caught = await action().then(
      (value) => ({ resolved: true as const, value }),
      (err: unknown) => ({ resolved: false as const, err }),
    )

    // Rule out the failure envelope explicitly: a swallowed redirect RESOLVES with
    // { ok: false, ... } rather than rejecting, and the user never navigates.
    expect(caught.resolved).toBe(false)
    if (caught.resolved) return

    const digest = (caught.err as { digest?: string }).digest
    expect(digest).toMatch(/^NEXT_REDIRECT;/)
    expect(digest?.split(';').slice(2, -2).join(';')).toBe('/dashboard')

    // Control flow is not an application error.
    expect(error).not.toHaveBeenCalled()
  })

  it('lets a notFound() throw propagate out of a wrapped action', async () => {
    const action = withServerAction({ name: 'jsdom-not-founds' }, async () => {
      notFound()
    })

    await expect(action()).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })
    expect(error).not.toHaveBeenCalled()
  })

  it('propagates a redirect even when an onError translator is configured', async () => {
    // The dangerous ordering is "classify, translate, return" with the rethrow after it:
    // with a translator present a broken wrapper returns this sentinel instead of throwing.
    const action = withServerAction(
      { name: 'jsdom-redirects-with-onerror', onError: () => ({ outcome: 'translated' as const }) },
      async () => {
        redirect('/dashboard')
        return { outcome: 'ok' as const }
      },
    )

    await expect(action()).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT;/) as unknown as string,
    })
  })

  it('unwraps a redirect hidden behind an error cause, as the real unstable_rethrow does', async () => {
    const action = withServerAction({ name: 'jsdom-wrapped-redirect' }, async () => {
      try {
        redirect('/dashboard')
      } catch (cause) {
        // An intermediate layer boxing the error must not defeat the rethrow.
        throw new Error('wrapped', { cause })
      }
      return 'unreachable'
    })

    await expect(action()).rejects.toMatchObject({ message: 'wrapped' })
  })

  it('still classifies an ordinary failure into the failure envelope', async () => {
    // The counterweight: the rethrow must not turn every error into a throw, or the wrapper
    // stops returning failures as data and blows up the nearest error boundary instead.
    const action = withServerAction({ name: 'jsdom-ordinary-failure' }, async () => {
      throw new Error('database is on fire')
    })

    await expect(action()).resolves.toMatchObject({ ok: false })
  })
})
