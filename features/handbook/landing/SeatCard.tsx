import type { FounderSeatSnapshot } from '@/src/modules/billing/application/FounderSeatService'

/**
 * Founder seats as a punch card: one hole per seat, filled where a seat is held.
 * Fed by the live seat snapshot; renders nothing when the count is unavailable
 * rather than guessing at one.
 */
export function SeatCard({ seats, checkoutOpen }: { seats: FounderSeatSnapshot | null; checkoutOpen: boolean }) {
  if (!seats) return null
  const held = Math.min(seats.limit, seats.claimed + seats.reserved)
  return (
    <figure className="hb-seats">
      <figcaption className="hb-mono">
        {seats.soldOut
          ? `All ${seats.limit} founder seats are held.`
          : `${seats.remaining} of ${seats.limit} founder seats remaining.`}{' '}
        <span className="hb-soft">
          {checkoutOpen
            ? 'Counted live, capped at checkout.'
            : 'Counted live, but no seat can be claimed while checkout is paused.'}
        </span>
      </figcaption>
      <ol className="hb-seat-grid" aria-label={`${held} of ${seats.limit} founder seats held`}>
        {Array.from({ length: seats.limit }, (_, index) => (
          <li key={index} className="hb-punch" data-on={index < held ? '' : undefined} />
        ))}
      </ol>
    </figure>
  )
}
