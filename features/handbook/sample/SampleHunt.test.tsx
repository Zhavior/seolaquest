import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { levelTable } from '../rules'
import { SAMPLE_SETS } from './data'
import { SampleHunt } from './SampleHunt'

const LEVELS = levelTable(10).map((row) => row.cumulativeXp)

function setup(sets = SAMPLE_SETS, variant: 'compact' | 'full' = 'full') {
  const user = userEvent.setup()
  render(<SampleHunt sets={sets} levelCumulative={LEVELS} variant={variant} />)
  return user
}

describe('SampleHunt', () => {
  it('says on its face that everything is invented', () => {
    setup()
    expect(screen.getByText(/Invented for this page/)).toBeInTheDocument()
    expect(screen.getByText('SAMPLE')).toBeInTheDocument()
  })

  it('shows no results before a scan, then a row per match with the source post one click away', async () => {
    const user = setup([SAMPLE_SETS[0]], 'compact')
    expect(screen.getByText(/No scan yet/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Scan for/ }))
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(SAMPLE_SETS[0].posts.length)

    await user.click(within(rows[0]).getByRole('button'))
    expect(screen.getByRole('article')).toHaveTextContent(SAMPLE_SETS[0].posts[0].text)
  })

  it('spends mana on a scan and pays no XP for it', async () => {
    const user = setup([SAMPLE_SETS[0]], 'compact')
    expect(screen.getByLabelText('3 of 3 sample mana left')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Scan for/ }))
    expect(screen.getByLabelText('2 of 3 sample mana left')).toBeInTheDocument()
    expect(screen.getByText(/0 XP · 100 to level 2/)).toBeInTheDocument()
  })

  it('pays 25 XP for a claim at 60 or more and 0 XP under it', async () => {
    const user = setup([SAMPLE_SETS[0]], 'compact')
    await user.click(screen.getByRole('button', { name: /Scan for/ }))

    const posts = SAMPLE_SETS[0].posts
    const strong = posts.find((post) => post.score >= 60)!
    const weak = posts.find((post) => post.score >= 40 && post.score < 60)!

    await user.click(screen.getByRole('button', { name: new RegExp(strong.handle) }))
    await user.click(screen.getByRole('button', { name: /Claim lead \(\+25 XP\)/ }))
    expect(screen.getByText(/25 XP · 75 to level 2/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: new RegExp(weak.handle) }))
    expect(screen.getByText(/pays \+0 XP/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Claim lead \(\+0 XP\)/ }))
    expect(screen.getByText(/25 XP · 75 to level 2/)).toBeInTheDocument()
  })

  it('lets a quest be collected once its target is met', async () => {
    const user = setup([SAMPLE_SETS[0]], 'compact')
    await user.click(screen.getByRole('button', { name: /Scan for/ }))

    await user.click(screen.getByRole('button', { name: new RegExp(SAMPLE_SETS[0].posts[0].handle) }))
    await user.click(screen.getByRole('button', { name: /Claim lead/ }))

    const collect = screen.getByRole('button', { name: /Collect \+50 XP/ })
    await user.click(collect)
    expect(screen.queryByRole('button', { name: /Collect \+50 XP/ })).not.toBeInTheDocument()
    const quest = screen.getByText('First lead saved', { selector: 'strong' }).closest('li')
    expect(quest).toHaveTextContent('Claimed')
  })

  it('locks the scan button when sample mana runs out and says why', async () => {
    const user = setup()
    for (let i = 0; i < 3; i += 1) {
      await user.click(screen.getByRole('button', { name: /Scan for/ }))
    }
    expect(screen.getByRole('button', { name: /Scan for/ })).toBeDisabled()
    expect(screen.getAllByText(/Real mana comes with a paid plan/).length).toBeGreaterThan(0)
  })

  it('starts over cleanly', async () => {
    const user = setup([SAMPLE_SETS[0]], 'compact')
    await user.click(screen.getByRole('button', { name: /Scan for/ }))
    await user.click(screen.getByRole('button', { name: /Start over/ }))
    expect(screen.getByText(/No scan yet/)).toBeInTheDocument()
    expect(screen.getByLabelText('3 of 3 sample mana left')).toBeInTheDocument()
  })

  it('offers a watch-list chooser only when there is more than one list', () => {
    setup(SAMPLE_SETS, 'full')
    expect(screen.getAllByRole('radio')).toHaveLength(SAMPLE_SETS.length)
  })
})
