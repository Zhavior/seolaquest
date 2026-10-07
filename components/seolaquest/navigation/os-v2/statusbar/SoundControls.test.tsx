import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SoundControls } from './SoundControls'
import { sfx } from '@/lib/sfx'

vi.unmock('@/lib/sfx')
afterEach(() => { sfx.setEnabled(true); sfx.setVolume(0.5); localStorage.clear() })

describe('sound settings', () => {
  it('exposes remembered controls and disables preview when muted', () => {
    const { container, unmount } = render(<SoundControls />)
    container.querySelector('details')!.open = true
    fireEvent.change(screen.getByRole('slider', { name: 'Sound volume' }), { target: { value: '25' } })
    expect(sfx.getVolume()).toBe(0.25)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sound effects' }))
    expect(sfx.isEnabled()).toBe(false)
    expect(screen.getByRole('button', { name: 'Preview celebration' })).toBeDisabled()
    unmount()
    const next = render(<SoundControls />)
    next.container.querySelector('details')!.open = true
    expect(screen.getByRole('slider', { name: 'Sound volume' })).toHaveValue('25')
    expect(screen.getByRole('checkbox', { name: 'Sound effects' })).not.toBeChecked()
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Sound volume' }), { key: 'Escape' })
    expect(next.container.querySelector('details')!.open).toBe(false)
    expect(next.container.querySelector('summary')).toHaveFocus()
  })
})
