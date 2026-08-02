import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { WebhookService } from '@/src/modules/billing/application/WebhookService'
import { logger } from '@/src/modules/core/infrastructure/logger'

export const maxDuration = 60

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!stripeKey || !webhookSecret) {
    return new NextResponse('Stripe webhook is not configured', { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return new NextResponse('Missing Stripe signature', { status: 400 })

  // Stripe owns delivery retries. Bound provider lookups performed during
  // reconciliation so one webhook cannot consume the whole function window.
  const stripe = new Stripe(stripeKey, { timeout: 8_000, maxNetworkRetries: 0 })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch {
    logger.warn({ outcomeCode: 'STRIPE_SIGNATURE_REJECTED' }, 'Rejected Stripe webhook signature')
    return new NextResponse('Invalid Stripe signature', { status: 400 })
  }

  try {
    const result = await WebhookService.process(stripe, event)
    if (!result.recognized) return new NextResponse('Event ignored', { status: 200 })
    if (result.duplicate) return new NextResponse('Event already accepted', { status: 200 })
    if (result.inProgress) {
      return new NextResponse('Event processing is still in progress', {
        status: 503,
        headers: { 'Retry-After': '30' },
      })
    }
    return new NextResponse('Event processed', { status: 200 })
  } catch {
    logger.error({
      outcomeCode: 'STRIPE_WEBHOOK_PROCESSING_FAILED',
      eventType: event.type,
    }, 'Stripe webhook processing failed')
    return new NextResponse('Webhook processing failed', { status: 500 })
  }
}
