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
  gold: "bg-[#FFE082]",
  turquoise: "bg-[#B8FFF3]",
  orange: "bg-[#FFD2A8]",
  white: "bg-white",
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
        "border-4 border-black",
        "shadow-[4px_4px_0_0_#000]",
        "p-4",
        "flex flex-col gap-2",
        accents[accent],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon}

        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/60">
          {label}
        </span>
      </div>

      <div className="text-3xl font-black tracking-tight">
        {value}
      </div>
    </div>
  )
}
