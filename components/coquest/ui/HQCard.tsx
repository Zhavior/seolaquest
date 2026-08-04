import type { ReactNode } from "react"
import clsx from "clsx"

type HQCardVariant =
  | "default"
  | "mission"
  | "intel"
  | "warning"

interface HQCardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  icon?: ReactNode
  variant?: HQCardVariant
}

const variants: Record<HQCardVariant, string> = {
  default: "bg-white",
  mission: "bg-[#FFF8D6]",
  intel: "bg-[#EEF8FF]",
  warning: "bg-[#FFE7C7]",
}

export default function HQCard({
  children,
  className,
  title,
  subtitle,
  icon,
  variant = "default",
}: HQCardProps) {
  return (
    <section
      className={clsx(
        "rounded-none border-4 border-black shadow-[6px_6px_0_0_#000]",
        "p-6",
        variants[variant],
        className,
      )}
    >
      {(title || subtitle) && (
        <header className="mb-5">
          {subtitle && (
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-black/60">
              {subtitle}
            </p>
          )}

          <div className="flex items-center gap-3">
            {icon}

            {title && (
              <h2 className="text-2xl font-black tracking-tight">
                {title}
              </h2>
            )}
          </div>
        </header>
      )}

      {children}
    </section>
  )
}
