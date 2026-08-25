import { ClerkProvider, SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | SEOlaQuest',
  description: 'Sign in to resume your saved SEOlaQuest workspace.',
}

export default function Page() {
  return (
    <ClerkProvider>
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-canvas px-4 py-8 text-ink">
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center text-2xl font-black uppercase tracking-widest focus-visible:outline-4 focus-visible:outline-offset-4">
        SEOlaQuest
      </Link>
      <section aria-labelledby="sign-in-heading" className="flex w-full max-w-md flex-col items-center">
        <div className="mb-4 w-full border-3 border-outline bg-accent p-4 text-center shadow-brutal">
          <h1 id="sign-in-heading" className="text-2xl font-black uppercase">Resume your customer hunt</h1>
          <p className="mt-1 font-bold">Sign in to open your saved workspace or continue onboarding.</p>
        </div>
        <SignIn
          fallbackRedirectUrl="/onboarding"
          signUpUrl="/sign-up"
          appearance={{
            variables: { colorPrimary: '#111111', borderRadius: '0px' },
            options: { autoFocus: false },
            elements: {
              rootBox: 'flex w-full justify-center',
              cardBox: 'w-full',
              card: 'w-full',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              formFieldInput: { minHeight: '44px' },
              formButtonPrimary: { minHeight: '44px' },
              formFieldAction: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
              formFieldInputShowPasswordButton: { minHeight: '44px', minWidth: '44px' },
              socialButtonsBlockButton: { minHeight: '44px' },
              socialButtonsIconButton: { minHeight: '44px', minWidth: '44px' },
              alternativeMethodsBlockButton: { minHeight: '44px' },
              otpCodeFieldInput: { minHeight: '44px', minWidth: '44px' },
              backLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
              footerActionLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
              formResendCodeLink: { minHeight: '44px', display: 'inline-flex', alignItems: 'center' },
            },
          }}
        />
      </section>
      </main>
    </ClerkProvider>
  )
}
