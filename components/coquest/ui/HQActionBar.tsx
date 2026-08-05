import type { ReactNode } from "react"

interface HQActionBarProps {
  children: ReactNode
}

export default function HQActionBar({
  children,
}: HQActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-none border-4 border-outline bg-[#F7F1DD] p-4 shadow-brutal-lg">
      {children}
    </div>
  )
}
