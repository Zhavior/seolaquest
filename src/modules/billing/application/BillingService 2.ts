import Stripe from 'stripe'
import { requireCurrentUser } from '@/lib/auth'

type CheckoutPlan = 'BETA' | 'PRO' | 'AGENCY'

const stripePriceByPlan: Record<CheckoutPlan, string | undefined> = {
  BETA: process.env.STRIPE_PRICE_BETA,
  PRO: process.env.STRIPE_PRICE_PRO,
  AGENCY: process.env.STRIPE_PRICE_AGENCY,
}

type PotionId = 'minor_vial' | 'greater_elixir' | 'dragon_cauldron'

const POTION_DETAILS = {
  minor_vial: { name: 'Minor Mana Vial', priceCents: 500, quests: 1000 },
  greater_elixir: { name: 'Greater Mana Elixir', priceCents: 1000, quests: 2500 },
  dragon_cauldron: { name: "Dragon's Mana Cauldron", priceCents: 2000, quests: 6000 },
}

export class BillingService {
  static async createCheckout(plan: CheckoutPlan) {
    const user = await requireCurrentUser()
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const priceId = stripePriceByPlan[plan]
    const siteUrl = process.env.NEXTAUTH_URL

    if (!stripeKey || !priceId || !siteUrl) {
      return { ok: false, message: 'Checkout is not configured yet. Add the Stripe price IDs in Vercel first.' }
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/billing?checkout=success`,
      cancel_url: `${siteUrl}/billing?checkout=cancelled`,
    })

    if (!session.url) return { ok: false, message: 'Stripe did not return a checkout link. Try again.' }
    return { ok: true, url: session.url }
  }

  static async createManaCheckout(potionId: string) {
    const user = await requireCurrentUser()
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const siteUrl = process.env.NEXTAUTH_URL
    const potion = POTION_DETAILS[potionId as PotionId]

    if (!stripeKey || !siteUrl || !potion) {
      return { ok: false, message: 'Checkout is not configured or invalid item.' }
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { userId: user.id, type: 'mana_potion', potionId, quests: potion.quests.toString() },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: potion.name,
            },
            unit_amount: potion.priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}?checkout=success&potion=${potionId}`,
      cancel_url: `${siteUrl}?checkout=cancelled`,
    })

    if (!session.url) return { ok: false, message: 'Stripe did not return a checkout link. Try again.' }
    return { ok: true, url: session.url }
  }
}
