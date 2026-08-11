'use client'

import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import clsx from 'clsx'

interface HQInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> {
  label: string
  /** Rendered below the field and wired up via aria-describedby. */
  hint?: string
  /** Presence of this switches the field to its invalid state. */
  error?: string
  /** Visually hide the label without hiding it from assistive tech. */
  hideLabel?: boolean
}

/**
 * A label is not optional, so it is a required prop rather than something a
 * caller can forget. `hideLabel` covers the search-field case where the design
 * carries the meaning visually.
 *
 * The field uses the recessed surface (`bg-inset`) rather than the card
 * surface: in a style with no blur and no inner shadow, surface elevation is
 * the only cue that distinguishes an input from a block of text.
 */
export function HQInput({ label, hint, error, hideLabel = false, className, id, ...props }: HQInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={clsx(
          'text-xs font-black uppercase tracking-[0.12em] text-ink',
          hideLabel && 'sr-only'
        )}
      >
        {label}
      </label>

      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={clsx(
          'min-h-11 w-full min-w-0',
          'border-4 border-outline bg-inset px-3 py-2',
          'font-bold text-ink placeholder:text-ink-muted',
          // The global :focus-visible ring in globals.css handles focus, so
          // nothing here removes or overrides the outline.
          error && 'border-danger',
          className
        )}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs font-bold text-ink-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs font-black uppercase text-danger-ink">
          {error}
        </p>
      )}
    </div>
  )
}

export default HQInput
