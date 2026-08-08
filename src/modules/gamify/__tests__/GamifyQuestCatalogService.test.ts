import { describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import { DomainError } from '../../core/infrastructure/errors'
import { GamifyQuestCatalogService } from '../GamifyQuestCatalogService'

describe('GamifyQuestCatalogService', () => {
  it('creates a versioned definition against a canonical event contract', async () => {
    const create = vi.fn(async ({ data }) => ({ id: 'quest_1', ...data }))
    const service = new GamifyQuestCatalogService({
      gamifyQuest: { create },
    } as never)

    const quest = await service.createDefinition({
      code: 'engage_three',
      version: 1,
      title: 'Engage three opportunities',
      description: 'Take action on three qualified opportunities.',
      type: 'DAILY',
      eventType: 'opportunity.engaged',
      target: 3,
      rewardXp: 40,
    })

    expect(quest).toMatchObject({ code: 'engage_three', version: 1, eventVersion: 1 })
    expect(create).toHaveBeenCalledOnce()
  })

  it('rejects invalid schedules and unregistered event versions', async () => {
    const service = new GamifyQuestCatalogService({
      gamifyQuest: { create: vi.fn() },
    } as never)

    await expect(service.createDefinition({
      code: 'bad_schedule',
      version: 1,
      title: 'Bad schedule',
      description: 'Ends before it starts.',
      type: 'DAILY',
      eventType: 'opportunity.engaged',
      target: 1,
      rewardXp: 10,
      startsAt: new Date('2026-08-09T00:00:00.000Z'),
      endsAt: new Date('2026-08-08T00:00:00.000Z'),
    })).rejects.toBeInstanceOf(ZodError)

    await expect(service.createDefinition({
      code: 'future_contract',
      version: 1,
      title: 'Future contract',
      description: 'Uses a contract version that does not exist.',
      type: 'MILESTONE',
      eventType: 'lead.converted',
      eventVersion: 99,
      target: 1,
      rewardXp: 100,
    })).rejects.toBeInstanceOf(DomainError)
  })
})
