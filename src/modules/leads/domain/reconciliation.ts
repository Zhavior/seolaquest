export type ScanReconciliationOutcomeCode =
  | 'DEAD_JOB_RECONCILED'
  | 'STRANDED_SCAN_RECONCILED'
  | 'REFUND_SKIPPED'
  | 'REFUND_SUCCEEDED'
  | 'REFUND_FAILED'

export type ScanReconciliationItemOutcome = {
  runId: string
  errorCode: string
  outcome: ScanReconciliationOutcomeCode
}

export type ScanReconciliationSummary = {
  candidates: number
  refunded: number
  failed: number
  items: ScanReconciliationItemOutcome[]
}

export function initialScanReconciliationSummary(): ScanReconciliationSummary {
  return {
    candidates: 0,
    refunded: 0,
    failed: 0,
    items: [],
  }
}

export function incrementRefunded(summary: ScanReconciliationSummary, item: ScanReconciliationItemOutcome) {
  summary.refunded += 1
  summary.items.push(item)
}

export function incrementFailed(summary: ScanReconciliationSummary, item: ScanReconciliationItemOutcome) {
  summary.failed += 1
  summary.items.push(item)
}
