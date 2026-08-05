import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BattleAreaCanvas from './BattleAreaCanvas'

// Mock Three.js and React Three Fiber context for unit tests in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Float: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('BattleAreaCanvas Component', () => {
  it('renders signature neobrutalist 3D viewport container', () => {
    const { container } = render(<BattleAreaCanvas />)
    const viewport = container.querySelector('section')
    expect(viewport).not.toBeNull()
    expect(viewport?.className).toContain('border-4 border-outline bg-emerald-950')
    expect(viewport?.className).toContain('shadow-brutal-lg')
  })
})
