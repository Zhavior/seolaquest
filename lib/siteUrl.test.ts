import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `siteUrl` is resolved once at module load, so every case here needs a fresh
 * module registry rather than a reassignment.
 */
async function loadSiteUrl() {
  vi.resetModules()
  const mod = await import('./siteUrl')
  return mod
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('siteUrl', () => {
  it('prefers an explicitly configured NEXT_PUBLIC_APP_URL', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.seolaquest.com'
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'ignored.example.com'

    const { siteUrl } = await loadSiteUrl()
    expect(siteUrl.origin).toBe('https://www.seolaquest.com')
  })

  it('falls back to the Vercel production domain rather than localhost', async () => {
    // The production environment currently has no NEXT_PUBLIC_APP_URL. Without
    // this fallback every canonical on the live site would read localhost.
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'www.seolaquest.com'

    const { siteUrl } = await loadSiteUrl()
    expect(siteUrl.origin).toBe('https://www.seolaquest.com')
  })

  it('upgrades a non-local http origin to https', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://seolaquest.com'

    const { siteUrl } = await loadSiteUrl()
    expect(siteUrl.origin).toBe('https://seolaquest.com')
  })

  it('leaves localhost on http so local development is unaffected', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

    const { siteUrl } = await loadSiteUrl()
    expect(siteUrl.origin).toBe('http://localhost:3000')
  })

  it('survives a malformed origin instead of failing every render', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'not a url'

    const { siteUrl } = await loadSiteUrl()
    expect(siteUrl.origin).toBe('http://localhost:3000')
  })

  it('drops any configured path so relative metadata paths concatenate cleanly', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.seolaquest.com/app/'

    const { absoluteUrl } = await loadSiteUrl()
    expect(absoluteUrl('/pricing')).toBe('https://www.seolaquest.com/pricing')
  })
})
