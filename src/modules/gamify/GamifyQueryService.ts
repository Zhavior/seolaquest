import type { PrismaClient } from '@prisma/client'
import { GamifyLevelCurve, type LevelProgress } from './GamifyLevelCurve'

type GamifyPrisma = Pick<PrismaClient, 'gamifyProfile'>

export interface GamifyProfileView extends LevelProgress {
  userId: string
  reputation: number
}

export class GamifyQueryService {
  constructor(private readonly prisma: GamifyPrisma) {}

  async getProfile(userId: string): Promise<GamifyProfileView> {
    const profile = await this.prisma.gamifyProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        lifetimeXp: true,
        reputation: true,
      },
    })

    const lifetimeXp = profile?.lifetimeXp ?? 0
    const progress = GamifyLevelCurve.progressForLifetimeXp(lifetimeXp)

    return {
      userId,
      reputation: profile?.reputation ?? 0,
      ...progress,
    }
  }
}
