import 'server-only'
import { cache } from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/auth'
import { ForbiddenError } from '@/src/modules/core/infrastructure/errors'

export const OWNER_ADMIN_EMAIL = 'zhavior@gmail.com'

export const getAdminIdentity = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null
  const identity = await currentUser()
  if (!identity || identity.id !== user.id) return null
  const primary = identity.emailAddresses.find(email => email.id === identity.primaryEmailAddressId)
  if (primary?.verification?.status !== 'verified'
    || primary.emailAddress.trim().toLowerCase() !== OWNER_ADMIN_EMAIL) return null
  return { id: user.id, email: OWNER_ADMIN_EMAIL }
})

export async function requireAdmin() {
  const admin = await getAdminIdentity()
  if (!admin) throw new ForbiddenError('Administrator access required')
  return admin
}
