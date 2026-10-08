import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { isPaidCheckoutOpen } from '@/features/billing/checkoutGate'
import { EarlyAccessWelcome } from '@/features/handbook/welcome/EarlyAccessWelcome'

export const metadata: Metadata = {
  title: 'Early Access | SEOlaQuest',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Where a new account lands after sign-up. The public site sells AI-citation
 * (GEO) scans, which are not switched on yet, so this page says that plainly
 * instead of dropping the person into the X lead finder they did not sign up
 * for. The X tool stays one click away for anyone who wants it. Accounts that
 * already finished the X setup go straight to the app.
 */
export default async function WelcomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fwelcome')
  if (user.onboardingComplete) redirect('/app')

  // Read from the same switch the checkout uses, so the page cannot drift from it.
  return <EarlyAccessWelcome checkoutOpen={isPaidCheckoutOpen()} setupStarted={user.onboardingStep > 1} />
}
