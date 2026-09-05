import 'server-only'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { ScanSchedulerService } from '@/src/modules/leads/application/ScanSchedulerService'
import { requireAdmin } from './authorization'

export class AdminService {
  static async overview() {
    await requireAdmin()
    const since = new Date(Date.now() - 86400000)
    const [users, onboarded, activeSubscriptions, leads, outcomes, newUsers, enabledSchedules] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { onboardingComplete: true } }),
      prisma.billingSubscription.count({ where: { status: 'active', plan: { not: 'FREE' } } }),
      prisma.lead.count(), prisma.leadOutcome.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.tenantScanSchedule.count({ where: { enabled: true } }),
    ])
    return { users, onboarded, activeSubscriptions, leads, outcomes, newUsers, enabledSchedules }
  }

  static async users(search: string, page: number) {
    await requireAdmin()
    const query = z.string().trim().max(120).parse(search)
    const currentPage = z.number().int().min(1).max(10000).parse(page)
    const where = query ? { OR: [
      { email: { contains: query, mode: 'insensitive' as const } },
      { name: { contains: query, mode: 'insensitive' as const } },
    ] } : {}
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, skip: (currentPage - 1) * 25, take: 25,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: { id: true, name: true, email: true, createdAt: true, onboardingComplete: true,
          questsRemaining: true, billingSubscription: { select: { plan: true, status: true } },
          scanSchedule: { select: { enabled: true, lastCompletedAt: true } },
          _count: { select: { leads: true, keywords: true } } },
      }),
    ])
    return { users, total, page: currentPage }
  }

  static async operations() {
    await requireAdmin()
    const since = new Date(Date.now() - 86400000)
    const [jobs, providerAttempts, failedJobs, failedEvents, decisions, outcomes, audit] = await Promise.all([
      prisma.durableJob.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.providerScanAttempt.groupBy({ by: ['provider', 'outcome'], where: { requestedAt: { gte: since } }, _count: { _all: true } }),
      prisma.durableJob.findMany({ where: { status: 'DEAD' }, orderBy: { updatedAt: 'desc' }, take: 25,
        select: { id: true, kind: true, attempts: true, lastErrorCode: true, updatedAt: true } }),
      prisma.domainEventLog.findMany({ where: { status: 'FAILED' }, orderBy: { createdAt: 'desc' }, take: 25,
        select: { id: true, type: true, attempts: true, createdAt: true } }),
      prisma.auroraDecision.groupBy({ by: ['policyVersion', 'evaluationStatus'], _count: { _all: true } }),
      prisma.leadOutcome.groupBy({ by: ['action', 'evidenceKind'], _count: { _all: true } }),
      prisma.auditTrail.findMany({ where: { action: { startsWith: 'ADMIN_' } }, orderBy: { createdAt: 'desc' }, take: 25,
        select: { id: true, action: true, entityId: true, createdAt: true, status: true } }),
    ])
    return { jobs, providerAttempts, failedJobs, failedEvents, decisions, outcomes, audit }
  }

  static async pauseScheduledScans(targetUserId: string) {
    const admin = await requireAdmin()
    const userId = z.string().min(1).max(256).parse(targetUserId)
    return prisma.$transaction(async tx => {
      const changed = await ScanSchedulerService.pauseSchedule(userId, tx)
      if (changed.count) await tx.auditTrail.create({ data: {
        userId: admin.id, action: 'ADMIN_PAUSE_SCAN_SCHEDULE', entityType: 'TenantScanSchedule',
        entityId: userId, status: 'SUCCESS', metadata: { changed: changed.count },
      } })
      return { paused: changed.count === 1 }
    })
  }
}
