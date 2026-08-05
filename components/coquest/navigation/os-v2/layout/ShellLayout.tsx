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
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#FAF7F2] text-black flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      {statusBar}
      <div className="flex flex-1 min-w-0 max-w-full overflow-x-hidden">
        {sidebar}
        <div className="flex-1 min-w-0 max-w-full overflow-x-hidden p-2 sm:p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
