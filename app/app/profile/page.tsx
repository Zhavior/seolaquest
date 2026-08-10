import type { Metadata } from 'next'
import ProfileClient from '@/features/profile/components/ProfileClient'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { Suspense } from 'react'
import ProfileLoading from './loading'
import { readHunterProgression } from '@/src/modules/gamify/hunterProgression'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mage Tower | SEOlaQuest',
  description: 'Review your guild master profile, class identity, and account state.',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileData />
    </Suspense>
  )
}

async function ProfileData() {
  const user = await requireCurrentUser()
  const [posts, progression] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, content: true, createdAt: true },
    }),
    readHunterProgression(user.id),
  ])

  return <ProfileClient user={{ name: user.name ?? user.email ?? 'Hunter', title: user.title ?? 'Lead Hunter', level: progression.level }} initialPosts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString() }))} />
}
