import { EB_Garamond, Geist, Geist_Mono } from 'next/font/google'

/**
 * Three faces, one job each, all scoped to the handbook wrapper so the signed-in
 * product keeps its own type.
 *   text  — a Garamond cut for reading (the manual's Sabon role)
 *   sans  — a neo-grotesk for heads, tabs, and controls (the Univers role)
 *   mono  — machine voice: scores, XP, keystroke legends, sample labels
 */
export const handbookText = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-hb-text',
})

export const handbookSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hb-sans',
})

export const handbookMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hb-mono',
})

export const handbookFontVariables = [
  handbookText.variable,
  handbookSans.variable,
  handbookMono.variable,
].join(' ')
