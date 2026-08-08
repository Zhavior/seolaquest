import prisma from '@/lib/prisma'

export interface DistributionMetric {
  label: string
  count: number
  rate: number // 0 to 1
}

export interface AuroraMetricsOverview {
  totalDecisions: number
  evaluationStatus: DistributionMetric[]
  recommendedAction: DistributionMetric[]
  priority: DistributionMetric[]
  averageScore: number
  averageConfidence: number
  semanticFailureCodes: DistributionMetric[]
  classifierProviders: DistributionMetric[]
  classifierModels: DistributionMetric[]
  deterministicScorerVersions: DistributionMetric[]
  classifierVersions: DistributionMetric[]
  policyVersions: DistributionMetric[]
  feedbackDistribution: DistributionMetric[]
}

export class AuroraMetricsService {
  static async getOverviewMetrics(): Promise<AuroraMetricsOverview> {
    const totalDecisions = await prisma.auroraDecision.count()

    const denominator = Math.max(totalDecisions, 1)

    type GroupRow = Record<string, unknown> & { _count?: number; count?: number }
    const mapDistribution = <T extends GroupRow>(
      groups: T[],
      key: string,
      defaultLabel = 'UNKNOWN'
    ): DistributionMetric[] => {
      return groups
        .map(g => {
          const count = Number(g._count || g.count || 0)
          return {
            label: String(g[key] || defaultLabel),
            count,
            rate: count / denominator
          }
        })
        .sort((a, b) => b.count - a.count)
    }

    const [
      evaluationStatusGroup,
      recommendedActionGroup,
      priorityGroup,
      averages,
      semanticFailuresGroup,
      classifierProvidersGroup,
      classifierModelsGroup,
      deterministicScorerVersionsGroup,
      classifierVersionsGroup,
      policyVersionsGroup,
      feedbackGroup
    ] = await Promise.all([
      prisma.auroraDecision.groupBy({ by: ['evaluationStatus'], _count: true }),
      prisma.auroraDecision.groupBy({ by: ['recommendedAction'], _count: true }),
      prisma.auroraDecision.groupBy({ by: ['priority'], _count: true }),
      prisma.auroraDecision.aggregate({
        _avg: { finalScore: true, confidence: true }
      }),
      prisma.auroraDecision.groupBy({ by: ['semanticFailureCode'], _count: true, where: { semanticFailureCode: { not: null } } }),
      prisma.auroraDecision.groupBy({ by: ['classifierProvider'], _count: true, where: { classifierProvider: { not: null } } }),
      prisma.auroraDecision.groupBy({ by: ['classifierModel'], _count: true, where: { classifierModel: { not: null } } }),
      prisma.auroraDecision.groupBy({ by: ['deterministicScorerVersion'], _count: true }),
      prisma.auroraDecision.groupBy({ by: ['classifierVersion'], _count: true }),
      prisma.auroraDecision.groupBy({ by: ['policyVersion'], _count: true }),
      prisma.auroraFeedback.groupBy({ by: ['feedbackType'], _count: true })
    ])

    // Note for feedback: total feedback might be different from total decisions.
    // The explicit denominator for feedback rate should arguably be total feedback.
    const totalFeedback = feedbackGroup.reduce((acc, g) => acc + g._count, 0)
    const feedbackDenominator = Math.max(totalFeedback, 1)
    const mappedFeedback = feedbackGroup.map(g => ({
      label: g.feedbackType,
      count: g._count,
      rate: g._count / feedbackDenominator
    })).sort((a, b) => b.count - a.count)

    return {
      totalDecisions,
      evaluationStatus: mapDistribution(evaluationStatusGroup, 'evaluationStatus'),
      recommendedAction: mapDistribution(recommendedActionGroup, 'recommendedAction'),
      priority: mapDistribution(priorityGroup, 'priority'),
      averageScore: averages._avg.finalScore ?? 0,
      averageConfidence: averages._avg.confidence ?? 0,
      semanticFailureCodes: mapDistribution(semanticFailuresGroup, 'semanticFailureCode'),
      classifierProviders: mapDistribution(classifierProvidersGroup, 'classifierProvider'),
      classifierModels: mapDistribution(classifierModelsGroup, 'classifierModel'),
      deterministicScorerVersions: mapDistribution(deterministicScorerVersionsGroup, 'deterministicScorerVersion'),
      classifierVersions: mapDistribution(classifierVersionsGroup, 'classifierVersion'),
      policyVersions: mapDistribution(policyVersionsGroup, 'policyVersion'),
      feedbackDistribution: mappedFeedback,
    }
  }

  static async getRecentDecisions(limit = 50) {
    return prisma.auroraDecision.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        opportunityId: true,
        sourceEventId: true,
        finalScore: true,
        confidence: true,
        priority: true,
        recommendedAction: true,
        evaluationStatus: true,
        classifierVersion: true,
        deterministicScorerVersion: true,
        policyVersion: true,
        reasons: true, // Only fetch reasons, DO NOT fetch semanticSignals to save memory
        semanticFailureCode: true,
        createdAt: true,
      }
    })
  }
}
