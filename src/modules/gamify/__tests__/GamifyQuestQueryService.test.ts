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

it('marks suspended conversion assignments for truthful board filtering', async () => {
  const base = { progress: 1, target: 1, rewardXp: 200, quest: { code: 'first_conversion', version: 1, title: 'Legacy', description: 'Legacy', type: 'ONBOARDING', eventType: 'lead.converted' } }
  const service = new GamifyQuestQueryService({ gamifyQuestAssignment: { findMany: vi.fn().mockResolvedValue([
    { ...base, id: 'pending', status: 'IN_PROGRESS' }, { ...base, id: 'completed', status: 'COMPLETED' }, { ...base, id: 'claimed', status: 'CLAIMED' },
  ]) } } as never)
  expect((await service.getAssignments('owner')).map(row => [row.id, row.completionAvailable])).toEqual([
    ['pending', false], ['completed', false], ['claimed', false],
  ])
})
