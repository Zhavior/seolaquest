import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

/**
 * Mock next/navigation.
 *
 * The hooks are here for component tests, but the module's *control flow* half matters just
 * as much: `withServerAction`'s catch opens with `unstable_rethrow`, so a mock that omits it
 * turns every wrapped action driven into that catch into `TypeError: unstable_rethrow is not
 * a function` — the mock fails before the assertion, and the redirect hazard the wrapper
 * exists to prevent cannot be exercised from the default jsdom environment at all.
 *
 * So the control-flow members are modelled faithfully rather than stubbed:
 *
 *  - Errors are matched on their `digest` string, not by importing Next's internal
 *    `isRedirectError` / `isHTTPAccessFallbackError`. Those live under
 *    `next/dist/client/components/...`, are not re-exported from `next/navigation`, and are
 *    unversioned internals; the digest wire format is the stable surface.
 *  - `unstable_rethrow` recurses into `error.cause`, as the real one does, so a redirect
 *    wrapped by an intermediate `throw new Error(msg, { cause })` still survives the catch.
 *  - Anything that is not Next control flow is ignored (no throw, no return value), which is
 *    what lets the wrapper go on to classify a genuine failure.
 *
 * A test that needs the real implementation — e.g. to cover the server build's extra
 * prerender/dynamic bailout branches, which the browser build does not check — should still
 * shadow this with a local `vi.mock(..., importActual)` and `// @vitest-environment node`,
 * as `src/modules/core/infrastructure/server-action.test.ts` does.
 */
const REDIRECT_ERROR_CODE = 'NEXT_REDIRECT'
const HTTP_ACCESS_FALLBACK_ERROR_CODE = 'NEXT_HTTP_ERROR_FALLBACK'

function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const { digest } = error as { digest?: unknown }
  if (typeof digest === 'string') {
    const code = digest.split(';')[0]
    if (code === REDIRECT_ERROR_CODE || code === HTTP_ACCESS_FALLBACK_ERROR_CODE) return true
  }

  // Next unwraps `cause` too: an error box around a redirect is still a redirect.
  if (error instanceof Error && error.cause != null) return isNextControlFlowError(error.cause)

  return false
}

vi.mock('next/navigation', () => {
  const replaceMock = vi.fn()
  const pushMock = vi.fn()

  // Digest shape mirrors next/dist/client/components/redirect.js: the trailing `;` is part of
  // the format, and the destination occupies every field between the type and the status so
  // that a URL containing `;` round-trips.
  const makeRedirect = (type: 'push' | 'replace', statusCode: number) => (url: string): never => {
    const error = new Error(REDIRECT_ERROR_CODE) as Error & { digest: string }
    error.digest = `${REDIRECT_ERROR_CODE};${type};${url};${statusCode};`
    throw error
  }

  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      prefetch: vi.fn(),
      refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),

    RedirectType: { push: 'push', replace: 'replace' },
    redirect: makeRedirect('replace', 307),
    permanentRedirect: makeRedirect('replace', 308),
    notFound: (): never => {
      const error = new Error(HTTP_ACCESS_FALLBACK_ERROR_CODE) as Error & { digest: string }
      // Next 16 folds notFound/forbidden/unauthorized into one code plus a status. There is
      // no `NEXT_NOT_FOUND` digest any more — that spelling is pre-15.
      error.digest = `${HTTP_ACCESS_FALLBACK_ERROR_CODE};404`
      throw error
    },
    unstable_rethrow: (error: unknown): void => {
      if (isNextControlFlowError(error)) throw error
    },
  }
})

// Mock audio / sfx
vi.mock('@/lib/sfx', () => ({
  sfx: {
    playBountyUnlock: vi.fn(),
    playCoinDrop: vi.fn(),
    playCriticalWarning: vi.fn(),
    playElixirDrink: vi.fn(),
    playHoverBlip: vi.fn(),
    playLevelUp: vi.fn(),
    playRadarBlip: vi.fn(),
    playSidebarCollapse: vi.fn(),
    playSidebarExpand: vi.fn(),
    playSidebarHover: vi.fn(),
    playSwordSlash: vi.fn(),
    isEnabled: vi.fn(() => true),
    setEnabled: vi.fn(),
    toggle: vi.fn(() => true),
  },
}))
