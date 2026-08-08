import { EventDispatcher } from '../../core/events/EventDispatcher';
import { OpportunityDiscoveredPayloadSchema } from '../../core/events/EventRegistry';
import { DomainEvent } from '../../core/events/DomainEvent';
import { AuroraService } from '../AuroraService';
import { PrismaClient } from '@prisma/client';
import { DeterministicScorer } from '../classifiers/DeterministicScorer';
import { GeminiSemanticClassifier } from '../classifiers/GeminiSemanticClassifier';
import { CanonicalPolicyScorer } from '../classifiers/CanonicalPolicyScorer';

// Note: In a real app, this Prisma instance would be injected via a DI container.
const prisma = new PrismaClient();
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
