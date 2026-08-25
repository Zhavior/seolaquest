'use client'

import { useEffect, useState } from 'react'
import { Braces, ChevronLeft, ChevronRight, Radar, Send, SkipForward } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  SAMPLE_ROW_COUNT,
  rejectedRowCount,
  type Pain,
  type Prey,
  type SampleTarget,
} from '../data/sample-targets'
import { RadarScope } from './RadarScope'

type SlideId = 'scope' | 'telemetry' | 'source' | 'draft'

type Slide = { id: SlideId; label: string; caption: string }

const SLIDES: Slide[] = [
  { id: 'scope', label: 'Scope', caption: 'The scope sweeps public threads on X. Reddit is next.' },
  {
    id: 'telemetry',
    label: 'Telemetry',
    caption: 'Every scan reports what it kept and what it threw away.',
  },
  { id: 'source', label: 'Source', caption: 'What survives names a tool and states a problem.' },
  {
    id: 'draft',
    label: 'Draft',
    caption: 'That becomes a draft you edit before anything gets posted.',
  },
]

const SLIDE_MS = 3600
const TELEMETRY_STEP_MS = 260

/** The query the intro narrates. Fixed, so the numbers on screen are stable. */
const STORY_PREY: Prey = 'Salesforce'
const STORY_PAIN: Pain = 'Pricing revolt'

type Props = {
  targets: SampleTarget[]
  target: SampleTarget
  draft: string
  draftLabel: string
  reducedMotion: boolean
  /** Ran to the end on its own. The host uses this to hand off downward. */
  onFinish: () => void
  /** Dismissed by the reader. No hand-off, no scroll. */
  onSkip: () => void
}

/**
 * The HUD as a slide deck: each of the console's surfaces gets one slide, in
 * the order the workflow runs. It replaces the interactive scope only while it
 * plays — the panel swaps back the moment it ends, so nothing the deck shows is
 * only reachable through the deck.
 *
 * Auto-advance stops while the pointer or keyboard focus is inside the panel,
 * because a deck that keeps moving under someone reading it is worse than one
 * that never moved.
 */
