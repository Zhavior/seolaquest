import { ClerkProvider, SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/features/handbook/auth/appearance'
import { AuthShell } from '@/features/handbook/auth/AuthShell'
import { QUEST_OBJECTIVES } from '@/features/auth/questSteps'

export const metadata: Metadata = {
  title: 'Join Early Access | SEOlaQuest',
  description: 'Create a free SEOlaQuest account for GEO early access. No card.',
}

export default function Page() {
  return (
    <ClerkProvider>
      <AuthShell
        titleId="sign-up-heading"
        title="Join the early access"
        lede="Free, and no card. GEO scans are planned to switch on in this account once they have run for real."
        aside={
          <>
            <p className="hb-mono hb-soft">
              Want to see what a scan shows first?{' '}
              <Link href="/radar" className="hb-link">
                See the sample scan
              </Link>{' '}
              (invented data, no account).
            </p>
            <p className="hb-prose">
              Until GEO switches on, your account opens today&apos;s app: the X lead finder. Its setup takes six short
              steps:
            </p>
            <ol className="hb-card-fields" aria-label="Today's setup, six short steps">
              {QUEST_OBJECTIVES.map((objective) => (
                <li key={objective.step}>
                  <strong>{objective.title}</strong>
                  {objective.optional ? ' (optional)' : ''}. {objective.objective}
                </li>
              ))}
            </ol>
            <p className="hb-mono hb-soft">
              Setup saves as you go. Nothing posts or messages anyone for you, and{' '}
              <Link href="/pricing" className="hb-link">
                pricing
              </Link>{' '}
              shows what early access includes.
            </p>
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
