'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCurrentUser } from '@/lib/auth'
import { EntitlementService } from '@/src/modules/billing/application/EntitlementService'
import { logger } from '@/src/modules/core/infrastructure/logger'
import {
  normalizeCrmWebhookUrl,
  UnsafeCrmWebhookUrlError,
} from '@/src/modules/core/security/crmWebhookUrl'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'
import { CrmDeliveryService } from '@/src/modules/leads/application/CrmDeliveryService'
import type { RetryDeliveryState } from './types'
import { listCurrentUserDeliveries, getDeliveriesStatus } from './queries'

const deliveryIdSchema = z.string().uuid()

function errorState(message: string): RetryDeliveryState {
  return { outcome: 'error', message }
}

/**
 * `useActionState` reads `{ outcome, message }` off this action, so the wrapper's failure
 * is translated into that same shape rather than returned as a `ServerActionFailure`.
 * In practice only the rate limit reaches `onError` — everything the action itself can hit
 * is already mapped to a customer-safe `errorState` below.
 *
 * The action never redirects; `revalidatePath` does not throw a navigation signal, so the
 * pre-existing catch is safe where it is. It stays *inside* the wrapper's handler, which
 * means `unstable_rethrow` still runs first for anything this catch does not swallow.
 */
export const retryDeliveryAction = withServerAction(
  {
    name: 'retryDeliveryAction',
    // Ordinary authenticated mutation: it re-queues an already-purchased delivery job for
    // the worker. It moves no money, provisions nothing, and consumes no metered credits.
    tier: 'global',
    onError: (failure) => errorState(failure.message),
  },
  async (
    deliveryId: string,
    previousState: RetryDeliveryState,
    formData: FormData,
  ): Promise<RetryDeliveryState> => {
    void previousState
    void formData

    const parsed = deliveryIdSchema.safeParse(deliveryId)
    if (!parsed.success) return errorState('This delivery could not be found.')

    let user: Awaited<ReturnType<typeof requireCurrentUser>>
    try {
      user = await requireCurrentUser()
    } catch {
      return errorState('Your session has expired. Sign in again before retrying.')
    }

    try {
      const entitlements = await EntitlementService.forUser(user.id)
      if (!entitlements.canExportToCRM) {
        return errorState('An active paid plan is required to retry CRM delivery.')
      }

      let destination: string | null
      try {
        destination = normalizeCrmWebhookUrl(user.crmWebhookUrl)
      } catch (error) {
        if (!(error instanceof UnsafeCrmWebhookUrlError)) throw error
        destination = null
      }

      if (!destination) {
        return errorState('Update your CRM connection in Settings before retrying.')
      }

      const result = await CrmDeliveryService.retryDead({
        userId: user.id,
        deliveryId: parsed.data,
        normalizedDestination: destination,
      })

      if (!result.ok) {
        if (result.reason === 'NOT_FOUND') return errorState('This delivery could not be found.')
        return errorState('This delivery is no longer eligible for retry. Refresh the page for its latest status.')
      }

      revalidatePath('/app/deliveries')
      revalidatePath(`/app/deliveries/${parsed.data}`)
      return {
        outcome: 'success',
        message: 'Retry queued. The delivery worker will try again.',
      }
    } catch (error) {
      logger.error(
        { err: error, outcomeCode: 'CRM_DELIVERY_MANUAL_RETRY_FAILED' },
        'CRM delivery manual retry failed',
      )
      return errorState('Retry is temporarily unavailable. Please try again later.')
    }
  },
)

/**
 * Returns raw domain data that `DeliveryList` spreads straight into state, and its caller
 * already treats a rejection as the failure signal (`requireCurrentUser` throws today for a
 * signed-out caller). An envelope would be a type error at the call site, so the throwing
 * contract is preserved with `onError: 'rethrow'`.
 */
export const loadMoreDeliveriesAction = withServerAction(
  { name: 'loadMoreDeliveriesAction', tier: 'global', onError: 'rethrow' },
  async (cursor: string) => {
    await requireCurrentUser()
    return listCurrentUserDeliveries(cursor)
  },
)

/** Same raw-domain-data contract as above; the polling caller reads the array directly. */
export const pollPendingDeliveriesAction = withServerAction(
  { name: 'pollPendingDeliveriesAction', tier: 'global', onError: 'rethrow' },
  async (deliveryIds: string[]) => {
    if (!Array.isArray(deliveryIds)) return []
    const cappedIds = deliveryIds.slice(0, 50)
    await requireCurrentUser()
    return getDeliveriesStatus(cappedIds)
  },
)
