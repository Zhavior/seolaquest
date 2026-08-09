import {
  AuroraSemanticResult,
  CanonicalPolicyResult,
  DeterministicScorerResult,
  Priority,
  RecommendedAction,
} from '../types';

export class CanonicalPolicyScorer {
  score(
    deterministic: DeterministicScorerResult,
    semantic?: AuroraSemanticResult
  ): CanonicalPolicyResult {
    // If hard reject, bypass all and return immediate ignore
    if (deterministic.hardReject) {
      return {
        finalScore: 0,
        confidence: 1.0,
        priority: 'LOW',
        recommendedAction: 'IGNORE',
        canonicalReasons: deterministic.hardRejectReasons,
      };
    }

    let finalScore = 50; // Base score
    const canonicalReasons: string[] = [];

    // Apply deterministic modifiers
    if (deterministic.signals.exactMatch) {
      finalScore += 20;
      canonicalReasons.push('EXACT_MATCH');
    }
    if (deterministic.signals.sourceQuality === 'HIGH') {
      finalScore += 10;
      canonicalReasons.push('HIGH_QUALITY_SOURCE');
    }

    // Apply semantic modifiers
    if (semantic) {
      if (semantic.semanticSignals?.relevance === 'HIGH') finalScore += 20;
      if (semantic.semanticSignals?.commercialIntent === true) {
        finalScore += 20;
        canonicalReasons.push('STRONG_COMMERCIAL_INTENT');
      }
      if (semantic.semanticSignals?.businessFit === 'HIGH') finalScore += 15;

      if (semantic.semanticSignals?.relevance === 'LOW') {
        finalScore -= 50;
      }

      canonicalReasons.push(...semantic.reasons);
    }

    // Cap score at 100
    finalScore = Math.max(0, Math.min(100, finalScore));

    let canonicalConfidence = 0;

    if (!semantic) {
      // DETERMINISTIC_ONLY: We skipped semantic purposefully (or hard reject, handled above).
      // Since it wasn't a hard reject, maybe we skipped it because deterministic was enough.
      canonicalConfidence = 0.8;
    } else if (semantic.failureCode) {
      // FALLBACK: Semantic failed. We have some deterministic evidence, so we aren't completely blind.
      // Base fallback confidence.
      canonicalConfidence = 0.4;
      if (deterministic.signals.exactMatch) canonicalConfidence += 0.2;
      if (deterministic.signals.sourceQuality === 'HIGH') canonicalConfidence += 0.1;
    } else {
      // LIVE: Semantic succeeded.
      canonicalConfidence = semantic.confidence;
    }

    // Cap confidence between 0 and 1
    canonicalConfidence = Math.max(0, Math.min(1.0, canonicalConfidence));

    // Determine Action & Priority
    let recommendedAction: RecommendedAction = 'WATCH';
    let priority: Priority = 'MEDIUM';

    if (finalScore >= 80) {
      recommendedAction = 'ENGAGE';
      priority = finalScore >= 95 ? 'CRITICAL' : 'HIGH';
    } else if (finalScore < 40) {
      recommendedAction = 'IGNORE';
      priority = 'LOW';
    }

    return {
      finalScore,
      confidence: canonicalConfidence,
      priority,
      recommendedAction,
      canonicalReasons,
    };
  }
}
