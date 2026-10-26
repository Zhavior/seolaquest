'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../artifact/IconSprite'
import {
  SAMPLE_GEO_BRAND,
  SAMPLE_GEO_CITED,
  SAMPLE_GEO_LABEL,
  SAMPLE_GEO_PRESENCE,
  SAMPLE_GEO_QUERY,
  SAMPLE_GEO_SOURCES,
  SOURCE_TYPE_INFO,
} from '../geo/sample'
import { valleyAudio } from '../valley/audio'
import type { BeaconView } from '../valley/scene'
import { useHomeStage } from './HomeStage'

const TEAL = '#5DD6B0'
const MUTED = '#6E6590'
const BRAND_TONE = '#8E86A8'
/** The visitor's own site, after the four cited sources. */
const BRAND = SAMPLE_GEO_CITED.length

type Pick = 'target' | 'skipped'

/**
 * The hero: copy on the scene, then one sample AI-citation scan as a source
 * list and a source card. Picking a source lights its beacon in the valley
 * (clicking a beacon picks it back); adding it to the plan fires a light
 * pillar. Your own site can be picked too, to see why it was left out. The scan, the sites and the
 * ranks are invented and labelled; the fields and the "is my site cited"
 * verdict follow the product's own scan rules.
 */
export function GeoHeroStage({ children }: { children: ReactNode }) {
  const [sel, setSel] = useState(0)
  const [picks, setPicks] = useState<Record<string, Pick>>({})
  const stage = useHomeStage()

  const brandRow = SAMPLE_GEO_SOURCES.find((s) => s.domain === SAMPLE_GEO_BRAND)!
  const isBrand = sel === BRAND
  const source = isBrand ? brandRow : SAMPLE_GEO_CITED[sel]
  const info = SOURCE_TYPE_INFO[source.sourceType]
  const done = isBrand ? null : (picks[source.url] ?? null)
  const targets = Object.values(picks).filter((p) => p === 'target').length

  const beacons: BeaconView[] = useMemo(
    () =>
      [
        ...SAMPLE_GEO_CITED.map((s, i): BeaconView => ({
          state: picks[s.url] === 'target' ? 'claimed' : picks[s.url] === 'skipped' ? 'dismissed' : 'open',
          selected: i === sel,
        })),
        { state: 'open', selected: sel === BRAND },
      ],
    [picks, sel],
  )

  useEffect(() => {
    stage.setBeacons(beacons)
  }, [stage, beacons])

  useEffect(() => {
    stage.onPick((index) => {
      valleyAudio.hover()
      setSel(index)
    })
    return () => stage.onPick(null)
  }, [stage])

  function onTarget() {
    if (done || isBrand) return
    valleyAudio.claim()
    setPicks((current) => ({ ...current, [source.url]: 'target' }))
    stage.fire(sel)
  }

  function onSkip() {
    if (done || isBrand) return
    valleyAudio.dismiss()
    setPicks((current) => ({ ...current, [source.url]: 'skipped' }))
  }

  const tint = isBrand ? BRAND_TONE : done === 'target' ? TEAL : done === 'skipped' ? MUTED : info.color

  return (
    <>
      <div className="hb-hero-top">
        <div className="hb-hero-copy">{children}</div>
      </div>
      <div className="hb-deck">
        <section className="hb-panel hb-log" aria-label="Sample scan, cited sources">
          <div className="hb-ph">
            <b>SAMPLE SCAN</b>
            <span>PERPLEXITY · INVENTED</span>
          </div>

          <p className="hb-geo-query">
            <span className="hb-mono">Question asked</span>
            “{SAMPLE_GEO_QUERY}”
          </p>

          <ul className="hb-qrows" aria-label="Sources the answer cited">
            {SAMPLE_GEO_CITED.map((s, i) => {
              const t = SOURCE_TYPE_INFO[s.sourceType]
              const pick = picks[s.url]
              const color = pick === 'target' ? TEAL : pick === 'skipped' ? MUTED : t.color
              return (
                <li key={s.url}>
                  <button
                    type="button"
                    className="hb-qrow"
                    aria-pressed={i === sel}
                    style={i === sel ? { borderColor: color } : undefined}
                    onClick={() => setSel(i)}
                    onMouseEnter={() => valleyAudio.hover()}
                  >
                    <span style={{ opacity: pick ? 0.4 : 1, display: 'inline-flex', color: t.color }}>
                      <Icon name={t.icon} size={34} />
                    </span>
                    <span className="hb-qrow-text">
                      <b>{s.domain}</b>
                      <small>
                        {t.label}
                        {pick === 'target' ? ' · In your plan' : pick === 'skipped' ? ' · Skipped' : ''}
                      </small>
                    </span>
                    <span className="hb-qrow-score" style={{ color: pick ? MUTED : t.color }}>
                      #{s.citedRank}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            className="hb-geo-brand"
            aria-pressed={isBrand}
            onClick={() => setSel(BRAND)}
            onMouseEnter={() => valleyAudio.hover()}
          >
            <span className="hb-lv">YOUR SITE</span>
            <span className="hb-geo-brand-text">
              <b>{SAMPLE_GEO_BRAND}</b>{' '}
              {SAMPLE_GEO_PRESENCE.brandCited
                ? `cited at #${SAMPLE_GEO_PRESENCE.brandCitedRank}.`
                : SAMPLE_GEO_PRESENCE.brandRetrieved
                  ? `found by the search${brandRow.retrievedRank ? ` (result ${brandRow.retrievedRank})` : ''}, but not cited in the answer.`
                  : 'not found by the search at all.'}
            </span>
          </button>
        </section>

        <section
          className="hb-panel hb-tip"
          aria-label="Selected source"
          style={{ borderColor: tint, boxShadow: `0 0 0 3px #0E0A1C, 0 0 0 4px #5A4720, 0 0 46px ${tint}45, 0 28px 60px rgba(0,0,0,.7)` }}
        >
          <div className="hb-tbar" style={{ background: tint }} />
          <div className="hb-tb" key={source.url}>
            <div className="hb-tt">
              <span style={{ display: 'inline-flex', color: tint, filter: `drop-shadow(0 0 12px ${tint})` }}>
                <Icon name={info.icon} size={58} className="hb-floaty" />
              </span>
              <div>
                <h2 className="hb-tip-name" style={{ color: tint }}>
                  {source.domain}
                </h2>
                <small>{isBrand ? 'Your site · left out' : `${info.label} · cited source`}</small>
              </div>
            </div>
            <div className="hb-bigscore">
              <b>{isBrand ? '–' : `#${source.citedRank}`}</b>
              <span>{isBrand ? 'NOT CITED IN THE ANSWER' : 'CITED IN THE ANSWER'}</span>
            </div>
            <hr />
            <blockquote className="hb-quote">{source.title}</blockquote>
            <p className="hb-by">{source.snippet}</p>
            <div className="hb-facts">
              <p className="hb-good">
                <Icon name="compass" size={20} />
                {isBrand
                  ? `The search found this page${source.retrievedRank ? ` as result ${source.retrievedRank}` : ''}, and the answer cited ${SAMPLE_GEO_CITED.length} other pages instead.`
                  : info.what}
              </p>
              <p className="hb-src">
                <Icon name="flag" size={20} />
                Your move: {info.move}
              </p>
            </div>
            {isBrand ? null : !done ? (
              <div className="hb-acts">
                <button type="button" className="hb-btn hb-btn--small" onClick={onTarget}>
                  Add to plan
                </button>
                <button type="button" className="hb-btn hb-btn--label hb-btn--small" onClick={onSkip}>
                  Skip
                </button>
              </div>
            ) : (
              <p className="hb-done">
                {done === 'target' ? 'In your plan. The beacon burns teal in the valley.' : 'Skipped. The beacon has gone dark.'}
              </p>
            )}
          </div>
        </section>

        <p className="hb-note" role="status">
          <span className="hb-slip">SAMPLE</span> {SAMPLE_GEO_LABEL}
          <br />
          {targets === 0
            ? 'Pick a source to see what kind of page it is and what you could do about it.'
            : `${targets} of ${SAMPLE_GEO_CITED.length} cited sources in your plan.`}
        </p>
      </div>
    </>
  )
}
