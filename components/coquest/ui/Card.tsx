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
        'w-full min-w-0 rounded-xl border-4 border-black bg-white',
        'p-4 md:p-6',
        'shadow-[6px_6px_0_0_#000]',
        'flex flex-col gap-4',
        className,
      )}
    />
  )
}
