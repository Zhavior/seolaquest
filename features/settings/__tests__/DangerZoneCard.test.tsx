import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
}))

vi.mock('@clerk/nextjs', () => ({
  useReverification: (action: unknown) => action,
}))
vi.mock('@/features/profile/actions', () => ({
  deleteAccountAction: mocks.deleteAccount,
}))

import DangerZoneCard from '../components/DangerZoneCard'

describe('DangerZoneCard account deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.deleteAccount.mockResolvedValue({
      ok: true,
      message: 'Identity deletion accepted. Local data removal is pending.',
    })
  })

  it('opens an accessible confirmation, initially focuses the phrase, and restores the opener', async () => {
    const user = userEvent.setup()
    render(<DangerZoneCard onSuccessToast={vi.fn()} />)

    const opener = screen.getByRole('button', { name: /^delete account$/i })
    await user.click(opener)

    const dialog = screen.getByRole('dialog', { name: 'CONFIRM ACCOUNT DELETION' })
    expect(dialog).toHaveAccessibleDescription(/permanently deletes your Clerk identity/i)
    expect(dialog).toHaveStyle({ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' })
    expect(screen.getByPlaceholderText('DELETE MY ACCOUNT')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'ABORT OPERATION' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('requires and submits the exact destructive phrase', async () => {
    const onSuccessToast = vi.fn()
    render(<DangerZoneCard onSuccessToast={onSuccessToast} />)

    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }))
    fireEvent.change(screen.getByPlaceholderText('DELETE MY ACCOUNT'), {
      target: { value: 'DELETE MY ACCOUNT' },
    })
    fireEvent.click(screen.getByRole('button', { name: /delete account 💀/i }))

    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledWith('DELETE MY ACCOUNT'))
    expect(onSuccessToast).toHaveBeenCalledWith(expect.stringContaining('pending'))
  })

  it('does not call the server action for a case-insensitive lookalike', () => {
    render(<DangerZoneCard onSuccessToast={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }))
    fireEvent.change(screen.getByPlaceholderText('DELETE MY ACCOUNT'), {
      target: { value: 'delete my account' },
    })
    fireEvent.click(screen.getByRole('button', { name: /delete account 💀/i }))

    expect(screen.getByText(/type "DELETE MY ACCOUNT" exactly/i)).toBeInTheDocument()
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })
})
