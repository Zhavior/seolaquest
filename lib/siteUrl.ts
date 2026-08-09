/**
 * The one canonical origin for this deployment.
 *
 * `robots.txt`, `sitemap.xml`, and `metadataBase` must all agree: if the sitemap
 * advertises `https://seolaquest.com/pricing` while the canonical tag says
 * `http://seolaquest.com/pricing`, crawlers treat them as two documents and split
 * the ranking signal between them.
 *
 * `NEXT_PUBLIC_APP_URL` is inlined at build time, so this resolves during the
 * static generation of the metadata routes rather than per request.
 */
const FALLBACK_ORIGIN = 'http://localhost:3000'

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')
}

/**
 * `NEXT_PUBLIC_APP_URL` is the explicit answer, but it is not currently set in
 * the Vercel production environment — and an unset value here would publish
 * `http://localhost:3000` as the canonical of every page on the live site.
 *
 * `VERCEL_PROJECT_PRODUCTION_URL` is injected by the platform and holds the
 * project's stable production domain (hostname only, no protocol). It is the
 * right second choice: unlike `VERCEL_URL` it does not change per deployment,
 * so preview builds still resolve to the production canonical instead of
 * advertising a preview hostname to crawlers.
 */
function configuredOrigin(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (explicit) return explicit

  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercelProductionHost) return `https://${vercelProductionHost}`

  return undefined
}

function resolveSiteUrl(): URL {
  const configured = configuredOrigin()

  let url: URL
  try {
    url = new URL(configured || FALLBACK_ORIGIN)
  } catch {
    // A malformed value must not take the build down — a wrong-but-valid origin
    // degrades SEO, an exception here fails every page render.
    url = new URL(FALLBACK_ORIGIN)
  }

  // A public site served over http publishes canonicals that browsers and
  // crawlers both distrust, and every deployment target here terminates TLS.
  // Upgrade rather than propagate the mistake; localhost stays http so local
  // development is unaffected.
  if (url.protocol === 'http:' && !isLocalHost(url.hostname)) {
    url.protocol = 'https:'
  }

  // Trailing slashes concatenate badly with relative metadata paths.
  url.pathname = '/'

  return url
}

export const siteUrl: URL = resolveSiteUrl()

/** Absolute URL for a site-relative path, e.g. `absoluteUrl('/pricing')`. */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString()
}
