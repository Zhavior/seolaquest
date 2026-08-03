import 'server-only'

import prisma from '@/lib/prisma'

const UTC_TIME_ZONES = new Set(['UTC', 'Etc/UTC', 'GMT'])

export function isDatabaseSessionUtc(timeZone: string | undefined) {
  return Boolean(timeZone && UTC_TIME_ZONES.has(timeZone))
}

export class DatabaseTimeZoneError extends Error {
  constructor() {
    super('Database session time zone must be UTC')
    this.name = 'DatabaseTimeZoneError'
  }
}

export async function assertDatabaseSessionUtc() {
  const [row] = await prisma.$queryRaw<Array<{ timeZone: string }>>`
    SELECT current_setting('TimeZone') AS "timeZone"
  `
  if (!isDatabaseSessionUtc(row?.timeZone)) throw new DatabaseTimeZoneError()
  return row.timeZone
}
