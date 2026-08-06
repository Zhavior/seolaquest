export interface LevelInfo {
  level: number
  currentXP: number
  nextLevelXP: number
  progress: number
}

const XP_PER_LEVEL = 250

export function getLevelInfo(totalXP: number): LevelInfo {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1

  const currentXP = totalXP % XP_PER_LEVEL

  const progress = Math.round((currentXP / XP_PER_LEVEL) * 100)

  return {
    level,
    currentXP,
    nextLevelXP: XP_PER_LEVEL,
    progress,
  }
}
