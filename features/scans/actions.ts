'use server'

import { listCurrentUserScanRuns, getScanRunsStatus } from './queries'
import { requireCurrentUser } from '@/lib/auth'

export async function loadMoreScanRunsAction(cursor: string) {
  await requireCurrentUser()
  return listCurrentUserScanRuns(cursor)
}

export async function pollPendingScanRunsAction(runIds: string[]) {
  if (!Array.isArray(runIds)) return []
  const cappedIds = runIds.slice(0, 50)
  await requireCurrentUser()
  return getScanRunsStatus(cappedIds)
}
