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
    <form action={formAction} className="mt-5 border-t-2 border-black pt-5">
      <button
        type="submit"
        disabled={pending}
        className="border-4 border-black bg-[#FFE600] px-5 py-3 font-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-yellow-300 disabled:cursor-wait disabled:bg-zinc-200 disabled:text-zinc-500"
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
