import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { GameModeSetting } from './GameModeSetting'
import { GameModeProvider } from '@/components/seolaquest/GameModeContext'

afterEach(() => {
  document.cookie = 'sq-game=; path=/; max-age=0'
  refresh.mockClear()
})

describe('GameModeSetting', () => {
  it('starts off and saves the choice so the server renders to match', () => {
    render(<GameModeSetting />)
    const box = screen.getByRole('checkbox', { name: 'Show XP, levels and goals' })
    expect(box).not.toBeChecked()

    fireEvent.click(box)
    expect(box).toBeChecked()
    expect(document.cookie).toContain('sq-game=on')
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('reflects a saved "on" and can be turned off again', () => {
    render(
      <GameModeProvider on>
        <GameModeSetting />
      </GameModeProvider>,
    )
    const box = screen.getByRole('checkbox', { name: 'Show XP, levels and goals' })
    expect(box).toBeChecked()

    fireEvent.click(box)
    expect(document.cookie).toContain('sq-game=off')
  })
})
