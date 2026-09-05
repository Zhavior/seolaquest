'use server'

import { revalidatePath } from 'next/cache'
import { AdminService } from '@/src/modules/admin/AdminService'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'

export const pauseScheduleAction = withServerAction({ name: 'adminPauseSchedule', tier: 'global' }, async (userId: string) => {
  const result = await AdminService.pauseScheduledScans(userId)
  revalidatePath('/app/admin')
  revalidatePath('/app/admin/users')
  revalidatePath('/app/admin/operations')
  return { ok: true, message: result.paused ? 'Schedule paused. Already queued scans are unchanged.' : 'Schedule is already paused.' }
})
