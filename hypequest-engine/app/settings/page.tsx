import SettingsClient from './SettingsClient'
import { requireCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireCurrentUser()
  return <SettingsClient initial={{ name: user.name ?? '', title: user.title, email: user.email ?? '', emailDigest: user.emailDigest, radarAlerts: user.radarAlerts }} />
}
