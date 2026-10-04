import { ClerkProvider, SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/features/handbook/auth/appearance'
import { AuthShell } from '@/features/handbook/auth/AuthShell'

export const metadata: Metadata = {
  title: 'Create Account | SEOlaQuest',
  description: 'Create an account before saving your first customer-research keyword.',
}

export default function Page() {
  return (
    <ClerkProvider>
      <AuthShell
        titleId="sign-up-heading"
        title="Start one focused customer hunt"
        lede="Create an account, then save your first real keyword in onboarding."
        aside={
          <>
            <ol className="hb-card-fields hb-mono" aria-label="Onboarding steps">
              <li>Name your hunter</li>
              <li>Declare your trade (optional)</li>
              <li>Mark your quarry (optional)</li>
              <li>Equip your first keyword</li>
              <li>Choose your hunting ground</li>
              <li>Sign the contract</li>
            </ol>
            <p className="hb-mono hb-soft">
              Already registered?{' '}
              <Link href="/sign-in" className="hb-link">
                Sign in
              </Link>
              .
            </p>
          </>
        }
      >
        <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" appearance={clerkAppearance} />
      </AuthShell>
    </ClerkProvider>
  )
}
