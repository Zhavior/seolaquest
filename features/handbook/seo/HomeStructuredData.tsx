import { FAQ } from '../landing/errata'
import { JsonLdScript, faqSchema, organizationSchema, softwareSchema, websiteSchema } from './jsonLd'

/**
 * Only the free early-access account is offered: GEO scans have no price, and
 * structured data must not advertise what cannot be bought.
 */
export function HomeStructuredData() {
  const offers = [{ name: 'Early access', price: '0', description: 'Free account. GEO scans are not switched on yet.' }]
  return <JsonLdScript data={[organizationSchema(), websiteSchema(), softwareSchema(offers), faqSchema(FAQ)]} />
}
