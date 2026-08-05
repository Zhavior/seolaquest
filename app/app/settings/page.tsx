import { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { requireCurrentUser } from '@/lib/auth'
import Loading from '../loading'

const SettingsClient = nextDynamic(() =>
  import('@/features/settings/components/SettingsClient')
)

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Basecamp Settings | CoQuest',
  description: 'Configure your adventurer profile, integrations, and operational scrolls.',
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsData />
    </Suspense>
  )
}

async function SettingsData() {
  const user = await requireCurrentUser()
  return (
    <SettingsClient
      initial={{
        name: user.name ?? '',
        title: user.title ?? 'Lead Hunter',
        email: user.email ?? '',
        emailDigest: user.emailDigest,
        radarAlerts: user.radarAlerts,
        crmWebhookUrl: user.crmWebhookUrl ?? '',
      }}
    />
  )
}
