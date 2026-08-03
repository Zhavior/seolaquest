import type {
  ProviderHealth,
  ScanCounts,
  ScanRunView,
  ScanStatus,
  ScanTrigger,
} from './types'

export type SafeScanRunRecord = {
  id: string
  status: string
  trigger: string
  providerStatus: string
  counts: ScanCounts
  refunded: boolean
  errorCode: string | null
  balance: number | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

const statusMessages: Record<ScanStatus, string> = {
  QUEUED: 'Saved and waiting for the scan worker to start.',
  RUNNING: 'Provider work is in progress. Counts may still change.',
  SUCCEEDED: 'The scan finished. Counts show only results recorded by the backend.',
  FAILED_REFUNDED: 'The scan stopped after automatic attempts and its scan credit was refunded.',
  DEAD: 'The scan stopped after automatic attempts without a recorded refund.',
  CANCELLED: 'The scan was cancelled before it finished.',
  UNKNOWN: 'The saved scan state is not recognized. Refresh later or contact support if it continues.',
}

const providerSummaries: Record<ProviderHealth, string> = {
  NOT_STARTED: 'No provider attempt has been recorded for this run.',
  IN_PROGRESS: 'At least one provider attempt is still in progress.',
  AVAILABLE: 'Recorded provider attempts completed without an outage.',
  PARTIAL_OUTAGE: 'Some provider work completed while at least one source was unavailable or invalid.',
  UNAVAILABLE: 'No provider attempt completed successfully for this run.',
  UNKNOWN: 'Provider health is unavailable. The displayed counts remain the stored backend counts.',
}

export function normalizeScanStatus(status: string): ScanStatus {
  if (
    status === 'QUEUED'
    || status === 'RUNNING'
    || status === 'SUCCEEDED'
    || status === 'FAILED_REFUNDED'
    || status === 'DEAD'
    || status === 'CANCELLED'
  ) {
    return status
  }
  return 'UNKNOWN'
}

export function normalizeScanTrigger(trigger: string): ScanTrigger {
  if (trigger === 'MANUAL' || trigger === 'SCHEDULED') return trigger
  return 'UNKNOWN'
}

export function normalizeProviderHealth(status: string): ProviderHealth {
  if (
    status === 'NOT_STARTED'
    || status === 'IN_PROGRESS'
    || status === 'AVAILABLE'
    || status === 'PARTIAL_OUTAGE'
    || status === 'UNAVAILABLE'
  ) {
    return status
  }
  return 'UNKNOWN'
}

function customerError(
  status: ScanStatus,
  providerHealth: ProviderHealth,
  errorCode: string | null,
) {
  if (status === 'FAILED_REFUNDED') {
    return 'The scan could not finish after automatic attempts. One scan credit was returned.'
  }
  if (status === 'DEAD') {
    return 'The scan stopped after automatic attempts. No refund is recorded; contact support before spending another credit.'
  }
  if (status === 'CANCELLED') {
    return 'The scan was cancelled. No refund is recorded for this run.'
  }
  if (status === 'UNKNOWN') {
    return 'The backend returned an unrecognized scan state. Internal provider details are not shown.'
  }
  if (
    status === 'SUCCEEDED'
    && (providerHealth === 'PARTIAL_OUTAGE' || providerHealth === 'UNAVAILABLE' || errorCode !== null)
  ) {
    return 'The scan completed with limited source availability. Counts include only results the backend recorded.'
  }
  return null
}

function refundMessage(status: ScanStatus, refunded: boolean) {
  if (refunded) return 'Refund recorded: one scan credit was returned for this run.'
  if (status === 'DEAD' || status === 'CANCELLED' || status === 'UNKNOWN') {
    return 'No scan-credit refund is recorded for this run.'
  }
  if (status === 'FAILED_REFUNDED') {
    return 'The run is marked refunded, but refund confirmation is unavailable. Contact support.'
  }
  return 'No refund is recorded or expected for this run in its current state.'
}

export function toScanRunView(record: SafeScanRunRecord): ScanRunView {
  const status = normalizeScanStatus(record.status)
  const providerHealth = normalizeProviderHealth(record.providerStatus)

  return {
    id: record.id,
    status,
    statusMessage: statusMessages[status],
    trigger: normalizeScanTrigger(record.trigger),
    providerHealth,
    providerSummary: providerSummaries[providerHealth],
    counts: record.counts,
    refunded: record.refunded,
    refundMessage: refundMessage(status, record.refunded),
    customerError: customerError(status, providerHealth, record.errorCode),
    currentBalance: record.balance,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
  }
}

export function formatScanTime(value: string | null) {
  if (!value) return 'Not yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date) + ' UTC'
}

export function shortScanRunId(id: string) {
  return id.slice(0, 8)
}
