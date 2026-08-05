'use client'

import type { ReactNode } from 'react'

export default function Workspace({
  children,
}: {
  children: ReactNode
}) {
  return (
    // Pages own their own padding and max-width, so this stays a layout guard
    // rather than a container: min-w-0 lets flex/grid children actually shrink,
    // and the overflow clamp stops one wide child from scrolling the whole page.
    <main className="w-full min-w-0 max-w-full overflow-x-clip">
      {children}
    </main>
  )
}
