import type { ReactNode } from 'react'
import { HandbookFrame } from '@/features/handbook/components/HandbookFrame'

/**
 * Every public page shares one frame, so the fore-edge tab rail persists across
 * navigations and only the board under it changes. The signed-in product
 * (`app/app`) and onboarding keep their own layouts.
 */
export default function HandbookLayout({ children }: { children: ReactNode }) {
  return <HandbookFrame>{children}</HandbookFrame>
}
