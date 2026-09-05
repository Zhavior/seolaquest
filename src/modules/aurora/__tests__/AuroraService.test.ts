/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuroraService } from '../AuroraService';
import { DeterministicScorer } from '../classifiers/DeterministicScorer';
import { CanonicalPolicyScorer } from '../classifiers/CanonicalPolicyScorer';
import type { AuroraSemanticClassifier, AuroraSemanticResult } from '../types';
import { PrismaClient } from '@prisma/client';
import { EventStore } from '../../core/events/EventStore';

vi.mock('../../core/events/EventStore', () => ({
  EventStore: {
    writeOutbox: vi.fn(),
  }
}));

// Provenance is read from the configured model rather than hardcoded, so the orchestrator
// now touches env. Pinned here so these cases do not depend on the machine's .env.local.
vi.mock('@/lib/env', () => ({
  getServerEnv: () => ({ GEMINI_MODEL: 'gemini-2.5-flash' }),
}));

/**
 * A classifier double.
 *
 * These cases cover the ORCHESTRATOR — idempotency, status selection, provenance, what gets
 * persisted and emitted. They used to construct the real `GeminiSemanticClassifier` and lean
 * on its hardcoded stub output, which meant they silently became network- and limiter-bound
 * the moment it became a real adapter. The adapter has its own tests; this decouples them.
 */
function stubClassifier(result: Partial<AuroraSemanticResult> = {}): AuroraSemanticClassifier {
  return {
    classify: vi.fn(async () => ({
      confidence: 0.85,
      semanticSignals: {
        relevance: 'HIGH',
        commercialIntent: true,
        intentCategory: 'PURCHASE',
        // MEDIUM, not HIGH: the scorer adds 15 for a HIGH fit, which would cap this fixture
        // at 100/CRITICAL and stop it exercising the ENGAGE/HIGH band.
        businessFit: 'MEDIUM',
        businessContextAvailable: true,
      },
      reasons: ['Strong intent detected'],
      ...result,
    })),
  };
}

const mockPrisma = {
  auroraDecision: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  domainEventLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(async (cb) => {
    return cb(mockPrisma);
  }),
} as unknown as PrismaClient;

describe('AuroraService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-08-07T12:00:00Z'));
  });

  it('should skip evaluation if decision already exists for the policy version', async () => {
    vi.mocked(mockPrisma.auroraDecision.findUnique).mockResolvedValueOnce({} as any);

    const service = new AuroraService(
      mockPrisma,
      new DeterministicScorer(),
      stubClassifier(),
      new CanonicalPolicyScorer()
    );

    const context = {
      opportunityId: 'opp-1',
      sourceEventId: 'evt-1',
      policyVersion: 'v1',
      text: 'Test context',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
    };

    await service.evaluate(context);

    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('should evaluate and persist decision and outbox event in the same transaction', async () => {
    vi.mocked(mockPrisma.auroraDecision.findUnique).mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.auroraDecision.create).mockResolvedValueOnce({
      id: 'decision-1',
      opportunityId: 'opp-1',
      finalScore: 85,
      confidence: 0.85,
      priority: 'HIGH',
      recommendedAction: 'ENGAGE',
      reasons: ['Strong signals'],
    } as any);

    const service = new AuroraService(
      mockPrisma,
      new DeterministicScorer(), // Will not hard reject this input
      stubClassifier(),
      new CanonicalPolicyScorer() // Will score (50 + 20 + 20 = 90 -> ENGAGE/HIGH)
    );

    const context = {
      opportunityId: 'opp-1',
      sourceEventId: 'evt-1',
      policyVersion: 'v1',
      text: 'Need SEO services',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
      additionalData: { exactMatch: false } // No deterministic bonus
    };

    await service.evaluate(context);

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.auroraDecision.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        opportunityId: 'opp-1',
        sourceEventId: 'evt-1',
        evaluationStatus: 'LIVE',
        finalScore: 90,
        recommendedAction: 'ENGAGE',
        priority: 'HIGH',
      })
    }));

    expect(EventStore.writeOutbox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'aurora.opportunity.evaluated',
        payload: expect.objectContaining({
          decisionId: 'decision-1',
          opportunityId: 'opp-1',
          recommendedAction: 'ENGAGE',
          priority: 'HIGH',
        })
      }),
      mockPrisma
    );
  });

  it('should bypass semantic classifier on deterministic hard reject', async () => {
    vi.mocked(mockPrisma.auroraDecision.findUnique).mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.auroraDecision.create).mockResolvedValueOnce({
      id: 'decision-2',
      opportunityId: 'opp-2',
      finalScore: 0,
      confidence: 0.85,
      priority: 'LOW',
      recommendedAction: 'IGNORE',
      reasons: ['Hard reject triggered'],
    } as any);

    const semanticClassifier = stubClassifier();
    const classifySpy = vi.spyOn(semanticClassifier, 'classify');

    const service = new AuroraService(
      mockPrisma,
      new DeterministicScorer(), // Hard reject on casino
      semanticClassifier,
      new CanonicalPolicyScorer()
    );

    const context = {
      opportunityId: 'opp-2',
      sourceEventId: 'evt-2',
      policyVersion: 'v1',
      text: 'casino spam',
      source: 'twitter',
      discoveredAt: new Date().toISOString(),
    };

    await service.evaluate(context);

    expect(classifySpy).not.toHaveBeenCalled();
    expect(mockPrisma.auroraDecision.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        evaluationStatus: 'DETERMINISTIC_ONLY',
        recommendedAction: 'IGNORE',
      })
    }));
  });

  /**
   * THE SUPPRESSED-OPPORTUNITY REGRESSION.
   *
   * This previously asserted the opposite: that an unexpected failure still persisted a
   * synthetic score-0 / IGNORE decision and resolved normally. That combination is what made
   * a transient fault permanent — a resolved evaluate() marks the outbox row PROCESSED so it
   * never retries, and the persisted row then trips the idempotency guard on any future
   * attempt. A real lead was buried as IGNORE, indistinguishable from a considered verdict.
   */
  it('rethrows an unexpected failure instead of burying the lead as IGNORE', async () => {
    vi.mocked(mockPrisma.auroraDecision.findUnique).mockResolvedValueOnce(null);

    const deterministicScorer = new DeterministicScorer();
    vi.spyOn(deterministicScorer, 'score').mockRejectedValueOnce(new Error('Unexpected Database timeout'));

    const service = new AuroraService(
      mockPrisma,
      deterministicScorer,
      stubClassifier(),
      new CanonicalPolicyScorer()
    );

    const context = {
      opportunityId: 'opp-err',
      sourceEventId: 'evt-err',
      policyVersion: 'v1',
      text: 'Something',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
    };

    // Must reject: a resolved evaluate() is EventProcessor's signal to mark the event
    // PROCESSED, which is exactly what must not happen for a fault that deserves a retry.
    await expect(service.evaluate(context)).rejects.toThrow('Unexpected Database timeout');

    // And nothing may be written — a persisted decision would make the skip permanent via
    // the idempotency guard, so a later retry could never re-evaluate this opportunity.
    expect(mockPrisma.auroraDecision.create).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
