import { Prisma, PrismaClient } from '@prisma/client';
import { AuroraEvaluationContext } from './types';
import { DeterministicScorer } from './classifiers/DeterministicScorer';
import { AuroraSemanticClassifier } from './classifiers/AuroraSemanticClassifier';
import { CanonicalPolicyScorer } from './classifiers/CanonicalPolicyScorer';
import { EventFactory } from '../core/events/EventFactory';
import { EventStore } from '../core/events/EventStore';
import { logger } from '@/src/modules/core/infrastructure/logger';

export class AuroraService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly deterministicScorer: DeterministicScorer,
    private readonly semanticClassifier: AuroraSemanticClassifier,
    private readonly policyScorer: CanonicalPolicyScorer
  ) {}

  async evaluate(context: AuroraEvaluationContext): Promise<void> {
    const existing = await this.prisma.auroraDecision.findUnique({
      where: {
        sourceEventId_deterministicScorerVersion_classifierVersion_policyVersion: {
          sourceEventId: context.sourceEventId,
          deterministicScorerVersion: 'v1',
          classifierVersion: 'v1',
          policyVersion: context.policyVersion,
        }
      }
    });

    if (existing) {
      // Not inside a request; carry correlation fields explicitly since there is no
      // withApiHandler AsyncLocalStorage store to inherit them from.
      logger.info(
        {
          event: 'aurora_evaluation_skipped',
          outcomeCode: 'AURORA_DECISION_ALREADY_EXISTS',
          sourceEventId: context.sourceEventId,
          opportunityId: context.opportunityId,
          policyVersion: context.policyVersion,
        },
        'Aurora decision already exists, skipping evaluation',
      );
      return; // Idempotency
    }

    let deterministicResult: import('./types').DeterministicScorerResult;
    let semanticResult: import('./types').AuroraSemanticResult | undefined;
    let evaluationStatus = 'LIVE';
    let finalDecision: import('./types').CanonicalPolicyResult;

    try {
      // 1. Deterministic scoring
      deterministicResult = await this.deterministicScorer.score(context);

      // 2. Semantic scoring (if not hard rejected)
      if (!deterministicResult.hardReject) {
        semanticResult = await this.semanticClassifier.classify({
          opportunityId: context.opportunityId,
          sourceEventId: context.sourceEventId,
          text: context.text,
          context: context.additionalData || {}
        });

        if (semanticResult.reasons.includes('Classifier failed or timed out')) {
          evaluationStatus = 'FALLBACK';
        }
      } else {
        evaluationStatus = 'DETERMINISTIC_ONLY';
      }

      // 3. Final canonical policy scoring
      finalDecision = this.policyScorer.score(deterministicResult, semanticResult);
    } catch (error) {
      // Degraded-but-continuing path: the decision is still persisted below with
      // evaluationStatus UNAVAILABLE, so this must never be silent.
      logger.error(
        {
          err: error,
          event: 'aurora_evaluation_failed',
          outcomeCode: 'AURORA_EVALUATION_UNAVAILABLE',
          sourceEventId: context.sourceEventId,
          opportunityId: context.opportunityId,
          policyVersion: context.policyVersion,
        },
        'Aurora evaluation failed unexpectedly',
      );
      evaluationStatus = 'UNAVAILABLE';
      deterministicResult = { hardReject: false, hardRejectReasons: [], signals: {} };
      finalDecision = {
        finalScore: 0,
        confidence: 0,
        priority: 'LOW',
        recommendedAction: 'IGNORE',
        canonicalReasons: ['SYSTEM_UNAVAILABLE']
      };
    }

    let classifierProvider: string | null = null;
    let classifierModel: string | null = null;
    let semanticFailureCode: string | null = null;

    if (evaluationStatus === 'LIVE') {
      classifierProvider = 'Gemini';
      classifierModel = 'gemini-1.5-flash';
    } else if (evaluationStatus === 'FALLBACK') {
      classifierProvider = 'Gemini';
      classifierModel = 'gemini-1.5-flash';
      semanticFailureCode = semanticResult?.failureCode || 'PROVIDER_ERROR';
    }

    // 4. Wrap everything in a database transaction to persist decision + outbox event
    await this.prisma.$transaction(async (tx) => {
      // It's possible someone else raced us and inserted, Prisma unique constraint handles throwing error which aborts tx.
      const decisionRecord = await tx.auroraDecision.create({
        data: {
          opportunityId: context.opportunityId,
          sourceEventId: context.sourceEventId,
          finalScore: finalDecision.finalScore,
          confidence: finalDecision.confidence,
          priority: finalDecision.priority,
          recommendedAction: finalDecision.recommendedAction,
          deterministicSignals: deterministicResult.signals as Prisma.InputJsonObject,
          semanticSignals: (evaluationStatus === 'LIVE' && semanticResult?.semanticSignals)
            ? semanticResult.semanticSignals as Prisma.InputJsonObject
            : Prisma.DbNull,
          reasons: finalDecision.canonicalReasons,
          policyFlags: [], // Populated by advanced policy rules if applicable
          classifierProvider,
          classifierModel,
          classifierVersion: 'v1',
          deterministicScorerVersion: 'v1',
          policyVersion: context.policyVersion,
          semanticFailureCode,
          evaluationStatus: evaluationStatus,
        }
      });

      // Use EventFactory and EventStore for proper transactional outboxing
      const domainEvent = EventFactory.create({
        type: 'aurora.opportunity.evaluated',
        version: 1,
        actorId: 'aurora-engine',
        source: 'aurora',
        correlationId: context.sourceEventId,
        idempotencyKey: `aurora.evaluated:${context.sourceEventId}:v1:v1:${context.policyVersion}`,
        payload: {
          decisionId: decisionRecord.id,
          opportunityId: decisionRecord.opportunityId,
          leadId: context.additionalData?.leadId as string | undefined, // from payload schema
          finalScore: decisionRecord.finalScore,
          confidence: decisionRecord.confidence,
          priority: decisionRecord.priority,
          recommendedAction: decisionRecord.recommendedAction,
          reasons: decisionRecord.reasons as string[],
        }
      });

      await EventStore.writeOutbox(domainEvent, tx);
    });
  }
}
