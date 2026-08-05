import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SkipLink } from '@/components/SkipLink'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-inter',
})

export const metadata: Metadata = {
  applicationName: 'SEO la Quest',
  title: 'SEO la Quest | Customer Research',
  description: 'A customer research workspace for tracking keywords, running manual source scans, and reviewing matched public posts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="font-sans min-h-screen text-black antialiased"
        style={{
          backgroundColor: '#F4F0EA',
          backgroundImage: `
            repeating-linear-gradient(transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px)
          `
        }}
      >
        <ClerkProvider>
          <SkipLink />
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
