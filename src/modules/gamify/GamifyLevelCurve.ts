export const GAMIFY_LEVEL_CURVE_VERSION = 1

export interface LevelProgress {
  level: number
  lifetimeXp: number
  currentLevelXp: number
  nextLevelXp: number
  progressPercent: number
  curveVersion: number
}

export class GamifyLevelCurve {
  static readonly version = GAMIFY_LEVEL_CURVE_VERSION

  static cumulativeXpRequiredForLevel(level: number): number {
    if (!Number.isInteger(level) || level < 1) {
      throw new RangeError('level must be an integer greater than or equal to 1')
    }

    if (level === 1) return 0
    return Math.round(100 * Math.pow(level - 1, 1.5))
  }

  static levelForLifetimeXp(lifetimeXp: number): number {
    if (!Number.isInteger(lifetimeXp) || lifetimeXp < 0) {
      throw new RangeError('lifetimeXp must be a non-negative integer')
    }

    let level = 1
    while (this.cumulativeXpRequiredForLevel(level + 1) <= lifetimeXp) {
      level += 1
    }

    return level
  }

  static progressForLifetimeXp(lifetimeXp: number): LevelProgress {
    const level = this.levelForLifetimeXp(lifetimeXp)
    const currentLevelXp = this.cumulativeXpRequiredForLevel(level)
    const nextLevelXp = this.cumulativeXpRequiredForLevel(level + 1)
    const span = nextLevelXp - currentLevelXp
    const progressPercent = span === 0
      ? 100
      : Math.max(0, Math.min(100, Math.round(((lifetimeXp - currentLevelXp) / span) * 100)))

    return {
      level,
      lifetimeXp,
      currentLevelXp,
      nextLevelXp,
      progressPercent,
      curveVersion: this.version,
    }
  }
}
