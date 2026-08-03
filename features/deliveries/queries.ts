import 'server-only'

import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { toDeliveryView } from './deliveryView'
import type { DeliveryListResult, DeliveryView } from './types'

const deliveryIdSchema = z.string().uuid()
const PAGE_SIZE = 20

const safeDeliverySelect = {
  id: true,
  leadId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
  durableJob: {
    select: {
      status: true,
      attempts: true,
      maxAttempts: true,
    },
  },
} satisfies Prisma.CrmExportDeliverySelect

export async function listCurrentUserDeliveries(cursor?: string): Promise<DeliveryListResult> {
  const user = await requireCurrentUser()
  const rows = await prisma.crmExportDelivery.findMany({
    where: { userId: user.id },
    select: safeDeliverySelect,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  })

  return {
    deliveries: rows.slice(0, PAGE_SIZE).map(toDeliveryView),
    hasMore: rows.length > PAGE_SIZE,
  }
}

export async function getCurrentUserDelivery(deliveryId: string): Promise<DeliveryView | null> {
  const user = await requireCurrentUser()
  const parsed = deliveryIdSchema.safeParse(deliveryId)
  if (!parsed.success) return null

  const row = await prisma.crmExportDelivery.findFirst({
    where: { id: parsed.data, userId: user.id },
    select: safeDeliverySelect,
  })

  return row ? toDeliveryView(row) : null
}

export async function getDeliveriesStatus(deliveryIds: string[]) {
  const user = await requireCurrentUser()
  const validIds = deliveryIds.filter(id => deliveryIdSchema.safeParse(id).success)
  if (validIds.length === 0) return []

  const rows = await prisma.crmExportDelivery.findMany({
    where: { id: { in: validIds }, userId: user.id },
    select: safeDeliverySelect,
    take: 50,
  })

  return rows.map(toDeliveryView)
}
