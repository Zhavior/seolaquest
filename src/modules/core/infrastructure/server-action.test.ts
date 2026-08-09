// @vitest-environment node
//
// A Server Action runs on the server, and `unstable_rethrow` picks a different, *narrower*
// implementation when `typeof window !== 'undefined'`. Running these under jsdom would
// exercise the browser build and quietly stop covering the dynamic-rendering and prerender
// bailout signals, so this file pins the node environment.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { AppError, RateLimitError } from './errors'

// Rate limiting is covered by RateLimiter.test.ts; these cases exercise the wrapper.
vi.mock('@/src/modules/core/security/RateLimiter', () => ({
  RateLimiterService: { enforce: vi.fn() },
}))

// Without a request scope `headers()` throws and the caller is UNIDENTIFIED, which routes to
// the shared `unidentified` tier and bypasses the action's configured tier. That is the right
// production behaviour but it would make every tier assertion below untestable, so the scope
// is mocked and `scope.forwardedFor` lets individual cases opt back into the no-identity path.
const scope = vi.hoisted(() => ({ forwardedFor: null as string | null }))
vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers(scope.forwardedFor ? { 'x-forwarded-for': scope.forwardedFor } : {}),
}))

// vitest.setup.ts installs a global `next/navigation` mock that now does model
// `unstable_rethrow`, `redirect`, `permanentRedirect` and `notFound` faithfully (see
// server-action.jsdom.test.ts, which covers the wrapper through exactly that mock). This
// file still shadows it with the REAL module: a mock, however faithful, is written against
// the same digest formats the assertions below check, so on its own it proves only internal
// consistency. Pairing the two means the digest contract is pinned against Next.js itself
// here, and the shared jsdom test infrastructure is pinned against this file's expectations
// there. It also keeps the node-only bailout branches covered — see the docblock above.
vi.mock('next/navigation', async () =>
  vi.importActual<typeof import('next/navigation')>('next/navigation'),
)

import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { RateLimiterService } from '@/src/modules/core/security/RateLimiter'
import { baseLogger } from './logger'
import { withServerAction, type ServerActionFailure } from './server-action'

const enforce = vi.mocked(RateLimiterService.enforce)

// `logger` is a Proxy that merges the AsyncLocalStorage context (requestId, action, ip,
// userId) into every call before delegating to baseLogger. Spying on baseLogger rather than
// mocking `logger` keeps that merge under test instead of reimplementing it here.
const warn = vi.spyOn(baseLogger, 'warn').mockImplementation(() => undefined)
const error = vi.spyOn(baseLogger, 'error').mockImplementation(() => undefined)

const GENERIC = 'Something went wrong. Please try again.'

beforeEach(() => {
  vi.clearAllMocks()
  enforce.mockResolvedValue(undefined)
  // Vercel's edge always appends the terminating peer address, so a resolvable IP is the
  // normal case. Cases that need the no-identity path clear this explicitly.
  scope.forwardedFor = '203.0.113.7'
})

/**
 * THE REDIRECT HAZARD.
 *
 * `redirect()`, `permanentRedirect()` and `notFound()` are thrown control flow that Next.js
 * unwinds itself. If the wrapper's catch classifies them, every navigation performed by a
 * Server Action silently turns into a rendered failure message and the user never moves.
 * These assertions target the thrown value's `digest` — the marker Next.js itself keys on —
 * so they cannot be satisfied by an implementation that merely happens not to crash.
 */
