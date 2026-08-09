/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import { EventFactory } from '../../core/events/EventFactory'
import { ConflictError, DomainError } from '../../core/infrastructure/errors'
import { GamifyLedgerService } from '../GamifyLedgerService'
import type { GamifyRuleEvaluation } from '../types'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/prisma', () => ({ default: {} }))

type Profile = { userId: string; lifetimeXp: number; level: number; reputation: number }
type LedgerRow = {
  id: string
  actorId: string
  sourceEventId: string
  targetKey: string | null
  ruleId: string
  ruleVersion: number
  entryType: 'AWARD' | 'REVERSAL'
  amount: number
  reason: string
  idempotencyKey: string
  reversalOfId: string | null
  createdAt: Date
}

function uniqueError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  })
}

function createDb() {
  const state = {
    profiles: new Map<string, Profile>(),
    xp: [] as LedgerRow[],
    reputation: [] as LedgerRow[],
    nextId: 1,
  }

  const buildTx = (target: typeof state) => {
    const findByIdempotency = (rows: LedgerRow[], idempotencyKey: string) =>
      rows.find((row) => row.idempotencyKey === idempotencyKey) ?? null

    return {
      gamifyProfile: {
        upsert: vi.fn(async ({ where, create }: any) => {
          if (!target.profiles.has(where.userId)) {
            target.profiles.set(where.userId, { ...create })
          }
          return target.profiles.get(where.userId)
        }),
        findUnique: vi.fn(async ({ where }: any) => target.profiles.get(where.userId) ?? null),
        update: vi.fn(async ({ where, data }: any) => {
          const current = target.profiles.get(where.userId)
          if (!current) throw new Error('missing profile')
          const updated = { ...current, ...data }
          target.profiles.set(where.userId, updated)
          return updated
        }),
      },
      gamifyXpTransaction: {
        create: vi.fn(async ({ data }: any) => {
          if (findByIdempotency(target.xp, data.idempotencyKey)) throw uniqueError()
          if (data.reversalOfId && target.xp.some((row) => row.reversalOfId === data.reversalOfId)) {
            throw uniqueError()
          }
          const row = {
            id: `xp_${target.nextId++}`,
            reversalOfId: null,
            targetKey: null,
            createdAt: new Date(),
            ...data,
          }
          target.xp.push(row)
          return row
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) return target.xp.find((row) => row.id === where.id) ?? null
          if (where.idempotencyKey) return findByIdempotency(target.xp, where.idempotencyKey)
          return null
        }),
        aggregate: vi.fn(async ({ where }: any) => ({
          _sum: {
            amount: target.xp
              .filter((row) => row.actorId === where.actorId)
              .reduce((sum, row) => sum + row.amount, 0),
          },
        })),
      },
      gamifyReputationTransaction: {
        create: vi.fn(async ({ data }: any) => {
          if (findByIdempotency(target.reputation, data.idempotencyKey)) throw uniqueError()
          if (data.reversalOfId && target.reputation.some((row) => row.reversalOfId === data.reversalOfId)) {
            throw uniqueError()
          }
          const row = {
            id: `rep_${target.nextId++}`,
            reversalOfId: null,
            targetKey: null,
            createdAt: new Date(),
            ...data,
          }
          target.reputation.push(row)
          return row
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) return target.reputation.find((row) => row.id === where.id) ?? null
          if (where.idempotencyKey) return findByIdempotency(target.reputation, where.idempotencyKey)
          return null
        }),
        aggregate: vi.fn(async ({ where }: any) => ({
          _sum: {
            amount: target.reputation
              .filter((row) => row.actorId === where.actorId)
              .reduce((sum, row) => sum + row.amount, 0),
          },
        })),
      },
    }
  }

  const db = {
    gamifyProfile: {
      findUnique: vi.fn(async ({ where }: any) => state.profiles.get(where.userId) ?? null),
    },
    $transaction: vi.fn(async (cb: (tx: ReturnType<typeof buildTx>) => unknown) => {
      const working = {
        profiles: new Map(state.profiles),
        xp: [...state.xp],
        reputation: [...state.reputation],
        nextId: state.nextId,
      }
      const result = await cb(buildTx(working))
      state.profiles = working.profiles
      state.xp = working.xp
      state.reputation = working.reputation
      state.nextId = working.nextId
      return result
    }),
    state,
  }

  return db
}

