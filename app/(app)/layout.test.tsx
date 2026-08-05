import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ onboardingComplete: true }),
}))

// The shell's Log Out control calls useClerk(), which requires a ClerkProvider.
vi.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}))

import AppLayout from './layout'

describe('onboarding route-group layout', () => {
  it('does not add a duplicate shell or main landmark', async () => {
    const view = await AppLayout({ children: <div>Onboarding content</div> })
    render(view)

    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  })
})
