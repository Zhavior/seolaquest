import { describe, expect, it } from 'vitest'
import { dashboardReveal, dashboardStaticReveal } from '../motion'

describe('dashboard motion helpers', () => {
  it('returns static variants when reduced motion is preferred', () => {
    expect(dashboardReveal(true)).toBe(dashboardStaticReveal)
    expect(dashboardReveal(true).show).toEqual({ opacity: 1, y: 0 })
  })

  it('returns animated reveal when motion is allowed', () => {
    const reveal = dashboardReveal(false)
    expect(reveal).not.toBe(dashboardStaticReveal)
    expect(reveal.hidden).toMatchObject({ opacity: 0, y: 18 })
  })
})
