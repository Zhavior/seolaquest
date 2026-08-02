import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
  throw new Error('Refusing to create a development enterprise account in production.')
}

if (process.env.ALLOW_DEV_ENTERPRISE_SEED !== 'true') {
  throw new Error('Set ALLOW_DEV_ENTERPRISE_SEED=true to run this development-only script.')
}

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@coquest.com' },
    update: {
      name: 'Local Development User',
    },
    create: {
      email: 'admin@coquest.com',
      name: 'Local Development User',
    }
  })

  console.log(`Development user ready: ${user.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Failed to create Enterprise account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
