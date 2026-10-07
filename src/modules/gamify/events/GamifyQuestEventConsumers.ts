import type { DomainEvent } from '../../core/events/DomainEvent'
import { EventDispatcher } from '../../core/events/EventDispatcher'
import { DomainError } from '../../core/infrastructure/errors'
import { GamifyEnrollmentService } from '../GamifyEnrollmentService'
import { GamifyQuestService } from '../GamifyQuestService'
import { GAMIFY_QUEST_PROGRESS_EVENTS } from '../questTypes'

type QuestEventConsumer = Pick<GamifyQuestService, 'contributeForEvent'>

export const GAMIFY_QUEST_CONSUMER_KEY = 'gamify.quest-progress.v1'

export function registerGamifyQuestConsumers(
  service: QuestEventConsumer = new GamifyQuestService(),
  enrollment: Pick<GamifyEnrollmentService, 'ensureEnrolled'> = new GamifyEnrollmentService(),
): void {
  for (const eventType of GAMIFY_QUEST_PROGRESS_EVENTS) {
    EventDispatcher.register(
      eventType,
      GAMIFY_QUEST_CONSUMER_KEY,
      async (event: DomainEvent<Record<string, unknown>>) => {
        if (event.actorId === 'system' || event.actorId === 'aurora-engine' || event.source.startsWith('system.')) return
        const occurredAt = new Date(event.occurredAt)
        if (Number.isNaN(occurredAt.getTime())) throw new DomainError('Quest event has an invalid occurredAt timestamp', 'INVALID_EVENT_TIME')
        // Enrollment must precede contribution, including retries and delayed cycle events.
        await enrollment.ensureEnrolled(event.actorId, occurredAt)
        await service.contributeForEvent(event)
      }
    )
  }
}
