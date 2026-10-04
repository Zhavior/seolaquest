import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { InventoryFacts } from '../facts'
import { Hero } from './Hero'
import { LeadCard } from './LeadCard'
import { PlanLedger } from './PlanLedger'
import { CheckoutNote } from './InventoryChapter'
import { ErrataList, FaqList } from './ErrataChapter'
import { FAQ, errataItems } from './errata'

const inventory = (checkoutOpen: boolean): InventoryFacts => ({
  plans: [],
  free: { code: 'FREE', name: 'Free Scout', priceLabel: '$0', scanLimit: 0, enabled: true, availabilityLabel: '', benefits: [] },
  beta: { code: 'BETA', name: 'Beta Hunter', priceLabel: '$14.99/mo', scanLimit: 1500, enabled: true, availabilityLabel: '', benefits: [] },
  founder: { code: 'FOUNDER', name: 'Founder Pass', priceLabel: '$29.99/mo', scanLimit: 3000, enabled: true, availabilityLabel: '', benefits: [] },
  comingSoon: [],
  checkoutOpen,
  founderSeatLimit: 50,
  founderLockTerms: [],
  potions: [],
})

describe('Hero', () => {
  it('leads with the promise and two honest actions', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find buyers on X.')
    expect(screen.getByRole('link', { name: /Start free/ })).toHaveAttribute('href', '/sign-up')
    expect(screen.getByRole('link', { name: 'Try the sample hunt' })).toHaveAttribute('href', '/radar')
  })

  it('does not promise free real scans and labels its example as invented', () => {
    render(<Hero />)
    expect(screen.getByText(/Real scans need a paid plan/)).toBeInTheDocument()
    expect(screen.getByText(/Invented for this page/)).toBeInTheDocument()
    expect(screen.queryByText(/free scans|50 free/i)).not.toBeInTheDocument()
  })
})

describe('LeadCard', () => {
  it('is display-only: no interactive controls', () => {
    render(<LeadCard full markers />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('states the real XP rule on the card', () => {
    render(<LeadCard />)
    expect(screen.getByText(/Pays 25 XP at a score of 60\+/)).toBeInTheDocument()
  })
})

describe('PlanLedger', () => {
  it('never offers a paid purchase while checkout is paused', () => {
    render(<PlanLedger inventory={inventory(false)} actions />)
    const start = screen.getByRole('row', { name: /Start/ })
    expect(within(start).getAllByRole('button', { name: 'Checkout paused' })).toHaveLength(2)
    for (const button of within(start).getAllByRole('button')) expect(button).toBeDisabled()
    expect(within(start).getAllByRole('link')).toHaveLength(1)
  })

  it('links the paid plans to sign-up when checkout is on', () => {
    render(<PlanLedger inventory={inventory(true)} actions />)
    const start = screen.getByRole('row', { name: /Start/ })
    expect(within(start).getAllByRole('link')).toHaveLength(3)
  })

  it('shows sold out instead of a claim button', () => {
    render(<PlanLedger inventory={inventory(true)} actions soldOut />)
    expect(screen.getByRole('button', { name: 'Seats sold out' })).toBeDisabled()
  })

  it('takes plan numbers from the catalog, not from copy', () => {
    render(<PlanLedger inventory={inventory(false)} />)
    expect(screen.getByText('1,500 per paid invoice')).toBeInTheDocument()
    expect(screen.getByText('3,000 per paid invoice')).toBeInTheDocument()
  })
})

describe('CheckoutNote', () => {
  it('names a paused checkout as an errata slip', () => {
    render(<CheckoutNote open={false} />)
    expect(screen.getByText('CHECKOUT PAUSED')).toBeInTheDocument()
    expect(screen.getByText(/Nothing on this page can be bought yet/)).toBeInTheDocument()
  })

  it('does not claim more than the configuration says when checkout is on', () => {
    render(<CheckoutNote open />)
    expect(screen.getByText(/final payment check still runs/)).toBeInTheDocument()
  })
})

describe('Errata and FAQ', () => {
  it('names what is not built, including Reddit and the missing leaderboards', () => {
    render(<ErrataList checkoutOpen={false} />)
    expect(screen.getByText(/Reddit support is built but switched off/)).toBeInTheDocument()
    expect(screen.getByText(/no leaderboards, rankings, or other hunters/)).toBeInTheDocument()
    expect(screen.getByText(/Paid checkout is paused/)).toBeInTheDocument()
  })

  it('changes the checkout line when checkout is on', () => {
    const paused = errataItems(false).find((item) => item.id === 'checkout')!.text
    const open = errataItems(true).find((item) => item.id === 'checkout')!.text
    expect(paused).not.toEqual(open)
  })

  it('renders every FAQ entry that the structured data will publish', () => {
    render(<FaqList />)
    for (const item of FAQ) expect(screen.getByText(item.q)).toBeInTheDocument()
  })

  it('does not say SEOlaQuest posts to X for you', () => {
    const answer = FAQ.find((item) => /post to X/.test(item.q))!.a
    expect(answer).toMatch(/^No\./)
  })
})
