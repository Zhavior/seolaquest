import type { ReactNode } from "react"
import clsx from "clsx"

interface HQCardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  icon?: ReactNode
  variant?:
    | "default"
    | "mission"
    | "danger"
    | "success"
    | "warning"
}

const variants = {
  default:
    "bg-white/70 dark:bg-white/[0.04] border-white/10",

  mission:
    "bg-gradient-to-br from-sky-500/10 via-cyan-400/5 to-transparent border-cyan-400/20",

  danger:
    "bg-gradient-to-br from-red-500/10 via-red-400/5 to-transparent border-red-400/20",

  success:
    "bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-transparent border-emerald-400/20",

  warning:
    "bg-gradient-to-br from-amber-500/10 via-orange-400/5 to-transparent border-orange-300/20",
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
        "group relative overflow-hidden rounded-3xl",
        "border",
        "backdrop-blur-2xl",
        "transition-all duration-300",
        "hover:-translate-y-1",
        "hover:shadow-[0_25px_60px_rgba(0,0,0,.45)]",
        "before:absolute before:inset-0",
        "before:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.08),transparent_55%)]",
        "before:pointer-events-none",
        variants[variant],
        className,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,.04),transparent)]" />

      <div className="relative z-10 p-7">
        {(title || subtitle) && (
          <header className="mb-6">
            {subtitle && (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                {subtitle}
              </p>
            )}

            <div className="flex items-center gap-3">
              {icon}

              {title && (
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {title}
                </h2>
              )}
            </div>
          </header>
        )}

        {children}
      </div>
    </section>
  )
}
