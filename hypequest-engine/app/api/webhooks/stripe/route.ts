import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

function planForSubscription(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing' ? 'PRO' : 'FREE'
}

export async function POST(req: Request) {
  if (!stripeKey || !webhookSecret) return new NextResponse('Stripe webhook is not configured', { status: 503 })

  const signature = (await headers()).get('stripe-signature')
  if (!signature) return new NextResponse('Missing Stripe signature', { status: 400 })

  let event: Stripe.Event
  try {
    const stripe = new Stripe(stripeKey)
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe webhook signature'
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const checkout = event.data.object
      const userId = checkout.metadata?.userId
      const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id
      
      if (userId && customerId) {
        if (checkout.metadata?.type === 'mana_potion') {
          const questsToAdd = parseInt(checkout.metadata.quests || '0', 10)
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId,
              questsRemaining: { increment: questsToAdd }
            }
          })
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId, plan: 'PRO', subscriptionStatus: 'active' }
          })
        }
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: planForSubscription(subscription.status), subscriptionStatus: subscription.status },
      })
    }
  } catch (error) {
    console.error('[Stripe] Webhook processing failed', error)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }

  return new NextResponse('Webhook processed successfully', { status: 200 })
}
