import {
  PLAN_CATALOG,
  type PlanCode,
} from '@/src/modules/billing/domain/catalog'

export type BillingPlanView = {
  code: PlanCode
  name: string
  priceLabel: string
  scanLimit: number
  enabled: boolean
  availabilityLabel: string
  benefits: string[]
}

const COMMON_PAID_BENEFITS = [
  'Manual scans use the server credit ledger.',
  'Saved results retain their original source links.',
  'Paid access starts only after signed webhook verification.',
]

function benefitsForPlan(code: PlanCode, scanLimit: number) {
  if (code === 'FREE') {
    return [
      'Save and manage tracked keywords.',
      'No manual scan credits are included.',
      'No paid entitlement is assumed.',
    ]
  }

  if (!PLAN_CATALOG[code].enabled) {
    return ['Not for sale and grants no entitlement.']
  }

  return [
    `${scanLimit} scan credits per qualifying paid invoice.`,
    ...COMMON_PAID_BENEFITS,
  ]
}

/**
 * The domain catalog owns names, price labels, limits, and sellability. This
 * projection adds display copy without creating a second commercial catalog.
 */
export function getBillingPlanCatalog(): BillingPlanView[] {
  return (Object.keys(PLAN_CATALOG) as PlanCode[]).map((code) => {
    const plan = PLAN_CATALOG[code]
    return {
      code: plan.code,
      name: plan.name,
      priceLabel: plan.priceLabel,
      scanLimit: plan.scanLimit,
      enabled: plan.enabled,
      availabilityLabel: plan.enabled
        ? plan.code === 'FREE' ? 'Base access' : 'Available when checkout is open'
        : 'Not for sale',
      benefits: benefitsForPlan(plan.code, plan.scanLimit),
    }
  })
}
