import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import HunterStatModal from './HunterStatModal'

const hunter = {
  id: 'hunter-1',
  rank: 3,
  name: 'Truth Seeker',
  alias: 'Measured Owl',
  classTitle: 'Signal Scout',
  bountiesSlayed: 8,
  manaEfficiency: 25,
  activeStreak: 2,
  isOwner: true,
  activeScouts: ['Reddit'],
}

describe('HunterStatModal', () => {
  it('is absent without a hunter and exposes full dialog behavior when mounted', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(<HunterStatModal hunter={null} onClose={onClose} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<HunterStatModal hunter={hunter} onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Truth Seeker' })
    expect(dialog).toHaveAccessibleDescription(/no pipeline value, response SLA, customer identity, or achievement is inferred/i)
    expect(screen.getByRole('button', { name: 'Close hunter details' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
