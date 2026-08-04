'use client'

import type { ReactNode } from 'react'

export default function ShellLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
      {children}
    </div>
  )
}
