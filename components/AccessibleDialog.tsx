'use client'

import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let bodyScrollLockCount = 0
let previousBodyOverflow = ''
let previousHtmlOverflow = ''

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }
  bodyScrollLockCount += 1
}

function unlockBodyScroll() {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
    document.documentElement.style.overflow = previousHtmlOverflow
  }
}

function getFocusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    return !element.closest('[hidden], [aria-hidden="true"]') && element.tabIndex >= 0
  })
}

interface AccessibleDialogProps {
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy: string
  children: ReactNode
  panelClassName: string
  overlayClassName?: string
  initialFocusRef?: RefObject<HTMLElement | null>
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  initial?: HTMLMotionProps<'div'>['initial']
  animate?: HTMLMotionProps<'div'>['animate']
  exit?: HTMLMotionProps<'div'>['exit']
  transition?: HTMLMotionProps<'div'>['transition']
}

export default function AccessibleDialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  panelClassName,
  overlayClassName = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4',
  initialFocusRef,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initial,
  animate,
  exit,
  transition,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const closeOnEscapeRef = useRef(closeOnEscape)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    closeOnEscapeRef.current = closeOnEscape
  }, [closeOnEscape])

  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const getInitialFocus = () => {
      const preferred = initialFocusRef?.current
      if (preferred && dialog.contains(preferred) && preferred.matches(FOCUSABLE_SELECTOR)) {
        return preferred
      }
      return getFocusableElements(dialog)[0] ?? dialog
    }

    lockBodyScroll()
    getInitialFocus().focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current && !event.defaultPrevented) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(dialog)
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) {
        getInitialFocus().focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      unlockBodyScroll()
      if (opener?.isConnected) opener.focus()
    }
  }, [initialFocusRef, open])

  if (!open) return null

  return (
    <div
      className={overlayClassName}
      data-dialog-backdrop="true"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        className={panelClassName}
        data-dialog-scroll-container="true"
        style={{
          maxHeight: 'calc(100dvh - 2rem)',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
