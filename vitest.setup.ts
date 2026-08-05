import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Mock next/navigation
vi.mock('next/navigation', () => {
  const replaceMock = vi.fn()
  const pushMock = vi.fn()
  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }
})

// Mock audio / sfx
vi.mock('@/lib/sfx', () => ({
  sfx: {
    playBountyUnlock: vi.fn(),
    playCoinDrop: vi.fn(),
    playCriticalWarning: vi.fn(),
    playElixirDrink: vi.fn(),
    playHoverBlip: vi.fn(),
    playLevelUp: vi.fn(),
    playRadarBlip: vi.fn(),
    playSidebarCollapse: vi.fn(),
    playSidebarExpand: vi.fn(),
    playSidebarHover: vi.fn(),
    playSwordSlash: vi.fn(),
    isEnabled: vi.fn(() => true),
    setEnabled: vi.fn(),
    toggle: vi.fn(() => true),
  },
}))
