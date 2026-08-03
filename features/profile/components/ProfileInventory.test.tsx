import { render, screen } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { ProfileInventory } from './ProfileInventory'

describe('ProfileInventory accessibility', () => {
  it('presents inventory as truthful noninteractive list items', () => {
    render(
      <ProfileInventory
        inventorySlots={[
          { id: 1, name: 'Signal Lens', icon: Sparkles, color: 'bg-yellow-200', rarity: 'RARE', stat: '+2 source checks' },
          { id: 2, name: 'Locked', icon: null, color: '', rarity: 'EMPTY', stat: '' },
        ]}
      />,
    )

    expect(screen.getByText('1 / 2 SLOTS')).toBeVisible()
    expect(screen.getByRole('list', { name: /inventory slots/i })).toBeVisible()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()

    const signalLensCard = screen.getByText('Signal Lens').closest('li')
    expect(signalLensCard).not.toHaveClass('cursor-pointer', 'group')
    expect(signalLensCard?.className).not.toMatch(/hover:/)
    expect(screen.getByText('+2 source checks')).toHaveClass('sr-only')
  })
})
