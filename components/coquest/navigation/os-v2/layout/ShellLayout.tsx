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
    <div className="min-h-screen bg-[#FAF7F2] text-black flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      {statusBar}
      <div className="flex flex-1">
        {sidebar}
        <div className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
