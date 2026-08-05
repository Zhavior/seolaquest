import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'

function toCurrentUserDto(user: {
  name: string | null
  questsRemaining: number
  maxCredits: number
}) {
  return {
    name: user.name,
    questsRemaining: user.questsRemaining,
    maxCredits: user.maxCredits,
  }
}

export const GET = withApiHandler(async () => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: toCurrentUserDto(user) })
  } catch (error) {
    logger.error({ err: error, outcomeCode: 'USER_PROFILE_READ_FAILED' }, 'User profile read failed')
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
})
