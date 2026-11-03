import { Alegreya, Alegreya_Sans, Grenze, Grenze_Gotisch, Martian_Mono } from 'next/font/google'

/**
 * The SEOlaQuest type system, loaded once in the root layout and used by every
 * page, public and signed-in. It reads like a quest log rather than a dashboard.
 *   gothic  — Grenze Gotisch, the blackletter cut, for the wordmark, the home
 *             headline and page titles only. Its capitals run together (X, XP,
 *             API, III are unreadable), so wrap any of those in `.hb-plain`.
 *   display — Grenze, the same design with roman capitals, for every other heading
 *   text    — Alegreya Sans, a calligraphic humanist sans for reading
 *   sans    — Alegreya Sans again, for controls, tabs and capitalised labels
 *   quote   — Alegreya italic, for ledes and quoted posts
 *   mono    — Martian Mono, slightly narrowed: scores, XP, ledgers, sample labels
 *
 * Only the gothic cut is preloaded, for the headline. Preloading a family
 * fetches every weight and style in it whether the page uses them or not (13
 * files, 345 KB on the home page). Without it the browser fetches only the
 * files the page draws with, and `display: swap` shows text straight away.
 */
export const handbookGothic = Grenze_Gotisch({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hb-gothic',
})

export const handbookDisplay = Grenze({
  preload: false,
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-hb-display',
})

export const handbookText = Alegreya_Sans({
  preload: false,
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-hb-text',
})

export const handbookQuote = Alegreya({
  preload: false,
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-hb-quote',
})

export const handbookMono = Martian_Mono({
  preload: false,
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-hb-mono',
})

export const handbookFontVariables = [
  handbookGothic.variable,
  handbookDisplay.variable,
  handbookText.variable,
  handbookQuote.variable,
  handbookMono.variable,
].join(' ')
