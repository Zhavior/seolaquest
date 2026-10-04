import { GAMIFY_QUEST_CATALOG } from '@/src/modules/gamify/questCatalog'

/** Quest catalog view for the public site, read from the product's own catalog. */
export type QuestView = {
  code: string
  title: string
  description: string
  cadence: string
  target: number
  rewardXp: number
  live: boolean
}

const CADENCE: Record<string, string> = {
  ONBOARDING: 'Once',
  DAILY: 'Daily, UTC',
  WEEKLY: 'Weekly, UTC',
  MILESTONE: 'Lifetime',
  AURORA: 'Aurora',
}

export function questViews(): QuestView[] {
  return GAMIFY_QUEST_CATALOG.map((quest) => ({
    code: quest.code,
    title: quest.title,
    description: quest.description ?? '',
    cadence: CADENCE[quest.type] ?? quest.type,
    target: quest.target,
    rewardXp: quest.rewardXp,
    live: quest.enabled !== false,
  }))
}
