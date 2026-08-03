import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await ScanRunService.enqueueManual(user.id)
    if (!result.queued && 'reason' in result) {
      if (result.reason === 'NO_ACTIVE_KEYWORDS') {
        return NextResponse.json(
          { success: false, queued: false, error: 'Add a keyword before scanning.' },
          { status: 422 },
        )
      }
      if (result.reason === 'NOT_ENTITLED') {
        return NextResponse.json(
          { success: false, queued: false, error: 'Manual scanning requires an active paid subscription.' },
          { status: 403 },
        )
      }
      return NextResponse.json(
        { success: false, queued: false, error: 'No scan credits remaining.' },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      scanAccepted: result.queued,
      queued: true,
      runId: result.runId,
      message: result.queued
        ? 'Scan queued. Results will appear after processing.'
        : 'A scan is already queued for this window.',
    })
  } catch {
    return NextResponse.json({ success: false, queued: false, error: 'Scan request failed' }, { status: 500 })
  }
}
