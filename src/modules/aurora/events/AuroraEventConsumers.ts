import { EventDispatcher } from '../../core/events/EventDispatcher';
import { OpportunityDiscoveredPayloadSchema } from '../../core/events/EventRegistry';
import { DomainEvent } from '../../core/events/DomainEvent';
import { AuroraService } from '../AuroraService';
import prisma from '@/lib/prisma';
import { DeterministicScorer } from '../classifiers/DeterministicScorer';
import { GeminiSemanticClassifier } from '../classifiers/GeminiSemanticClassifier';
import { CanonicalPolicyScorer } from '../classifiers/CanonicalPolicyScorer';

// Uses the shared Prisma singleton. Instantiating a second PrismaClient here would
// open an additional connection pool on every serverless cold start.
const auroraService = new AuroraService(
  prisma,
  new DeterministicScorer(),
  new GeminiSemanticClassifier(),
  new CanonicalPolicyScorer()
);

export function registerAuroraConsumers() {
  EventDispatcher.register(
    'opportunity.discovered',
    'aurora-decision-engine',
    async (event: DomainEvent<Record<string, unknown>>) => {
      const payload = OpportunityDiscoveredPayloadSchema.parse(event.payload);

      const discoveredAt = payload.sourceCreatedAt || new Date().toISOString();

      /**
       * The signals `DeterministicScorer` actually reads.
       *
       * It looks for `ageDays`, `exactMatch` and `sourceQuality` on `additionalData`, and
       * this consumer supplied none of them — so in production every decision defaulted to
       * `exactMatch: false`, `sourceQuality: 'UNKNOWN'`, and the recency hard-reject could
       * never fire. The deterministic half of Aurora was a no-op that still looked like it
       * had run, which is worse than it being absent: the scorer's output is what the
       * FALLBACK path leans on when the classifier cannot answer.
       */
      const sourceCreatedMs = Date.parse(discoveredAt);
      const ageDays = Number.isFinite(sourceCreatedMs)
        ? (Date.now() - sourceCreatedMs) / 86_400_000
        : undefined;

      // The scan pipeline only stores a lead when the provider matched the tracked phrase, so
      // an exact substring hit is a genuine "the author used these words" signal rather than
      // a fuzzy one.
      const exactMatch = payload.content.toLowerCase().includes(payload.keywordPhrase.toLowerCase());

      await auroraService.evaluate({
        opportunityId: payload.opportunityId,
        sourceEventId: event.id,
        policyVersion: 'v1', // This could be dynamically configured
        text: payload.content,
        source: payload.platform,
        discoveredAt,
        additionalData: {
          // Carried so the semantic classifier can meter its spend against the tenant that
          // owns the lead; the outbox worker has no session to derive one from.
          userId: payload.userId,
          leadId: payload.leadId,
          keywordId: payload.keywordId,
          keywordPhrase: payload.keywordPhrase,
          platform: payload.platform,
          externalPostId: payload.externalPostId,
          author: payload.author,
          url: payload.url,
          ...(ageDays === undefined ? {} : { ageDays }),
          exactMatch,
          // Every enabled provider is a public social feed today, so there is no basis to
          // rank one above another yet. Left explicit rather than absent so the scorer's
          // default stops being indistinguishable from "nobody supplied this".
          sourceQuality: 'UNKNOWN',
        }
      });
    }
  );
}
