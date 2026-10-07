import { describe, expect, it } from 'vitest'
import {
  LEAF_TARGET_LUMINANCE,
  boardTokens,
  compose,
  contrastRatio,
  hexToRgb,
  relativeLuminance,
  solveLeafAlpha,
} from './leaf'
import { VOLUMES, tokensFor } from './tokens'

describe('leaf solver', () => {
  it('lands every volume board on the same reading-field luminance', () => {
    for (const volume of VOLUMES) {
      const tokens = boardTokens(volume.hue)
      const luminance = relativeLuminance(hexToRgb(tokens.leaf))
      expect(Math.abs(luminance - LEAF_TARGET_LUMINANCE)).toBeLessThan(0.01)
    }
  })

  it('keeps page ink at AA or better on every solved leaf', () => {
    for (const volume of VOLUMES) {
      expect(tokensFor(volume.id).leafContrast).toBeGreaterThanOrEqual(7)
    }
  })

  it('chooses legible ink for text set directly on the board', () => {
    for (const volume of VOLUMES) {
      const tokens = tokensFor(volume.id)
      expect(contrastRatio(hexToRgb(tokens.onBoard), hexToRgb(tokens.board))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('needs more milk over a dark board than over a light one', () => {
    const ultramarine = solveLeafAlpha(hexToRgb('#2B3FA3'))
    const yellow = solveLeafAlpha(hexToRgb('#F2C400'))
    expect(ultramarine).toBeGreaterThan(yellow)
  })

  it('leaves an already-light board fully clear', () => {
    expect(solveLeafAlpha([250, 250, 250])).toBe(0)
  })

  it('composes source-over in sRGB space', () => {
    expect(compose([255, 255, 255], 0.5, [0, 0, 0])).toEqual([127.5, 127.5, 127.5])
  })

  it('rejects malformed hex', () => {
    expect(() => hexToRgb('#12')).toThrow(RangeError)
  })
})
