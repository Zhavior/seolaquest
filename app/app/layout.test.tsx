import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ onboardingComplete: true }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  usePathname: () => '/app',
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}))

import AppLayout from './layout'

describe('authenticated app layout', () => {
  it('renders application shell and main content', async () => {
    const view = await AppLayout({ children: <div>Authenticated content</div> })
    render(view)

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(within(main).getByText('Authenticated content')).toBeInTheDocument()
  })
})

