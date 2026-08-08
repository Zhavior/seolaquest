/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest'
import { EventFactory } from '../../core/events/EventFactory'
import { DomainError } from '../../core/infrastructure/errors'
import { GamifyQuestService } from '../GamifyQuestService'

type Quest = {
  id: string
  code: string
  version: number
  title: string
  description: string
  type: string
  eventType: string
  eventVersion: number
  target: number
  rewardXp: number
  enabled: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
}

type Assignment = {
  id: string
  questId: string
  actorId: string
  cycleKey: string
  progress: number
  target: number
  rewardXp: number
  status: string
  assignedAt: Date
  completedAt: Date | null
  claimedAt: Date | null
  expiresAt: Date | null
}

type Contribution = {
  id: string
  assignmentId: string
  sourceEventId: string
  sourceEventType: string
  sourceEventVersion: number
  increment: number
  occurredAt: Date
  createdAt: Date
}

type Profile = { userId: string; lifetimeXp: number; level: number; reputation: number }
type XpRow = { id: string; idempotencyKey: string; actorId: string; amount: number; [key: string]: unknown }

function cloneState(state: ReturnType<typeof baseState>) {
  return {
    quests: new Map([...state.quests].map(([key, value]) => [key, { ...value }])),
    assignments: new Map([...state.assignments].map(([key, value]) => [key, { ...value }])),
    contributions: state.contributions.map((value) => ({ ...value })),
    profiles: new Map([...state.profiles].map(([key, value]) => [key, { ...value }])),
    xp: state.xp.map((value) => ({ ...value })),
    nextId: state.nextId,
    failNextAssignmentUpdate: state.failNextAssignmentUpdate,
  }
}

function baseState() {
  return {
    quests: new Map<string, Quest>(),
    assignments: new Map<string, Assignment>(),
    contributions: [] as Contribution[],
    profiles: new Map<string, Profile>(),
    xp: [] as XpRow[],
    nextId: 1,
    failNextAssignmentUpdate: false,
  }
}

