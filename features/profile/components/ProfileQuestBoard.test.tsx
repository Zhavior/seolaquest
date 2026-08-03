import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileQuestBoard } from './ProfileQuestBoard'

describe('ProfileQuestBoard accessibility', () => {
  it('uses named controls and a keyboard-operable task toggle', () => {
    const toggleQuest = vi.fn()
    render(
      <ProfileQuestBoard
        quests={[{ id: 1, title: 'Review source matches', completed: false, dueDate: 'Today', priority: 'HIGH', xp: 0 }]}
        newQuestTitle=""
        setNewQuestTitle={vi.fn()}
        addQuest={vi.fn()}
        toggleQuest={toggleQuest}
      />,
    )

    expect(screen.getByRole('textbox', { name: /new personal task/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /add personal task/i })).toBeVisible()
    const task = screen.getByRole('button', { name: /review source matches/i })
    expect(task).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(task)
    expect(toggleQuest).toHaveBeenCalledWith(1)
  })
})
