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
    playCoinDrop: vi.fn(),
    playRadarBlip: vi.fn(),
    playHoverBlip: vi.fn(),
    playCriticalWarning: vi.fn(),
  },
}))
