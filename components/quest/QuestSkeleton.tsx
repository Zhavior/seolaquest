import type { ReactNode } from 'react'
import clsx from 'clsx'

import { QuestPageShell } from './QuestPageShell'
import { questSurface } from './questStyles'

/**
 * Loading primitives for the Guild Hall fast-load architecture.
 *
 * Every export here is a plain server component: no hooks, no timers, no
 * `'use client'`. That is the point — route-level `loading.tsx` files and
 * Suspense fallbacks are the very first thing a user sees, so they must not
 * cost a single byte of client JavaScript.
 *
 * Shapes mirror the real screens (parchment page, hard black borders, flat
 * offset shadows) so swapping the fallback for the content does not shift
 * layout.
 */

/** A single pulsing panel matching the `QuestPanel` surface. */
export function QuestSkeletonBlock({
  height = 'h-32',
  className,
}: {
  height?: string
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={questSurface({
        tone: 'none',
        className: clsx(
          'animate-pulse bg-inset motion-reduce:animate-none',
          height,
          className
        ),
      })}
    />
  )
}

export interface QuestListSkeletonProps {
  /** Number of stacked placeholder rows. */
  count?: number
  height?: string
  /**
   * When set, the list announces itself as a live region. Leave unset when
   * nesting inside `QuestRouteSkeleton`, which already owns the announcement.
   */
  label?: string
  className?: string
}

/** Stacked placeholder rows — the shape of a scan run / delivery / signal list. */
export function QuestListSkeleton({
  count = 3,
  height = 'h-40',
  label,
  className,
}: QuestListSkeletonProps) {
  return (
    <div
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
      className={clsx('space-y-4', className)}
    >
      {label ? <span className="sr-only">{label}</span> : null}
      {Array.from({ length: count }).map((_, index) => (
        <QuestSkeletonBlock key={index} height={height} />
      ))}
    </div>
  )
}

const COLUMN_CLASS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

export interface QuestGridSkeletonProps {
  count?: number
  columns?: 2 | 3 | 4
  height?: string
  className?: string
}

/** Responsive card grid — the shape of a stat wall or a plan/field grid. */
export function QuestGridSkeleton({
  count = 4,
  columns = 4,
  height = 'h-32',
  className,
}: QuestGridSkeletonProps) {
  return (
    <div className={clsx('grid gap-4', COLUMN_CLASS[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <QuestSkeletonBlock key={index} height={height} />
      ))}
    </div>
  )
}

/** Placeholder matching `QuestPageHeader`: eyebrow chip, display title, ribbon. */
function QuestHeaderSkeleton({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="min-w-0">
      <div className="mb-2 inline-block rotate-0 border border-outline bg-forest px-3 py-1 text-xs font-semibold normal-case tracking-wide text-accent rounded-xl">
        {label}
      </div>
      <div className="h-14 w-full max-w-xl animate-pulse border border-outline bg-inset shadow-brutal-lg motion-reduce:animate-none sm:h-16 md:h-20 rounded-xl" />
      <div className="mt-3 h-8 w-56 rotate-0 animate-pulse border border-outline bg-zinc-300 motion-reduce:animate-none rounded-xl" />
    </div>
  )
}

/**
 * A row spec: a bare height string for a full-width block, or a grid spec.
 */
export type QuestSkeletonRow = string | QuestGridSkeletonProps

export interface QuestRouteSkeletonProps {
  /** Uppercase kicker rendered in the eyebrow chip, e.g. `GUILD HALL`. */
  label: string
  /** Body rows. Ignored when `children` is provided. */
  rows?: QuestSkeletonRow[]
  /** Custom body, for routes with a bespoke shape. */
  children?: ReactNode
}

/**
 * Full route-level loading shape: the Guild Hall page chrome (parchment,
 * centred 1400px column) plus a header placeholder and a body.
 *
 * Use this as the default export of a `loading.tsx`. Pages should reuse the
 * same file for their inner `<Suspense>` fallback so the streamed and
 * navigated states are identical.
 */
export function QuestRouteSkeleton({ label, rows = ['h-32', 'h-64'], children }: QuestRouteSkeletonProps) {
  return (
    <QuestPageShell>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading {label.toLowerCase()}</span>

        <QuestHeaderSkeleton label={label} />

        {children ??
          rows.map((row, index) =>
            typeof row === 'string' ? (
              <QuestSkeletonBlock key={index} height={row} />
            ) : (
              <QuestGridSkeleton key={index} {...row} />
            )
          )}
      </div>
    </QuestPageShell>
  )
}

export default QuestRouteSkeleton
