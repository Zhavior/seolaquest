import { Sidebar } from '@/components/Sidebar'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in?redirect_url=%2Fapp')
  if (!user.onboardingComplete) redirect('/onboarding?returnTo=%2Fapp')

  return (
    <div className="flex min-h-dvh text-black">
      <Sidebar />
      <main
        data-authenticated-main
        className="min-w-0 flex-1 w-full max-w-full overflow-x-hidden pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0"
      >
        {children}
      </main>
    </div>
  )
}
