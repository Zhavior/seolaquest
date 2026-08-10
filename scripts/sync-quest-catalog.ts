import { PrismaClient } from '@prisma/client'
import { GamifyQuestCatalogService } from '../src/modules/gamify/GamifyQuestCatalogService'
import { GAMIFY_QUEST_CATALOG } from '../src/modules/gamify/questCatalog'

/**
 * Publishes the quest catalog.
 *
 * This is not `prisma db seed`, and it deliberately stays out of it: seeding in
 * this repo means fabricating user data, which SEOlaQuest refuses to do (see
 * prisma/seed.ts). Quest definitions are shipped configuration, not tenant data
 * — they own no rows a customer created, and the sync is idempotent, so running
 * it against production is a normal deploy step rather than a destructive one.
 */
const prisma = new PrismaClient()

async function main() {
  const catalog = new GamifyQuestCatalogService(prisma)
  const summary = await catalog.syncDefinitions(GAMIFY_QUEST_CATALOG)

  console.log(
    `Quest catalog synced: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged.`,
  )
}

main()
  .catch((error) => {
    console.error('❌ Quest catalog sync failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
