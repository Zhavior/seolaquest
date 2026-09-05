import { describe, expect, it } from 'vitest';
import { CanonicalPolicyScorer } from '../CanonicalPolicyScorer';
import { DeterministicScorerResult, AuroraSemanticResult } from '../../types';

describe('CanonicalPolicyScorer', () => {
  it('should immediately ignore on hard reject', () => {
    const scorer = new CanonicalPolicyScorer();
    const deterministic: DeterministicScorerResult = {
      hardReject: true,
      hardRejectReasons: ['KNOWN_NOISE'],
      signals: {}
    };

    const result = scorer.score(deterministic);
    expect(result.finalScore).toBe(0);
    expect(result.confidence).toBe(1.0); // Hard reject is 100% confident
    expect(result.recommendedAction).toBe('IGNORE');
    expect(result.priority).toBe('LOW');
    expect(result.canonicalReasons).toContain('KNOWN_NOISE');
  });

  it('does not promote deterministic-only keyword matches', () => {
    const scorer = new CanonicalPolicyScorer();
    const deterministic: DeterministicScorerResult = {
      hardReject: false,
      hardRejectReasons: [],
      signals: { exactMatch: true, sourceQuality: 'HIGH' } // +20, +10 = 80
    };

    // No semantic input
    const result = scorer.score(deterministic);
    expect(result.finalScore).toBe(79);
    expect(result.confidence).toBe(0.8); // DETERMINISTIC_ONLY confidence
    expect(result.recommendedAction).toBe('WATCH');
    expect(result.priority).toBe('MEDIUM');
  });

  it('should evaluate boundaries for CRITICAL priority with semantic input', () => {
    const scorer = new CanonicalPolicyScorer();
    const deterministic: DeterministicScorerResult = {
      hardReject: false,
      hardRejectReasons: [],
      signals: { exactMatch: true, sourceQuality: 'HIGH' } // 80
    };

    const semantic: AuroraSemanticResult = {
      confidence: 0.9,
      semanticSignals: { relevance: 'HIGH', commercialIntent: true, businessFit: 'HIGH', businessContextAvailable: true }, // +20, +15 = 115 (capped at 100)
      reasons: ['Looks great']
    };

    const result = scorer.score(deterministic, semantic);
    expect(result.finalScore).toBe(100);
    expect(result.confidence).toBe(0.9); // LIVE semantic confidence
    expect(result.recommendedAction).toBe('ENGAGE');
    expect(result.priority).toBe('CRITICAL');
  });

  it('should drop score and recommend IGNORE if semantic signals are poor', () => {
    const scorer = new CanonicalPolicyScorer();
    const deterministic: DeterministicScorerResult = {
      hardReject: false,
      hardRejectReasons: [],
      signals: {} // 50
    };

    const semantic: AuroraSemanticResult = {
      confidence: 0.8,
      semanticSignals: { relevance: 'LOW', commercialIntent: false }, // -20 = 30
      reasons: ['Irrelevant']
    };

    const result = scorer.score(deterministic, semantic);
    expect(result.finalScore).toBe(0);
    expect(result.confidence).toBe(0.8); // LIVE semantic confidence
    expect(result.recommendedAction).toBe('IGNORE');
    expect(result.priority).toBe('LOW');
  });

  it('should assign fallback confidence when semantic evaluation fails', () => {
    const scorer = new CanonicalPolicyScorer();
    const deterministic: DeterministicScorerResult = {
      hardReject: false,
      hardRejectReasons: [],
      signals: { exactMatch: true, sourceQuality: 'UNKNOWN' } // +20 = 70
    };

    // Fallback semantic result
    const semantic: AuroraSemanticResult = {
      confidence: 0,
      semanticSignals: null,
      reasons: ['Classifier failed or timed out'],
      failureCode: 'PROVIDER_ERROR'
    };

    const result = scorer.score(deterministic, semantic);

    // Deterministic base (50) + exactMatch (20) = 70
    expect(result.finalScore).toBe(70);

    // FALLBACK confidence = base 0.4 + exactMatch 0.2 = 0.6
    expect(result.confidence).toBeCloseTo(0.6, 2);
    expect(result.recommendedAction).toBe('WATCH');
    expect(result.priority).toBe('MEDIUM');
  });
  it.each([
    { commercialIntent: false, relevance: 'HIGH', businessFit: 'HIGH', businessContextAvailable: true },
    { commercialIntent: true, relevance: 'HIGH', businessFit: 'HIGH', businessContextAvailable: false },
    { commercialIntent: true, relevance: 'HIGH', businessFit: 'LOW', businessContextAvailable: true },
  ])('does not turn relevance or invented business fit into buying evidence: %j', semanticSignals => {
    const result = new CanonicalPolicyScorer().score({ hardReject: false, hardRejectReasons: [], signals: { exactMatch: true } },
      { confidence: 0.95, semanticSignals, reasons: [] })
    expect(result.recommendedAction).toBe('WATCH')
    expect(result.finalScore).toBeLessThan(80)
  })

});
