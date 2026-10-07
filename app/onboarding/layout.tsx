import type { ReactNode } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { OnboardingSkin } from '@/features/handbook/onboarding/OnboardingSkin'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <OnboardingSkin>{children}</OnboardingSkin>
    </ClerkProvider>
  )
}
