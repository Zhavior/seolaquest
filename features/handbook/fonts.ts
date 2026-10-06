import { Barlow, Barlow_Semi_Condensed, Cinzel, Cormorant_Garamond, Geist_Mono } from 'next/font/google'

/**
 * The Dusk Hunt type system, scoped to the public-site wrapper so the signed-in
 * product keeps its own type.
 *   display — Cinzel, an inscriptional serif for headings and the wordmark
 *   text    — Barlow, for reading
 *   sans    — Barlow Semi Condensed, for controls, tabs and labels
 *   quote   — Cormorant Garamond, for ledes and quoted posts
 *   mono    — machine voice: scores, XP, keystroke legends, sample labels
 */
export const handbookDisplay = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hb-display',
})

export const handbookText = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hb-text',
})

export const handbookSans = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-hb-sans',
})

export const handbookQuote = Cormorant_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-hb-quote',
})

export const handbookMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hb-mono',
})

export const handbookFontVariables = [
  handbookDisplay.variable,
  handbookText.variable,
  handbookSans.variable,
  handbookQuote.variable,
  handbookMono.variable,
].join(' ')
