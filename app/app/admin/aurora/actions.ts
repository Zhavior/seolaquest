'use server'

import { getCurrentUser } from '@/lib/auth'
import { AuroraFeedbackService, SubmitFeedbackSchema } from '@/src/modules/aurora/AuroraFeedbackService'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'

function getAdminIds() {
  return new Set(
    (process.env.AURORA_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  )
}

/**
 * Returns a `{ success, error }` envelope rather than this repo's `{ ok, message }`, so the
 * wrapper's failure is translated into that shape instead of replacing it.
 *
 * The signed-out and non-allowlisted answers are deliberately left inside the handler: they
 * are the specific strings this surface returns, and a generic 401/403 from the wrapper would
 * replace them. The action never redirects, so the existing catch swallows no navigation
 * signal; `unstable_rethrow` still runs first for anything that escapes it.
 */
export const submitAuroraFeedbackAction = withServerAction(
  {
    name: 'submitAuroraFeedbackAction',
    // Ordinary authenticated mutation behind an admin allowlist. It writes feedback rows;
    // it neither touches credentials/sessions nor spends money.
    tier: 'global',
    onError: (failure) => ({ success: false, error: failure.message }),
  },
  async (input: unknown) => {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!getAdminIds().has(user.id)) {
      return { success: false, error: 'Forbidden' }
    }

    const parsed = SubmitFeedbackSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid payload', details: parsed.error.flatten().fieldErrors }
    }

    try {
      const feedback = await AuroraFeedbackService.submitFeedback(user.id, parsed.data)
      return { success: true, feedbackId: feedback.id }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Internal error' }
    }
  },
)
