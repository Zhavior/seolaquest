'use client'

import { useSyncExternalStore } from 'react'

const noop = () => () => {}

function utcText(iso: string): string {
  return `${iso.replace('T', ' ').slice(0, 16)} UTC`
}

function localText(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return utcText(iso)
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    // Keep the UTC text if the browser cannot format dates.
    return utcText(iso)
  }
}

/**
 * A timestamp in the reader's own time zone, e.g. "Oct 8, 2026, 3:42 PM".
 *
 * The server does not know the reader's zone, so the server render shows UTC
 * and the browser renders local time. Rendering local time on the server would
 * print the server's zone and mismatch on hydration.
 */
export function LocalTime({ iso, prefix = '' }: { iso: string; prefix?: string }) {
  const inBrowser = useSyncExternalStore(noop, () => true, () => false)

  return (
    <time dateTime={iso}>
      {prefix}
      {inBrowser ? localText(iso) : utcText(iso)}
    </time>
  )
}