describe('withServerAction and Next.js control-flow signals', () => {
  it('lets a redirect() throw propagate untouched instead of returning a failure', async () => {
    const action = withServerAction({ name: 'redirects' }, async () => {
      redirect('/dashboard')
      return 'unreachable'
    })

    const caught = await action().then(
      (value) => ({ resolved: true as const, value }),
      (err: unknown) => ({ resolved: false as const, err }),
    )

    // Explicitly rule out the failure envelope: a swallowed redirect resolves.
    expect(caught.resolved).toBe(false)
    if (caught.resolved) return

    const digest = (caught.err as { digest?: string }).digest
    expect(digest).toMatch(/^NEXT_REDIRECT;/)
    // `;replace;/dashboard;307;` — the destination must survive verbatim.
    expect(digest?.split(';').slice(2, -2).join(';')).toBe('/dashboard')

    // A control-flow signal is not an application error and must not be logged as one.
    expect(error).not.toHaveBeenCalled()
  })

  it('lets a permanentRedirect() throw propagate untouched', async () => {
    const action = withServerAction({ name: 'permanently-redirects' }, async () => {
      permanentRedirect('/pricing')
      return 'unreachable'
    })

    await expect(action()).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT;replace;\/pricing;308;/) as unknown as string,
    })
  })

  it('lets a notFound() throw propagate untouched', async () => {
    const action = withServerAction({ name: 'not-founds' }, async () => {
      notFound()
    })

    await expect(action()).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
    expect(error).not.toHaveBeenCalled()
  })

  it('still propagates a redirect when an onError translator is configured', async () => {
    // The dangerous ordering is "classify, translate, return" with the rethrow after it.
    // With a translator present, a broken wrapper returns this sentinel instead of throwing.
    const action = withServerAction(
      { name: 'redirects-with-onerror', onError: () => ({ outcome: 'error' as const }) },
      async () => {
        redirect('/dashboard')
        return { outcome: 'ok' as const }
      },
    )

    await expect(action()).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT;/) as unknown as string,
    })
  })

  it('propagates a redirect that an action accidentally wrapped as an error cause', async () => {
    // `unstable_rethrow` recurses through `cause`. An action with its own try/catch that
    // re-wraps what it caught still must not have its navigation swallowed here.
    const action = withServerAction({ name: 'wraps-redirect' }, async () => {
      try {
        redirect('/dashboard')
      } catch (cause) {
        throw new Error('failed to save', { cause })
      }
      return 'unreachable'
    })

    // `unstable_rethrow` unwraps: it rethrows the *cause*, so Next.js receives the bare
    // redirect error rather than a wrapper it would not recognise.
    const err = await action().catch((e: unknown) => e)
    expect((err as { digest?: string }).digest).toMatch(/^NEXT_REDIRECT;/)
    expect((err as { digest?: string }).digest?.split(';').slice(2, -2).join(';')).toBe(
      '/dashboard',
    )
  })
})

