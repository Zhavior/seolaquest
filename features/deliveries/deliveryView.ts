import type { DeliveryStatus, DeliveryView } from './types'

export type SafeDeliveryRecord = {
  id: string
  leadId: string
  status: string
  createdAt: Date
  updatedAt: Date
  deliveredAt: Date | null
  durableJob: {
    status: string
    attempts: number
    maxAttempts: number
  } | null
}

const statusMessages: Record<DeliveryStatus, string> = {
  QUEUED: 'Waiting for the delivery worker or another automatic attempt.',
  DELIVERED: 'Your CRM accepted this delivery.',
  DEAD: 'Delivery stopped after its automatic attempts. Check your CRM connection before retrying.',
  UNKNOWN: 'The current delivery state is unavailable. Refresh later or contact support if it continues.',
}

export function normalizeDeliveryStatus(status: string): DeliveryStatus {
  if (status === 'QUEUED' || status === 'DELIVERED' || status === 'DEAD') {
    return status
  }
  return 'UNKNOWN'
}

export function toDeliveryView(record: SafeDeliveryRecord): DeliveryView {
  const status = normalizeDeliveryStatus(record.status)
  const attempts = record.durableJob?.attempts ?? 0
  const maxAttempts = record.durableJob?.maxAttempts ?? 0

  return {
    id: record.id,
    leadId: record.leadId,
    status,
    statusMessage: statusMessages[status],
    attempts,
    maxAttempts,
    canRetry: status === 'DEAD' && record.durableJob?.status === 'DEAD',
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deliveredAt: record.deliveredAt?.toISOString() ?? null,
  }
}

export function formatDeliveryTime(value: string | null) {
  if (!value) return 'Not yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date) + ' UTC'
}

export function formatAttempts(attempts: number, maxAttempts: number) {
  return maxAttempts > 0 ? `${attempts} of ${maxAttempts}` : String(attempts)
}

export function shortDeliveryId(id: string) {
  return id.slice(0, 8)
}
