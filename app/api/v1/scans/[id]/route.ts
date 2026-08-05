import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/src/modules/core/infrastructure/errors'

const scanRunIdSchema = z.string().uuid()

export const GET = withApiHandler(async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
) => {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()

  const { id } = await context.params
  const parsed = scanRunIdSchema.safeParse(id)
  if (!parsed.success) throw new ValidationError('Invalid scan ID', parsed.error.issues)

  const status = await ScanRunService.getStatus(user.id, parsed.data)
  if (!status) throw new NotFoundError('Scan not found')

  return NextResponse.json({ success: true, scan: status })
})

