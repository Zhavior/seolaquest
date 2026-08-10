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

  /**
   * Idempotently brings the stored catalog in line with a list of definitions.
   *
   * Only presentation and scheduling are updated in place. `type`, the event
   * binding, `target` and `rewardXp` are frozen for a published version because
   * `GamifyQuestAssignment` snapshots the target and reward at assignment time —
   * editing them here would leave hunters already on the quest chasing a bar the
   * catalog no longer describes, with no record of the change. Publish a new
   * `version` instead; existing assignments keep the terms they were issued
   * under and new ones pick up the new terms.
   */
  async syncDefinitions(definitions: CreateGamifyQuestDefinition[]) {
    const summary = { created: 0, updated: 0, unchanged: 0 }

    for (const input of definitions) {
      const definition = questDefinitionSchema.parse(input)
      if (!EventRegistry.get(definition.eventType, definition.eventVersion)) {
        throw new DomainError(
          `Quest event contract is not registered: ${definition.eventType}:v${definition.eventVersion}`,
          'UNREGISTERED_QUEST_EVENT'
        )
      }

      const existing = await this.db.gamifyQuest.findUnique({
        where: { code_version: { code: definition.code, version: definition.version } },
      })

      if (!existing) {
        await this.db.gamifyQuest.create({ data: definition })
        summary.created += 1
        continue
      }

      const frozen: Array<[string, unknown, unknown]> = [
        ['type', existing.type, definition.type],
        ['eventType', existing.eventType, definition.eventType],
        ['eventVersion', existing.eventVersion, definition.eventVersion],
        ['target', existing.target, definition.target],
        ['rewardXp', existing.rewardXp, definition.rewardXp],
      ]
      const drifted = frozen.filter(([, stored, incoming]) => stored !== incoming)
      if (drifted.length > 0) {
        throw new DomainError(
          `Quest ${definition.code}:v${definition.version} changes frozen terms (${drifted
            .map(([field]) => field)
            .join(', ')}); publish a new version instead`,
          'QUEST_TERMS_FROZEN'
        )
      }

      const mutable = {
        title: definition.title,
        description: definition.description,
        enabled: definition.enabled,
        startsAt: definition.startsAt ?? null,
        endsAt: definition.endsAt ?? null,
      }
      const changed =
        existing.title !== mutable.title ||
        existing.description !== mutable.description ||
        existing.enabled !== mutable.enabled ||
        existing.startsAt?.getTime() !== mutable.startsAt?.getTime() ||
        existing.endsAt?.getTime() !== mutable.endsAt?.getTime()

      if (!changed) {
        summary.unchanged += 1
        continue
      }

      await this.db.gamifyQuest.update({ where: { id: existing.id }, data: mutable })
      summary.updated += 1
    }

    return summary
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
