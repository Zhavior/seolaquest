import type { InventoryFacts } from '../facts'
import { FAQ } from '../landing/errata'
import { JsonLdScript, faqSchema, organizationSchema, softwareSchema, websiteSchema } from './jsonLd'

/** "$14.99/mo" becomes "14.99". Anything without a dollar amount is skipped. */
function priceOf(label: string): string | null {
  const match = /\$(\d+(?:\.\d{2})?)/.exec(label)
  return match ? match[1] : null
}

/**
 * Prices come from the billing catalog, and paid offers are listed only while
 * checkout is on: structured data must not advertise what cannot be bought.
 */
export function HomeStructuredData({ inventory }: { inventory: InventoryFacts }) {
  const offers = [{ name: inventory.free.name, price: '0', description: 'Save up to 10 keywords. No scan credits.' }]
  if (inventory.checkoutOpen) {
    for (const plan of [inventory.beta, inventory.founder]) {
      const price = priceOf(plan.priceLabel)
      if (price) {
        offers.push({
          name: plan.name,
          price,
          description: `${plan.scanLimit.toLocaleString('en-US')} scan credits per paid invoice.`,
        })
      }
    }
  }
  return <JsonLdScript data={[organizationSchema(), websiteSchema(), softwareSchema(offers), faqSchema(FAQ)]} />
}
