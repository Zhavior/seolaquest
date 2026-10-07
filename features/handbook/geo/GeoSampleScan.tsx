import { Icon } from '../artifact/IconSprite'
import type { SourceType } from '@/src/modules/geo/domain/sourceType'
import {
  SAMPLE_GEO_BRAND,
  SAMPLE_GEO_LABEL,
  SAMPLE_GEO_PRESENCE,
  SAMPLE_GEO_QUERY,
  SAMPLE_GEO_SOURCES,
  SOURCE_TYPE_INFO,
} from './sample'

/** The sample answer, with citation markers in the order the sources were cited. Invented. */
const SAMPLE_ANSWER: Array<string | number> = [
  'Small agencies mostly want a CRM that is quick to set up and cheap per seat. Owners in agency forums report keeping the simpler tools and dropping the ones that needed a consultant ',
  1,
  '. User-ranked lists put a handful of small-team CRMs ahead on price and ease of use ',
  2,
  ', and one hands-on test of six tools on a five-person team came to a similar conclusion ',
  3,
  '. Some vendors now sell a plan aimed at small teams ',
  4,
  '.',
]

const TYPE_ORDER: SourceType[] = ['FORUM', 'AGGREGATOR', 'EDITORIAL', 'DIRECT']

/**
 * One sample scan laid out the way a real result reads: the question, the
 * answer with its citations, every source found, the verdict on your site,
 * and what each source type suggests you do. Static and invented.
 */
export function GeoSampleScan() {
  const sources = [...SAMPLE_GEO_SOURCES].sort((a, b) => (a.retrievedRank ?? 99) - (b.retrievedRank ?? 99))
  const brand = SAMPLE_GEO_SOURCES.find((s) => s.domain === SAMPLE_GEO_BRAND)

  return (
    <div className="hb-geo-scan">
      <p className="hb-note">
        <span className="hb-slip">SAMPLE</span> {SAMPLE_GEO_LABEL}
      </p>

      <section className="hb-geo-block" aria-labelledby="geo-q">
        <h2 id="geo-q" className="hb-h3">
          The question
        </h2>
        <p className="hb-geo-asked">“{SAMPLE_GEO_QUERY}”</p>
        <p className="hb-mono hb-soft">Site checked: {SAMPLE_GEO_BRAND} · Engine: Perplexity · Sample</p>
      </section>

      <section className="hb-geo-block" aria-labelledby="geo-a">
        <h2 id="geo-a" className="hb-h3">
          The answer
        </h2>
        <p className="hb-geo-answer">
          {SAMPLE_ANSWER.map((part, i) =>
            typeof part === 'number' ? (
              <sup key={i} className="hb-geo-cite">
                [{part}]
              </sup>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>
      </section>

      <section className="hb-geo-block" aria-labelledby="geo-verdict">
        <h2 id="geo-verdict" className="hb-h3">
          Your site
        </h2>
        <p className="hb-geo-verdict">
          <span className="hb-lv">{SAMPLE_GEO_PRESENCE.brandCited ? 'CITED' : SAMPLE_GEO_PRESENCE.brandRetrieved ? 'FOUND, NOT CITED' : 'NOT FOUND'}</span>
          <span>
            {SAMPLE_GEO_PRESENCE.brandCited
              ? `${SAMPLE_GEO_BRAND} was cited at #${SAMPLE_GEO_PRESENCE.brandCitedRank}.`
              : SAMPLE_GEO_PRESENCE.brandRetrieved
                ? `The search found ${SAMPLE_GEO_BRAND}${brand?.retrievedRank ? ` as result ${brand.retrievedRank}` : ''}, and the answer left it out. The engine knew the page and chose other sources.`
                : `The search did not find ${SAMPLE_GEO_BRAND} for this question.`}
          </span>
        </p>
      </section>

      <section className="hb-geo-block" aria-labelledby="geo-sources">
        <h2 id="geo-sources" className="hb-h3">
          Every source
        </h2>
        <div className="hb-geo-tbl">
          <table className="hb-ledger">
            <caption>In search order. Cited rank is the order the answer quoted them.</caption>
            <thead>
              <tr>
                <th scope="col">Found</th>
                <th scope="col">Cited</th>
                <th scope="col">Source</th>
                <th scope="col">Type</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => {
                const info = SOURCE_TYPE_INFO[s.sourceType]
                return (
                  <tr key={s.url} className={s.domain === SAMPLE_GEO_BRAND ? 'hb-geo-mine' : undefined}>
                    <td className="hb-mono">{s.retrievedRank ?? '–'}</td>
                    <td className="hb-mono">{s.citedRank ? `#${s.citedRank}` : 'No'}</td>
                    <th scope="row">
                      <span className="hb-geo-domain">{s.domain}</span>
                      <span className="hb-geo-title">{s.title}</span>
                    </th>
                    <td>
                      <span className="hb-geo-type" style={{ color: info.color }}>
                        <Icon name={info.icon} size={18} /> {info.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hb-geo-block" aria-labelledby="geo-moves">
        <h2 id="geo-moves" className="hb-h3">
          What each type suggests
        </h2>
        <ul className="hb-geo-moves">
          {TYPE_ORDER.map((type) => {
            const info = SOURCE_TYPE_INFO[type]
            return (
              <li key={type} style={{ borderColor: info.color }}>
                <span className="hb-geo-type" style={{ color: info.color }}>
                  <Icon name={info.icon} size={20} /> {info.label}
                </span>
                <p>{info.what}</p>
                <p>
                  <b>Your move:</b> {info.move}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="hb-prose">
          A real scan also records the engine&apos;s model, the tokens used and what the engine charged for that scan.
          The sample leaves those out rather than invent them.
        </p>
      </section>
    </div>
  )
}
