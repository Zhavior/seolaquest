import './globals.css'
import { Space_Grotesk } from 'next/font/google'
import { Sidebar } from '../components/Sidebar'
import { ClerkProvider } from '@clerk/nextjs'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata = {
  title: 'HypeQuest Engine',
  description: 'Gamified Social Listening',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body 
          className={`${spaceGrotesk.className} flex min-h-screen text-black`}
          style={{
            backgroundColor: '#F4F0EA',
            backgroundImage: `
              repeating-linear-gradient(transparent, transparent 39px, rgba(0,0,0,0.06) 39px, rgba(0,0,0,0.06) 40px)
            `
          }}
        >
          <Sidebar />
          <main className="flex-1 w-full max-w-full overflow-x-hidden pt-16 md:pt-0">
            {children}
          </main>
        </body>
      </ClerkProvider>
    </html>
  )
}
