import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { MotionPreferenceProvider, SkipLink } from '@/components/SkipLink'

export const metadata: Metadata = {
  applicationName: 'CoQuest',
  title: 'CoQuest | Customer Research',
  description: 'A customer research workspace for tracking keywords, running manual source scans, and reviewing matched public posts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
          <MotionPreferenceProvider>
            <SkipLink />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </MotionPreferenceProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
