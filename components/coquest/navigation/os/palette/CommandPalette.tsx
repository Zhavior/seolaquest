'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, History, Search, X } from 'lucide-react'

import { navigation } from '../shared/navigation'

const sectionLabels: Record<string, string> = {
  tactical: 'Tactical',
  guild: 'Guild & Ops',
  system: 'System',
}

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [manualActiveIndex, setManualActiveIndex] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return navigation
    return navigation.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.hotkey?.toLowerCase() === q
    )
  }, [query])

  const recentItems = useMemo(
    () =>
      recent
        .map((href) => navigation.find((item) => item.href === href))
        .filter((item): item is (typeof navigation)[number] => Boolean(item)),
    [recent]
  )

  const activeIndex = Math.min(manualActiveIndex, Math.max(results.length - 1, 0))

  const openItem = useCallback((href: string) => {
    setRecent((current) => [href, ...current.filter((value) => value !== href)].slice(0, 5))
    setQuery('')
    setManualActiveIndex(0)
    router.push(href)
    setOpen(false)
  }, [router])

  const handleToggleOpen = useCallback((nextOpen?: boolean) => {
    const value = typeof nextOpen === 'boolean' ? nextOpen : !open
    setOpen(value)

    if (value) {
      setQuery('')
      setManualActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (isCmdK) {
        event.preventDefault()
        handleToggleOpen()
        return
      }

      if (event.key === 'Escape' && open) {
        setOpen(false)
        return
      }

      if (!open) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setManualActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setManualActiveIndex((index) => Math.max(index - 1, 0))
      }

      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault()
        openItem(results[activeIndex].href)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, results, activeIndex, handleToggleOpen, openItem])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  if (!open) return null

  const grouped = results.reduce<Record<string, typeof navigation>>((acc, item) => {
    acc[item.section] = acc[item.section] ? [...acc[item.section], item] : [item]
    return acc
  }, {})

  let runningIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-24">
      <button
        type="button"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative w-full max-w-2xl overflow-hidden border-2 border-black bg-[#FFF8D6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 border-b-2 border-black bg-white px-3 py-3">
          <Search className="h-4 w-4 shrink-0 text-black" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setManualActiveIndex(0)
            }}
            placeholder="Jump to a quest, page, or setting..."
            className="w-full bg-transparent text-sm font-bold uppercase tracking-[0.06em] text-black outline-none placeholder:text-black/40"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-white text-black transition-all duration-150 hover:-translate-y-[1px]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {!query.trim() && recentItems.length > 0 && (
          <div className="border-b-2 border-black bg-[#FFE9A3] px-3 py-2">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
              <History className="h-3.5 w-3.5" />
              Recent Commands
            </div>

            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => openItem(item.href)}
                  className="inline-flex items-center gap-2 border-2 border-black bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:-translate-y-[1px]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section} className="mb-3 last:mb-0">
              <div className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black/50">
                {sectionLabels[section] ?? section}
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  runningIndex += 1
                  const isActive = runningIndex === activeIndex

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => openItem(item.href)}
                      className={`flex w-full items-center justify-between gap-3 border-2 border-black px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FFE600] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:-translate-y-[1px]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.12em] text-black">{item.label}</div>
                        {item.description ? (
                          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-black/55">
                            {item.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.hotkey ? (
                          <span className="border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase text-black">
                            {item.hotkey}
                          </span>
                        ) : null}
                        <ArrowRight className="h-4 w-4 text-black" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {results.length === 0 ? (
            <div className="border-2 border-black bg-white px-4 py-6 text-center text-xs font-black uppercase tracking-[0.12em] text-black/55">
              No commands found
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
