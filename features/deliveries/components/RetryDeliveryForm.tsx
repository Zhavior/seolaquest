'use client'

import { useActionState } from 'react'
import { retryDeliveryAction } from '../actions'
import { INITIAL_RETRY_DELIVERY_STATE } from '../types'

export function RetryDeliveryForm({ deliveryId }: { deliveryId: string }) {
  const retryForDelivery = retryDeliveryAction.bind(null, deliveryId)
  const [state, formAction, pending] = useActionState(
    retryForDelivery,
    INITIAL_RETRY_DELIVERY_STATE,
  )

  return (
    <form action={formAction} className="mt-5 border-t-2 border-outline pt-5">
      <button
        type="submit"
        disabled={pending}
        className="border-4 border-outline bg-accent px-5 py-3 font-black uppercase shadow-brutal hover:bg-highlight-strong disabled:cursor-wait disabled:bg-inset disabled:text-ink-muted"
      >
        {pending ? 'Queueing retry…' : 'Retry delivery'}
      </button>
      <p
        aria-live="polite"
        className={`mt-3 text-sm font-bold ${state.outcome === 'error' ? 'text-red-700' : 'text-green-800'}`}
      >
        {state.message}
      </p>
    </form>
  )
}
