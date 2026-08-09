import { DomainEvent } from './DomainEvent'
import { logger } from '@/src/modules/core/infrastructure/logger'

export type EventHandler<T = Record<string, unknown>> = (event: DomainEvent<T>) => Promise<void>

export interface RegisteredConsumer {
  consumerKey: string
  handler: EventHandler
}

export class EventDispatcher {
  private static consumers = new Map<string, RegisteredConsumer[]>()

  /**
   * Registers a consumer function for a specific event type.
   */
  static register(eventType: string, consumerKey: string, handler: EventHandler): void {
    const existing = this.consumers.get(eventType) ?? []
    if (existing.some((c) => c.consumerKey === consumerKey)) {
      logger.warn(
        { eventType, consumerKey, outcomeCode: 'EVENT_CONSUMER_ALREADY_REGISTERED' },
        `Consumer key '${consumerKey}' is already registered for event type '${eventType}'`
      )
      return
    }
    existing.push({ consumerKey, handler })
    this.consumers.set(eventType, existing)
  }

  /**
   * Clears all registered handlers. Useful for isolated unit tests.
   */
  static clearAll(): void {
    this.consumers.clear()
  }

  /**
   * Retrieves all registered consumers for a given event type.
   */
  static getConsumers(eventType: string): RegisteredConsumer[] {
    return this.consumers.get(eventType) ?? []
  }
}
