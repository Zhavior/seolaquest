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

/*
 * `syncDefinitions` is what `scripts/sync-quest-catalog.ts` runs, so it executes
 * against production on every deploy. It has to be safe to run repeatedly, and —
 * more importantly — it has to refuse the one edit that would quietly break
 * hunters mid-quest.
 */
describe('GamifyQuestCatalogService.syncDefinitions', () => {
  const definition = {
    code: 'engage_three',
    version: 1,
    title: 'Engage three opportunities',
    description: 'Take action on three qualified opportunities.',
    type: 'DAILY' as const,
    eventType: 'opportunity.engaged' as const,
    target: 3,
    rewardXp: 40,
  }

  function stored(overrides: Record<string, unknown> = {}) {
    return {
      id: 'quest_1',
      eventVersion: 1,
      enabled: true,
      startsAt: null,
      endsAt: null,
      ...definition,
      ...overrides,
    }
  }

  function harness(existing: ReturnType<typeof stored> | null) {
    const gamifyQuest = {
      findUnique: vi.fn(async () => existing),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'quest_1', ...data })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'quest_1', ...data })),
    }
    return { gamifyQuest, service: new GamifyQuestCatalogService({ gamifyQuest } as never) }
  }

  it('creates a definition the catalog has never seen', async () => {
    const { gamifyQuest, service } = harness(null)

    await expect(service.syncDefinitions([definition])).resolves.toEqual({
      created: 1,
      updated: 0,
      unchanged: 0,
    })
    expect(gamifyQuest.create).toHaveBeenCalledOnce()
    expect(gamifyQuest.update).not.toHaveBeenCalled()
  })

  it('is a no-op when the stored definition already matches', async () => {
    const { gamifyQuest, service } = harness(stored())

    await expect(service.syncDefinitions([definition])).resolves.toEqual({
      created: 0,
      updated: 0,
      unchanged: 1,
    })
    expect(gamifyQuest.create).not.toHaveBeenCalled()
    expect(gamifyQuest.update).not.toHaveBeenCalled()
  })

  /**
   * Wording and scheduling are safe to edit in place: no hunter's progress is
   * measured against them, so a typo fix should not need a version bump.
   */
  it('updates presentation and scheduling in place', async () => {
    const { gamifyQuest, service } = harness(stored())

    await expect(service.syncDefinitions([{
      ...definition,
      title: 'Engage three signals',
      description: 'Take action on three qualified signals.',
      enabled: false,
    }])).resolves.toEqual({ created: 0, updated: 1, unchanged: 0 })

    expect(gamifyQuest.update).toHaveBeenCalledWith({
      where: { id: 'quest_1' },
      data: {
        title: 'Engage three signals',
        description: 'Take action on three qualified signals.',
        enabled: false,
        startsAt: null,
        endsAt: null,
      },
    })
  })

  /**
   * The frozen terms, one per test case.
   *
   * `GamifyQuestAssignment` snapshots `target` and `rewardXp` when it is issued,
   * so editing them here leaves everyone already on the quest chasing a bar the
   * catalog no longer describes — with no record anywhere that the terms moved.
   * `type` and the event binding are frozen for the same reason: they decide
   * which events count and when the assignment resets, and assignments already
   * in flight were issued under the old answer. The fix is a new `version`, which
   * leaves existing assignments intact and issues new ones under the new terms.
   */
  it.each([
    ['target', { target: 5 }],
    ['rewardXp', { rewardXp: 90 }],
    ['type', { type: 'WEEKLY' as const }],
    ['eventType', { eventType: 'lead.converted' as const }],
    ['eventVersion', { eventVersion: 1 }],
  ])('refuses to change %s on a published version', async (field, change) => {
    // `eventVersion` is the one case where the incoming value is the default, so
    // the drift has to be staged on the stored row instead.
    const existing = field === 'eventVersion' ? stored({ eventVersion: 2 }) : stored()
    const { gamifyQuest, service } = harness(existing)

    await expect(service.syncDefinitions([{ ...definition, ...change }]))
      .rejects.toMatchObject({ code: 'QUEST_TERMS_FROZEN' })

    expect(gamifyQuest.update).not.toHaveBeenCalled()
    expect(gamifyQuest.create).not.toHaveBeenCalled()
  })

  it('names every frozen field that drifted, not just the first', async () => {
    const { service } = harness(stored())

    await expect(service.syncDefinitions([{ ...definition, target: 5, rewardXp: 90 }]))
      .rejects.toThrow(/target, rewardXp/)
  })

  it('still refuses an event contract that was never registered', async () => {
    const { gamifyQuest, service } = harness(null)

    await expect(service.syncDefinitions([{ ...definition, eventVersion: 99 }]))
      .rejects.toBeInstanceOf(DomainError)
    expect(gamifyQuest.create).not.toHaveBeenCalled()
  })
})
