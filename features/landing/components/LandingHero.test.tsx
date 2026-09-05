import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/dynamic', () => ({
  default: () => function ParticleStub() { return <div data-testid="particles" /> },
}))

import { LandingHero } from './LandingHero'

describe('LandingHero offer', () => {
  it('offers a sample demo without promising free real scans', () => {
    render(<LandingHero />)
    expect(screen.queryByTestId('particles')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try the demo' })).toHaveAttribute('href', '/#demo')
    expect(screen.getByRole('link', { name: 'View plans' })).toHaveAttribute('href', '/pricing')
    expect(screen.getByText(/Real scans require a paid plan/)).toBeInTheDocument()
    expect(screen.getByText(/This example is invented/)).toBeInTheDocument()
    expect(screen.queryByText(/LIVE PULSE|50 free/)).not.toBeInTheDocument()
  })
})
