import Link from 'next/link'
import { Board } from '../components/primitives'
import { HeroStage } from './HeroStage'

/**
 * The hero is bare text on the scene, readable through a left-hand scrim, with
 * the playable sample hunt waiting below it. The tall stage leaves the beacons
 * visible between the headline and the panels.
 */
export function Hero() {
  return (
    <Board volume="start" first id="hunt" labelledBy="hero-title" className="hb-hero-stage">
      <HeroStage>
        <p className="hb-eyebrow">A hunt for founders who sell on X</p>
        <h1 id="hero-title" className="hb-display">
          Find buyers on&nbsp;X.
        </h1>
        <p className="hb-hero-lead">
          Scan X for the problems you solve. Every match is scored for buyer intent and arrives with its source post,
          so you read before you reply.
        </p>
        <div className="hb-ctas">
          <Link href="/sign-up" className="hb-btn">
            Start free
          </Link>
          <Link href="/radar" className="hb-btn hb-btn--label">
            Try the sample hunt
          </Link>
        </div>
        <p className="hb-hero-fine hb-mono">
          Free Scout is $0 and saves keywords. Real scans need a paid plan. The sample needs nothing.
        </p>
      </HeroStage>
    </Board>
  )
}
