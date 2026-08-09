import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SkipLink } from '@/components/SkipLink'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ThemeScript } from '@/components/theme/ThemeScript'
import { siteUrl } from '@/lib/siteUrl'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-inter',
})

const TITLE = 'SEOlaQuest | AI Social Listening & Lead Monitoring'
const DESCRIPTION =
  'SEOlaQuest monitors X (Twitter) and Reddit for your target keywords in real time. AI scouts flag posts from potential customers and deliver matched leads to your dashboard automatically.'

export const metadata: Metadata = {
  // Without `metadataBase` every relative URL below resolves against the
  // deployment's own hostname, so preview builds would publish preview URLs as
  // their canonical and Open Graph targets.
  metadataBase: siteUrl,
  applicationName: 'SEOlaQuest',
  title: TITLE,
  description: DESCRIPTION,
  // No `alternates.canonical` and no `openGraph.url` here on purpose. Metadata
  // fields are inherited by any child page that does not set them, so a
  // canonical declared at the root would tell crawlers that /pricing, /blog,
  // and every post are all copies of the homepage. Each public page declares
  // its own; see app/page.tsx.
  openGraph: {
    type: 'website',
    siteName: 'SEOlaQuest',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
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