describe('withServerAction failure mapping', () => {
  it('returns the handler value untouched on the success path', async () => {
    const value = { questId: 'q_1', xp: 40 }
    const action = withServerAction({ name: 'succeeds' }, async (a: string, b: number) => {
      expect(a).toBe('arg')
      expect(b).toBe(7)
      return value
    })

    // Identity, not deep equality: the wrapper must not clone or re-envelope the result.
    await expect(action('arg', 7)).resolves.toBe(value)
    expect(error).not.toHaveBeenCalled()
  })

  it('surfaces a RateLimitError from the limiter as the failure shape rather than throwing', async () => {
    enforce.mockRejectedValue(new RateLimitError())

    const handler = vi.fn(async () => 'ran')
    const action = withServerAction({ name: 'rate-limited', tier: 'billing' }, handler)

    await expect(action()).resolves.toEqual({
      ok: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
    })
    // Rejected before the mutation, not after it.
    expect(handler).not.toHaveBeenCalled()
    expect(enforce).toHaveBeenCalledWith(expect.objectContaining({ type: 'billing' }))
  })

  it('preserves the message of a 4xx AppError', async () => {
    const action = withServerAction({ name: 'conflicts' }, async () => {
      throw new AppError('That quest is already claimed', 409, 'CONFLICT')
    })

    await expect(action()).resolves.toEqual({
      ok: false,
      code: 'CONFLICT',
      message: 'That quest is already claimed',
    })
  })

  it('replaces the message of a 5xx AppError with the generic text but keeps the code', async () => {
    const action = withServerAction({ name: 'depends' }, async () => {
      throw new AppError('upstream billing cluster refused connection', 503, 'DEPENDENCY_FAILED')
    })

    const result = (await action()) as ServerActionFailure
    expect(result).toEqual({ ok: false, code: 'DEPENDENCY_FAILED', message: GENERIC })
    expect(JSON.stringify(result)).not.toContain('billing cluster')
  })

  it('returns a bare INTERNAL_ERROR when a raw Error escapes the handler', async () => {
    const action = withServerAction({ name: 'throws-raw' }, async () => {
      throw new Error('connect ECONNREFUSED 10.0.3.14:5432 for user svc_billing')
    })

    const result = (await action()) as ServerActionFailure
    expect(result).toEqual({ ok: false, code: 'INTERNAL_ERROR', message: GENERIC })
    expect(JSON.stringify(result)).not.toContain('ECONNREFUSED')
    expect(JSON.stringify(result)).not.toContain('svc_billing')
  })

  it('maps a ZodError to VALIDATION_ERROR without echoing the rejected input', async () => {
    const action = withServerAction({ name: 'validates' }, async () => {
      z.object({ plan: z.enum(['free', 'pro']) }).parse({ plan: 'admin@example.com' })
      return 'unreachable'
    })

    const result = (await action()) as ServerActionFailure
    expect(result.ok).toBe(false)
    expect(result.code).toBe('VALIDATION_ERROR')
    expect(result.message).toBe('Validation failed')
    // Zod puts the caller's rejected input on `received` for enum failures; sanitizeDetails
    // drops it and rewrites the interpolated default message.
    expect(result.details).toEqual([
      { path: 'plan', code: 'invalid_enum_value', message: 'Invalid value' },
    ])
    expect(JSON.stringify(result)).not.toContain('admin@example.com')
    expect(JSON.stringify(warn.mock.calls)).not.toContain('admin@example.com')
  })

  it('strips internal metadata from the details of a 4xx AppError', async () => {
    const action = withServerAction({ name: 'conflicts-with-details' }, async () => {
      throw new AppError('Conflict detected', 409, 'CONFLICT', {
        field: 'email',
        stack: 'at Object.<anonymous> (/srv/app/src/modules/user.ts:42:11)',
        clientVersion: '6.2.1',
      })
    })

    await expect(action()).resolves.toEqual({
      ok: false,
      code: 'CONFLICT',
      message: 'Conflict detected',
      details: { field: 'email' },
    })
  })

  it('omits details entirely when nothing survives sanitizing', async () => {
    const action = withServerAction({ name: 'conflicts-empty-details' }, async () => {
      throw new AppError('Conflict detected', 409, 'CONFLICT', {
        stack: 'at Object.<anonymous> (/srv/app/src/modules/user.ts:42:11)',
      })
    })

    const result = (await action()) as ServerActionFailure
    expect(result).not.toHaveProperty('details')
  })
})

