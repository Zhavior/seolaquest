import type { DomainEvent } from '../../core/events/DomainEvent'
import { EventDispatcher } from '../../core/events/EventDispatcher'
import { GamifyLedgerService } from '../GamifyLedgerService'

type LedgerEventConsumer = Pick<GamifyLedgerService, 'awardForEvent'>

export const GAMIFY_LEDGER_CONSUMER_KEY = 'gamify.ledger.v1'

/**
 * The events that mint XP.
 *
 * All three are outcomes: a signal the hunter acted on, a lead that converted,
 * and feedback that taught Aurora something. `opportunity.discovered` is
 * deliberately absent — discovery is what a paid scan produces, so paying for it
 * would reward spending credits rather than working the queue.
 */
export const GAMIFY_LEDGER_EVENTS = [
  'opportunity.engaged',
  'lead.converted',
  'aurora.feedback.recorded',
] as const

/**
 * Wires `GamifyLedgerService.awardForEvent` into the dispatcher.
 *
 * Without this the ledger was unreachable: every rule, eligibility check and
 * level curve existed and nothing ever called them, so a hunter could claim
 * leads all day and `GamifyProfile` would stay at zero. Quest *claims* paid out
 * through `awardQuestRewardInTransaction`; event-driven XP did not.
 */
export function registerGamifyLedgerConsumers(
  service: LedgerEventConsumer = new GamifyLedgerService()
): void {
  for (const eventType of GAMIFY_LEDGER_EVENTS) {
    EventDispatcher.register(
      eventType,
      GAMIFY_LEDGER_CONSUMER_KEY,
      async (event: DomainEvent<Record<string, unknown>>) => {
        await service.awardForEvent(event)
      }
    )
  }
}
