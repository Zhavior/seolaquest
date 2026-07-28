'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Zap } from 'lucide-react'
import { completeOnboardingAction } from '../actions'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('Lead Hunter')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await completeOnboardingAction(name, title)
      if (!result.ok) return setError(result.message ?? 'Could not save your profile.')
      router.push('/')
      router.refresh()
    })
  }

  return <div className="flex min-h-screen items-center justify-center p-6"><section className="w-full max-w-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]"><div className="inline-flex items-center gap-2 border-3 border-black bg-[#A3E635] px-4 py-2 font-black uppercase"><Sparkles /> Your hunter profile</div><h1 className="mt-6 text-4xl font-black uppercase">Make it yours</h1><p className="mt-2 font-bold text-gray-700">This is saved to your HypeQuest account.</p><label className="mt-6 block font-black uppercase">Display name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 font-bold" placeholder="Your name" /></label><label className="mt-5 block font-black uppercase">Hunter title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full border-3 border-black bg-[#F4F0EA] p-3 font-bold" placeholder="Lead Hunter" /></label>{error && <p role="alert" className="mt-4 border-2 border-black bg-[#FF5722] p-3 font-bold">{error}</p>}<button type="button" onClick={submit} disabled={pending} className="mt-7 flex w-full items-center justify-center gap-2 border-3 border-black bg-[#FFE600] p-4 font-black uppercase shadow-[4px_4px_0_0_#000] disabled:opacity-50"><Zap /> {pending ? 'Saving…' : 'Enter command center'}</button></section></div>
}
