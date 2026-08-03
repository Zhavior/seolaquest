import type { BusinessEvent } from '@/lib/world/events/business'
import type { WorldEvent } from '@/lib/world/events/world'

type WorldBiome = Extract<WorldEvent, { biome: unknown }>["biome"]

const sourceToBiome: Record<string, WorldBiome> = {
  reddit: 'reddit-forest',
  x: 'x-wastes',
  linkedin: 'linkedin-citadel',
}

function normalizeBiome(source: string): 'reddit-forest' | 'x-wastes' | 'linkedin-citadel' {
  return sourceToBiome[source.toLowerCase()] ?? 'reddit-forest'
}

function qualityToRarity(
  quality: 'low' | 'medium' | 'high' | 'mythic'
): 'common' | 'rare' | 'epic' | 'legendary' {
  switch (quality) {
    case 'low':
      return 'common'
    case 'medium':
      return 'rare'
    case 'high':
      return 'epic'
    case 'mythic':
      return 'legendary'
  }
}

export function mapBusinessEventToWorldEvents(event: BusinessEvent): WorldEvent[] {
  switch (event.type) {
    case 'scan_started':
      return [
        {
          type: 'expedition_started',
          runId: event.scanId,
          occurredAt: event.startedAt,
          biome: normalizeBiome(event.source),
          scoutCount: Math.max(1, event.keywordCount),
        },
      ]

    case 'post_discovered':
      return [
        {
          type: 'encounter_spawned',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          encounterId: event.postId,
          biome: normalizeBiome(event.source),
          threatTier: 'common',
        },
      ]

    case 'post_analyzed':
      return [
        {
          type: 'encounter_resolved',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          encounterId: event.postId,
          outcome: event.relevanceScore >= 70 ? 'defeated' : event.relevanceScore >= 40 ? 'damaged' : 'ignored',
          relevanceScore: event.relevanceScore,
        },
      ]

    case 'lead_qualified': {
      const xpAmount = event.quality === 'mythic' ? 40 : event.quality === 'high' ? 25 : event.quality === 'medium' ? 15 : 8
      const goldAmount =
        event.revenueBand === 'enterprise' ? 50 : event.revenueBand === 'mid' ? 25 : 10

      return [
        {
          type: 'loot_spawned',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          lootId: event.leadId,
          rarity: qualityToRarity(event.quality),
          sourceLeadId: event.leadId,
        },
        {
          type: 'xp_gained',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          amount: xpAmount,
          reason: 'qualification',
        },
        {
          type: 'gold_gained',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          amount: goldAmount,
          reason: 'lead_value',
        },
      ]
    }

    case 'crm_delivery_created':
      return [
        {
          type: 'gold_gained',
          runId: event.scanId,
          occurredAt: event.occurredAt,
          amount: 15,
          reason: 'delivery',
        },
      ]

    case 'scan_finished':
      return [
        {
          type: 'xp_gained',
          runId: event.scanId,
          occurredAt: event.finishedAt,
          amount: Math.max(10, event.qualifiedCount * 5),
          reason: 'scan_completion',
        },
        {
          type: 'expedition_finished',
          runId: event.scanId,
          occurredAt: event.finishedAt,
          qualifiedCount: event.qualifiedCount,
          deliveredCount: event.deliveredCount,
        },
      ]

    case 'source_connected':
      return []
  }
}
