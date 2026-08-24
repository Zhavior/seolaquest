import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Class merge helper. `clsx` resolves conditionals, `twMerge` resolves the
 * conflicts that conditionals create — without it, a base `bg-x` and a
 * conditional `bg-y` both survive into the class list and the winner is
 * decided by stylesheet order rather than by the condition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
