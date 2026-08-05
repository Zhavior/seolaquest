'use client'

import { useClerk } from '@clerk/nextjs'
import type { ReactNode } from 'react'

interface LogOutButtonProps {
  /** Visual styling is owned by the caller so each shell keeps its own chrome. */
  className?: string
  title?: string
  /** Defaults to "Log out" so icon-only variants stay announced. */
  'aria-label'?: string
  /** Fires before sign-out (sfx, closing the mobile drawer, etc.). */
  onBeforeSignOut?: () => void
  onMouseEnter?: () => void
  onFocus?: () => void
  children: ReactNode
}

/**
 * Real logout control. Ends the Clerk session first, then sends the browser to
 * the marketing home page. Rendering a plain `<Link href="/sign-in">` here would
 * only navigate — the session cookie would survive and Clerk would immediately
 * re-authenticate the user straight back into the app.
 */
export default function LogOutButton({
  className,
  title,
  'aria-label': ariaLabel = 'Log out',
  onBeforeSignOut,
  onMouseEnter,
  onFocus,
  children,
}: LogOutButtonProps) {
  const { signOut } = useClerk()

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onClick={() => {
        onBeforeSignOut?.()
        void signOut({ redirectUrl: '/' })
      }}
      className={className}
    >
      {children}
    </button>
  )
}
