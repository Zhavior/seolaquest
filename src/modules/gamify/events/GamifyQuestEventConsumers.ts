import type { DomainEvent } from '../../core/events/DomainEvent'
import { EventDispatcher } from '../../core/events/EventDispatcher'
import { GamifyQuestService } from '../GamifyQuestService'
import { GAMIFY_QUEST_PROGRESS_EVENTS } from '../questTypes'

type QuestEventConsumer = Pick<GamifyQuestService, 'contributeForEvent'>

export const GAMIFY_QUEST_CONSUMER_KEY = 'gamify.quest-progress.v1'

export function registerGamifyQuestConsumers(service: QuestEventConsumer = new GamifyQuestService()): void {
  for (const eventType of GAMIFY_QUEST_PROGRESS_EVENTS) {
    EventDispatcher.register(
      eventType,
      GAMIFY_QUEST_CONSUMER_KEY,
      async (event: DomainEvent<Record<string, unknown>>) => {
        await service.contributeForEvent(event)
      }
    )
  }
}
