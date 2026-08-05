import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardKeywords } from './DashboardKeywords'

describe('DashboardKeywords accessibility', () => {
  it('names keyword controls and exposes removal without hover', () => {
    render(
      <DashboardKeywords
        item={{}}
        keywords={[{ id: 'kw_1', phrase: 'need a website', active: true }]}
        newKeyword=""
        setNewKeyword={vi.fn()}
        selectedHeroClass="Warrior 🥷"
        setSelectedHeroClass={vi.fn()}
        isPending={false}
        PRESET_KEYWORDS={[]}
        addKeyword={vi.fn()}
        handlePresetClick={vi.fn()}
        removeKeyword={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox', { name: /signal phrase to track/i })).toBeVisible()
    expect(screen.getByRole('combobox', { name: /signal class/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /remove need a website/i })).not.toHaveClass('opacity-0')
  })
})
