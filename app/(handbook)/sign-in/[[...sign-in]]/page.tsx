import { ClerkProvider, SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/features/handbook/auth/appearance'
import { AuthShell } from '@/features/handbook/auth/AuthShell'

export const metadata: Metadata = {
  title: 'Sign In | SEOlaQuest',
  description: 'Sign in to resume your saved SEOlaQuest workspace.',
}

export default function Page() {
  return (
    <ClerkProvider>
      <AuthShell
        titleId="sign-in-heading"
        title="Resume your customer hunt"
        lede="Sign in to open your saved workspace or pick setup back up where you stopped."
        aside={
          <p className="hb-mono hb-soft">
            New here?{' '}
            <Link href="/sign-up" className="hb-link">
              Create a free account
            </Link>
            . Free Scout is $0.
          </p>
        }
      >
        <SignIn fallbackRedirectUrl="/onboarding" signUpUrl="/sign-up" appearance={clerkAppearance} />
      </AuthShell>
    </ClerkProvider>
  )
}
