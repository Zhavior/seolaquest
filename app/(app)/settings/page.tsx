import SettingsClient from '@/features/settings/components/SettingsClient'
import { requireCurrentUser } from '@/lib/auth'
import { Suspense } from 'react'
import Loading from '../loading'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsData />
    </Suspense>
  )
}

async function SettingsData() {
  const user = await requireCurrentUser()
  return <SettingsClient initial={{ name: user.name ?? '', title: user.title ?? 'Lead Hunter', email: user.email ?? '', emailDigest: user.emailDigest, radarAlerts: user.radarAlerts, crmWebhookUrl: user.crmWebhookUrl ?? '' }} />
}
