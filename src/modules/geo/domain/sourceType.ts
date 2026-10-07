/**
 * Classifies a cited URL into the source type a user would act on differently:
 * answer a thread (FORUM), get listed or reviewed (AGGREGATOR), get written
 * about (EDITORIAL), or out-rank a vendor's own page (DIRECT).
 *
 * The lists are deliberately short and hand-picked. Anything not recognised
 * falls through to DIRECT with `basis: 'FALLBACK'`, so a caller can tell a
 * known classification from a default one instead of trusting both equally.
 */

export type SourceType = 'FORUM' | 'AGGREGATOR' | 'EDITORIAL' | 'DIRECT'
export type ClassificationBasis = 'KNOWN_DOMAIN' | 'URL_PATTERN' | 'FALLBACK'

export interface SourceClassification {
  sourceType: SourceType
  basis: ClassificationBasis
}

const KNOWN_DOMAINS: Record<string, SourceType> = {
  'reddit.com': 'FORUM',
  'quora.com': 'FORUM',
  'stackoverflow.com': 'FORUM',
  'stackexchange.com': 'FORUM',
  'news.ycombinator.com': 'FORUM',
  'indiehackers.com': 'FORUM',
  'community.hubspot.com': 'FORUM',

  'g2.com': 'AGGREGATOR',
  'capterra.com': 'AGGREGATOR',
  'producthunt.com': 'AGGREGATOR',
  'trustradius.com': 'AGGREGATOR',
  'getapp.com': 'AGGREGATOR',
  'softwareadvice.com': 'AGGREGATOR',
  'trustpilot.com': 'AGGREGATOR',
  'alternativeto.net': 'AGGREGATOR',
  'saasworthy.com': 'AGGREGATOR',
  'sourceforge.net': 'AGGREGATOR',
  'gartner.com': 'AGGREGATOR',

  'medium.com': 'EDITORIAL',
  'substack.com': 'EDITORIAL',
  'techcrunch.com': 'EDITORIAL',
  'theverge.com': 'EDITORIAL',
  'wired.com': 'EDITORIAL',
  'forbes.com': 'EDITORIAL',
  'businessinsider.com': 'EDITORIAL',
  'zapier.com': 'EDITORIAL',
  'dev.to': 'EDITORIAL',
  'hashnode.dev': 'EDITORIAL',
  'wikipedia.org': 'EDITORIAL',
  'youtube.com': 'EDITORIAL',
}

const FORUM_HOST_PREFIXES = ['forum.', 'forums.', 'community.', 'discuss.', 'discourse.']
const FORUM_PATH = /\/(forum|forums|community|discussions?|threads?|questions)\//i
const EDITORIAL_HOST_PREFIXES = ['blog.', 'news.']
const EDITORIAL_PATH = /\/(blog|blogs|articles?|news|posts?|insights|resources\/guides?)\//i

/** Lower-cased hostname without a leading `www.`, or null when the URL does not parse. */
export function hostnameOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return null
  }
}

/** True when `host` is `domain` itself or any subdomain of it. */
export function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

function knownDomainType(host: string): SourceType | null {
  // Exact entries win over parent entries, so community.hubspot.com is a forum
  // even if hubspot.com were ever listed as something else.
  if (KNOWN_DOMAINS[host]) return KNOWN_DOMAINS[host]
  for (const [domain, type] of Object.entries(KNOWN_DOMAINS)) {
    if (hostMatches(host, domain)) return type
  }
  return null
}

export function classifySource(url: string): SourceClassification {
  const host = hostnameOf(url)
  if (!host) return { sourceType: 'DIRECT', basis: 'FALLBACK' }

  const known = knownDomainType(host)
  if (known) return { sourceType: known, basis: 'KNOWN_DOMAIN' }

  let path = ''
  try {
    path = new URL(url).pathname + '/'
  } catch {
    // hostnameOf already parsed it; unreachable in practice.
  }

  if (FORUM_HOST_PREFIXES.some((prefix) => host.startsWith(prefix)) || FORUM_PATH.test(path)) {
    return { sourceType: 'FORUM', basis: 'URL_PATTERN' }
  }
  if (EDITORIAL_HOST_PREFIXES.some((prefix) => host.startsWith(prefix)) || EDITORIAL_PATH.test(path)) {
    return { sourceType: 'EDITORIAL', basis: 'URL_PATTERN' }
  }

  return { sourceType: 'DIRECT', basis: 'FALLBACK' }
}

/**
 * Normalises what a user types as their domain ("https://www.Acme.com/pricing",
 * "acme.com") to a bare host. Returns null for input that is not a hostname.
 */
export function normalizeBrandDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
  const host = hostnameOf(withScheme)
  if (!host || !host.includes('.') || host.endsWith('.')) return null
  return host
}
