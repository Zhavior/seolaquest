import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventFactory } from '../../core/events/EventFactory'
import { AuroraDecisionReader } from '../AuroraDecisionReader'
import { RewardEligibilityService } from '../RewardEligibilityService'
import type { GamifyRuleEvaluation } from '../types'

const prisma = {
  gamifyXpTransaction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
}

const auroraDecision = {
  findUnique: vi.fn(),
  findFirst: vi.fn(),
}

const reader = new AuroraDecisionReader(auroraDecision as never)

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

describe('RewardEligibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prisma.gamifyXpTransaction.findUnique.mockResolvedValue(null)
    prisma.gamifyXpTransaction.findFirst.mockResolvedValue(null)
    prisma.gamifyXpTransaction.count.mockResolvedValue(0)
    prisma.gamifyXpTransaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } })
    auroraDecision.findUnique.mockResolvedValue({
      id: 'decision_1',
      sourceEventId: 'source_1',
      opportunityId: 'opp_1',
      finalScore: 80,
      recommendedAction: 'ENGAGE',
      priority: 'HIGH',
      evaluationStatus: 'LIVE',
      createdAt: new Date(),
    })
  })

  it('rejects duplicate idempotency keys', async () => {
    prisma.gamifyXpTransaction.findUnique.mockResolvedValueOnce({ id: 'tx_1' })

    const result = await new RewardEligibilityService(prisma as never, reader).validate(event, rule)

    expect(result).toEqual({ eligible: false, rejectionCode: 'DUPLICATE_REWARD' })
  })

  it('rejects repeat targets for the same actor and rule', async () => {
    prisma.gamifyXpTransaction.findFirst.mockResolvedValueOnce({ id: 'tx_1' })

    const result = await new RewardEligibilityService(prisma as never, reader).validate(event, rule)

    expect(result).toEqual({ eligible: false, rejectionCode: 'REPEAT_TARGET' })
  })

  it('rejects velocity limits and daily caps', async () => {
    prisma.gamifyXpTransaction.count.mockResolvedValueOnce(20)
    await expect(new RewardEligibilityService(prisma as never, reader).validate(event, rule))
      .resolves.toEqual({ eligible: false, rejectionCode: 'VELOCITY_LIMIT' })

    prisma.gamifyXpTransaction.count.mockResolvedValueOnce(0)
    prisma.gamifyXpTransaction.aggregate.mockResolvedValueOnce({ _sum: { amount: 490 } })
    await expect(new RewardEligibilityService(prisma as never, reader).validate(event, rule))
      .resolves.toEqual({ eligible: false, rejectionCode: 'DAILY_XP_CAP' })
  })

  it('enforces Aurora decision bounds without calling AuroraService', async () => {
    auroraDecision.findUnique.mockResolvedValueOnce({
      id: 'decision_1',
      sourceEventId: 'source_1',
      opportunityId: 'opp_1',
      finalScore: 40,
      recommendedAction: 'ENGAGE',
      priority: 'MEDIUM',
      evaluationStatus: 'LIVE',
      createdAt: new Date(),
    })

    const result = await new RewardEligibilityService(prisma as never, reader).validate(event, rule)

    expect(result).toEqual({ eligible: false, rejectionCode: 'AURORA_BELOW_THRESHOLD' })
  })
})
