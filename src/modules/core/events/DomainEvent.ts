import { z } from 'zod'

export interface DomainEvent<T = Record<string, unknown>> {
  id: string // UUID v4
  type: string // Canonical event type name (e.g. "opportunity.discovered")
  version: number // Schema version (e.g. 1)
  actorId: string // Tenant / user context
  organizationId?: string // Optional organization context
  occurredAt: string // ISO 8601 string timestamp
  source: string // Originating module name (e.g. "leads.scan_service")
  correlationId: string // Unique workflow tracing ID
  causationId?: string // Parent event ID that caused this event
  idempotencyKey: string // Unique deduplication key
  payload: T // Strictly typed event payload
  metadata?: Record<string, unknown> // Optional operational metadata
}

export const domainEventSchema = z.object({
  id: z.string().uuid('Event id must be a valid UUID v4'),
  type: z.string().min(3).regex(/^[a-z0-9_\-\.]+$/, 'Event type must be dot/hyphen/underscore-separated lowercase'),
  version: z.number().int().positive(),
  actorId: z.string().min(1, 'actorId must not be empty'),
  organizationId: z.string().optional(),
  occurredAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'occurredAt must be a valid ISO 8601 timestamp' }),
  source: z.string().min(1, 'source must not be empty'),
  correlationId: z.string().min(1, 'correlationId must not be empty'),
  causationId: z.string().optional(),
  idempotencyKey: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_\-\.\:]+$/, 'Idempotency key must be alphanumeric, hyphen, underscore, dot, or colon'),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
})

export type DomainEventSchema = typeof domainEventSchema
