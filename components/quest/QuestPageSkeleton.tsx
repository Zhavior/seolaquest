import clsx from 'clsx'
import { questSurface } from './questStyles'

export interface QuestPageSkeletonProps {
  /** Number of body blocks below the header placeholder. */
  blocks?: number
  className?: string
}

/**
 * Suspense placeholder matching the quest page rhythm (parchment background,
 * bordered blocks with the flat offset shadow).
 */
export function QuestPageSkeleton({ blocks = 2, className }: QuestPageSkeletonProps) {
  const heights = ['h-32', 'h-64', 'h-40', 'h-40']

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx('min-h-[100dvh] w-full max-w-full space-y-6 bg-[#FDFBF7] p-4 sm:p-8', className)}
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={questSurface({
            tone: 'none',
            className: clsx('animate-pulse bg-zinc-200 motion-reduce:animate-none', heights[i % heights.length]),
          })}
        />
      ))}
    </div>
  )
}

export default QuestPageSkeleton
