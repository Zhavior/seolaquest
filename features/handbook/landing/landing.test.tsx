import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Hero } from './Hero'
import { AccessLedger } from './AccessChapter'
import { ErrataList, FaqList } from './ErrataChapter'
import { FAQ, errataItems } from './errata'
import { SAMPLE_GEO_CITED, SAMPLE_GEO_PRESENCE, SAMPLE_GEO_SOURCES } from '../geo/sample'

describe('Hero', () => {
  it('leads with the GEO promise and two honest actions', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Be the source the answer cites.')
    expect(screen.getByRole('link', { name: 'Join early access' })).toHaveAttribute('href', '/sign-up')
    expect(screen.getByRole('link', { name: 'See a sample scan' })).toHaveAttribute('href', '/radar')
  })

  it('says scans are not switched on and labels its example as invented', () => {
    render(<Hero />)
    expect(screen.getByText(/Scans are not switched on yet/)).toBeInTheDocument()
    expect(screen.getByText(/Invented for this page/)).toBeInTheDocument()
    expect(screen.queryByText(/guarantee|free scans/i)).not.toBeInTheDocument()
  })

  it('lists the cited sources and adds one to the plan', () => {
    render(<Hero />)
    const list = screen.getByRole('list', { name: 'Sources the answer cited' })
    expect(within(list).getAllByRole('button')).toHaveLength(SAMPLE_GEO_CITED.length)
    fireEvent.click(screen.getByRole('button', { name: 'Add to plan' }))
    expect(screen.getByText(/In your plan\. The beacon burns teal/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(`1 of ${SAMPLE_GEO_CITED.length} cited sources in your plan.`)
  })
})

describe('GEO sample', () => {
  it('uses only reserved example domains, so no real site is shown as cited', () => {
    for (const source of SAMPLE_GEO_SOURCES) expect(source.domain).toMatch(/\.example$/)
  })

  it('shows the brand found but not cited, through the product rule', () => {
    expect(SAMPLE_GEO_PRESENCE).toEqual({ brandCited: false, brandCitedRank: null, brandRetrieved: true })
  })
})

describe('AccessLedger', () => {
  it('puts no price on GEO scans', () => {
    render(<AccessLedger />)
    expect(within(screen.getByRole('row', { name: /Price per scan/ })).getByText('Not set')).toBeInTheDocument()
    expect(within(screen.getByRole('row', { name: /GEO scans/ })).getByText('Not switched on')).toBeInTheDocument()
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument()
  })
})

describe('Errata and FAQ', () => {
  it('names that scans have not run and only one engine exists', () => {
    render(<ErrataList checkoutOpen={false} />)
    expect(screen.getByText(/no real scan has run/)).toBeInTheDocument()
    expect(screen.getByText(/One engine: Perplexity/)).toBeInTheDocument()
    expect(screen.getByText(/Nothing on this site can be bought/)).toBeInTheDocument()
  })

  it('changes the checkout line when checkout is on', () => {
    const paused = errataItems(false).find((item) => item.id === 'x-checkout')!.text
    const open = errataItems(true).find((item) => item.id === 'x-checkout')!.text
    expect(paused).not.toEqual(open)
  })

  it('renders every FAQ entry that the structured data will publish', () => {
    render(<FaqList />)
    for (const item of FAQ) expect(screen.getByText(item.q)).toBeInTheDocument()
  })

  it('does not promise a citation', () => {
    const answer = FAQ.find((item) => /get my site cited/.test(item.q))!.a
    expect(answer).toMatch(/^No\./)
  })
})
