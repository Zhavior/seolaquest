import { AURORA_CLASSIFIER_VERSION } from './policy';
import { createHash } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { AuroraEvaluationContext } from './types';
import { DeterministicScorer } from './classifiers/DeterministicScorer';
import { AuroraSemanticClassifier } from './classifiers/AuroraSemanticClassifier';
import { CanonicalPolicyScorer } from './classifiers/CanonicalPolicyScorer';
import { EventFactory } from '../core/events/EventFactory';
import { EventStore } from '../core/events/EventStore';
import { logger } from '@/src/modules/core/infrastructure/logger';
import { getServerEnv } from '@/lib/env';

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
          classifierVersion: AURORA_CLASSIFIER_VERSION,
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

        /**
         * FALLBACK is decided by `failureCode`, the field that exists to say so.
         *
         * This used to string-match the literal reason 'Classifier failed or timed out'.
         * That coupled the status to prose: the real classifier reports distinct reasons per
         * failure mode (timed out, budget spent, schema mismatch), every one of which would
         * have been recorded as LIVE — a decision stamped with real provider provenance and
         * a confidence of 0, indistinguishable from a genuine low-confidence verdict.
         */
        if (semanticResult.failureCode) {
          evaluationStatus = 'FALLBACK';
        }
      } else {
        evaluationStatus = 'DETERMINISTIC_ONLY';
      }

      // 3. Final canonical policy scoring
      finalDecision = this.policyScorer.score(deterministicResult, semanticResult);
    } catch (error) {
      /**
       * Rethrow. This used to persist a synthetic UNAVAILABLE decision — score 0, confidence
       * 0, recommendedAction IGNORE — and then return normally.
       *
       * That was the worst available outcome. `evaluate()` resolving tells EventProcessor the
       * event succeeded, so the outbox row is marked PROCESSED and never retried; and because
       * the idempotency guard at the top of this method keys on the persisted decision, the
       * synthetic row makes the skip permanent. A transient fault — a dropped connection, a
       * bad deploy — therefore buried a real opportunity forever, as an IGNORE verdict that
       * the read layer cannot distinguish from a considered one.
       *
       * Throwing instead lets the outbox do its job: EventProcessor records a FAILED consumer
       * receipt with the error, schedules a backed-off retry, and dead-letters to FAILED only
       * after maxAttempts — where OperationalHealthService already counts it. Nothing is
       * persisted, so a later attempt evaluates the lead cleanly.
       *
       * Note this catch is now only reachable for genuine faults: the semantic classifier
       * reports its own failures by RETURNING a `failureCode` (handled above as FALLBACK),
       * precisely so a metered-out or slow provider does not land here and trigger retries
       * that would re-bill it. UNAVAILABLE remains in the EvaluationStatus union because
       * historical rows may carry it.
       */
      logger.error(
        {
          err: error,
          event: 'aurora_evaluation_failed',
          outcomeCode: 'AURORA_EVALUATION_UNAVAILABLE',
          sourceEventId: context.sourceEventId,
          opportunityId: context.opportunityId,
          policyVersion: context.policyVersion,
        },
        'Aurora evaluation failed unexpectedly; leaving the event for retry',
      );
      throw error;
    }

    let classifierProvider: string | null = null;
    let classifierModel: string | null = null;
    let semanticFailureCode: string | null = null;

    /**
     * Provenance is read from the configured model rather than hardcoded.
     *
     * Both branches previously wrote the literal 'gemini-1.5-flash', a model string that
     * appears nowhere else in this codebase — `GEMINI_MODEL` defaults to gemini-2.5-flash.
     * Provenance whose only job is to answer "which model decided this?" was answering it
     * wrong, and would have kept doing so silently after any model upgrade.
     */
    if (evaluationStatus === 'LIVE') {
      classifierProvider = 'Gemini';
      classifierModel = getServerEnv().GEMINI_MODEL;
    } else if (evaluationStatus === 'FALLBACK') {
      classifierProvider = 'Gemini';
      classifierModel = getServerEnv().GEMINI_MODEL;
      semanticFailureCode = semanticResult?.failureCode || 'PROVIDER_ERROR';
    } else if (evaluationStatus === 'UNAVAILABLE') {
      // An UNAVAILABLE row used to carry no provenance at all — null provider, null model,
      // null failure code — so the one status that means "we broke" was also the one that
      // recorded nothing about what broke. The scorer or the classifier threw rather than
      // returning, so there is no provider verdict to attribute; record the failure itself.
      semanticFailureCode = 'PROVIDER_ERROR';
    }

    // Persist the exact normalized evaluation context; hashes identify inputs, not truth.
    const inputSnapshot = JSON.parse(JSON.stringify(context)) as Prisma.InputJsonObject;
    const inputFingerprint = createHash('sha256').update(JSON.stringify(inputSnapshot)).digest('hex');

    // 4. Wrap everything in a database transaction to persist decision + outbox event
    await this.prisma.$transaction(async (tx) => {
      // It's possible someone else raced us and inserted, Prisma unique constraint handles throwing error which aborts tx.
      const decisionRecord = await tx.auroraDecision.create({
        data: {
          leadId: typeof context.additionalData?.leadId === 'string' ? context.additionalData.leadId : null,
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
          policyFlags: ['HEURISTIC_SCORE', 'UNCALIBRATED_CONFIDENCE'],
          inputFingerprint,
          inputSnapshot,
          outputSchemaVersion: 'v1',
          classifierProvider,
          classifierModel,
          classifierVersion: AURORA_CLASSIFIER_VERSION,
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
        idempotencyKey: `aurora.evaluated:${context.sourceEventId}:v1:${AURORA_CLASSIFIER_VERSION}:${context.policyVersion}`,
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
