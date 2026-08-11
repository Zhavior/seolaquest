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

  it('hard rejects trading chatter matched via cashtag / AVWAP vocabulary', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-4',
      sourceEventId: 'evt-4',
      policyVersion: 'v1',
      text: '$CRM bounced perfectly from the AVWAP channel',
      source: 'x',
      discoveredAt: new Date().toISOString(),
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(true);
    expect(result.hardRejectReasons).toContain('TRADING_NOISE');
  });

  it('hard rejects job listing copy before semantic scoring', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-5',
      sourceEventId: 'evt-5',
      policyVersion: 'v1',
      text: 'HIRING Now — Job Title: Lead Generation Specialist. Salary: 90k. Location: Remote',
      source: 'x',
      discoveredAt: new Date().toISOString(),
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(true);
    expect(result.hardRejectReasons).toContain('JOB_LISTING');
  });

  it('does not hard reject a plain CRM buyer ask', async () => {
    const scorer = new DeterministicScorer();
    const context: AuroraEvaluationContext = {
      opportunityId: 'opp-6',
      sourceEventId: 'evt-6',
      policyVersion: 'v1',
      text: '#LOOKING FOR CRM for a small B2B team',
      source: 'x',
      discoveredAt: new Date().toISOString(),
    };

    const result = await scorer.score(context);
    expect(result.hardReject).toBe(false);
  });
});
