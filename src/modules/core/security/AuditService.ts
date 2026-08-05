import { Prisma } from '@prisma/client'
import { logger } from '../infrastructure/logger'
import prisma from '@/lib/prisma'

export interface AuditLogOptions {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  status: 'SUCCESS' | 'FAILURE' | 'PENDING'
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  /**
   * Log an action to the AuditTrail table.
   * This operates in a fire-and-forget manner to not block the main request lifecycle,
   * though in Serverless environments you may want to await it if the process dies immediately.
   */
  static async log(options: AuditLogOptions): Promise<void> {
    try {
      await prisma.auditTrail.create({
        data: {
          userId: options.userId,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          status: options.status,
          metadata: (options.metadata ?? {}) as Prisma.InputJsonObject,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        },
      })
    } catch (error) {
      // We don't want to fail the main request if auditing fails, but we must log it
      logger.error({ err: error, event: 'audit_log_failed', auditOptions: options }, 'Failed to write audit log')
    }
  }
}
