import type { ReactNode } from "react"

interface HQActionBarProps {
  children: ReactNode
}

export default function HQActionBar({
  children,
}: HQActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-outline bg-highlight p-4 shadow-brutal-lg">
      {children}
    </div>
  )
}
