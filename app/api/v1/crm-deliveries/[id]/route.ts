import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { normalizeCrmWebhookUrl, UnsafeCrmWebhookUrlError } from '@/src/modules/core/security/crmWebhookUrl'
import { CrmDeliveryService } from '@/src/modules/leads/application/CrmDeliveryService'

const deliveryIdSchema = z.string().uuid()
type DeliveryContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: DeliveryContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const parsed = deliveryIdSchema.safeParse((await params).id)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid delivery ID' }, { status: 400 })

  const delivery = await CrmDeliveryService.getStatus({ userId: user.id, deliveryId: parsed.data })
  if (!delivery) return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 })
  return NextResponse.json({ success: true, delivery })
}

export async function POST(_request: Request, { params }: DeliveryContext) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const parsed = deliveryIdSchema.safeParse((await params).id)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid delivery ID' }, { status: 400 })

  const entitlements = await EntitlementService.forUser(user.id)
  if (!entitlements.canExportToCRM) {
    return NextResponse.json({ success: false, error: 'Active paid access required' }, { status: 403 })
  }

  let destination: string | null
  try {
    destination = normalizeCrmWebhookUrl(user.crmWebhookUrl)
  } catch (error) {
    if (!(error instanceof UnsafeCrmWebhookUrlError)) throw error
    destination = null
  }
  if (!destination) {
    return NextResponse.json({ success: false, error: 'Configure a safe CRM destination first' }, { status: 409 })
  }

  const result = await CrmDeliveryService.retryDead({
    userId: user.id,
    deliveryId: parsed.data,
    normalizedDestination: destination,
  })
  if (!result.ok) {
    const status = result.reason === 'NOT_FOUND' ? 404 : 409
    return NextResponse.json({ success: false, error: 'Delivery cannot be retried' }, { status })
  }
  return NextResponse.json({ success: true, deliveryId: result.deliveryId, status: result.status })
}
