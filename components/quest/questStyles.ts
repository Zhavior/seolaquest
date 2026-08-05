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

const TONE_CLASS: Record<QuestTone, string> = {
  white: 'bg-white text-black',
  parchment: 'bg-[#F4F0EA] text-black',
  sand: 'bg-[#FFF8D9] text-black',
  gold: 'bg-[#FFE600] text-black',
  ember: 'bg-[#FF5722] text-white',
  lime: 'bg-[#A3E635] text-black',
  cyan: 'bg-[#06B6D4] text-black',
  mint: 'bg-[#D9FFE3] text-black',
  ink: 'bg-black text-white',
  muted: 'bg-zinc-50 text-black',
  none: '',
}

/**
 * Static class strings (never template literals) so Tailwind's source scanner
 * always sees the full utility name.
 */
const SHADOW_CLASS: Record<QuestShadow, string> = {
  none: '',
  xs: 'shadow-[2px_2px_0_0_#000]',
  sm: 'shadow-[3px_3px_0_0_#000]',
  md: 'shadow-[4px_4px_0_0_#000]',
  lg: 'shadow-[6px_6px_0_0_#000]',
  xl: 'shadow-[8px_8px_0_0_#000]',
}

const BORDER_CLASS: Record<QuestBorder, string> = {
  0: '',
  2: 'border-2 border-black',
  3: 'border-3 border-black',
  4: 'border-4 border-black',
}

/** Hover "lift" used by clickable cards (keyword streams, scan runs, features). */
export const QUEST_LIFT =
  'transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0_0_#000] motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0'

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
export const QUEST_EYEBROW = 'text-xs font-black uppercase tracking-wider text-gray-500'

/** Black outline applied to large display headings. */
export const QUEST_TITLE_STROKE = { WebkitTextStroke: '2px black' } as const
export const QUEST_SUBTITLE_STROKE = { WebkitTextStroke: '1px black' } as const
