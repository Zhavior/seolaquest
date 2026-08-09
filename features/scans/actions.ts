'use server'

import { listCurrentUserScanRuns, getScanRunsStatus } from './queries'
import { requireCurrentUser } from '@/lib/auth'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'

/**
 * Both actions return raw domain data — `ScanRunListResult` and a status row array — and
 * their callers read those fields straight off the resolved value, so a `ServerActionFailure`
 * envelope would be a type error at every call site. `onError: 'rethrow'` keeps the existing
 * throwing contract (already reachable today via `requireCurrentUser`) while still getting
 * the log context and the rate limit.
 *
 * Tier is `global`, not `billing`: neither action enqueues work or spends a credit — they are
 * read-only reads of already-created scan runs. `pollPendingScanRunsAction` in particular is
 * polled on a 3s interval by ScanRunList (~20 calls/min), which the 10/min `billing` bucket
 * would reject outright. The action that actually spends a scan credit is
 * `scanForLeadsAction` in features/dashboard/actions.ts, and that one is on `billing`.
 */

export const loadMoreScanRunsAction = withServerAction(
  { name: 'loadMoreScanRunsAction', tier: 'global', onError: 'rethrow' },
  async (cursor: string) => {
    await requireCurrentUser()
    return listCurrentUserScanRuns(cursor)
  },
)

export const pollPendingScanRunsAction = withServerAction(
  { name: 'pollPendingScanRunsAction', tier: 'global', onError: 'rethrow' },
  async (runIds: string[]) => {
    if (!Array.isArray(runIds)) return []
    const cappedIds = runIds.slice(0, 50)
    await requireCurrentUser()
    return getScanRunsStatus(cappedIds)
  },
)
