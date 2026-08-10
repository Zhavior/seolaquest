import 'server-only'

import { registerAuroraConsumers } from '@/src/modules/aurora/events/AuroraEventConsumers'
import { registerGamifyLedgerConsumers } from '@/src/modules/gamify/events/GamifyLedgerEventConsumers'
import { registerGamifyQuestConsumers } from '@/src/modules/gamify/events/GamifyQuestEventConsumers'

/*
 * EventDispatcher's consumer map is process-global static state, so registration
 * has to happen once per process and be safe to attempt again on every warm
 * invocation. EventDispatcher.register already warns-and-returns on a duplicate
 * consumerKey, so a repeat call is correct but not free — it re-walks every
 * registered event type and emits a warn per duplicate. This module-level guard
 * makes the repeat call a single boolean read instead.
 */
let registered = false

/**
 * Registers every domain event consumer in the process.
 *
 * MUST be called before anything drains the DomainEventLog outbox:
 * EventProcessor.processEvent marks an event PROCESSED when its type has zero
 * registered consumers, so a drain against an empty dispatcher destroys events
 * with a clean audit trail and no error signal.
 */
export function registerAllEventConsumers(): void {
  if (registered) return

  registerAuroraConsumers()
  registerGamifyQuestConsumers()
  registerGamifyLedgerConsumers()

  registered = true
}

/**
 * Test-only escape hatch. Pairs with EventDispatcher.clearAll(), which drops the
 * dispatcher's map but cannot reach this module's guard.
 */
export function resetEventConsumerRegistrationForTests(): void {
  registered = false
}