const event = EventFactory.create({
  type: 'opportunity.engaged',
  actorId: 'user_1',
  source: 'leads',
  payload: {
    opportunityId: 'opp_1',
    leadId: 'lead_1',
    auroraDecisionId: 'decision_1',
    auroraScore: 80,
    actionTaken: 'CLAIMED',
    engagedAt: '2026-08-07T12:00:00.000Z',
  },
})

const rule: GamifyRuleEvaluation = {
  ruleId: 'opportunity_engaged',
  ruleVersion: 1,
  sourceEventId: event.id,
  actorId: event.actorId,
  targetKey: 'opportunity:opp_1',
  reason: 'Qualified opportunity engaged',
  effects: [
    { kind: 'XP', amount: 25 },
    { kind: 'REPUTATION', amount: 1 },
  ],
  requiresAuroraDecision: true,
  minimumAuroraScore: 60,
}

describe('GamifyLedgerService', () => {
  let eligibility: { validate: ReturnType<typeof vi.fn> }
  let ruleEngine: { evaluate: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    eligibility = { validate: vi.fn().mockResolvedValue({ eligible: true }) }
    ruleEngine = { evaluate: vi.fn().mockReturnValue([rule]) }
  })

  it('writes XP, reputation, and profile projection atomically', async () => {
    const db = createDb()
    const service = new GamifyLedgerService(db as never, ruleEngine as never, eligibility as never)

    const result = await service.awardForEvent(event)

    expect(result.awarded).toBe(true)
    expect(result.profile).toMatchObject({ userId: 'user_1', lifetimeXp: 25, level: 1, reputation: 1 })
    expect(db.state.xp).toHaveLength(1)
    expect(db.state.reputation).toHaveLength(1)
    expect(db.state.xp[0].idempotencyKey).toBe(`award:user_1:${event.id}:opportunity_engaged:1`)
  })

  it('deduplicates raced ledger inserts with database idempotency keys', async () => {
    const db = createDb()
    const service = new GamifyLedgerService(db as never, ruleEngine as never, eligibility as never)

    await service.awardForEvent(event)
    const second = await service.awardForEvent(event)

    expect(second.awarded).toBe(true)
    expect(second.profile).toMatchObject({ lifetimeXp: 25, reputation: 1 })
    expect(db.state.xp).toHaveLength(1)
    expect(db.state.reputation).toHaveLength(1)
  })

  it('rolls back profile projection if a mid-transaction write fails', async () => {
    const db = createDb()
    const service = new GamifyLedgerService(db as never, ruleEngine as never, eligibility as never)
    let failed = false

    db.$transaction.mockImplementationOnce(async (cb: any) => {
      const working = {
        profiles: new Map(db.state.profiles),
        xp: [...db.state.xp],
        reputation: [...db.state.reputation],
        nextId: db.state.nextId,
      }
      const tx = createDb()
      tx.state.profiles = working.profiles
      tx.state.xp = working.xp
      tx.state.reputation = working.reputation
      const inner = (tx as any).$transaction
      const built = await inner(async (realTx: any) => {
        realTx.gamifyReputationTransaction.create.mockImplementationOnce(async () => {
          failed = true
          throw new Error('forced reputation failure')
        })
        return cb(realTx)
      })
      return built
    })

    await expect(service.awardForEvent(event)).rejects.toThrow('forced reputation failure')
    expect(failed).toBe(true)
    expect(db.state.profiles.size).toBe(0)
    expect(db.state.xp).toHaveLength(0)
  })

  it('enforces reversal integrity and reputation floor', async () => {
    const db = createDb()
    const service = new GamifyLedgerService(db as never, ruleEngine as never, eligibility as never)
    await service.awardForEvent(event)

    await service.reverseReputationTransaction('rep_2')
    expect(db.state.profiles.get('user_1')?.reputation).toBe(0)

    await expect(service.reverseReputationTransaction('rep_2')).rejects.toBeInstanceOf(ConflictError)
    await expect(service.reverseReputationTransaction('rep_3')).rejects.toBeInstanceOf(DomainError)
  })

  it('reconciles profile totals from immutable ledgers', async () => {
    const db = createDb()
    const service = new GamifyLedgerService(db as never, ruleEngine as never, eligibility as never)
    await service.awardForEvent(event)

    db.state.profiles.set('user_1', { userId: 'user_1', lifetimeXp: 999, level: 9, reputation: 9 })
    const rebuilt = await service.reconcileProfile('user_1')

    expect(rebuilt).toMatchObject({ userId: 'user_1', lifetimeXp: 25, level: 1, reputation: 1 })
  })
})
