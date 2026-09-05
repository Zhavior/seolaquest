import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ManaShop } from './ManaShop'
import { POTION_CATALOG } from '@/src/modules/billing/domain/catalog'

// Purchase IDs and quantities must remain bound to the billing catalog after restyling.
describe('journal credit top-ups', () => {
  it('keeps paused and pending purchases disabled and passes canonical pack data', () => {
    const buyPotion = vi.fn()
    const props = { itemVariants: {}, buyPotion, purchasingPotion: null, potionSuccess: null, potionCheckoutEnabled: false, sfxBlip: vi.fn() }
    const { rerender } = render(<ManaShop {...props} />)
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
    rerender(<ManaShop {...props} potionCheckoutEnabled />)
    screen.getAllByRole('button', { name: 'Buy credits' }).forEach(button => fireEvent.click(button))
    expect(buyPotion.mock.calls).toEqual(Object.values(POTION_CATALOG).map(pack => [pack.id, pack.quests]))
    rerender(<ManaShop {...props} potionCheckoutEnabled purchasingPotion="minor_vial" />)
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
})
