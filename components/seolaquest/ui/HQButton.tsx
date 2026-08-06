import type { ButtonHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"

interface HQButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  icon?: ReactNode
  variant?: Variant
}

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-[#FFE600] hover:-translate-y-0.5",
  secondary:
    "bg-card text-ink hover:-translate-y-0.5",
  ghost:
    "bg-transparent text-on-accent hover:bg-black/5",
  danger:
    "bg-[#D92D20] text-white hover:-translate-y-0.5",
}

export default function HQButton({
  children,
  className,
  icon,
  variant = "primary",
  ...props
}: HQButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center gap-2",
        "border-4 border-outline",
        "px-4 py-2",
        "font-black uppercase tracking-[0.08em]",
        "shadow-brutal",
        "transition-all duration-150",
        "active:translate-x-[2px] active:translate-y-[2px]",
        "active:shadow-none",
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
