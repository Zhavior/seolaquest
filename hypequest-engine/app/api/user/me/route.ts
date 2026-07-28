import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let user = await prisma.user.findFirst({
      where: { email: 'admin@hypequest.com' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@hypequest.com',
          name: 'Dragon Slayer Overlord 🐉',
          subscriptionTier: 'ENTERPRISE_OVERLORD',
          questsRemaining: 100000,
          maxCredits: 100000,
          xpMultiplier: 3.0,
          level: 99,
          xp: 99999,
          unlockedTheme: 'OBSIDIAN_DRAGON'
        }
      })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
