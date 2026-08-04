'use client'

import type { ReactNode } from 'react'

export default function Workspace({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#F4EFE6]">
      {children}
    </main>
  )
}
