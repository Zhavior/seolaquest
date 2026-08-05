import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type QuestEventType =
  | 'quest_started'
  | 'enemy_spawned'
  | 'enemy_defeated'
  | 'loot_found'
  | 'mana_consumed'

export interface BaseQuestEvent {
  id: string
  type: QuestEventType
  timestamp: number
}

export interface QuestStartedEvent extends BaseQuestEvent {
  type: 'quest_started'
  runId: string
  biome: 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'
  scoutCount: number
}

export interface EnemySpawnedEvent extends BaseQuestEvent {
  type: 'enemy_spawned'
  enemyId: string
  name: string
  platform: 'reddit' | 'x' | 'linkedin'
  maxHp: number
  hp: number
  relevanceScore: number
}

export interface EnemyDefeatedEvent extends BaseQuestEvent {
  type: 'enemy_defeated'
  enemyId: string
  damage: number
  relevanceScore: number
}

export interface LootFoundEvent extends BaseQuestEvent {
  type: 'loot_found'
  enemyId?: string
  mpReward: number
  leadTitle: string
}

export interface ManaConsumedEvent extends BaseQuestEvent {
  type: 'mana_consumed'
  amount: number
  source: string
}

export type QuestEvent =
  | QuestStartedEvent
  | EnemySpawnedEvent
  | EnemyDefeatedEvent
  | LootFoundEvent
  | ManaConsumedEvent

export type QuestEventInput =
  | (Omit<QuestStartedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number })
  | (Omit<EnemySpawnedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number })
  | (Omit<EnemyDefeatedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number })
  | (Omit<LootFoundEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number })
  | (Omit<ManaConsumedEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number })

export interface ActiveExpeditionState {
  status: 'idle' | 'patrolling' | 'combat'
  biome: 'reddit-forest' | 'x-wastes' | 'linkedin-citadel'
  manaConsumptionPerScan: number
  logs: string[]
}

export interface QuestStoreState {
  queue: QuestEvent[]
  expedition: ActiveExpeditionState
  pushEvent: (event: QuestEventInput) => void
  popEvent: () => QuestEvent | undefined
  clearEvents: () => void
  addLog: (logMessage: string) => void
  setExpeditionStatus: (status: 'idle' | 'patrolling' | 'combat') => void
}

const MAX_QUEUE_SIZE = 50
const MAX_LOG_SIZE = 30

export const questStore = createStore<QuestStoreState>((set, get) => ({
  queue: [],
  expedition: {
    status: 'patrolling',
    biome: 'reddit-forest',
    manaConsumptionPerScan: 5,
    logs: [
      '⚔️ Expedition deployed to Reddit Forest',
      '🔍 Scouting active signals across target keywords...',
      '🛡️ Party standing by at central camp',
    ],
  },
  pushEvent: (rawEvent) => {
    const fullEvent: QuestEvent = {
      id: rawEvent.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: rawEvent.timestamp || Date.now(),
      ...rawEvent,
    } as QuestEvent

    set((state) => {
      // Safety Cap Buffer: Keep at max 50 events to prevent infinite queue backlogs
      const updatedQueue = [...state.queue, fullEvent]
      if (updatedQueue.length > MAX_QUEUE_SIZE) {
        updatedQueue.shift()
      }
      return { queue: updatedQueue }
    })
  },
  popEvent: () => {
    const queue = get().queue
    if (queue.length === 0) return undefined
    const [event, ...rest] = queue
    set({ queue: rest })
    return event
  },
  clearEvents: () => set({ queue: [] }),
  addLog: (logMessage) => {
    set((state) => {
      const logs = [logMessage, ...state.expedition.logs].slice(0, MAX_LOG_SIZE)
      return {
        expedition: {
          ...state.expedition,
          logs,
        },
      }
    })
  },
  setExpeditionStatus: (status) => {
    set((state) => ({
      expedition: {
        ...state.expedition,
        status,
      },
    }))
  },
}))

// React hook wrapper for components that need to read store state reactively (e.g. Micro-UI log ticker)
export function useQuestStore<T>(selector: (state: QuestStoreState) => T): T {
  return useStore(questStore, selector)
}

/**
 * Dispatcher helper functions for triggering canvas simulation events
 */
export function triggerDemoScanSequence() {
  const store = questStore.getState()
  const runId = `run_${Date.now()}`

  store.pushEvent({
    type: 'quest_started',
    runId,
    biome: 'reddit-forest',
    scoutCount: 3,
  })
  store.addLog('🚀 Scan initialized: Party pathfinding across Reddit Forest...')

  setTimeout(() => {
    store.pushEvent({
      type: 'mana_consumed',
      amount: 5,
      source: 'Keyword Radar Pulse',
    })
    store.addLog('⚡ 5 Mana consumed for deep signal pulse')
  }, 1000)

  setTimeout(() => {
    const enemyId = `wolf_${Date.now()}`
    store.pushEvent({
      type: 'enemy_spawned',
      enemyId,
      name: 'Reddit Thread Wolf',
      platform: 'reddit',
      maxHp: 200,
      hp: 200,
      relevanceScore: 94,
    })
    store.addLog('🐺 Target Identified: Reddit Thread Wolf [94% Relevance]')
  }, 2200)

  setTimeout(() => {
    const enemyId = `wolf_${Date.now()}`
    store.pushEvent({
      type: 'enemy_defeated',
      enemyId,
      damage: 124,
      relevanceScore: 94,
    })
    store.pushEvent({
      type: 'loot_found',
      enemyId,
      mpReward: 10,
      leadTitle: 'Qualified Lead: SaaS Automation Thread',
    })
    store.addLog('💥 Target Neutralized! -124 Relevance | 💎 +10 MP | Qualified Lead Acquired')
  }, 4200)
}
