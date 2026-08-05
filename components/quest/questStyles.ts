import clsx from 'clsx'

/**
 * Guild Hall neo-brutalist design tokens.
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
  parchmentBg: '#FDFBF7',
  parchmentPanel: '#F4F0EA',
  sand: '#FFF8D9',
  gold: '#FFE600',
  ember: '#FF5722',
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
  ember: 'bg-accent-2 text-white',
  lime: 'bg-success text-on-accent',
  cyan: 'bg-info text-on-accent',
  mint: 'bg-[#D9FFE3] text-on-accent',
  ink: 'bg-black text-white',
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
  2: 'border-2 border-outline',
  3: 'border-3 border-outline',
  4: 'border-4 border-outline',
}

/** Hover "lift" used by clickable cards (keyword streams, scan runs, features). */
export const QUEST_LIFT =
  'transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0'

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
    'min-w-0',
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
    'inline-flex items-center gap-2 px-3 py-1 text-xs font-black uppercase tracking-widest',
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
    'inline-flex min-h-11 items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase',
    BORDER_CLASS[border],
    TONE_CLASS[tone],
    SHADOW_CLASS[shadow],
    'transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    className
  )
}

/** Section eyebrow text used above panel titles. */
export const QUEST_EYEBROW = 'text-xs font-black uppercase tracking-wider text-ink-muted'

/** Outline applied to large display headings — follows the theme's hard edge. */
export const QUEST_TITLE_STROKE = { WebkitTextStroke: '2px var(--border-strong)' } as const
export const QUEST_SUBTITLE_STROKE = { WebkitTextStroke: '1px var(--border-strong)' } as const
