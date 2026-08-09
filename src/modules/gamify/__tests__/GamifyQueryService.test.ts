import { describe, expect, it, vi } from 'vitest'
import { GamifyQueryService } from '../GamifyQueryService'

describe('GamifyQueryService', () => {
  it('returns a default read model for users without a profile', async () => {
    const prisma = {
      gamifyProfile: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    }

    await expect(new GamifyQueryService(prisma as never).getProfile('user_1')).resolves.toMatchObject({
      userId: 'user_1',
      lifetimeXp: 0,
      level: 1,
      reputation: 0,
      currentLevelXp: 0,
      nextLevelXp: 100,
    })
  })
})
