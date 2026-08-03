export const SCAN_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED_REFUNDED',
  'DEAD',
  'CANCELLED',
  'UNKNOWN',
] as const

export type ScanStatus = (typeof SCAN_STATUSES)[number]

export type ScanTrigger = 'MANUAL' | 'SCHEDULED' | 'UNKNOWN'

export type ProviderHealth =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'AVAILABLE'
  | 'PARTIAL_OUTAGE'
  | 'UNAVAILABLE'
  | 'UNKNOWN'

export type ScanCounts = {
  leadsCreated: number
  providerAttempts: number
  providerResults: number
}

export type ScanRunView = {
  id: string
  status: ScanStatus
  statusMessage: string
  trigger: ScanTrigger
  providerHealth: ProviderHealth
  providerSummary: string
  counts: ScanCounts
  refunded: boolean
  refundMessage: string
  customerError: string | null
  currentBalance: number | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type ScanRunListResult = {
  runs: ScanRunView[]
  hasMore: boolean
}
