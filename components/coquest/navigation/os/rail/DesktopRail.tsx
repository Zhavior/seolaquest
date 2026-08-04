'use client'

import type { ReactNode } from 'react'

interface DesktopRailProps {
  collapsed: boolean
  children: ReactNode
}

export function DesktopRail({
  collapsed,
  children,
}: DesktopRailProps) {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex">
      <div
        className={[
          "h-dvh",
          "overflow-hidden",
          "transition-[width]",
          "duration-300",
          "ease-out",
          collapsed ? "w-24" : "w-80",
        ].join(" ")}
      >
        {children}
      </div>
    </aside>
  )
}
