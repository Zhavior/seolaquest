/**
 * What this edition does not do yet, and the plain answers to the questions a
 * founder asks before joining. Both lists render on the page and feed the FAQ
 * structured data, so what a crawler reads is exactly what a visitor sees.
 * Each GEO line was checked against src/modules/geo on 2026-10-07.
 */

export type ErrataItem = { id: string; text: string; kind: 'open' | 'by-design' }

export function errataItems(checkoutOpen: boolean): ErrataItem[] {
  return [
    {
      id: 'not-running',
      kind: 'open',
      text: 'GEO scans are not switched on. The code is built and tested, but no real scan has run, so no result on this site comes from an engine.',
    },
    {
      id: 'one-engine',
      kind: 'open',
      text: 'One engine: Perplexity. Other AI search engines are not built, and a citation in one engine says nothing about another.',
    },
    {
      id: 'cost',
      kind: 'open',
      text: 'The cost of a scan is not known yet. Each scan records what the engine charged; there is no price until those numbers exist.',
    },
    {
      id: 'classification',
      kind: 'by-design',
      text: 'Source types come from a short, hand-picked list of sites and URL patterns. Anything else is marked as a guess rather than shown as known.',
    },
    {
      id: 'snapshot',
      kind: 'by-design',
      text: 'A scan is one answer at one moment. The same question can cite different sources later, and SEOlaQuest does not promise a citation after you act.',
    },
    {
      id: 'manual',
      kind: 'open',
      text: 'Scans will run when you start them. There is no scheduled monitoring.',
    },
    {
      id: 'x-checkout',
      kind: 'open',
      text: checkoutOpen
        ? 'The earlier X lead finder still sells paid plans, behind a final payment check that can pause checkout again.'
        : 'Paid checkout for the earlier X lead finder is paused. Nothing on this site can be bought.',
    },
  ]
}

export type FaqItem = { q: string; a: string }

export const FAQ: FaqItem[] = [
  {
    q: 'What does a scan tell me?',
    a: 'For one question you choose: which pages the AI search found, which ones its answer cited and in what order, what kind of page each one is, and whether your own site was cited, found but left out, or missing.',
  },
  {
    q: 'Can SEOlaQuest get my site cited?',
    a: 'No. It shows where the answer comes from and what kind of move each source suggests. Nothing guarantees a citation, and the answer can change.',
  },
  {
    q: 'Which AI engines does it check?',
    a: 'Perplexity only, once scans are switched on. ChatGPT, Gemini and Google AI answers are not covered.',
  },
  {
    q: 'What does early access cost?',
    a: 'Nothing. Joining is free and asks for no card. GEO scans have no price yet, because no real scan has reported what it costs.',
  },
  {
    q: 'What happened to the X lead finder?',
    a: 'It still runs inside the app for signed-in accounts. The public site now describes GEO, which is where SEOlaQuest is heading.',
  },
  {
    q: 'What data do you keep?',
    a: 'Your email and display name, and for each scan the question, the site you checked, the answer text, the sources returned and what the engine charged. Card numbers stay with Stripe. The privacy page has the full list.',
  },
]
