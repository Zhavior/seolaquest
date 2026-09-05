'use client'
import { useState, useTransition } from 'react'
import { pauseScheduleAction } from './actions'

export function PauseScheduleButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  return <div>
    <button disabled={pending} className="min-h-11 rounded-lg border border-outline px-3 text-sm font-semibold disabled:opacity-50"
      onClick={() => startTransition(async () => {
        try { const result = await pauseScheduleAction(userId); setMessage(result.message) }
        catch { setMessage('Could not pause the schedule. Try again.') }
      })}>{pending ? 'Pausing…' : 'Pause schedule'}</button>
    <p role="status" className="mt-1 text-xs">{message}</p>
  </div>
}
