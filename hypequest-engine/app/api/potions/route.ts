import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId, potionId, questCredits } = await req.json()

    if (!userId || !questCredits) {
      return NextResponse.json({ error: 'Missing userId or credit amount' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        questsRemaining: {
          increment: questCredits,
        },
      },
    })

    return NextResponse.json({
      success: true,
      newTotal: updatedUser.questsRemaining,
      message: `${questCredits} quests added to balance!`,
    })
  } catch (error) {
    console.error('Potion purchase error:', error)
    return NextResponse.json({ error: 'Failed to process potion refill' }, { status: 500 })
  }
}
