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

      await auroraService.evaluate({
        opportunityId: payload.opportunityId,
        sourceEventId: event.id,
        policyVersion: 'v1', // This could be dynamically configured
        text: payload.content,
        source: payload.platform,
        discoveredAt: payload.sourceCreatedAt || new Date().toISOString(),
        additionalData: {
          leadId: payload.leadId,
          keywordId: payload.keywordId,
          keywordPhrase: payload.keywordPhrase,
          externalPostId: payload.externalPostId,
          author: payload.author,
          url: payload.url,
        }
      });
    }
  );
}
