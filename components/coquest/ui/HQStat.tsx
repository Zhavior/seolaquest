import type { ReactNode } from "react"
import clsx from "clsx"

type Accent =
  | "gold"
  | "turquoise"
  | "orange"
  | "white"

interface HQStatProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  accent?: Accent
  className?: string
}

const accents: Record<Accent, string> = {
  gold: "bg-highlight-strong",
  turquoise: "bg-[#B8FFF3]",
  orange: "bg-[#FFD2A8]",
  white: "bg-card",
}

const bars: Record<Accent, string> = {
  gold: "bg-[#F7B500]",
  turquoise: "bg-[#00D6B3]",
  orange: "bg-[#FF8A00]",
  white: "bg-[#222]",
}

export default function HQStat({
  label,
  value,
  icon,
  accent = "white",
  className,
}: HQStatProps) {
  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-[20px]",
        "border-4 border-outline",
        "shadow-brutal-lg",
        "transition-all duration-150",
        "hover:-translate-x-[2px]",
        "hover:-translate-y-[2px]",
        "hover:shadow-brutal-lg",
        accents[accent],
        className,
      )}
    >
      <div className={clsx("absolute inset-x-0 top-0 h-2", bars[accent])} />

      <div className="p-5 pt-6">

        <div className="flex items-center justify-between">

          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/55">
            {label}
          </span>

          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-3 border-outline bg-card shadow-brutal-sm transition-transform group-hover:rotate-3">
              {icon}
            </div>
          )}

        </div>

        <div className="mt-4 text-4xl font-black tracking-tight leading-none text-ink">
          {value}
        </div>

      </div>
    </div>
  )
}
