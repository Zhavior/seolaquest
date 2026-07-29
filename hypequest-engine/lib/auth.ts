import { currentUser, auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function getCurrentUser() {
  const { userId } = await auth()
  
  if (!userId) {
    if (process.env.NODE_ENV === 'development') {
      let fallbackUser = await prisma.user.findUnique({ where: { id: 'local_dev_user' } });
      if (!fallbackUser) {
        fallbackUser = await prisma.user.create({
          data: {
            id: 'local_dev_user',
            email: 'hunter@hypequest.local',
            name: 'Local Hunter',
            level: 4,
            xp: 1250,
          }
        });
      }
      return fallbackUser;
    }
    return null
  }

  // Get the user from the database
  let user = await prisma.user.findUnique({ where: { id: userId } })
  
  // If the user doesn't exist in our DB yet, but exists in Clerk, create them
  if (!user) {
    const clerkUser = await currentUser()
    if (clerkUser) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.fullName || clerkUser.firstName || 'Hunter',
        }
      })
    }
  }

  return user
}

export async function requireCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
