import Link from 'next/link'
import type { InventoryFacts } from '../facts'

/**
 * The plans as a system-requirements table: attributes down the side, plans
 * across, every cell from the billing catalog. Used on the home page and on
 * /pricing so the two cannot disagree.
 */
export function PlanLedger({
  inventory,
  actions = false,
  soldOut = false,
}: {
  inventory: InventoryFacts
  /** Add a closing row of per-plan actions (pricing page). */
  actions?: boolean
  soldOut?: boolean
}) {
  const { free, beta, founder } = inventory
  const yes = 'Yes'
  return (
    <table className="hb-ledger hb-ledger--plans">
      <caption>Prices in USD. Stripe shows the final total and any tax before you confirm.</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="hb-visually-hidden">Attribute</span>
          </th>
          <th scope="col">{free.name}</th>
          <th scope="col">{beta.name}</th>
          <th scope="col">{founder.name}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Price</th>
          <td data-label={free.name}>{free.priceLabel}</td>
          <td data-label={beta.name}>{beta.priceLabel}</td>
          <td data-label={founder.name}>{founder.priceLabel}</td>
        </tr>
        <tr>
          <th scope="row">Mana (scan credits)</th>
          <td data-label={free.name} className="hb-mono">0</td>
          <td data-label={beta.name} className="hb-mono">{beta.scanLimit.toLocaleString('en-US')} per paid invoice</td>
          <td data-label={founder.name} className="hb-mono">{founder.scanLimit.toLocaleString('en-US')} per paid invoice</td>
        </tr>
        <tr>
          <th scope="row">Scan X</th>
          <td data-label={free.name}>No</td>
          <td data-label={beta.name}>{yes}</td>
          <td data-label={founder.name}>{yes}</td>
        </tr>
        <tr>
          <th scope="row">AI reply drafts, CRM export</th>
          <td data-label={free.name}>No</td>
          <td data-label={beta.name}>{yes}</td>
          <td data-label={founder.name}>{yes}</td>
        </tr>
        <tr>
          <th scope="row">Saved keywords</th>
          <td data-label={free.name}>Up to 10</td>
          <td data-label={beta.name}>Up to 10</td>
          <td data-label={founder.name}>Up to 10</td>
        </tr>
        <tr>
          <th scope="row">Availability</th>
          <td data-label={free.name}>Open</td>
          <td data-label={beta.name}>{inventory.checkoutOpen ? 'Checkout on' : 'Checkout paused'}</td>
          <td data-label={founder.name}>
            {inventory.checkoutOpen ? 'Checkout on' : 'Checkout paused'}, {inventory.founderSeatLimit} seats
          </td>
        </tr>
        {actions ? (
          <tr>
            <th scope="row">Start</th>
            <td data-label={free.name}>
              <Link href="/sign-up" className="hb-btn hb-btn--small">
                Start free
              </Link>
            </td>
            <td data-label={beta.name}>
              {inventory.checkoutOpen ? (
                <Link href="/sign-up" className="hb-btn hb-btn--small">
                  Create account to continue
                </Link>
              ) : (
                <button type="button" className="hb-btn hb-btn--small" disabled>
                  Checkout paused
                </button>
              )}
            </td>
            <td data-label={founder.name}>
              {soldOut ? (
                <button type="button" className="hb-btn hb-btn--small" disabled>
                  Seats sold out
                </button>
              ) : inventory.checkoutOpen ? (
                <Link href="/sign-up" className="hb-btn hb-btn--small">
                  Claim a founder seat
                </Link>
              ) : (
                <button type="button" className="hb-btn hb-btn--small" disabled>
                  Checkout paused
                </button>
              )}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}
