import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withApiHandler(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, content: true, createdAt: true },
    })

    return NextResponse.json({
      ok: true,
      posts: posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString() })),
    })
  } catch (error) {
    console.error('profile posts hydration failed', error)
    return NextResponse.json(
      {
        ok: false,
        message: 'Could not load profile posts.',
      },
      { status: 500 },
    )
  }
})
