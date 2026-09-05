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
  turquoise: "bg-highlight",
  orange: "bg-highlight",
  white: "bg-card",
}

const bars: Record<Accent, string> = {
  gold: "bg-accent",
  turquoise: "bg-highlight",
  orange: "bg-[#FF8A00]",
  white: "bg-forest",
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
        "border border-outline rounded-xl",
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

          <span className="text-[10px] font-semibold normal-case tracking-[0.22em] text-ink/55">
            {label}
          </span>

          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline bg-card shadow-brutal-sm transition-transform group-hover:rotate-3">
              {icon}
            </div>
          )}

        </div>

        <div className="mt-4 text-4xl font-semibold tracking-tight leading-none text-ink">
          {value}
        </div>

      </div>
    </div>
  )
}
