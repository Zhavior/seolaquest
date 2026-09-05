/**
 * Pre-scoring / pre-persist noise gates for buyer-intent queues.
 *
 * These rules drop technical-analysis chatter, job listings, and invite spam
 * before they consume AI budget or pollute the Battlestation feed. They do not
 * invent Aurora scores — they only refuse non-buyer text.
 */

export type BuyerIntentNoiseReason =
  | 'TRADING_NOISE'
  | 'JOB_LISTING'
  | 'PROMO_SPAM'

export type BuyerIntentNoiseHit = {
  reason: BuyerIntentNoiseReason
}

/** Cashtag like $CRM — not the bare product word "CRM". */
const CASHTAG = /\$[A-Za-z]{1,5}\b/

const TRADING_TERMS: RegExp[] = [
  /\bavwap\b/i,
  /\bswing\s+lows?\b/i,
  /\baths?\b/i,
  /\bpoint\s+of\s+control\b/i,
  /\bvwap\b/i,
  /\bbounced\s+(perfectly\s+)?from\b/i,
]
const JOB_PATTERNS: RegExp[] = [
  /\bhiring\b/i,
  /\bsalary\s*:/i,
  /\bjob\s+title\s*:/i,
  /\blocation\s*:\s*remote\b/i,
]

const PROMO_PATTERNS: RegExp[] = [
  /discord\.gg\//i,
  /discord\.com\/invite\//i,
  /\bjoin\s+(our\s+)?discord\b/i,
  /\bfree\s+discord\b/i,
]

function hasTradingNoise(text: string): boolean {
  if (CASHTAG.test(text)) return true
  if (TRADING_TERMS.some((pattern) => pattern.test(text))) return true
  // Bare "POC" often means proof-of-concept (buyer). Do not reject alone.
  return false
}

/**
 * Returns the first matching noise reason, or null when the text may still be
 * a real buyer-intent signal.
 */
export function detectBuyerIntentNoise(content: string): BuyerIntentNoiseHit | null {
  const text = content.replace(/\s+/g, ' ').trim()
  if (!text) return null

  if (hasTradingNoise(text)) return { reason: 'TRADING_NOISE' }
  if (JOB_PATTERNS.some((pattern) => pattern.test(text))) return { reason: 'JOB_LISTING' }
  if (PROMO_PATTERNS.some((pattern) => pattern.test(text))) return { reason: 'PROMO_SPAM' }
  return null
}

export function isBuyerIntentNoise(content: string): boolean {
  return detectBuyerIntentNoise(content) !== null
}
