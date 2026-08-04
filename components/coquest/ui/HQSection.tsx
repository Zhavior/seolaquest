import type { ReactNode } from "react"
import clsx from "clsx"

interface HQSectionProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function HQSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: HQSectionProps) {
  return (
    <section
      className={clsx(
        "border-4 border-black bg-[#F7F1DD]",
        "shadow-[6px_6px_0_0_#000]",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b-4 border-black bg-[#FFE082] px-5 py-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wide">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/60">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>

      <div className="p-5">
        {children}
      </div>
    </section>
  )
}
