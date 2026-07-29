import ProfileClient from './ProfileClient'
import prisma from '@/lib/prisma'
import { requireCurrentUser } from '@/lib/auth'
import { Suspense } from 'react'
import Loading from '../loading'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileData />
    </Suspense>
  )
}

async function ProfileData() {
  const user = await requireCurrentUser()
  const posts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, content: true, createdAt: true },
  })

  return <ProfileClient user={{ name: user.name ?? user.email ?? 'Hunter', title: user.title ?? 'Lead Hunter', level: user.level }} initialPosts={posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString() }))} />
}
