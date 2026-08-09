/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuroraService } from '../AuroraService';
import { DeterministicScorer } from '../classifiers/DeterministicScorer';
import { GeminiSemanticClassifier } from '../classifiers/GeminiSemanticClassifier';
import { CanonicalPolicyScorer } from '../classifiers/CanonicalPolicyScorer';
import { PrismaClient } from '@prisma/client';
import { EventStore } from '../../core/events/EventStore';

vi.mock('../../core/events/EventStore', () => ({
  EventStore: {
    writeOutbox: vi.fn(),
  }
}));

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
      new GeminiSemanticClassifier(),
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
      confidence: 100,
      priority: 'HIGH',
      recommendedAction: 'ENGAGE',
      reasons: ['Strong signals'],
    } as any);

    const service = new AuroraService(
      mockPrisma,
      new DeterministicScorer(), // Will not hard reject this input
      new GeminiSemanticClassifier(), // Will return confidence 0.85 and HIGH relevance
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
      confidence: 100,
      priority: 'LOW',
      recommendedAction: 'IGNORE',
      reasons: ['Hard reject triggered'],
    } as any);

    const semanticClassifier = new GeminiSemanticClassifier();
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

  it('should save UNAVAILABLE decision with 0 confidence on unexpected failure', async () => {
    vi.mocked(mockPrisma.auroraDecision.findUnique).mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.auroraDecision.create).mockResolvedValueOnce({
      id: 'decision-err',
      opportunityId: 'opp-err',
      finalScore: 0,
      confidence: 0,
      priority: 'LOW',
      recommendedAction: 'IGNORE',
      reasons: ['SYSTEM_UNAVAILABLE'],
    } as any);

    const deterministicScorer = new DeterministicScorer();
    vi.spyOn(deterministicScorer, 'score').mockRejectedValueOnce(new Error('Unexpected Database timeout'));

    const service = new AuroraService(
      mockPrisma,
      deterministicScorer,
      new GeminiSemanticClassifier(),
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

    await service.evaluate(context);

    expect(mockPrisma.auroraDecision.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        evaluationStatus: 'UNAVAILABLE',
        confidence: 0,
        finalScore: 0,
        recommendedAction: 'IGNORE',
      })
    }));
  });
});
