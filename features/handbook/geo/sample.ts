import type { IconName } from '../artifact/IconSprite'
import { brandPresence, type BrandPresence, type GeoSource } from '@/src/modules/geo/domain/parseAgentResponse'
import type { SourceType } from '@/src/modules/geo/domain/sourceType'

/**
 * One invented AI-citation scan, used by the home hero and the /radar sample.
 *
 * Nothing here came from an engine. Every domain uses the reserved `.example`
 * TLD so no real company is shown as cited or ignored, and the page labels it
 * as a sample wherever it appears. The shape is the product's own `GeoSource`,
 * and the brand line runs through the product's `brandPresence` rule, so the
 * sample cannot show a field or a verdict the real scan does not produce.
 */

export const SAMPLE_GEO_LABEL =
  'Sample scan. Invented for this page: no engine was asked, and every site ends in .example.'

export const SAMPLE_GEO_QUERY = 'Which CRM should a five-person agency use?'
export const SAMPLE_GEO_BRAND = 'yourbrand.example'

function source(
  url: string,
  title: string,
  snippet: string,
  sourceType: SourceType,
  citedRank: number | null,
  retrievedRank: number | null,
): GeoSource {
  return {
    url,
    domain: new URL(url).hostname,
    title,
    snippet,
    retrievedRank,
    cited: citedRank !== null,
    citedRank,
    sourceType,
    basis: 'KNOWN_DOMAIN',
  }
}

export const SAMPLE_GEO_SOURCES: GeoSource[] = [
  source(
    'https://forum.agencytalk.example/threads/which-crm-did-you-keep',
    'Which CRM did your small agency actually keep?',
    'Forty replies from agency owners comparing what they tried, what they dropped, and why.',
    'FORUM',
    1,
    2,
  ),
  source(
    'https://reviews.stackrank.example/crm/small-agencies',
    'Best CRMs for small agencies, ranked by users',
    'A ranked list with user ratings, pricing notes and a comparison table.',
    'AGGREGATOR',
    2,
    1,
  ),
  source(
    'https://blog.opsweekly.example/posts/six-crms-tested',
    'We tested six CRMs on a five-person team',
    'A long-form write-up of a month spent moving one team between tools.',
    'EDITORIAL',
    3,
    4,
  ),
  source(
    'https://pipelinehq.example/pricing',
    'PipelineHQ pricing',
    "A vendor's own pricing page, with a plan aimed at small teams.",
    'DIRECT',
    4,
    3,
  ),
  source(
    'https://yourbrand.example/pricing',
    'Your pricing page',
    'Found by the search, then left out of the answer.',
    'DIRECT',
    null,
    5,
  ),
]

/** The four sources the answer cited, in the order it cited them. */
export const SAMPLE_GEO_CITED = SAMPLE_GEO_SOURCES.filter((s) => s.cited).sort(
  (a, b) => (a.citedRank ?? 0) - (b.citedRank ?? 0),
)

export const SAMPLE_GEO_PRESENCE: BrandPresence = brandPresence(SAMPLE_GEO_SOURCES, SAMPLE_GEO_BRAND)

export type SourceTypeInfo = {
  label: string
  /** What kind of page it is, in a buyer's words. */
  what: string
  /** What a brand can do about it. Advice, not a promise of a citation. */
  move: string
  color: string
  icon: IconName
}

export const SOURCE_TYPE_INFO: Record<SourceType, SourceTypeInfo> = {
  FORUM: {
    label: 'Forum',
    what: 'A discussion where buyers describe the problem in their own words.',
    move: 'Join the thread with a useful, honest answer.',
    color: '#FF8A3D',
    icon: 'scroll',
  },
  AGGREGATOR: {
    label: 'Review site',
    what: 'A list or review page that ranks vendors side by side.',
    move: 'Get listed there, and ask real customers for reviews.',
    color: '#5DB2FF',
    icon: 'medal',
  },
  EDITORIAL: {
    label: 'Article',
    what: 'A guide or write-up someone published about the topic.',
    move: 'Pitch the writer, or publish the clearer guide yourself.',
    color: '#F3D58A',
    icon: 'compass',
  },
  DIRECT: {
    label: 'Vendor page',
    what: "A company's own page.",
    move: 'Make your own page the plainest answer to this exact question.',
    color: '#C9CBD2',
    icon: 'flag',
  },
}

/** "1", "2"... in each cited source's type colour, for the valley beacons. */
export const SAMPLE_GEO_MARKS = SAMPLE_GEO_CITED.map((s) => ({
  text: String(s.citedRank),
  fill: SOURCE_TYPE_INFO[s.sourceType].color,
}))
