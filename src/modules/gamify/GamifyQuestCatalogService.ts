import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { EventRegistry } from '../core/events/EventRegistry'
import { DomainError } from '../core/infrastructure/errors'
import {
  GAMIFY_QUEST_PROGRESS_EVENTS,
  GAMIFY_QUEST_TYPES,
  type GamifyQuestProgressEvent,
} from './questTypes'

const questDefinitionSchema = z.object({
  code: z.string().trim().min(3).max(64).regex(/^[a-z0-9_]+$/),
  version: z.number().int().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  type: z.enum(GAMIFY_QUEST_TYPES),
  eventType: z.enum(GAMIFY_QUEST_PROGRESS_EVENTS),
  eventVersion: z.number().int().min(1).default(1),
  target: z.number().int().min(1),
  rewardXp: z.number().int().min(0),
  enabled: z.boolean().default(true),
  startsAt: z.date().nullable().optional(),
  endsAt: z.date().nullable().optional(),
}).refine(
  ({ startsAt, endsAt }) => !startsAt || !endsAt || startsAt < endsAt,
  { message: 'Quest startsAt must be before endsAt', path: ['endsAt'] }
)

export type CreateGamifyQuestDefinition = z.input<typeof questDefinitionSchema>

type QuestCatalogPrisma = Pick<PrismaClient, 'gamifyQuest'>

export class GamifyQuestCatalogService {
  constructor(private readonly db: QuestCatalogPrisma) {}

  async createDefinition(input: CreateGamifyQuestDefinition) {
    const definition = questDefinitionSchema.parse(input)
    if (!EventRegistry.get(definition.eventType, definition.eventVersion)) {
      throw new DomainError(
        `Quest event contract is not registered: ${definition.eventType}:v${definition.eventVersion}`,
        'UNREGISTERED_QUEST_EVENT'
      )
    }

    return this.db.gamifyQuest.create({ data: definition })
  }

  async setEnabled(id: string, enabled: boolean) {
    return this.db.gamifyQuest.update({ where: { id }, data: { enabled } })
  }

  async listActive(at = new Date(), eventType?: GamifyQuestProgressEvent) {
    return this.db.gamifyQuest.findMany({
      where: {
        enabled: true,
        ...(eventType ? { eventType } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: at } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: at } }] },
        ],
      },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
    })
  }
}
