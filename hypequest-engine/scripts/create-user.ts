import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@hypequest.com' },
    update: {
      name: 'Dragon Slayer Overlord 🐉',
      subscriptionTier: 'ENTERPRISE_OVERLORD',
      questsRemaining: 100000,
      maxCredits: 100000,
      xpMultiplier: 3.0,
      level: 99,
      xp: 99999,
      unlockedTheme: 'OBSIDIAN_DRAGON'
    },
    create: {
      email: 'admin@hypequest.com',
      name: 'Dragon Slayer Overlord 🐉',
      subscriptionTier: 'ENTERPRISE_OVERLORD',
      questsRemaining: 100000,
      maxCredits: 100000,
      xpMultiplier: 3.0,
      level: 99,
      xp: 99999,
      unlockedTheme: 'OBSIDIAN_DRAGON'
    }
  })

  console.log('🐉 ENTERPRISE OVERLORD ACCOUNT CREATED!')
  console.log('User Details:', user)
}

main()
  .catch((e) => {
    console.error('❌ Failed to create Enterprise account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
