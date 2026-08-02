import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: 'Direct credit modification is disabled.',
        message: 'Please initiate a potion purchase via the Stripe checkout flow.',
      },
      { status: 403 }
    )
  } catch (error) {
    logger.error({ err: error, outcomeCode: 'POTION_ENDPOINT_FAILED' }, 'Potion endpoint failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
