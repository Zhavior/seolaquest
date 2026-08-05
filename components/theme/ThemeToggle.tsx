'use client'

import { useCallback, useRef } from 'react'
import clsx from 'clsx'
import { Moon, Sparkles, Sun, type LucideIcon } from 'lucide-react'

import { sfx } from '@/lib/sfx'
import { useTheme } from './ThemeProvider'
import { THEMES, THEME_META, type Theme } from './theme-config'

const ICONS: Record<Theme, LucideIcon> = {
  parchment: Sun,
  grey: Moon,
  blue: Sparkles,
}

/**
 * Three-way theme picker. A real radiogroup with roving tabindex and arrow-key
 * navigation — three independent buttons would announce as three unrelated
 * controls with no sense of "one of three selected".
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const select = useCallback(
    (next: Theme) => {
      if (next === theme) return
      setTheme(next)
      sfx.playSidebarCollapse()
    },
    [theme, setTheme],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const delta =
        event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
            ? -1
            : 0
      if (delta === 0) return
      event.preventDefault()
      const nextIndex = (index + delta + THEMES.length) % THEMES.length
      select(THEMES[nextIndex])
      refs.current[nextIndex]?.focus()
    },
    [select],
  )

  return (
    <div
      role="radiogroup"
      aria-label="Interface theme"
      className={clsx(
        'inline-flex items-center gap-1 border-4 border-outline bg-surface p-1',
        className,
      )}
    >
      {THEMES.map((name, index) => {
        const Icon = ICONS[name]
        const active = theme === name
        return (
          <button
            key={name}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={THEME_META[name].label}
            title={THEME_META[name].label}
            tabIndex={active ? 0 : -1}
            onClick={() => select(name)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={clsx(
              'touch-target flex items-center gap-1.5 border-2 px-2.5 py-1.5',
              'text-[11px] font-black uppercase leading-none tracking-wider',
              'apple-snappy transition-[background-color,color,box-shadow,transform] duration-150',
              'active:translate-x-[1px] active:translate-y-[1px]',
              active
                ? 'border-outline bg-accent text-on-accent shadow-brutal-sm'
                : 'border-transparent text-ink-muted hover:border-hairline hover:text-ink',
            )}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{THEME_META[name].short}</span>
          </button>
        )
      })}
    </div>
  )
}
