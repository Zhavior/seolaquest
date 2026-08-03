import { NextResponse } from 'next/server'
import { verifyMachineBearer } from '@/src/modules/core/security/machineBearer'
import { assertDatabaseSessionUtc } from '@/src/modules/core/jobs/databaseClock'
import { accountDeletionEnabled } from '@/src/modules/lifecycle/domain/accountDeletion'
import {
  OperationalHeartbeatService,
  WORKER_CYCLE_FAILURE_CODE,
} from '@/src/modules/operations/application/OperationalHeartbeatService'

export const maxDuration = 60

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
    const durable = await JobWorkerService.runCycle()
    const maintenance = await OperationalHeartbeatService.pruneProcessedStripeWebhooks()
    await OperationalHeartbeatService.markSucceeded()
    return NextResponse.json({ ok: true, lifecycle, durable, maintenance })
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
