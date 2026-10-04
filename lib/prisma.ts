import 'server-only'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const requestClients = new WeakMap<object, PrismaClient>()

function createClient() {
  return new PrismaClient({
    adapter: new PrismaPg(new Pool({
      connectionString: process.env.DATABASE_URL,
      maxUses: process.env.NODE_ENV === 'production' ? 1 : Infinity,
    })),
  })
}

function currentClient() {
  let context: object | undefined
  try {
    // OpenNext stores this in AsyncLocalStorage for the full Worker request,
    // including streamed rendering, actions and background work.
    context = getCloudflareContext().ctx
  } catch {
    // Node CLI / next start have no Worker request context.
  }
  if (!context) return globalForPrisma.prisma ??= createClient()
  let client = requestClients.get(context)
  if (!client) {
    client = createClient()
    requestClients.set(context, client)
  }
  return client
}

// Existing services resolve their client at use time; transactions retain the
// concrete client they started with. Never share a pg pool across Worker requests.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = currentClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
