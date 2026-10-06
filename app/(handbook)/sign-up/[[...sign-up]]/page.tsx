import { ClerkProvider, SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'
import { clerkAppearance } from '@/features/handbook/auth/appearance'
import { AuthShell } from '@/features/handbook/auth/AuthShell'
import { QUEST_OBJECTIVES } from '@/features/auth/questSteps'

export const metadata: Metadata = {
  title: 'Create Account | SEOlaQuest',
  description: 'Create an account before saving your first customer-research keyword.',
}

export default function Page() {
  return (
    <ClerkProvider>
      <AuthShell
        titleId="sign-up-heading"
        title="Start your first hunt"
        lede="Make a free account, then pick your first keyword. Free Scout costs $0 and asks for no card."
        aside={
          <>
            <p className="hb-mono hb-soft">
              Want to see a lead first?{' '}
              <Link href="/#hunt" className="hb-link">
                Try the sample hunt
              </Link>{' '}
              (labelled sample data, no account).
            </p>
            <ol className="hb-card-fields" aria-label="Setup, six short steps">
              {QUEST_OBJECTIVES.map((objective) => (
                <li key={objective.step}>
                  <strong>{objective.title}</strong>
                  {objective.optional ? ' (optional)' : ''}. {objective.objective}
                </li>
              ))}
            </ol>
            <p className="hb-mono hb-soft">
              Setup saves as you go, so you can leave and pick it up later. It never posts or messages anyone for you.
              Free Scout saves keywords; running scans needs a paid plan, and{' '}
              <Link href="/pricing" className="hb-link">
                pricing
              </Link>{' '}
              shows what is open today.
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
