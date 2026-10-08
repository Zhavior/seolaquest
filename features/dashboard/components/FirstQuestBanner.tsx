'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'

/**
 * The reward banner shown once, immediately after first-run setup commits.
 *
 * It reports what the server already wrote — the quests are assigned inside
 * onboarding, never here — so a refresh or a shared link cannot mint anything.
 * The query params are stripped as soon as it mounts, which is also what stops
 * the banner reappearing on every later visit.
 *
 * It does not announce XP. Finishing setup no longer pays any: progression is
 * earned against the quests this banner is announcing, not against the act of
 * signing up.
 *
 * It stays until dismissed and plays no sound: a message that vanishes on a
 * timer is lost on anyone who reads slowly or looked away, and it names the one
 * thing to do next rather than celebrating.
 */
export default function FirstQuestBanner() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Read once on arrival. The effect below strips these params from the URL,
  // so reading them on every render would blank the counts a moment later.
  const [arrival] = useState(() => ({
    questComplete: params.get('questComplete') === 'first-quest',
    questCount: Number.parseInt(params.get('quests') ?? '', 10),
    sampleCount: Number.parseInt(params.get('samples') ?? '', 10),
  }))
  const { questComplete, questCount, sampleCount } = arrival

  const [visible, setVisible] = useState(questComplete)

  useEffect(() => {
    if (!questComplete) return

    // Consume the params right away. Keeping them in the URL would replay the
    // celebration on every back-navigation to this page.
    const next = new URLSearchParams(params.toString())
    for (const key of ['questComplete', 'quests', 'samples']) next.delete(key)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    // Runs once for the arrival that carried the params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questComplete])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex justify-center"
    >
      <div className="w-full max-w-xl rounded-2xl border border-outline bg-highlight p-4 shadow-brutal-lg">
        <div className="flex items-start gap-3">
          <Sparkles aria-hidden className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={3} />

          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold leading-tight">
              You are set up
            </p>

            <p className="mt-2 text-sm font-semibold text-ink/80">
              Your keyword is saved.
              {Number.isFinite(questCount) && questCount > 0
                ? ` ${questCount} ${questCount === 1 ? 'task is' : 'tasks are'} waiting for you.`
                : ''}
            </p>

            {Number.isFinite(sampleCount) && sampleCount > 0 ? (
              <p className="mt-2 rounded-xl border border-outline bg-card p-2 text-sm font-semibold">
                Try it now: open one of the {sampleCount} sample leads below and save it to
                follow-ups. Sample leads are examples, not real people.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Close this message"
            className="shrink-0 rounded-xl border border-outline bg-card p-3 shadow-brutal-sm"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}
