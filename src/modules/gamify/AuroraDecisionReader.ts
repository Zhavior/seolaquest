import type { PrismaClient } from '@prisma/client'

export interface GamifyAuroraDecision {
  id: string
  sourceEventId: string
  opportunityId: string
  finalScore: number
  recommendedAction: string
  priority: string
  evaluationStatus: string
  createdAt: Date
}

type AuroraDecisionDelegate = PrismaClient['auroraDecision']

export class AuroraDecisionReader {
  constructor(private readonly auroraDecision: AuroraDecisionDelegate) {}

  async findById(decisionId: string): Promise<GamifyAuroraDecision | null> {
    return this.auroraDecision.findUnique({
      where: { id: decisionId },
      select: {
        id: true,
        sourceEventId: true,
        opportunityId: true,
        finalScore: true,
        recommendedAction: true,
        priority: true,
        evaluationStatus: true,
        createdAt: true,
      },
    })
  }

  async findLatestForOpportunity(opportunityId: string): Promise<GamifyAuroraDecision | null> {
    return this.auroraDecision.findFirst({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sourceEventId: true,
        opportunityId: true,
        finalScore: true,
        recommendedAction: true,
        priority: true,
        evaluationStatus: true,
        createdAt: true,
      },
    })
  }
}
