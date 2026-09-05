import { detectBuyerIntentNoise } from './buyerIntentNoise';
import { AuroraEvaluationContext, DeterministicScorerResult } from '../types';

export class DeterministicScorer {
  async score(context: AuroraEvaluationContext): Promise<DeterministicScorerResult> {
    const signals: Record<string, unknown> = {};
    const hardRejectReasons: string[] = [];

    // Example rules based on context.additionalData or text
    const textLower = context.text.toLowerCase();

    // 1. Recency check (example)
    if (typeof context.additionalData?.ageDays === 'number' && context.additionalData.ageDays > 30) {
      hardRejectReasons.push('OPPORTUNITY_TOO_OLD');
    }

    // 2. Known noise check
    const blocklist = ['casino', 'spam', 'buy followers'];
    for (const term of blocklist) {
      if (textLower.includes(term)) {
        hardRejectReasons.push('KNOWN_NOISE');
        break;
      }
    }

    // 3. Pre-scoring buyer-intent exclusions (trading / jobs / promo)
    const buyerNoise = detectBuyerIntentNoise(context.text);
    if (buyerNoise) {
      hardRejectReasons.push(buyerNoise.reason);
    }

    // Signals populated deterministically
    signals.exactMatch = context.additionalData?.exactMatch || false;
    signals.sourceQuality = context.additionalData?.sourceQuality || 'UNKNOWN';

    return {
      hardReject: hardRejectReasons.length > 0,
      hardRejectReasons,
      signals,
    };
  }
}
