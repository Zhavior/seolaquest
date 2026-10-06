import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Hero } from './Hero'

describe('hero sample hunt', () => {
  it('pays claim XP only for leads that clear the score line', async () => {
    const user = userEvent.setup()
    render(<Hero />)

    expect(screen.getByText(/0 XP · 100 to level 2/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Claim \+25 XP/ }))
    expect(screen.getByText(/25 XP · 75 to level 2/)).toBeInTheDocument()
    expect(screen.getByText(/Quest done: First lead saved/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Collect \+50 XP/ }))
    expect(screen.getByText(/75 XP · 25 to level 2/)).toBeInTheDocument()

    // Jo P.'s post scores 58, under the 60 line: claiming saves it and pays nothing.
    await user.click(screen.getByRole('button', { name: /Jo P\./ }))
    await user.click(screen.getByRole('button', { name: /Claim · 0 XP/ }))
    expect(screen.getByText(/75 XP · 25 to level 2/)).toBeInTheDocument()

    // A second paying claim reaches level 2 at the curve's 100 XP.
    await user.click(screen.getByRole('button', { name: /Riya S\./ }))
    await user.click(screen.getByRole('button', { name: /Claim \+25 XP/ }))
    expect(screen.getByText(/100 XP · 183 to level 3/)).toBeInTheDocument()
  })

  it('labels every post as a sample and never offers real contact', () => {
    render(<Hero />)
    expect(screen.getAllByText(/Invented for this page/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /send|post reply|contact/i })).not.toBeInTheDocument()
  })
})
