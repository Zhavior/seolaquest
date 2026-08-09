import { describe, expect, it } from 'vitest';
import { DeterministicScorer } from '../DeterministicScorer';
import { AuroraEvaluationContext } from '../../types';

describe('DeterministicScorer', () => {
  it('should pass cleanly if no hard rules are violated', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-1',
      sourceEventId: 'evt-1',
      policyVersion: 'v1',
      text: 'Looking for a great SEO agency for my dental practice',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
      additionalData: { ageDays: 2, exactMatch: true, sourceQuality: 'HIGH' }
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(false);
    expect(result.hardRejectReasons).toHaveLength(0);
    expect(result.signals.exactMatch).toBe(true);
    expect(result.signals.sourceQuality).toBe('HIGH');
  });

  it('should hard reject based on recency', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-2',
      sourceEventId: 'evt-2',
      policyVersion: 'v1',
      text: 'Good prospect',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
      additionalData: { ageDays: 45 }
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(true);
    expect(result.hardRejectReasons).toContain('OPPORTUNITY_TOO_OLD');
  });

  it('should hard reject based on known noise', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-3',
      sourceEventId: 'evt-3',
      policyVersion: 'v1',
      text: 'Come to our casino and win big!',
      source: 'linkedin',
      discoveredAt: new Date().toISOString(),
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(true);
    expect(result.hardRejectReasons).toContain('KNOWN_NOISE');
  });
});
