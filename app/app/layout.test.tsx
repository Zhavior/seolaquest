import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ onboardingComplete: true }),
}))

// The shell's Log Out control calls useClerk(), which requires a ClerkProvider.
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  useClerk: () => ({ signOut: vi.fn() }),
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

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import AppLayout from './layout'

describe('authenticated app layout', () => {
  it('renders application shell and main content', async () => {
    const view = await AppLayout({ children: <div>Authenticated content</div> })
    // ThemeProvider lives in the root layout, which this test doesn't render.
    render(view, { wrapper: ThemeProvider })

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(within(main).getByText('Authenticated content')).toBeInTheDocument()
  })
})
