import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms | SEOlaQuest',
  description: 'SEOlaQuest terms for accounts, billing, credits, and acceptable use.',
  alternates: { canonical: '/terms' },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
