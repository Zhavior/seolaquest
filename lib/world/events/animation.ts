export type AnimationEvent =
  | {
      type: 'play_spawn'
      entityId: string
      occurredAt: string
      variant: 'smoke' | 'portal' | 'warp'
    }
  | {
      type: 'play_attack'
      actorId: string
      targetId: string
      occurredAt: string
      variant: 'slash' | 'bolt' | 'pulse'
    }
  | {
      type: 'play_hit'
      targetId: string
      occurredAt: string
      amount?: number
      crit?: boolean
    }
  | {
      type: 'play_loot_drop'
      lootId: string
      occurredAt: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
    }
  | {
      type: 'play_level_up'
      actorId: string
      occurredAt: string
      level: number
    }