function createDb() {
  let state = baseState()
  let transactionQueue = Promise.resolve()

  const withQuest = (assignment: Assignment) => ({
    ...assignment,
    quest: state.quests.get(assignment.questId)!,
  })

  const buildTx = (working: typeof state) => {
    const questFor = (assignment: Assignment) => working.quests.get(assignment.questId)!
    const includeQuest = (assignment: Assignment) => ({ ...assignment, quest: questFor(assignment) })

    return {
      $queryRaw: vi.fn(async () => []),
      gamifyQuest: {
        findUnique: vi.fn(async ({ where }: any) => working.quests.get(where.id) ?? null),
      },
      gamifyProfile: {
        upsert: vi.fn(async ({ where, create }: any) => {
          if (!working.profiles.has(where.userId)) working.profiles.set(where.userId, { ...create })
          return working.profiles.get(where.userId)
        }),
        findUnique: vi.fn(async ({ where }: any) => working.profiles.get(where.userId) ?? null),
        update: vi.fn(async ({ where, data }: any) => {
          const profile = working.profiles.get(where.userId)
          if (!profile) throw new Error('missing profile')
          const updated = { ...profile, ...data }
          working.profiles.set(where.userId, updated)
          return updated
        }),
      },
      gamifyQuestAssignment: {
        upsert: vi.fn(async ({ where, create }: any) => {
          const existing = [...working.assignments.values()].find(
            (row) => row.actorId === where.actorId_questId_cycleKey.actorId
              && row.questId === where.actorId_questId_cycleKey.questId
              && row.cycleKey === where.actorId_questId_cycleKey.cycleKey
          )
          if (existing) return includeQuest(existing)
          const assignment: Assignment = {
            id: `assignment_${working.nextId++}`,
            progress: 0,
            status: 'IN_PROGRESS',
            assignedAt: new Date('2026-08-08T00:00:00.000Z'),
            completedAt: null,
            claimedAt: null,
            expiresAt: null,
            ...create,
          }
          working.assignments.set(assignment.id, assignment)
          return includeQuest(assignment)
        }),
        findMany: vi.fn(async ({ where }: any) => [...working.assignments.values()]
          .filter((assignment) => {
            const quest = questFor(assignment)
            return assignment.actorId === where.actorId
              && where.status.in.includes(assignment.status)
              && quest.enabled === where.quest.enabled
              && quest.eventType === where.quest.eventType
              && quest.eventVersion === where.quest.eventVersion
          })
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(includeQuest)),
        findUnique: vi.fn(async ({ where }: any) => {
          const assignment = working.assignments.get(where.id)
          return assignment ? includeQuest(assignment) : null
        }),
        update: vi.fn(async ({ where, data }: any) => {
          if (working.failNextAssignmentUpdate) {
            working.failNextAssignmentUpdate = false
            throw new Error('forced assignment failure')
          }
          const assignment = working.assignments.get(where.id)
          if (!assignment) throw new Error('missing assignment')
          const updated = { ...assignment, ...data }
          working.assignments.set(where.id, updated)
          return updated
        }),
      },
      gamifyQuestContribution: {
        findUnique: vi.fn(async ({ where }: any) => working.contributions.find(
          (row) => row.assignmentId === where.assignmentId_sourceEventId.assignmentId
            && row.sourceEventId === where.assignmentId_sourceEventId.sourceEventId
        ) ?? null),
        create: vi.fn(async ({ data }: any) => {
          const row: Contribution = {
            id: `contribution_${working.nextId++}`,
            createdAt: new Date(),
            ...data,
          }
          working.contributions.push(row)
          return row
        }),
      },
      gamifyXpTransaction: {
        findUnique: vi.fn(async ({ where }: any) => working.xp.find(
          (row) => row.idempotencyKey === where.idempotencyKey
        ) ?? null),
        create: vi.fn(async ({ data }: any) => {
          if (working.xp.some((row) => row.idempotencyKey === data.idempotencyKey)) {
            throw new Error('duplicate XP')
          }
          const row = { id: `xp_${working.nextId++}`, ...data }
          working.xp.push(row)
          return row
        }),
      },
    }
  }

  const db = {
    auroraDecision: {},
    get state() {
      return state
    },
    seedQuest(quest: Quest) {
      state.quests.set(quest.id, quest)
    },
    failNextAssignmentUpdate() {
      state.failNextAssignmentUpdate = true
    },
    gamifyQuestAssignment: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const [id, assignment] of state.assignments) {
          if (assignment.status === where.status && assignment.expiresAt && assignment.expiresAt <= where.expiresAt.lte) {
            state.assignments.set(id, { ...assignment, ...data })
            count += 1
          }
        }
        return { count }
      }),
    },
    $transaction: vi.fn((callback: any) => {
      const run = transactionQueue.then(async () => {
        const working = cloneState(state)
        const result = await callback(buildTx(working))
        state = working
        return result
      })
      transactionQueue = run.then(() => undefined, () => undefined)
      return run
    }),
    assignment(id: string) {
      const assignment = state.assignments.get(id)
      return assignment ? withQuest(assignment) : null
    },
  }

  return db
}

function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'quest_1',
    code: 'engage_twice',
    version: 1,
    title: 'Engage twice',
    description: 'Engage two qualified opportunities.',
    type: 'DAILY',
    eventType: 'opportunity.engaged',
    eventVersion: 1,
    target: 2,
    rewardXp: 40,
    enabled: true,
    startsAt: new Date('2026-08-08T00:00:00.000Z'),
    endsAt: new Date('2026-08-09T00:00:00.000Z'),
    createdAt: new Date('2026-08-07T00:00:00.000Z'),
    ...overrides,
  }
}

function engagementEvent(id: string, actorId = 'user_1') {
  return {
    ...EventFactory.create({
      type: 'opportunity.engaged',
      actorId,
      source: 'leads',
      payload: {
        opportunityId: `opp_${id}`,
        leadId: `lead_${id}`,
        actionTaken: 'CLAIMED',
        engagedAt: '2026-08-08T12:00:00.000Z',
      },
    }),
    id,
    occurredAt: '2026-08-08T12:00:00.000Z',
  }
}

