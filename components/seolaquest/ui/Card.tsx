import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx(
        'w-full min-w-0 rounded-xl border border-outline bg-card',
        'p-4 md:p-6',
        'shadow-brutal-lg',
        'flex flex-col gap-4',
        className,
      )}
    />
  )
}
