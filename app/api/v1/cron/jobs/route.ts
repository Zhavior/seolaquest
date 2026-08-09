import { NextResponse } from 'next/server'
import { verifyMachineBearer } from '@/src/modules/core/security/machineBearer'
import { assertDatabaseSessionUtc } from '@/src/modules/core/jobs/databaseClock'
import { logger } from '@/src/modules/core/infrastructure/logger'
import type { ProcessBatchResult } from '@/src/modules/core/events/EventProcessor'
import { accountDeletionEnabled } from '@/src/modules/lifecycle/domain/accountDeletion'
import {
  OperationalHeartbeatService,
  WORKER_CYCLE_FAILURE_CODE,
} from '@/src/modules/operations/application/OperationalHeartbeatService'

export const maxDuration = 60

// Not exported: Next.js validates the export surface of a route module, and an
// unrecognised export fails the build.
const EVENT_DRAIN_FAILURE_CODE = 'EVENT_DRAIN_FAILED'

/*
 * The outbox drain shares this invocation's 60s maxDuration with the durable job
 * cycle, which budgets 40s of wall time for itself. Bounding the batch keeps the
 * drain's worst case (a slow consumer per event) well inside the remainder so it
 * cannot starve the job lane it runs alongside.
 */
const EVENT_DRAIN_BATCH_SIZE = 10

type EventDrainReport =
  | ({ ok: true } & ProcessBatchResult)
  | { ok: false; errorCode: typeof EVENT_DRAIN_FAILURE_CODE }

async function drainDomainEventOutbox() {
  /*
   * ORDER IS LOAD-BEARING. Consumers MUST be registered before a single event is
   * claimed. EventProcessor.processEvent marks an event PROCESSED when its type has
   * zero registered consumers, so draining an empty dispatcher would destroy every
   * pending event permanently — with a clean PROCESSED audit trail and no error.
   */
  const { registerAllEventConsumers } = await import('@/src/modules/core/events/registerConsumers')
  registerAllEventConsumers()

  const { EventProcessor } = await import('@/src/modules/core/events/EventProcessor')
  return EventProcessor.processPendingBatch(EVENT_DRAIN_BATCH_SIZE)
}

export async function GET(request: Request) {
  const authorization = verifyMachineBearer(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
  )
  if (authorization === 'missing_config') {
    return new NextResponse('Durable worker is not configured', { status: 503 })
  }
  if (authorization !== 'authorized') {
    return new NextResponse('Unauthorized Cron Request', { status: 401 })
  }
  if (process.env.DURABLE_WORKER_ENABLED !== 'true') {
    return new NextResponse('Durable worker is disabled', { status: 503 })
  }

  try {
    await assertDatabaseSessionUtc()
  } catch {
    return NextResponse.json({ ok: false, status: 'database_clock_unavailable' }, { status: 503 })
  }

  try {
    await OperationalHeartbeatService.markStarted()
    const lifecycle = accountDeletionEnabled()
      ? await (await import('@/src/modules/lifecycle/application/AccountDeletionWorker')).AccountDeletionWorker.processBatch()
      : { enabled: false }
    const { JobWorkerService } = await import('@/src/modules/core/jobs/JobWorkerService')

    /*
     * The durable job cycle and the outbox drain are independent lanes over
     * disjoint tables. allSettled keeps them isolated in both directions: a drain
     * failure must not cost us the job cycle's report, and a job cycle failure must
     * not skip the drain.
     */
    const [durableResult, eventsResult] = await Promise.allSettled([
      JobWorkerService.runCycle(),
      drainDomainEventOutbox(),
    ])

    let events: EventDrainReport
    if (eventsResult.status === 'fulfilled') {
      events = { ok: true, ...eventsResult.value }
    } else {
      events = { ok: false, errorCode: EVENT_DRAIN_FAILURE_CODE }
      logger.error(
        { err: eventsResult.reason, outcomeCode: EVENT_DRAIN_FAILURE_CODE },
        'Domain event outbox drain failed',
      )
    }

    if (durableResult.status === 'rejected') {
      throw durableResult.reason
    }

    const durable = durableResult.value
    const maintenance = await OperationalHeartbeatService.pruneProcessedStripeWebhooks()
    await OperationalHeartbeatService.markSucceeded()
    return NextResponse.json({ ok: true, lifecycle, durable, events, maintenance })
  } catch {
    try {
      await OperationalHeartbeatService.markFailed(WORKER_CYCLE_FAILURE_CODE)
    } catch {
      // The response remains a stable machine-readable failure even when the
      // database outage also prevents recording the heartbeat.
    }
    return NextResponse.json({ ok: false, errorCode: WORKER_CYCLE_FAILURE_CODE }, { status: 500 })
  }
}
