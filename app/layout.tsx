import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SkipLink } from '@/components/SkipLink'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ThemeScript } from '@/components/theme/ThemeScript'

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

// `viewport-fit=cover` is what makes env(safe-area-inset-*) resolve to real
// values on notched devices — the mobile shell's safe padding depends on it.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/*
          Both scripts run synchronously while the browser parses the document,
          so the saved settings are on `<html>` before the first paint. Without
          them the server (which cannot read localStorage) always emits the
          default, and the correction only lands after hydration — a full page
          of parchment flashing to slate on every load.
        */}
        <ThemeScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('coquest_sfx_enabled')==='false'){document.documentElement.classList.add('sfx-muted')}}catch(e){}`,
          }}
        />
      </head>
      {/* Canvas colour and texture come from `@layer base` in globals.css — an
          inline style here would outrank every theme. */}
      <body className="font-sans min-h-screen bg-canvas text-ink antialiased">
        <ThemeProvider>
          <ClerkProvider>
            <SkipLink />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
