import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'

export const GET = withApiHandler(async () => {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ status: 'ok', data: [] })
})
