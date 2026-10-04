'use client'

import { useSyncExternalStore } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sfx } from '@/lib/sfx'

export function SoundControls() {
  const enabled = useSyncExternalStore(sfx.subscribe, sfx.isEnabled, () => true)
  const volume = useSyncExternalStore(sfx.subscribe, sfx.getVolume, () => 0.5)

  return (
    <details className="relative" onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }
    }}>
      <summary aria-label="Sound settings" title="Sound settings" className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-outline bg-card text-ink [&::-webkit-details-marker]:hidden">
        <Volume2 aria-hidden="true" className="sfx-icon-on size-4" />
        <VolumeX aria-hidden="true" className="sfx-icon-off size-4" />
      </summary>
      <div className="absolute right-0 top-11 z-50 w-60 max-w-[calc(100vw-1rem)] space-y-4 rounded-2xl border border-outline bg-card p-4 text-sm text-ink shadow-lg">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 font-semibold">
          Sound effects
          <input type="checkbox" checked={enabled} onChange={(event) => sfx.setEnabled(event.target.checked)} className="size-5 accent-emerald-600" />
        </label>
        <label className="block space-y-2">
          <span className="flex justify-between"><span>Volume</span><span>{Math.round(volume * 100)}%</span></span>
          <input aria-label="Sound volume" type="range" min="0" max="100" step="5" value={Math.round(volume * 100)} onChange={(event) => sfx.setVolume(Number(event.target.value) / 100)} className="min-h-8 w-full accent-emerald-600" />
        </label>
        <button type="button" disabled={!enabled || volume === 0} onClick={() => sfx.playQuestComplete()} className="min-h-11 w-full rounded-lg border border-outline px-3 font-semibold disabled:opacity-50">Preview celebration</button>
        <p className="text-xs text-ink-muted">Short cues for your actions and progress. Saved on this device.</p>
      </div>
    </details>
  )
}
