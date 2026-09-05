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

      <div className="relative w-full max-w-2xl overflow-hidden border border-outline bg-highlight shadow-brutal-lg rounded-xl">
        <div className="flex items-center gap-2 border-b border-outline bg-card px-3 py-3">
          <Search className="h-4 w-4 shrink-0 text-on-accent" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setManualActiveIndex(0)
            }}
            placeholder="Jump to a quest, page, or setting..."
            className="w-full bg-transparent text-sm font-bold normal-case tracking-[0.06em] text-ink outline-none placeholder:text-ink-muted"
          />
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 shrink-0 items-center justify-center border border-outline bg-card text-ink transition-all duration-150 hover:-translate-y-[1px] rounded-xl"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {!query.trim() && recentItems.length > 0 && (
          <div className="border-b border-outline bg-[#FFE9A3] px-3 py-2">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold normal-case tracking-[0.18em] text-ink-muted">
              <History className="h-3.5 w-3.5" />
              Recent Commands
            </div>

            <div className="flex flex-wrap gap-2">
              {recentItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => openItem(item.href)}
                  className="inline-flex items-center gap-2 border border-outline bg-card px-2.5 py-1 text-[10px] font-semibold normal-case tracking-[0.12em] text-ink shadow-brutal-sm transition-all duration-150 hover:-translate-y-[1px] rounded-xl"
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
              <div className="px-2 py-1 text-[10px] font-semibold normal-case tracking-[0.18em] text-ink-muted">
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
                      className={`flex w-full items-center justify-between gap-3 border border-outline px-3 py-3 text-left transition-all duration-150  rounded-xl ${
                        isActive
                          ? 'bg-accent shadow-brutal-sm'
                          : 'bg-card hover:-translate-y-[1px]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold normal-case tracking-[0.12em] text-ink">{item.label}</div>
                        {item.description ? (
                          <div className="mt-1 text-[11px] font-bold normal-case tracking-[0.08em] text-ink/55">
                            {item.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.hotkey ? (
                          <span className="border border-outline bg-card px-2 py-1 text-[10px] font-semibold normal-case text-ink rounded-xl">
                            {item.hotkey}
                          </span>
                        ) : null}
                        <ArrowRight className="h-4 w-4 text-ink" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {results.length === 0 ? (
            <div className="border border-outline bg-card px-4 py-6 text-center text-xs font-semibold normal-case tracking-[0.12em] text-ink/55 rounded-xl">
              No commands found
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
