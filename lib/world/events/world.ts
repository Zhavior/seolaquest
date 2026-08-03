export type WorldEvent =
  | {
      type: 'expedition_started'
      runId: string
      occurredAt: string
      biome: 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'
      scoutCount: number
    }
  | {
      type: 'encounter_spawned'
      runId: string
      occurredAt: string
      encounterId: string
      biome: 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'
      threatTier: 'common' | 'elite' | 'boss'
    }
  | {
      type: 'encounter_resolved'
      runId: string
      occurredAt: string
      encounterId: string
      outcome: 'ignored' | 'damaged' | 'defeated'
      relevanceScore?: number
    }
  | {
      type: 'loot_spawned'
      runId: string
      occurredAt: string
      lootId: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      sourceLeadId?: string
    }
  | {
      type: 'xp_gained'
      runId: string
      occurredAt: string
      amount: number
      reason: 'qualification' | 'delivery' | 'scan_completion'
    }
  | {
      type: 'gold_gained'
      runId: string
      occurredAt: string
      amount: number
      reason: 'lead_value' | 'delivery'
    }
  | {
      type: 'expedition_finished'
      runId: string
      occurredAt: string
      qualifiedCount: number
      deliveredCount: number
    }
