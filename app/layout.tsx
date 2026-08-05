import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
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
          Runs synchronously while the browser parses the document, so the saved
          colour mode and mute setting are on `<html>` before the first paint.
          Without it, grey-mode users saw a full page of parchment flash to slate
          on every single load: the server cannot read localStorage, so it always
          emitted the light theme and the correction only landed after hydration.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;if(localStorage.getItem('coquest_theme')==='grey'){d.classList.add('grey-mode')}if(localStorage.getItem('coquest_sfx_enabled')==='false'){d.classList.add('sfx-muted')}}catch(e){}`,
          }}
        />
      </head>
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
