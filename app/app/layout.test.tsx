import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/Sidebar', () => ({
  Sidebar: () => <aside aria-label="Sidebar" />,
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ onboardingComplete: true }),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({})),
}))

import AppLayout from './layout'

describe('authenticated app layout on mobile', () => {
  it('owns exactly one sidebar shell and one main landmark', async () => {
    const view = await AppLayout({ children: <div>Authenticated content</div> })
    const { container } = render(view)

    const shell = container.firstElementChild
    const main = screen.getByRole('main')

    expect(screen.getAllByRole('complementary', { name: 'Sidebar' })).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(shell).toHaveClass('flex', 'min-h-dvh')
    expect(shell?.children).toHaveLength(2)
    expect(within(main).getByText('Authenticated content')).toBeInTheDocument()
  })

  it('keeps document scrolling as the single page scroll owner and offsets the safe-area header', async () => {
    const view = await AppLayout({ children: <div>Authenticated content</div> })
    const { container } = render(view)

    const main = screen.getByRole('main')
    expect(main).not.toHaveAttribute('id')
    expect(main).toHaveAttribute('data-authenticated-main')
    expect(main).toHaveClass('overflow-x-hidden', 'pt-[calc(4rem+env(safe-area-inset-top))]', 'md:pt-0')
    expect(main.className).not.toMatch(/overflow-y|h-screen|h-dvh|touch-none|pointer-events-none/)
    expect(main).not.toHaveAttribute('inert')
    expect(container.firstElementChild).toHaveClass('min-h-dvh')
  })
})
