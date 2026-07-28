'use client'

import { useState, useTransition } from 'react'
import { Save, Settings } from 'lucide-react'
import { updateSettingsAction } from '../actions'

export default function SettingsClient({ initial }: { initial: { name: string; title: string; email: string; emailDigest: boolean; radarAlerts: boolean } }) {
  const [name, setName] = useState(initial.name)
  const [title, setTitle] = useState(initial.title)
  const [emailDigest, setEmailDigest] = useState(initial.emailDigest)
  const [radarAlerts, setRadarAlerts] = useState(initial.radarAlerts)
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()
  function save() { startTransition(async () => { const result = await updateSettingsAction({ name, title, emailDigest, radarAlerts }); setNotice(result.ok ? 'Settings saved.' : result.message ?? 'Could not save settings.') }) }
  return <div className="min-h-screen max-w-4xl mx-auto p-4 md:p-8"><section className="border-4 border-black bg-white p-7 shadow-[7px_7px_0_0_#000]"><h1 className="flex items-center gap-3 text-3xl font-black uppercase"><Settings /> Settings</h1><label className="mt-6 block font-black uppercase">Display name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 font-bold" /></label><label className="mt-5 block font-black uppercase">Hunter title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 font-bold" /></label><p className="mt-5 font-bold">Signed-in email: {initial.email || 'Not provided by your provider'}</p><div className="mt-6 space-y-3 border-3 border-black bg-[#F4F0EA] p-4 font-bold"><label className="flex gap-3"><input type="checkbox" checked={emailDigest} onChange={(event) => setEmailDigest(event.target.checked)} /> Email digest preference</label><label className="flex gap-3"><input type="checkbox" checked={radarAlerts} onChange={(event) => setRadarAlerts(event.target.checked)} /> Radar alert preference</label><p className="text-sm text-gray-700">Preferences are saved, but email delivery and browser alerts are not enabled yet.</p></div>{notice && <p role="status" className="mt-4 border-2 border-black bg-[#A3E635] p-3 font-bold">{notice}</p>}<button type="button" onClick={save} disabled={pending} className="mt-6 flex items-center gap-2 border-3 border-black bg-[#06B6D4] px-5 py-3 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50"><Save /> {pending ? 'Saving…' : 'Save settings'}</button></section></div>
}
