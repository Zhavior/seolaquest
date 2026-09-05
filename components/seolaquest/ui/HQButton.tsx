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

// Fills only. The lift and press live in the base class list so every variant
// moves identically — a per-variant hover translate is how a button set starts
// feeling inconsistent.
const variants: Record<Variant, string> = {
  primary: "bg-forest text-accent",
  secondary: "bg-card text-ink",
  // `text-on-accent` is black in every theme, which made this unreadable on the
  // dark grounds — a transparent fill inherits the page, not an accent. Theme
  // ink is correct in both places: on a bright panel the ink inversion in
  // globals.css already resolves `text-ink` to the on-accent black.
  ghost: "bg-transparent text-ink hover:bg-black/5",
  danger: "bg-[#D92D20] text-white",
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
        "inline-flex items-center justify-center gap-2",
        "border border-outline rounded-xl",
        // 44px is the minimum touch target. px-4 py-2 on a small label lands
        // under 40, which fails on every phone.
        "min-h-11 px-4 py-2",
        "font-semibold normal-case tracking-[0.08em]",
        "shadow-brutal",
        "transition-[transform,box-shadow] duration-100 ease-out",
        // The press has to conserve the footprint: the element moves into its
        // shadow by the same amount the shadow shrinks, so the button depresses
        // instead of sliding. `shadow-none` broke that — the slab vanished and
        // the button looked like it fell off the page.
        "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg",
        "active:translate-x-1 active:translate-y-1 active:shadow-brutal-sm",
        "disabled:pointer-events-none disabled:opacity-50",
        // The entire interaction is movement, so it needs an opt-out. Colour
        // and focus state still convey everything.
        "motion-reduce:transition-none",
        "motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
        "motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0",
        variants[variant],
        className
      )}
    >
      {icon}
      {children}
    </button>
  )
}
