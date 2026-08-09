import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { logger } from '@/src/modules/core/infrastructure/logger'

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
    // requestId/userId/path/ip are injected by withApiHandler's AsyncLocalStorage store.
    logger.error(
      {
        err: error,
        event: 'profile_posts_hydration_failed',
        outcomeCode: 'PROFILE_POSTS_HYDRATION_FAILED',
      },
      'Profile posts hydration failed',
    )
    return NextResponse.json(
      {
        ok: false,
        message: 'Could not load profile posts.',
      },
      { status: 500 },
    )
  }
})