describe('withServerAction onError policies', () => {
  it("rethrows the ORIGINAL error, not the failure envelope, under onError: 'rethrow'", async () => {
    const original = new AppError('That quest is already claimed', 409, 'CONFLICT', {
      questId: 'q_1',
    })
    const action = withServerAction(
      { name: 'rethrows', onError: 'rethrow' },
      async (): Promise<string> => {
        throw original
      },
    )

    const caught = await action().catch((err: unknown) => err)
    // Identity: callers of these actions branch on `instanceof AppError` and read
    // `statusCode`/`details`, none of which survive a re-thrown envelope.
    expect(caught).toBe(original)
    expect(caught).toBeInstanceOf(AppError)
    expect((caught as AppError).statusCode).toBe(409)
    expect((caught as AppError).details).toEqual({ questId: 'q_1' })
    // It is still logged before being rethrown.
    expect(warn).toHaveBeenCalled()
  })

  it("rethrows a RateLimitError untouched under onError: 'rethrow'", async () => {
    const limit = new RateLimitError()
    enforce.mockRejectedValue(limit)

    const action = withServerAction({ name: 'rethrows-limit', onError: 'rethrow' }, async () => 'x')

    await expect(action()).rejects.toBe(limit)
  })

  it("translates the failure into the action's own shape under onError: fn", async () => {
    const original = new AppError('Card declined', 402, 'PAYMENT_REQUIRED')
    const onError = vi.fn((failure: ServerActionFailure) => ({
      outcome: 'error' as const,
      reason: failure.message,
      code: failure.code,
    }))

    const action = withServerAction({ name: 'translates', onError }, async () => ({
      outcome: 'ok' as const,
      reason: '',
      code: '',
    }))

    enforce.mockRejectedValueOnce(original)

    await expect(action()).resolves.toEqual({
      outcome: 'error',
      reason: 'Card declined',
      code: 'PAYMENT_REQUIRED',
    })
    // The translator gets the classified failure AND the original error, so an action that
    // needs `statusCode` or a typed subclass can still reach it.
    expect(onError).toHaveBeenCalledWith(
      { ok: false, code: 'PAYMENT_REQUIRED', message: 'Card declined' },
      original,
    )
  })

  it('does not invoke onError on the success path', async () => {
    const onError = vi.fn(() => ({ outcome: 'error' as const }))
    const action = withServerAction({ name: 'no-error', onError }, async () => ({
      outcome: 'ok' as const,
    }))

    await expect(action()).resolves.toEqual({ outcome: 'ok' })
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('withServerAction logging context', () => {
  it('carries a requestId and the action name into every log line', async () => {
    const action = withServerAction({ name: 'claimQuestReward' }, async () => {
      throw new AppError('That quest is already claimed', 409, 'CONFLICT')
    })

    await action()

    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({
        // Only the AsyncLocalStorage store supplies requestId — classify() never passes it.
        requestId: expect.any(String) as unknown as string,
        action: 'claimQuestReward',
        code: 'CONFLICT',
      }),
      'Server Action rejected',
    )
  })

  it('gives each invocation a distinct requestId', async () => {
    const action = withServerAction({ name: 'unhandled' }, async () => {
      throw new Error('boom')
    })

    await action()
    await action()

    const ids = error.mock.calls.map((call) => (call[0] as { requestId?: string }).requestId)
    expect(ids).toHaveLength(2)
    expect(ids[0]).toEqual(expect.any(String))
    expect(ids[0]).not.toBe(ids[1])
  })

  it('attaches the action context to an unhandled-exception log line', async () => {
    const action = withServerAction({ name: 'unhandled' }, async () => {
      throw new Error('boom')
    })

    await action()

    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'server_action_unhandled_error',
        action: 'unhandled',
        requestId: expect.any(String) as unknown as string,
      }),
      'Unhandled Server Action exception',
    )
  })
})

describe('withServerAction caller identity outside a request scope', () => {
  it('degrades without throwing when there is no ambient request or session', async () => {
    // No Next.js request store and no Clerk instrumentation here: `headers()` and `auth()`
    // both throw. If either escaped, the wrapper would turn every unit-tested action — and
    // every action invoked outside a request — into an INTERNAL_ERROR.
    const action = withServerAction({ name: 'no-scope' }, async () => 'ran')

    await expect(action()).resolves.toBe('ran')
    expect(error).not.toHaveBeenCalled()
  })

  it('routes a caller with no userId and no resolvable IP to the shared unidentified tier', async () => {
    scope.forwardedFor = null
    const action = withServerAction({ name: 'no-scope-bucket', tier: 'billing' }, async () => 'ran')

    await action()

    // Charging the action's own tier under a constant key would hand every anonymous caller
    // a combined budget at that tier's rate — a free bucket for anyone who can strip the
    // header. The shared `unidentified` tier is deliberately a trickle instead.
    expect(enforce).toHaveBeenCalledWith({ type: 'unidentified', identifier: 'unidentified' })
  })

  it('never buckets on a caller-supplied x-forwarded-for prefix', async () => {
    // The header is an appendable hop list; anything the caller authored arrives at the LEFT.
    // Reading it raw would let one caller mint unlimited buckets by varying that prefix.
    scope.forwardedFor = 'evil-made-up-value, 203.0.113.7'
    const action = withServerAction({ name: 'spoofed' }, async () => 'ran')

    await action()

    expect(enforce).toHaveBeenCalledWith({ type: 'global', identifier: '203.0.113.7' })
  })

  it('defaults to the global tier when none is configured', async () => {
    const action = withServerAction({ name: 'default-tier' }, async () => 'ran')

    await action()

    expect(enforce).toHaveBeenCalledWith(expect.objectContaining({ type: 'global' }))
  })
})
