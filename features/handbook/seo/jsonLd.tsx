import { absoluteUrl } from '@/lib/siteUrl'

type JsonLd = Record<string, unknown>

/**
 * `<` is escaped so a string containing "</script>" cannot end the tag early.
 * Every value passed in is authored in this repo, never user input.
 */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SEOlaQuest',
    url: absoluteUrl('/'),
    email: 'support@seolaquest.com',
  }
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SEOlaQuest',
    url: absoluteUrl('/'),
  }
}

type OfferInput = { name: string; price: string; description: string }

/**
 * Only offers a visitor can actually take belong in structured data. The free
 * plan always qualifies; paid plans are included only while checkout is on.
 */
export function softwareSchema(offers: OfferInput[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEOlaQuest',
    url: absoluteUrl('/'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Scans X for the keywords you track, scores each public post for buyer intent, and delivers it to a lead inbox with the source post attached.',
    offers: offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: 'USD',
      description: offer.description,
    })),
  }
}

export function faqSchema(items: Array<{ q: string; a: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}
