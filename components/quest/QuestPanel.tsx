import type { HTMLAttributes, ReactNode } from 'react'
import { questSurface, type QuestBorder, type QuestShadow, type QuestTone } from './questStyles'

type QuestPanelElement = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'li'

export interface QuestPanelProps extends HTMLAttributes<HTMLElement> {
  /** Semantic element to render. Defaults to `div`. */
  as?: QuestPanelElement
  tone?: QuestTone
  shadow?: QuestShadow
  border?: QuestBorder
  /** Adds the hover lift used by clickable cards. */
  interactive?: boolean
  /** Padding preset. `none` lets the caller own spacing (e.g. tables). */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children?: ReactNode
}

const PADDING_CLASS = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
} as const

/**
 * The Guild Hall card/panel surface: hard black border, flat offset shadow,
 * square corners. Use this instead of re-typing
 * `border-4 border-outline bg-card p-6 shadow-brutal-lg`.
 *
 * For `motion.*` elements or `<Link>`/`<form>`, use `questSurface()` from
 * `./questStyles` to get the same class string.
 */
export function QuestPanel({
  as = 'div',
  tone = 'white',
  shadow = 'lg',
  border = 4,
  interactive = false,
  padding = 'md',
  className,
  children,
  ...rest
}: QuestPanelProps) {
  // Every allowed tag shares the same generic HTML attribute surface, so a
  // single-tag cast keeps JSX prop checking meaningful without a generic
  // polymorphic component.
  const Tag = as as 'div'

  return (
    <Tag
      {...rest}
      className={questSurface({
        tone,
        shadow,
        border,
        interactive,
        className: `${PADDING_CLASS[padding]} ${className ?? ''}`.trim(),
      })}
    >
      {children}
    </Tag>
  )
}

export default QuestPanel
