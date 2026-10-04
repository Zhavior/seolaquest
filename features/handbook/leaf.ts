/**
 * Acetate leaf solver.
 *
 * Every page of the handbook is a milk-white acetate leaf lying over a colour
 * board. The board changes hue per volume, but the reading field must not:
 * body text has to land on the same luminance whatever board sits under it, or
 * contrast becomes a per-hue guessing game. So the leaf's opacity is solved,
 * not chosen: a binary search over source-over compositing in sRGB until the
 * composited field reaches the target luminance.
 *
 * This runs on the server while the page renders and ships the result as CSS
 * custom properties. There is no client script and nothing to hydrate.
 */

export type Rgb = readonly [number, number, number]

/** Relative luminance the reading field is solved to (WCAG definition). */
export const LEAF_TARGET_LUMINANCE = 0.74

const MILK: Rgb = [255, 253, 247]
const INK: Rgb = [20, 18, 14]

export function hexToRgb(hex: string): Rgb {
  const clean = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new RangeError(`expected a 6-digit hex colour, received "${hex}"`)
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const part = (value: number) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

function linearise(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Source-over: `top` at `alpha` laid on `bottom`, in sRGB space. */
export function compose(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
  ]
}

/**
 * Opacity of the milk overlay that brings `board` up to the target luminance.
 * Luminance rises monotonically with opacity (milk is lighter than every
 * board), so a bisection converges. A board already lighter than the target
 * resolves to 0: the leaf is then fully clear.
 */
export function solveLeafAlpha(board: Rgb, target = LEAF_TARGET_LUMINANCE): number {
  if (relativeLuminance(board) >= target) return 0
  let low = 0
  let high = 1
  for (let step = 0; step < 24; step += 1) {
    const mid = (low + high) / 2
    if (relativeLuminance(compose(MILK, mid, board)) < target) low = mid
    else high = mid
  }
  return high
}

export type BoardTokens = {
  board: string
  leaf: string
  /** Darker shade of the board: hard cut shadow and tab edge. */
  edge: string
  /** Legible ink for text set directly on the board. */
  onBoard: string
  /** Opacity the milk overlay was solved to. */
  alpha: number
  leafContrast: number
}

/**
 * Everything a volume needs from one hue. `leafContrast` is the ratio of the
 * page ink on the solved leaf, exposed so a test can pin the reading field.
 */
export function boardTokens(hex: string): BoardTokens {
  const board = hexToRgb(hex)
  const alpha = solveLeafAlpha(board)
  const leaf = compose(MILK, alpha, board)
  const edge = compose([0, 0, 0], 0.42, board)
  const onBoard = contrastRatio(INK, board) >= contrastRatio(MILK, board) ? INK : MILK
  return {
    board: rgbToHex(board),
    leaf: rgbToHex(leaf),
    edge: rgbToHex(edge),
    onBoard: rgbToHex(onBoard),
    alpha: Math.round(alpha * 1000) / 1000,
    leafContrast: Math.round(contrastRatio(INK, leaf) * 100) / 100,
  }
}
