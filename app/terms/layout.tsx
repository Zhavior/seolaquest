import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms | SEOlaQuest',
  description: 'SEOlaQuest terms for accounts, billing, credits, and acceptable use.',
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
