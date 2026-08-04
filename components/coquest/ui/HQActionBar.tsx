import type { ReactNode } from "react"

interface HQActionBarProps {
  children: ReactNode
}

export default function HQActionBar({
  children,
}: HQActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-none border-4 border-black bg-[#F7F1DD] p-4 shadow-[6px_6px_0_0_#000]">
      {children}
    </div>
  )
}
