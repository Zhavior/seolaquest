'use server'

import { listCurrentUserScanRuns, getScanRunsStatus } from './queries'
import { requireCurrentUser } from '@/lib/auth'

export async function loadMoreScanRunsAction(cursor: string) {
  await requireCurrentUser()
  return listCurrentUserScanRuns(cursor)
}

export async function pollPendingScanRunsAction(runIds: string[]) {
  await requireCurrentUser()
  return getScanRunsStatus(runIds)
}
