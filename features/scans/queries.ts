import 'server-only'

import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { requireCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ScanRunService } from '@/src/modules/leads/application/ScanRunService'
import { aggregateProviderAttempts } from '@/src/modules/leads/domain/providerTruth'
import { toScanRunView } from './scanView'
import type { ScanRunListResult, ScanRunView } from './types'

const scanRunIdSchema = z.string().uuid()
const PAGE_SIZE = 20

const safeScanListSelect = {
  id: true,
  status: true,
  trigger: true,
  leadsCreated: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  providerAttempts: {
    select: {
      provider: true,
      outcome: true,
      resultCount: true,
      insertedCount: true,
      rateLimitResetAt: true,
    },
  },
} satisfies Prisma.ScanRunSelect

const safeScanMetadataSelect = {
  id: true,
  trigger: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ScanRunSelect

export async function listCurrentUserScanRuns(cursor?: string): Promise<ScanRunListResult> {
  const user = await requireCurrentUser()
  const rows = await prisma.scanRun.findMany({
    where: { userId: user.id },
    select: safeScanListSelect,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  })

  return {
    runs: rows.slice(0, PAGE_SIZE).map((row) => {
      const provider = aggregateProviderAttempts(row.providerAttempts)
      return toScanRunView({
        id: row.id,
        status: row.status,
        trigger: row.trigger,
        providerStatus: provider.status,
        counts: {
          leadsCreated: row.leadsCreated,
          providerAttempts: row.providerAttempts.length,
          providerResults: row.providerAttempts.reduce(
            (total, attempt) => total + attempt.resultCount,
            0,
          ),
        },
        refunded: row.status === 'FAILED_REFUNDED',
        errorCode: null,
        balance: null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      })
    }),
    hasMore: rows.length > PAGE_SIZE,
  }
}

export async function getCurrentUserScanRun(scanRunId: string): Promise<ScanRunView | null> {
  const user = await requireCurrentUser()
  const parsed = scanRunIdSchema.safeParse(scanRunId)
  if (!parsed.success) return null

  const [status, metadata] = await Promise.all([
    ScanRunService.getStatus(user.id, parsed.data),
    prisma.scanRun.findFirst({
      where: { id: parsed.data, userId: user.id },
      select: safeScanMetadataSelect,
    }),
  ])
  if (!status || !metadata) return null

  return toScanRunView({
    id: status.id,
    status: status.status,
    trigger: metadata.trigger,
    providerStatus: status.provider.status,
    counts: status.counts,
    refunded: status.refunded,
    errorCode: status.errorCode,
    balance: status.balance,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    completedAt: status.completedAt,
  })
}

export async function getScanRunsStatus(runIds: string[]) {
  const user = await requireCurrentUser()
  const validIds = runIds.filter(id => scanRunIdSchema.safeParse(id).success)
  if (validIds.length === 0) return []

  const rows = await prisma.scanRun.findMany({
    where: { id: { in: validIds }, userId: user.id },
    select: safeScanListSelect,
    take: 50,
  })

  return rows.map(row => {
    const provider = aggregateProviderAttempts(row.providerAttempts)
    return {
      id: row.id,
      status: row.status,
      statusMessage: toScanRunView({
        id: row.id,
        status: row.status,
        trigger: row.trigger,
        providerStatus: provider.status,
        counts: {
          leadsCreated: row.leadsCreated,
          providerAttempts: row.providerAttempts.length,
          providerResults: row.providerAttempts.reduce((t, a) => t + a.resultCount, 0),
        },
        refunded: row.status === 'FAILED_REFUNDED',
        errorCode: null,
        balance: null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      }).statusMessage,
      providerSummary: toScanRunView({
        id: row.id,
        status: row.status,
        trigger: row.trigger,
        providerStatus: provider.status,
        counts: {
          leadsCreated: row.leadsCreated,
          providerAttempts: row.providerAttempts.length,
          providerResults: row.providerAttempts.reduce((t, a) => t + a.resultCount, 0),
        },
        refunded: row.status === 'FAILED_REFUNDED',
        errorCode: null,
        balance: null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      }).providerSummary,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
      counts: {
        leadsCreated: row.leadsCreated,
        providerAttempts: row.providerAttempts.length,
        providerResults: row.providerAttempts.reduce((t, a) => t + a.resultCount, 0),
      }
    }
  })
}
