export const GAMIFY_QUEST_TYPES = [
  'ONBOARDING',
  'DAILY',
  'WEEKLY',
  'MILESTONE',
  'AURORA',
] as const

export type GamifyQuestType = (typeof GAMIFY_QUEST_TYPES)[number]

export const GAMIFY_QUEST_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'CLAIMED',
  'EXPIRED',
] as const

export type GamifyQuestStatus = (typeof GAMIFY_QUEST_STATUSES)[number]

export const GAMIFY_QUEST_PROGRESS_EVENTS = [
  'opportunity.engaged',
  'lead.converted',
  'aurora.feedback.recorded',
] as const

export type GamifyQuestProgressEvent = (typeof GAMIFY_QUEST_PROGRESS_EVENTS)[number]
