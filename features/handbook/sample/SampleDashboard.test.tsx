import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CLAIM_MIN_SCORE, CLAIM_XP, levelTable } from '../rules'
import { SAMPLE_SETS } from './data'
import { SampleDashboard } from './SampleDashboard'

const LEVELS = levelTable(10).map((row) => row.cumulativeXp)
const FIRST = SAMPLE_SETS[0]

function setup() {
  const user = userEvent.setup()
  render(<SampleDashboard sets={SAMPLE_SETS} levelCumulative={LEVELS} />)
  return user
}

const mana = () => screen.getByRole('region', { name: 'Sample mana and XP' })

describe('SampleDashboard', () => {
  it('says on its face that everything is invented', () => {
    setup()
    expect(screen.getByText('Sample hunt · invented data')).toBeInTheDocument()
    expect(screen.getByText(/Invented for this page/)).toBeInTheDocument()
  })

  it('starts empty, then a scan fills the cards and spends 1 mana for no XP', async () => {
    const user = setup()
    expect(screen.getByText(/No leads yet/)).toBeInTheDocument()
    expect(mana()).toHaveTextContent('3 / 3')
    await user.click(screen.getByRole('button', { name: 'Run scan · 1 mana' }))
    expect(screen.getAllByRole('button', { name: /^Claim/ })).toHaveLength(FIRST.posts.length)
    expect(mana()).toHaveTextContent('2 / 3')
    expect(mana()).toHaveTextContent('0 XP')
    expect(screen.getByRole('button', { name: 'Already scanned' })).toBeDisabled()
  })

  it('pays claim XP only at or above the threshold', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Run scan · 1 mana' }))
    const paying = FIRST.posts.find((post) => post.score >= CLAIM_MIN_SCORE)!
    const card = screen.getByText(`“${paying.text}”`).closest('li')!
    await user.click(within(card).getByRole('button', { name: `Claim +${CLAIM_XP} XP` }))
    expect(within(card).getByText(`Claimed · +${CLAIM_XP} XP`)).toBeInTheDocument()
    expect(mana()).toHaveTextContent(`${CLAIM_XP} XP`)
  })

  it('removes a dismissed lead and filters with the header chips', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Run scan · 1 mana' }))
    const target = FIRST.posts[0]
    const card = screen.getByText(`“${target.text}”`).closest('li')!
    await user.click(within(card).getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(`“${target.text}”`)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Score 80\+/ }))
    const shown = FIRST.posts.filter((post) => post.id !== target.id && post.score >= 80)
    for (const post of shown) expect(screen.getByText(`“${post.text}”`)).toBeInTheDocument()
    const hidden = FIRST.posts.filter((post) => post.id !== target.id && post.score < 80)
    for (const post of hidden) expect(screen.queryByText(`“${post.text}”`)).not.toBeInTheDocument()
  })

  it('runs out of mana after three scans', async () => {
    const user = setup()
    for (const set of SAMPLE_SETS.slice(0, 3)) {
      await user.click(screen.getByRole('button', { name: new RegExp(set.keyword) }))
      await user.click(screen.getByRole('button', { name: 'Run scan · 1 mana' }))
    }
    expect(mana()).toHaveTextContent('0 / 3')
    if (SAMPLE_SETS.length > 3) {
      await user.click(screen.getByRole('button', { name: new RegExp(SAMPLE_SETS[3].keyword) }))
      expect(screen.getByRole('button', { name: 'Out of sample mana' })).toBeDisabled()
    }
  })
})
