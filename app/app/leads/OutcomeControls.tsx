'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const choices: Record<string, [string, string][]> = {
  CLAIMED: [['CONTACT', 'I contacted this lead']],
  CONTACTED: [['REPLY', 'They replied'], ['QUALIFY', 'Mark qualified'], ['CONVERT', 'Report conversion']],
  REPLIED: [['QUALIFY', 'Mark qualified'], ['CONVERT', 'Report conversion']],
  QUALIFIED: [['CONVERT', 'Report conversion']],
}
export function OutcomeControls({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [action, setAction] = useState('')
  const [notes, setNotes] = useState('')
  const receipt = useRef<{ body: string; key: string } | null>(null)
  const options = choices[status] ?? []
  if (!options.length) return null
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault()
    if (pending || !action) return
    const body = JSON.stringify({ action, notes })
    if (receipt.current?.body !== body) receipt.current = { body, key: crypto.randomUUID() }
    setPending(true); setMessage('')
    try {
      const response = await fetch(`/api/v1/leads/${leadId}/outcomes`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': receipt.current.key }, body })
      const result = await response.json()
      if (!response.ok) { setMessage(result.error || 'Could not save this update.'); return }
      setMessage('Outcome saved.'); setAction(''); setNotes(''); receipt.current = null; router.refresh()
    } catch { setMessage('Could not confirm the save. Retry the same update safely.') }
    finally { setPending(false) }
  }}>
    <label className="block">Outcome
      <select required disabled={pending} value={action} onChange={e => setAction(e.target.value)} className="ml-2 min-h-11 rounded border border-outline bg-card p-2">
        <option value="">Choose an update</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label className="block">Notes (optional)
      <textarea disabled={pending} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} className="block w-full rounded border border-outline bg-card p-2" />
    </label>
    <button disabled={pending || !action} className="min-h-11 rounded border border-outline px-4 disabled:opacity-50">{pending ? 'Saving…' : 'Save reported outcome'}</button>
    <p role="status">{message}</p>
  </form>
}