describe('GamifyQuestService', () => {
  it('snapshots assignment terms and applies each event exactly once without over-progress', async () => {
    const db = createDb()
    db.seedQuest(quest())
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1', new Date('2026-08-08T08:00:00.000Z'))

    expect(assignment).toMatchObject({ target: 2, rewardXp: 40, status: 'IN_PROGRESS' })
    await service.contributeForEvent(engagementEvent('event_1'))
    const replay = await service.contributeForEvent(engagementEvent('event_1'))
    await service.contributeForEvent(engagementEvent('event_2'))
    const afterCompletion = await service.contributeForEvent(engagementEvent('event_3'))

    expect(replay[0]).toMatchObject({ applied: false, progress: 1 })
    expect(afterCompletion).toEqual([])
    expect(db.assignment(assignment.id)).toMatchObject({ progress: 2, status: 'COMPLETED' })
    expect(db.state.contributions).toHaveLength(2)
  })

  it('creates a fresh assignment for each daily cycle and reuses one within the same day', async () => {
    const db = createDb()
    db.seedQuest(quest({ endsAt: null }))
    const service = new GamifyQuestService(db as never)

    const first = await service.assignQuest('user_1', 'quest_1', new Date('2026-08-08T08:00:00.000Z'))
    const sameDay = await service.assignQuest('user_1', 'quest_1', new Date('2026-08-08T20:00:00.000Z'))
    const nextDay = await service.assignQuest('user_1', 'quest_1', new Date('2026-08-09T08:00:00.000Z'))

    expect(first.id).toBe(sameDay.id)
    expect(first.cycleKey).toBe('2026-08-08')
    expect(nextDay.id).not.toBe(first.id)
    expect(nextDay.cycleKey).toBe('2026-08-09')
  })

  it('deduplicates concurrent delivery through the assignment lock and contribution identity', async () => {
    const db = createDb()
    db.seedQuest(quest({ target: 3 }))
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')
    const event = engagementEvent('event_concurrent')

    await Promise.all([
      service.contributeForEvent(event),
      service.contributeForEvent(event),
    ])

    expect(db.assignment(assignment.id)?.progress).toBe(1)
    expect(db.state.contributions).toHaveLength(1)
  })

  it('excludes system activity and expires only incomplete assignments', async () => {
    const db = createDb()
    db.seedQuest(quest())
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')
    const systemEvent = { ...engagementEvent('event_system', 'system'), source: 'system.scanner' }

    await expect(service.contributeForEvent(systemEvent)).resolves.toEqual([])
    await expect(service.expireAssignments(new Date('2026-08-10T00:00:00.000Z'))).resolves.toBe(1)
    expect(db.assignment(assignment.id)?.status).toBe('EXPIRED')
    await expect(service.claimQuest('user_1', assignment.id)).rejects.toMatchObject({ code: 'QUEST_EXPIRED' })
  })

  it('accepts delayed delivery when the action occurred before expiration', async () => {
    const db = createDb()
    db.seedQuest(quest({ target: 1 }))
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')
    await service.expireAssignments(new Date('2026-08-10T00:00:00.000Z'))

    const result = await service.contributeForEvent(engagementEvent('event_delayed'))

    expect(result[0]).toMatchObject({ applied: true, progress: 1, status: 'COMPLETED' })
    expect(db.assignment(assignment.id)?.status).toBe('COMPLETED')
  })

  it('claims a completed quest after its deadline exactly once through the XP ledger', async () => {
    const db = createDb()
    db.seedQuest(quest({ target: 1 }))
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')
    await service.contributeForEvent(engagementEvent('event_complete'))

    const first = await service.claimQuest('user_1', assignment.id, new Date('2026-08-10T00:00:00.000Z'))
    const replay = await service.claimQuest('user_1', assignment.id, new Date('2026-08-10T00:00:01.000Z'))

    expect(first).toMatchObject({ claimed: true, profile: { lifetimeXp: 40 } })
    expect(replay).toMatchObject({ claimed: false, profile: { lifetimeXp: 40 } })
    expect(db.state.xp).toHaveLength(1)
    expect(db.state.xp[0].idempotencyKey).toBe(`quest-claim:${assignment.id}`)
    expect(db.assignment(assignment.id)?.status).toBe('CLAIMED')
  })

  it('rolls back the ledger and profile if claim finalization fails', async () => {
    const db = createDb()
    db.seedQuest(quest({ target: 1 }))
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')
    await service.contributeForEvent(engagementEvent('event_complete'))
    db.failNextAssignmentUpdate()

    await expect(service.claimQuest('user_1', assignment.id)).rejects.toThrow('forced assignment failure')

    expect(db.state.xp).toHaveLength(0)
    expect(db.state.profiles.get('user_1')?.lifetimeXp).toBe(0)
    expect(db.assignment(assignment.id)?.status).toBe('COMPLETED')
  })

  it('rejects claims before completion', async () => {
    const db = createDb()
    db.seedQuest(quest())
    const service = new GamifyQuestService(db as never)
    const assignment = await service.assignQuest('user_1', 'quest_1')

    await expect(service.claimQuest('user_1', assignment.id)).rejects.toBeInstanceOf(DomainError)
    expect(db.state.xp).toHaveLength(0)
  })
})
