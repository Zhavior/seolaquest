import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'

const scanRunIdSchema = z.string().uuid()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = scanRunIdSchema.safeParse((await context.params).id)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid scan ID' }, { status: 400 })
    const status = await ScanRunService.getStatus(user.id, parsed.data)
    if (!status) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
    return NextResponse.json({ success: true, scan: status })
  } catch {
    return NextResponse.json({ error: 'Scan status unavailable' }, { status: 500 })
  }
}
