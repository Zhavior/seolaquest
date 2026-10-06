import { describe, expect, it } from 'vitest'
import { phaseOf, skyInfo, sunDirection } from './phase'

describe('phaseOf', () => {
  it('splits the local day into four phases', () => {
    expect(phaseOf(4.99)).toBe('night')
    expect(phaseOf(5)).toBe('dawn')
    expect(phaseOf(8)).toBe('day')
    expect(phaseOf(17)).toBe('dusk')
    expect(phaseOf(20)).toBe('night')
    expect(phaseOf(0)).toBe('night')
  })
})

describe('skyInfo', () => {
  it('follows the given clock in auto mode', () => {
    const info = skyInfo('auto', new Date(2026, 9, 5, 18, 5))
    expect(info.phase).toBe('dusk')
    expect(info.label).toMatch(/^Your sky: Dusk · 18:05/)
  })

  it('previews a chosen phase regardless of the clock', () => {
    const info = skyInfo('night', new Date(2026, 9, 5, 12, 0))
    expect(info.phase).toBe('night')
    expect(info.label).toBe('Previewing Night')
  })
})

describe('sunDirection', () => {
  it('returns a unit vector for every phase', () => {
    for (const phase of ['dawn', 'day', 'dusk', 'night'] as const) {
      const [x, y, z] = sunDirection({ phase, hour: 12 })
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5)
    }
  })
})
