import type { ReactNode } from "react"
import clsx from "clsx"
import HQCard from "./HQCard"

interface HQSectionProps {
  title: string
  subtitle?: string
  description?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function HQSection({
  title,
  subtitle,
  description,
  children,
  actions,
  className,
}: HQSectionProps) {
  return (
    <HQCard
      className={clsx("overflow-hidden", className)}
    >
      <div className="space-y-8">

        <div className="relative">

          <div className="absolute left-0 top-0 h-10 w-1 rounded-full bg-cyan-400 shadow-brutal" />

          <div className="pl-6">

            <p className="text-[11px] normal-case tracking-[0.28em] text-cyan-300/70 font-semibold">{subtitle ?? "COMMAND MODULE"}</p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                {description}
              </p>
            )}

          </div>
        </div>

        {children && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {children}
          </div>
        )}

        {actions && (
          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
            {actions}
          </div>
        )}

      </div>
    </HQCard>
  )
}
