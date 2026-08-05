'use client'

import type { ReactNode } from 'react'

interface ShellLayoutProps {
  collapsed?: boolean
  sidebar: ReactNode
  statusBar: ReactNode
  children: ReactNode
}

export default function ShellLayout({
  sidebar,
  statusBar,
  children,
}: ShellLayoutProps) {
  return (
    // `overflow-x-clip` throughout, never `overflow-x-hidden`. Both contain
    // horizontal overflow, but `hidden` makes the element a scroll container,
    // and a scroll-container ancestor is what `position: sticky` resolves
    // against — so the row on the second line below would silently stop the
    // sidebar rail from pinning. `clip` contains overflow without that effect.
    <div className="h-dvh max-w-full overflow-hidden overscroll-none bg-canvas text-ink flex flex-col font-sans selection:bg-yellow-400 selection:text-ink">
      {statusBar}
      <div className="flex flex-1 min-w-0 max-w-full overflow-hidden">
        {sidebar}
        <div className="flex-1 min-w-0 max-w-full overflow-x-hidden overflow-y-auto overscroll-contain p-2 sm:p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
