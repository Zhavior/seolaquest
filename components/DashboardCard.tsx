import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

/**
 * Reference implementation of the tokenised card surface.
 *
 * Every colour here is a semantic utility, so the three themes need zero
 * per-theme overrides. Copy this shape when building new tactical panels.
 */

type Status = 'success' | 'warning' | 'danger' | 'info'

const STATUS_STYLES: Record<Status, string> = {
  success: 'bg-success text-on-accent',
  warning: 'bg-warning text-on-accent',
  danger: 'bg-danger text-on-accent',
  info: 'bg-info text-on-accent',
}

export interface DashboardCardProps {
  title: string
  value: string | number
  hint?: string
  icon: LucideIcon
  status?: Status
  statusLabel?: string
  /** 0–100. Renders the tactical readout bar when present. */
  progress?: number
  /** Hero/CTA cards keep an offset slab on dark themes; regular cards don't. */
  emphasis?: boolean
  className?: string
}

export function DashboardCard({
  title,
  value,
  hint,
  icon: Icon,
  status = 'info',
  statusLabel,
  progress,
  emphasis = false,
  className,
}: DashboardCardProps) {
  return (
    <article
      className={clsx(
        'group relative border-4 border-outline bg-card p-4',
        // On the light theme the black slab is the depth cue. On dark themes
        // `--shadow-color` is transparent, so the light border carries the
        // silhouette instead and only emphasis cards keep a (tinted) slab.
        emphasis ? 'shadow-brutal-accent' : 'shadow-brutal',
        'apple-spring transition-[transform,box-shadow] duration-200',
        'hover:-translate-x-[2px] hover:-translate-y-[2px]',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center border-2 border-outline bg-accent text-on-accent"
          >
            <Icon className="size-4" strokeWidth={3} />
          </span>
          <h3 className="truncate-safe text-[11px] font-black uppercase tracking-[0.14em] text-ink-muted">
            {title}
          </h3>
        </div>

        {statusLabel && (
          <span
            className={clsx(
              'shrink-0 border-2 border-outline px-2 py-0.5',
              'text-[10px] font-black uppercase leading-none tracking-wider',
              STATUS_STYLES[status],
            )}
          >
            {statusLabel}
          </span>
        )}
      </header>

      <p className="mt-3 font-mono text-3xl font-black tabular-nums text-ink">{value}</p>

      {hint && <p className="mt-1 break-word-safe text-xs font-medium text-ink-muted">{hint}</p>}

      {typeof progress === 'number' && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${title} progress`}
          className="mt-4 h-3 w-full border-2 border-outline bg-inset"
        >
          <div
            className="h-full bg-accent-2 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </article>
  )
}
