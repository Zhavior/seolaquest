import { randomUUID } from 'node:crypto'
import { DomainEvent, domainEventSchema } from './DomainEvent'
import { EventRegistry } from './EventRegistry'
import { ValidationError } from '@/src/modules/core/infrastructure/errors'

export interface CreateEventInput<T = Record<string, unknown>> {
  type: string
  version?: number
  actorId: string
  organizationId?: string
  source: string
  correlationId?: string
  causationId?: string
  idempotencyKey?: string
  payload: T
  metadata?: Record<string, unknown>
}

export class EventFactory {
  static create<T extends Record<string, unknown>>(input: CreateEventInput<T>): DomainEvent<T> {
    const version = input.version ?? 1
    const validatedPayload = EventRegistry.validatePayload(input.type, version, input.payload) as T

    const id = randomUUID()
    const occurredAt = new Date().toISOString()
    const correlationId = input.correlationId ?? id
    const idempotencyKey = input.idempotencyKey ?? `${input.type}:${input.actorId}:${correlationId}`

    const envelope: DomainEvent<T> = {
      id,
      type: input.type,
      version,
      actorId: input.actorId,
      organizationId: input.organizationId,
      occurredAt,
      source: input.source,
      correlationId,
      causationId: input.causationId,
      idempotencyKey,
      payload: validatedPayload,
      metadata: input.metadata,
    }

    const parseResult = domainEventSchema.safeParse(envelope)
    if (!parseResult.success) {
      throw new ValidationError(`DomainEvent envelope validation failed for '${input.type}'`, parseResult.error.issues)
    }

    return envelope
  }
}
