'use client'

import { useMemo, useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Filter, Plus, Radar, Swords, Trash2, Zap } from 'lucide-react'
import { addKeywordAction, claimQuestAction, dismissLeadAction, removeKeywordAction, scanForLeadsAction } from './actions'

export type DashboardUser = {
  name: string
  title: string
  xp: number
  level: number
  xpRequired: number
}

export type DashboardKeyword = { id: string; phrase: string; active: boolean }
export type DashboardLead = {
  id: string
  platform: string
  author: string
  content: string
  matched: string
  url: string
  sourceCreatedAt: string | null
}

function ageLabel(value: string | null) {
  if (!value) return 'Recently found'
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function DashboardClient({
  dbUser,
  dbKeywords,
  dbLeads,
}: {
  dbUser: DashboardUser
  dbKeywords: DashboardKeyword[]
  dbLeads: DashboardLead[]
}) {
  const [user, setUser] = useState(dbUser)
  const [keywords, setKeywords] = useState(dbKeywords)
  const [leads, setLeads] = useState(dbLeads)
  const [newKeyword, setNewKeyword] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [notice, setNotice] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredLeads = useMemo(
    () => leads.filter((lead) => filter === 'ALL' || lead.platform === filter),
    [filter, leads],
  )
  const platforms = ['ALL', ...Array.from(new Set(leads.map((lead) => lead.platform)))]
  const xpPercent = Math.min(100, Math.round((user.xp / user.xpRequired) * 100))

  function addKeyword() {
    const phrase = newKeyword.trim()
    if (!phrase) return
    startTransition(async () => {
      const result = await addKeywordAction(phrase)
      if (!result.ok) return setNotice(result.message ?? 'Could not add keyword.')
      setKeywords((current) => [{ id: `new-${Date.now()}`, phrase, active: true }, ...current])
      setNewKeyword('')
      setNotice(`Tracking “${phrase}”. Run a scan to find matching Reddit posts.`)
    })
  }

  function removeKeyword(id: string) {
    startTransition(async () => {
      const result = await removeKeywordAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not remove keyword.')
      setKeywords((current) => current.filter((keyword) => keyword.id !== id))
    })
  }

  function scan() {
    startTransition(async () => {
      const result = await scanForLeadsAction()
      setNotice(result.message ?? `Scan complete: ${result.created ?? 0} new Reddit posts found.`)
      if (result.ok) window.location.reload()
    })
  }

  function claimLead(id: string) {
    startTransition(async () => {
      const result = await claimQuestAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not update quest.')
      if (result.user) setUser((current) => ({ ...current, ...result.user }))
      setLeads((current) => current.filter((lead) => lead.id !== id))
      setNotice('Lead marked contacted. +150 XP awarded.')
    })
  }

  function dismissLead(id: string) {
    startTransition(async () => {
      const result = await dismissLeadAction(id)
      if (!result.ok) return setNotice(result.message ?? 'Could not dismiss quest.')
      setLeads((current) => current.filter((lead) => lead.id !== id))
    })
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-4 md:p-8 text-black">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div className="bg-[#FFE600] border-4 border-black px-5 py-3 shadow-[6px_6px_0_0_#000] rotate-[-1deg]">
          <p className="font-black uppercase tracking-widest text-xs">HypeQuest command center</p>
          <h1 className="text-4xl font-black uppercase tracking-tight">Find real demand</h1>
        </div>
        <div className="bg-white border-4 border-black p-4 shadow-[5px_5px_0_0_#000] min-w-[280px]">
          <div className="flex justify-between font-black uppercase text-sm"><span>Level {user.level} · {user.title}</span><span>{user.xp}/{user.xpRequired}</span></div>
          <div className="h-4 mt-2 border-2 border-black bg-gray-100"><div className="h-full bg-[#A3E635] border-r-2 border-black" style={{ width: `${xpPercent}%` }} /></div>
          <p className="mt-2 text-xs font-bold text-gray-600">{user.name}</p>
        </div>
      </header>

      <section className="bg-white border-4 border-black p-5 shadow-[6px_6px_0_0_#000] mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-3">
            <input value={newKeyword} onChange={(event) => setNewKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addKeyword()} placeholder="Track a phrase, e.g. need a website" className="min-w-0 flex-1 border-3 border-black bg-[#F4F0EA] p-3 font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFE600]" />
            <button type="button" onClick={addKeyword} disabled={isPending} className="border-3 border-black bg-[#FFE600] p-3 font-black shadow-[3px_3px_0_0_#000] disabled:opacity-50" aria-label="Add keyword"><Plus /></button>
          </div>
          <button type="button" onClick={scan} disabled={isPending || keywords.length === 0} className="border-3 border-black bg-[#06B6D4] px-5 py-3 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50 flex items-center justify-center gap-2"><Radar size={20} /> {isPending ? 'Working…' : 'Scan Reddit now'}</button>
        </div>
        <p className="mt-3 text-sm font-bold text-gray-600">Currently scans public Reddit search only. X, automated schedules, and alerts are not enabled yet.</p>
        {notice && <p role="status" className="mt-3 border-2 border-black bg-[#A3E635] p-2 font-bold">{notice}</p>}
      </section>

      <section className="mb-8">
        <h2 className="inline-flex items-center gap-2 bg-white border-4 border-black px-4 py-2 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000]"><Swords /> Tracked quests</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {keywords.map((keyword) => <div key={keyword.id} className="flex items-center gap-2 border-3 border-black bg-[#A3E635] px-3 py-2 font-bold shadow-[3px_3px_0_0_#000]"><span>“{keyword.phrase}”</span><button type="button" onClick={() => removeKeyword(keyword.id)} disabled={isPending} className="border-2 border-black bg-white p-1" aria-label={`Remove ${keyword.phrase}`}><Trash2 size={16} /></button></div>)}
          {!keywords.length && <p className="font-bold text-gray-600">Add your first keyword. Nothing is monitored until you do.</p>}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="inline-flex items-center gap-2 bg-[#FF5722] text-white border-4 border-black px-4 py-2 font-black text-2xl uppercase shadow-[4px_4px_0_0_#000]"><Zap /> Open leads ({filteredLeads.length})</h2>
          <div className="flex flex-wrap gap-2 items-center"><Filter size={18} />{platforms.map((platform) => <button type="button" key={platform} onClick={() => setFilter(platform)} className={`border-2 border-black px-3 py-1 font-black text-sm ${filter === platform ? 'bg-black text-white' : 'bg-white'}`}>{platform}</button>)}</div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredLeads.map((lead) => <motion.article layout key={lead.id} className="bg-white border-4 border-black p-5 shadow-[5px_5px_0_0_#000]">
            <div className="flex justify-between gap-3"><div><p className="font-black">{lead.author}</p><p className="text-xs font-bold text-gray-600 uppercase">{lead.platform} · {ageLabel(lead.sourceCreatedAt)} · matched “{lead.matched}”</p></div></div>
            <p className="my-4 font-bold leading-relaxed">{lead.content}</p>
            <div className="flex gap-2"><button type="button" onClick={() => claimLead(lead.id)} disabled={isPending} className="flex-1 border-3 border-black bg-[#06B6D4] px-3 py-2 font-black uppercase shadow-[3px_3px_0_0_#000] disabled:opacity-50">Mark contacted +150 XP</button><a href={lead.url} target="_blank" rel="noreferrer" className="border-3 border-black bg-[#FFE600] p-2 shadow-[3px_3px_0_0_#000]" aria-label="Open source post"><ExternalLink /></a><button type="button" onClick={() => dismissLead(lead.id)} disabled={isPending} className="border-3 border-black bg-white p-2 shadow-[3px_3px_0_0_#000]" aria-label="Dismiss lead"><Trash2 /></button></div>
          </motion.article>)}
        </div>
        {!filteredLeads.length && <div className="border-4 border-dashed border-black bg-white p-10 text-center shadow-[5px_5px_0_0_#000]"><Radar className="mx-auto mb-3" size={40} /><h3 className="font-black text-2xl uppercase">No open leads</h3><p className="mt-2 font-bold text-gray-600">{keywords.length ? 'Run a Reddit scan or change the filter.' : 'Add a keyword, then run your first Reddit scan.'}</p></div>}
      </section>
    </div>
  )
}
