import { describe, expect, it, vi } from 'vitest'
import { GamifyQuestQueryService } from '../GamifyQuestQueryService'

describe('GamifyQuestQueryService', () => {
  it('returns a bounded assignment progress read model', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: 'assignment_1',
      progress: 2,
      target: 4,
      rewardXp: 40,
      status: 'IN_PROGRESS',
      assignedAt: new Date('2026-08-08T00:00:00.000Z'),
      completedAt: null,
      claimedAt: null,
      expiresAt: new Date('2026-08-09T00:00:00.000Z'),
      quest: {
        code: 'engage_four',
        version: 1,
        title: 'Engage four',
        description: 'Engage four opportunities.',
        type: 'DAILY',
      },
    }])
    const service = new GamifyQuestQueryService({
      gamifyQuestAssignment: { findMany },
    } as never)

    const result = await service.getAssignments('user_1', ['IN_PROGRESS'])

    expect(result[0]).toMatchObject({
      id: 'assignment_1',
      code: 'engage_four',
      progress: 2,
      target: 4,
      progressPercent: 50,
    })
  })
})
