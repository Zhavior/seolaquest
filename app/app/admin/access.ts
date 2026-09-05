import 'server-only'
import { notFound } from 'next/navigation'
import { getAdminIdentity } from '@/src/modules/admin/authorization'

export async function requireAdminPage() {
  if (!await getAdminIdentity()) notFound()
}
