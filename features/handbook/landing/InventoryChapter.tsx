import Link from 'next/link'
import type { FounderSeatSnapshot } from '@/src/modules/billing/application/FounderSeatService'
import { Board, Leaf, Spread } from '../components/primitives'
import type { InventoryFacts } from '../facts'
import { PlanLedger } from './PlanLedger'
import { SeatCard } from './SeatCard'

export function CheckoutNote({ open }: { open: boolean }) {
  return open ? (
    <p className="hb-mono">
      Paid checkout is switched on. A final payment check still runs before any charge, and a paid plan only starts after
      Stripe confirms it.
    </p>
  ) : (
    <p>
      <span className="hb-slip">CHECKOUT PAUSED</span>{' '}
      <span className="hb-mono">
        Nothing on this page can be bought yet. You can create a free account now.
      </span>
    </p>
  )
}

export function InventoryChapter({
  inventory,
  seats,
}: {
  inventory: InventoryFacts
  seats: FounderSeatSnapshot | null
}) {
  return (
    <Board volume="inventory" id="inventory" labelledBy="inventory-title">
      <Leaf>
        <Spread
          head="Inventory"
          headId="inventory-title"
          note="Free saves keywords. Paid scans. Straight from the billing catalog."
        >
          <div className="hb-stack" style={{ '--gap': '2rem' } as React.CSSProperties}>
            <p className="hb-lede">Free to keep keywords. Paid to scan X.</p>
            <PlanLedger inventory={inventory} />
            <CheckoutNote open={inventory.checkoutOpen} />
            <SeatCard seats={seats} checkoutOpen={inventory.checkoutOpen} />
            <div className="hb-row">
              <Link href="/sign-up" className="hb-btn">
                Start free
              </Link>
              <Link href="/pricing" className="hb-btn hb-btn--label">
                Read the full pricing
              </Link>
            </div>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
