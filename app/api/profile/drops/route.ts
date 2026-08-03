import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    const drops = await prisma.drop.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        label: true,
        rarity: true,
        source: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      drops: drops.map((drop) => ({
        ...drop,
        createdAt: drop.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('profile drops hydration failed', error)
    return NextResponse.json(
      { ok: false, message: 'Could not load profile drops.' },
      { status: 500 },
    )
  }
}