export function HudStory({
  targets,
  target,
  draft,
  draftLabel,
  reducedMotion,
  onFinish,
  onSkip,
}: Props) {
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)
  const [revealed, setRevealed] = useState(0)

  const slide = SLIDES[index]
  const rejected = rejectedRowCount(STORY_PREY, STORY_PAIN)

  const telemetry = [
    { key: 'target', label: 'TARGET', value: STORY_PREY, tone: 'text-accent' },
    { key: 'intent', label: 'INTENT', value: STORY_PAIN, tone: 'text-accent' },
    { key: 'status', label: 'STATUS', value: 'Reading the sample set (X, Reddit)…', tone: 'text-[#4ADE80]' },
    {
      key: 'rejected',
      label: 'REJECTED',
      value: `${rejected} of ${SAMPLE_ROW_COUNT} rows filtered out.`,
      tone: 'text-[#FCA5A5]',
    },
  ]

  // Auto-advance. Reduced motion parks the deck on slide one and leaves the
  // arrows as the only way through it.
  useEffect(() => {
    if (reducedMotion || held) return
    const id = setTimeout(() => {
      if (index + 1 < SLIDES.length) setIndex(index + 1)
      else onFinish()
    }, SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, held, reducedMotion, onFinish])

  // The telemetry slide types itself in rather than appearing whole.
  useEffect(() => {
    if (slide.id !== 'telemetry') return
    if (reducedMotion) {
      const all = setTimeout(() => setRevealed(SLIDES.length), 0)
      return () => clearTimeout(all)
    }
    const timers = [0, 1, 2, 3].map((line) =>
      setTimeout(() => setRevealed(line + 1), TELEMETRY_STEP_MS * (line + 1)),
    )
    return () => timers.forEach(clearTimeout)
  }, [slide.id, reducedMotion])

  const go = (next: number) => {
    setHeld(true)
    setRevealed(0)
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }

  return (
    <div
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
    >
      {/* Fixed height so advancing a slide never resizes the panel, and the
          shorter slides sit centred rather than stranded at the top. */}
      <div className="relative flex min-h-[320px] flex-col justify-center border-4 border-outline bg-inset">
        {slide.id === 'scope' ? (
          <div className="w-full">
            <RadarScope
              targets={targets}
              selectedId={target.id}
              onSelect={() => undefined}
              reducedMotion={reducedMotion}
            />
          </div>
        ) : null}

        {slide.id === 'telemetry' ? (
          <div className="w-full p-3">
            <div className="border-2 border-outline bg-[#0A0A0A]">
              <div className="flex items-center justify-between gap-2 border-b-2 border-[#3F3F46] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em]">
                <span className="flex items-center gap-1.5 text-[#E4E4E7]">
                  <Radar className="h-3 w-3" aria-hidden="true" />
                  <span>Telemetry stream</span>
                </span>
                <span className="text-[#4ADE80]">Executing</span>
              </div>
              <div className="space-y-1.5 p-3 font-mono text-[11px] leading-relaxed">
                {telemetry.slice(0, revealed).map((line) => (
                  <p key={line.key} className="flex flex-wrap gap-x-2">
                    <span className="text-[#71717A]">&gt;</span>
                    <span className={cn('font-black', line.tone)}>{line.label}:</span>
                    <span className="text-[#D4D4D8]">{line.value}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {slide.id === 'source' ? (
          <div className="w-full p-3">
            <div className="border-2 border-outline bg-card">
              <p className="flex items-center gap-2 border-b-2 border-outline bg-inset px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                <Radar className="h-3 w-3" aria-hidden="true" />
                <span>Filtered source thread</span>
              </p>
              <div className="space-y-2 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-base" aria-hidden="true">
                    {target.avatar}
                  </span>
                  <span className="mr-auto font-mono text-xs font-black text-ink">{target.handle}</span>
                  <span
                    className={cn(
                      'border-2 border-outline px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em]',
                      target.source === 'Reddit' ? 'bg-accent-2 text-white' : 'bg-ink text-ink-inverse',
                    )}
                  >
                    {target.source}
                  </span>
                  <span className="border-2 border-outline bg-accent px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-on-accent">
                    Demo score {target.intentScore}
                  </span>
                </div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-ink-muted">
                  {target.competitor} · {target.painPoint}
                </p>
                <p className="line-clamp-4 border-2 border-outline bg-inset p-2 text-xs leading-relaxed text-ink">
                  &ldquo;{target.body}&rdquo;
                </p>
                <span className="inline-flex items-center gap-1 border-2 border-dashed border-ink-muted px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-ink-muted">
                  <Braces className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>Raw JSON available below</span>
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {slide.id === 'draft' ? (
          <div className="w-full p-3">
            <div className="border-2 border-outline bg-card">
              <p className="flex items-center gap-2 border-b-2 border-outline bg-accent px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-on-accent">
                <Send className="h-3 w-3" aria-hidden="true" />
                <span>{draftLabel}</span>
              </p>
              <div className="space-y-2 p-3">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-ink-muted">
                  Generated for {target.handle} · edit before you post
                </p>
                <p className="line-clamp-6 border-2 border-outline bg-inset p-2 font-mono text-[11px] leading-relaxed text-ink">
                  {draft}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Caption + transport */}
      <div className="mt-3 space-y-2 border-4 border-outline bg-card p-3 shadow-brutal">
        <p aria-live="polite" className="font-mono text-[11px] font-black uppercase tracking-[0.1em] text-ink">
          <span className="text-accent-2">
            {index + 1}/{SLIDES.length}
          </span>{' '}
          · {slide.caption}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="border-2 border-outline bg-card p-1 text-ink transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Previous slide</span>
            </button>
            {SLIDES.map((entry, position) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => go(position)}
                aria-current={position === index}
                className={cn(
                  'h-2 w-6 border-2 border-outline transition-colors',
                  position === index ? 'bg-accent' : 'bg-inset hover:bg-highlight',
                )}
              >
                <span className="sr-only">{entry.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="border-2 border-outline bg-card p-1 text-ink transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Next slide</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 border-2 border-outline bg-card px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink transition-transform duration-75 hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <SkipForward className="h-2.5 w-2.5" aria-hidden="true" />
            <span>Skip intro</span>
          </button>
        </div>
      </div>
    </div>
  )
}
