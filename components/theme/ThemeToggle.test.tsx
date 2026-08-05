import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/sfx', () => ({
  sfx: { playSidebarCollapse: vi.fn() },
}))

import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'
import { THEME_STORAGE_KEY } from './theme-config'

afterEach(() => {
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})

function renderToggle() {
  return render(<ThemeToggle />, { wrapper: ThemeProvider })
}

describe('ThemeToggle', () => {
  it('exposes the three themes as one radio group', () => {
    renderToggle()

    const group = screen.getByRole('radiogroup', { name: /interface theme/i })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('applies the chosen theme to the document and persists it', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('radio', { name: /midnight blue/i }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('blue')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('blue')
    expect(screen.getByRole('radio', { name: /midnight blue/i })).toBeChecked()
  })

  it('adopts the theme the pre-paint script already applied', () => {
    document.documentElement.setAttribute('data-theme', 'grey')
    renderToggle()

    expect(screen.getByRole('radio', { name: /grey mode/i })).toBeChecked()
  })

  it('moves the selection with the arrow keys', async () => {
    const user = userEvent.setup()
    renderToggle()

    // Only the selected radio is tabbable; arrows move within the group.
    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(document.documentElement.getAttribute('data-theme')).toBe('grey')
    expect(screen.getByRole('radio', { name: /grey mode/i })).toBeChecked()
  })
})
