import 'server-only'

import { getBillingPlanCatalog, type BillingPlanView } from '@/features/billing/catalog'
import { isPaidCheckoutOpen } from '@/features/billing/checkoutGate'
import { getAllPosts } from '@/lib/blog'
import { FounderSeatService, type FounderSeatSnapshot } from '@/src/modules/billing/application/FounderSeatService'
import { FOUNDER_LOCK_TERMS, FOUNDER_SEAT_LIMIT, POTION_CATALOG } from '@/src/modules/billing/domain/catalog'

/**
 * Live inputs for the public pages, each read from the module that owns it.
 * A marketing page must render when the database does not answer, so the one
 * database read (founder seats) degrades to "no counter", never to an error.
 */

export async function loadFounderSeats(): Promise<FounderSeatSnapshot | null> {
  try {
    return await FounderSeatService.snapshot()
  } catch {
    return null
  }
}

export type InventoryFacts = {
  plans: BillingPlanView[]
  free: BillingPlanView
  beta: BillingPlanView
  founder: BillingPlanView
  comingSoon: BillingPlanView[]
  checkoutOpen: boolean
  founderSeatLimit: number
  founderLockTerms: readonly string[]
  potions: Array<{ id: string; name: string; priceLabel: string; mana: number }>
}

export function loadInventory(): InventoryFacts {
  const plans = getBillingPlanCatalog()
  const pick = (code: BillingPlanView['code']) => plans.find((plan) => plan.code === code)!
  return {
    plans,
    free: pick('FREE'),
    beta: pick('BETA'),
    founder: pick('FOUNDER'),
    comingSoon: plans.filter((plan) => !plan.enabled),
    checkoutOpen: isPaidCheckoutOpen(),
    founderSeatLimit: FOUNDER_SEAT_LIMIT,
    founderLockTerms: FOUNDER_LOCK_TERMS,
    potions: Object.values(POTION_CATALOG).map((potion) => ({
      id: potion.id,
      name: potion.name,
      priceLabel: `$${(potion.priceCents / 100).toFixed(0)}`,
      mana: potion.quests,
    })),
  }
}

export function loadNotes(limit = 3) {
  return getAllPosts()
    .slice(0, limit)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      readTimeMinutes: post.readTimeMinutes,
      tag: post.tag,
    }))
}
