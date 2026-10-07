import Link from 'next/link'
import { Board } from '../components/primitives'
import { GeoHeroStage } from './GeoHeroStage'

/**
 * The hero is bare text on the scene, readable through a left-hand scrim, with
 * one sample AI-citation scan waiting below it. The tall stage leaves the
 * beacons visible between the headline and the panels.
 */
export function Hero() {
  return (
    <Board volume="start" first id="hunt" labelledBy="hero-title" className="hb-hero-stage">
      <GeoHeroStage>
        <p className="hb-eyebrow">A quest for founders who want AI answers to name them</p>
        <h1 id="hero-title" className="hb-display">
          Be the source the answer cites.
        </h1>
        <p className="hb-hero-lead">
          When a buyer asks an AI search engine which tool to use, the answer cites a handful of sites. SEOlaQuest asks
          that question for you, lists every source the answer used, sorts them into forums, review sites, articles and
          vendor pages, and shows whether your site made it in.
        </p>
        <div className="hb-ctas">
          <Link href="/sign-up" className="hb-btn">
            Join early access
          </Link>
          <Link href="/radar" className="hb-btn hb-btn--label">
            See a sample scan
          </Link>
        </div>
        <p className="hb-hero-fine hb-mono">
          Early access. Scans are not switched on yet, and the sample below is invented.
        </p>
      </GeoHeroStage>
    </Board>
  )
}
