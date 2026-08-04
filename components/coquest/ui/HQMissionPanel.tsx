import type { ReactNode } from "react"
import HQCard from "./HQCard"

interface HQMissionPanelProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
  children?: ReactNode
}

export default function HQMissionPanel({
  eyebrow = "Battle Area",
  title,
  description,
  actions,
  children,
}: HQMissionPanelProps) {
  return (
    <HQCard
      variant="mission"
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-[size:18px_18px]" />
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-black/60">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-base font-medium text-black/70">
            {description}
          </p>
        </div>

        {children && (
          <div className="grid gap-4 md:grid-cols-4">
            {children}
          </div>
        )}

        {actions && (
          <div className="flex flex-wrap gap-3">
            {actions}
          </div>
        )}
      </div>
    </HQCard>
  )
}
