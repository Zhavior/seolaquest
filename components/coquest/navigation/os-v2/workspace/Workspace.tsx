'use client'

import type { ReactNode } from 'react'

export default function Workspace({
  children,
}: {
  children: ReactNode
}) {
  return (
    <main className="w-full">
      {children}
    </main>
  )
}
