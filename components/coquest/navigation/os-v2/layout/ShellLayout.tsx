'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'

interface ShellLayoutProps {
  collapsed?: boolean
  sidebar: ReactNode
  statusBar: ReactNode
  children: ReactNode
}

export default function ShellLayout({
  collapsed = false,
  sidebar,
  statusBar,
  children,
}: ShellLayoutProps) {
  return (
    <div
      className={clsx(
        "grid min-h-screen bg-[#F4EFE6] transition-[grid-template-columns] duration-300 ease-in-out",
        collapsed
          ? "lg:grid-cols-[88px_1fr]"
          : "lg:grid-cols-[320px_1fr]"
      )}
    >
      <aside className="border-r-[3px] border-black bg-[#FFF3C4]">
        {sidebar}
      </aside>

      <section className="flex min-w-0 flex-col">
        <header className="border-b-[3px] border-black bg-[#FFF8D6]">
          {statusBar}
        </header>

        <main className="min-h-0 flex-1 overflow-auto">
          {children}
        </main>
      </section>
    </div>
  )
}
