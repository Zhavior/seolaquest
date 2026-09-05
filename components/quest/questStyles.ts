import clsx from 'clsx'

/**
 * Quest Journal surface tokens.
 *
 * Single source of truth for the `border-N border-black` + `shadow-[Npx_Npx_0_0_#000]`
 * surface pattern that repeats across the Guild Hall, Quest Log (keywords),
 * Quest Board (scan runs) and Campaign Broadcast (deliveries) screens.
 *
 * These are plain class-string builders (not components) so they can be applied
 * to `motion.*` elements, `<form>`, `<Link>` and server-rendered markup alike
 * without forcing a client boundary.
 */

export const QUEST_COLORS = {
  parchmentBg: '#FAF8F0',
  parchmentPanel: '#F3F0E7',
  sand: '#FFF8D9',
  gold: '#E5B75D',
  ember: '#E5B75D',
  lime: '#A3E635',
  cyan: '#06B6D4',
  mint: '#D9FFE3',
  crimson: '#DC2626',
} as const

export type QuestTone =
  | 'white'
  | 'parchment'
  | 'sand'
  | 'gold'
  | 'ember'
  | 'lime'
  | 'cyan'
  | 'mint'
  | 'ink'
  | 'muted'
  | 'none'

export type QuestShadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type QuestBorder = 0 | 2 | 3 | 4

/**
 * Two kinds of tone live here, and the difference decides the text colour:
 *
 *   • Surfaces (white, parchment, muted) follow the theme, so their text is
 *     `text-ink` and flips with it.
 *   • Bright fills (gold, ember, lime, …) stay bright in every theme, so their
 *     text stays `text-on-accent` — black — or it vanishes in grey/blue mode.
 */
const TONE_CLASS: Record<QuestTone, string> = {
  white: 'bg-card text-ink',
  parchment: 'bg-canvas text-ink',
  sand: 'bg-highlight text-on-accent',
  gold: 'bg-accent text-on-accent',
  ember: 'bg-highlight text-on-accent',
  lime: 'bg-highlight text-on-accent',
  cyan: 'bg-inset text-ink',
  mint: 'bg-inset text-ink',
  ink: 'bg-forest text-on-forest',
  muted: 'bg-inset text-ink',
  none: '',
}

/**
 * Static class strings (never template literals) so Tailwind's source scanner
 * always sees the full utility name.
 */
const SHADOW_CLASS: Record<QuestShadow, string> = {
  none: '',
  xs: 'shadow-brutal-sm',
  sm: 'shadow-brutal-sm',
  md: 'shadow-brutal',
  lg: 'shadow-brutal-lg',
  xl: 'shadow-brutal-lg',
}

const BORDER_CLASS: Record<QuestBorder, string> = {
  0: '',
  2: 'border border-hairline rounded-xl',
  3: 'border border-hairline rounded-xl',
  4: 'border border-hairline rounded-xl',
}

/** Hover "lift" used by clickable cards (keyword streams, scan runs, features). */
export const QUEST_LIFT =
  'transition-shadow duration-200 hover:shadow-brutal-lg motion-reduce:transition-none'

export type QuestSurfaceOptions = {
  tone?: QuestTone
  shadow?: QuestShadow
  border?: QuestBorder
  /** Adds the hover lift used by clickable cards. */
  interactive?: boolean
  className?: string
}

export function questSurface({
  tone = 'white',
  shadow = 'lg',
  border = 4,
  interactive = false,
  className,
}: QuestSurfaceOptions = {}) {
  return clsx(
    'min-w-0 rounded-2xl',
    BORDER_CLASS[border],
    TONE_CLASS[tone],
    SHADOW_CLASS[shadow],
    interactive && QUEST_LIFT,
    className
  )
}

/** Small rotated/flat chip: `border-2 border-black ... shadow-[2px_2px_0_0_#000]`. */
export function questBadge({
  tone = 'gold',
  shadow = 'xs',
  border = 2,
  className,
}: QuestSurfaceOptions = {}) {
  return clsx(
    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
    BORDER_CLASS[border],
    TONE_CLASS[tone],
    SHADOW_CLASS[shadow],
    className
  )
}

/** Primary chunky action button. Keeps the 44px minimum touch target. */
export function questButton({
  tone = 'gold',
  shadow = 'md',
  border = 4,
  className,
}: QuestSurfaceOptions = {}) {
  return clsx(
    'inline-flex min-h-11 rounded-xl items-center justify-center gap-2 px-6 py-3 text-sm font-semibold',
    BORDER_CLASS[border],
    TONE_CLASS[tone],
    SHADOW_CLASS[shadow],
    'transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    className
  )
}

/** Section eyebrow text used above panel titles. */
export const QUEST_EYEBROW = 'text-xs font-semibold tracking-wider text-ink-muted'

/** Outline applied to large display headings — follows the theme's hard edge. */
export const QUEST_TITLE_STROKE = { WebkitTextStroke: '0px' } as const
export const QUEST_SUBTITLE_STROKE = { WebkitTextStroke: '0px' } as const
