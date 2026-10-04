import { SAMPLE_LABEL, SAMPLE_SETS } from '../sample/data'
import { CLAIM_MIN_SCORE, CLAIM_XP, tierForScore } from '../rules'

const post = SAMPLE_SETS[0].posts[0]

function Marker({ n }: { n: number }) {
  return (
    <span className="hb-marker" aria-hidden="true">
      {n}
    </span>
  )
}

/**
 * One invented lead, laid out the way the product lays out a real one. Used
 * in the hero (zones 1-3) and, with numbered acetate markers, as the annotated
 * figure in The Hunt (all four zones). Display only: nothing on it is a
 * control, and it says on its face that it is a sample.
 */
export function LeadCard({ full = false, markers = false }: { full?: boolean; markers?: boolean }) {
  return (
    <figure className="hb-ply hb-leadcard" aria-label="Sample lead card">
      <figcaption className="hb-leadcard-cap hb-mono">
        <span className="hb-slip">SAMPLE</span>
        <span>{SAMPLE_LABEL}</span>
      </figcaption>

      <div className="hb-lc-zone">
        {markers ? <Marker n={1} /> : null}
        <p className="hb-lc-who">
          <span className="hb-avatar" aria-hidden="true">
            {post.name.charAt(0)}
          </span>
          <span>
            <strong>{post.name}</strong>
            <span className="hb-mono hb-soft"> {post.handle}</span>
          </span>
        </p>
        <blockquote className="hb-quote">{post.text}</blockquote>
      </div>

      <div className="hb-lc-zone hb-aurora">
        {markers ? <Marker n={2} /> : null}
        <p className="hb-aurora-score hb-mono" aria-label={`Score ${post.score} of 100`}>
          {post.score}
        </p>
        <div>
          <p className="hb-h3">{tierForScore(post.score) === 'ENGAGE' ? 'Engage' : 'Watch'}</p>
          <ul className="hb-reasons hb-mono">
            {post.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="hb-lc-zone">
        {markers ? <Marker n={3} /> : null}
        <p className="hb-keys">
          <span className="hb-key">Claim +{CLAIM_XP} XP</span>
          <span className="hb-key">Draft reply</span>
          <span className="hb-key">Dismiss</span>
        </p>
        <p className="hb-mono hb-soft" style={{ marginTop: '0.55rem' }}>
          Pays {CLAIM_XP} XP at a score of {CLAIM_MIN_SCORE}+. Claiming is not contacting.
        </p>
      </div>

      {full ? (
        <div className="hb-lc-zone">
          {markers ? <Marker n={4} /> : null}
          <p className="hb-mono hb-soft">Draft (sample, never posted)</p>
          <p className="hb-lc-draft">{post.draft}</p>
          <p className="hb-keys" style={{ marginTop: '0.6rem' }}>
            <span className="hb-key">Export to CRM</span>
            <span className="hb-key">Log outcome · 0 XP</span>
          </p>
        </div>
      ) : null}
    </figure>
  )
}
