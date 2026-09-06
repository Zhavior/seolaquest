import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg(new Pool({
    connectionString: process.env.DATABASE_URL,
    maxUses: process.env.NODE_ENV === 'production' ? 1 : Infinity,
  })),
})


if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
