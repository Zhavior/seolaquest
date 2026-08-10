import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GamifyEnrollmentService } from '../GamifyEnrollmentService'

vi.mock('@/lib/prisma', () => ({ default: {} }))
vi.mock('../../core/infrastructure/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const AT = new Date('2026-08-10T09:30:00.000Z')

function quest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'quest_daily',
    code: 'engage_three',
    version: 1,
    type: 'DAILY',
    target: 3,
    rewardXp: 40,
    endsAt: null,
    ...overrides,
  }
}

/**
 * The doubles stand in for the three tables enrollment touches. `createMany`
 * reports a count because that count is the service's own return value, and
 * `findUnique` on the profile is what decides whether a write happens at all.
 */
function harness(quests: ReturnType<typeof quest>[], options: {
  existingAssignments?: Array<{ questId: string; cycleKey: string }>
  existingProfile?: boolean
} = {}) {
  const db = {
    gamifyProfile: {
      findUnique: vi.fn(async () => (options.existingProfile === false ? null : { userId: 'user_1' })),
      upsert: vi.fn(async () => ({ userId: 'user_1' })),
    },
    gamifyQuest: { findMany: vi.fn(async () => quests) },
    gamifyQuestAssignment: {
      findMany: vi.fn(async () => options.existingAssignments ?? []),
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length })),
    },
  }

  return { db, service: new GamifyEnrollmentService(db as never) }
}

describe('GamifyEnrollmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * This service runs on every authenticated request, so its steady state is the
   * whole design. An unconditional upsert would be shorter and would issue a
   * write on every page load for the lifetime of every account — a per-request
   * write to earn nothing, since the rows already say what they need to say.
   */
  it('performs no writes once the hunter already holds this cycle', async () => {
    const { db, service } = harness([quest()], {
      existingAssignments: [{ questId: 'quest_daily', cycleKey: '2026-08-10' }],
    })

    await expect(service.ensureEnrolled('user_1', AT)).resolves.toEqual({
      enrolled: true,
      assigned: 0,
    })

    expect(db.gamifyQuestAssignment.createMany).not.toHaveBeenCalled()
    expect(db.gamifyProfile.upsert).not.toHaveBeenCalled()
    // Two reads, and that is the entire cost of a warm request.
    expect(db.gamifyQuest.findMany).toHaveBeenCalledOnce()
    expect(db.gamifyQuestAssignment.findMany).toHaveBeenCalledOnce()
  })

  /**
   * Yesterday's DAILY assignment does not satisfy today's cycle, and a MILESTONE
   * held once is held forever. Getting this wrong in either direction is silent:
   * too eager and the hunter gets a second copy of a one-off quest, too lazy and
   * their daily never resets and they can never make progress again.
   */
  it('assigns only the quests missing an assignment for the current cycle', async () => {
    const quests = [
      quest({ id: 'quest_daily', type: 'DAILY' }),
      quest({ id: 'quest_once', type: 'MILESTONE', target: 1, rewardXp: 250 }),
    ]
    const { db, service } = harness(quests, {
      existingAssignments: [
        // Yesterday's daily: same quest, spent cycle.
        { questId: 'quest_daily', cycleKey: '2026-08-09' },
        { questId: 'quest_once', cycleKey: 'once' },
      ],
    })

    await expect(service.ensureEnrolled('user_1', AT)).resolves.toEqual({
      enrolled: true,
      assigned: 1,
    })

    const [{ data, skipDuplicates }] = db.gamifyQuestAssignment.createMany.mock.calls[0] as [
      { data: Array<Record<string, unknown>>; skipDuplicates: boolean },
    ]
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      actorId: 'user_1',
      questId: 'quest_daily',
      cycleKey: '2026-08-10',
      // Target and reward are snapshotted at assignment time, so a later catalog
      // edit cannot move the bar out from under a hunter already chasing it.
      target: 3,
      rewardXp: 40,
    })
    expect(data[0].expiresAt).toEqual(new Date('2026-08-11T00:00:00.000Z'))
    // The unique index is the real defence against a rollover race; two requests
    // crossing midnight together must both succeed rather than one throwing.
    expect(skipDuplicates).toBe(true)
  })

  /**
   * A brand-new account has no profile row, and the HUD reads that row. Without
   * it the shell renders a level nobody earned, so the profile has to exist even
   * on the pass where the catalog turns out to be empty.
   */
  it('creates the profile row even when the catalog has nothing to assign', async () => {
    const { db, service } = harness([], { existingProfile: false })

    await expect(service.ensureEnrolled('user_1', AT)).resolves.toEqual({
      enrolled: true,
      assigned: 0,
    })

    expect(db.gamifyProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_1' },
        create: { userId: 'user_1', lifetimeXp: 0, level: 1, reputation: 0 },
      }),
    )
    expect(db.gamifyQuestAssignment.findMany).not.toHaveBeenCalled()
  })

  it('creates the profile before writing assignments for a first-time hunter', async () => {
    const { db, service } = harness([quest()], { existingProfile: false })

    await expect(service.ensureEnrolled('user_1', AT)).resolves.toEqual({
      enrolled: true,
      assigned: 1,
    })

    // Ordering matters: an assignment referencing a hunter with no profile would
    // render as progress against a level that does not exist yet.
    expect(db.gamifyProfile.upsert.mock.invocationCallOrder[0]).toBeLessThan(
      db.gamifyQuestAssignment.createMany.mock.invocationCallOrder[0],
    )
  })
})
