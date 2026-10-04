/**
 * What this edition does not do yet, and the plain answers to the questions a
 * founder asks before signing up. Both lists render on the page and feed the
 * FAQ structured data, so what a crawler reads is exactly what a visitor sees.
 * Each line was checked against the product code on 2026-09-29 (see PRODUCT.md).
 */

export type ErrataItem = { id: string; text: string; kind: 'open' | 'by-design' }

export function errataItems(checkoutOpen: boolean): ErrataItem[] {
  return [
    {
      id: 'x-only',
      kind: 'open',
      text: 'X only. Reddit support is built but switched off, so no Reddit posts are scanned.',
    },
    {
      id: 'manual-scans',
      kind: 'open',
      text: 'Scans run when you start them. Scheduled scanning exists in the code but is not a promised feature, so do not count on automatic monitoring.',
    },
    {
      id: 'checkout',
      kind: 'open',
      text: checkoutOpen
        ? 'Paid checkout is switched on but runs a final check before any charge; it can be paused again.'
        : 'Paid checkout is paused. If you try to buy, you will see that no charge was made.',
    },
    {
      id: 'scoring',
      kind: 'open',
      text: 'Scoring can be unavailable. When it is, the lead shows as not scored. It never shows a guessed number.',
    },
    {
      id: 'guild',
      kind: 'by-design',
      text: 'The Guild Hall is a private journal. There are no leaderboards, rankings, or other hunters to compete with.',
    },
    {
      id: 'conversions',
      kind: 'open',
      text: 'Conversion quests (First Blood, Weekly Closer, Rainmaker) are face down and pay nothing until conversions can be verified.',
    },
    {
      id: 'keywords',
      kind: 'by-design',
      text: 'Each account can keep up to 10 active keywords.',
    },
    {
      id: 'sla',
      kind: 'open',
      text: 'No uptime guarantee and no public API. The status page lists what is verified and what is still pending.',
    },
  ]
}

export type FaqItem = { q: string; a: string }

export const FAQ: FaqItem[] = [
  {
    q: 'Does a match mean someone will buy?',
    a: 'No. A match is a public post that fits your keywords. The score is a policy threshold, not a chance of a sale. Read the source post before you act.',
  },
  {
    q: 'What can I do for free?',
    a: 'Create an account, take the six-step tutorial quest, and save up to 10 keywords. Free Scout includes no scan credits, so real scans need a paid plan.',
  },
  {
    q: 'Which platforms does it scan?',
    a: 'X only today. Reddit is built but switched off.',
  },
  {
    q: 'Does SEOlaQuest post to X for me?',
    a: 'No. It drafts replies and you send them yourself. It does not post on your behalf.',
  },
  {
    q: 'Why not just search X myself?',
    a: 'You can. SEOlaQuest keeps every match with its source in one inbox, drops noise such as cashtag chatter, job posts, and invite spam before you see it, scores the rest, and tracks what you did about each one.',
  },
  {
    q: 'What data do you keep?',
    a: 'Your email and display name, your keywords and scan results, lead workflow state, and Stripe identifiers and subscription state. Card numbers stay with Stripe. The privacy page has the full list.',
  },
]
