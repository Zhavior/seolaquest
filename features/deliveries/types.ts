export type DeliveryStatus = 'QUEUED' | 'DELIVERED' | 'DEAD' | 'UNKNOWN'

export type DeliveryView = {
  id: string
  leadId: string
  status: DeliveryStatus
  statusMessage: string
  attempts: number
  maxAttempts: number
  canRetry: boolean
  createdAt: string
  updatedAt: string
  deliveredAt: string | null
}

export type DeliveryListResult = {
  deliveries: DeliveryView[]
  hasMore: boolean
}

export type RetryDeliveryState = {
  outcome: 'idle' | 'success' | 'error'
  message: string
}

export const INITIAL_RETRY_DELIVERY_STATE: RetryDeliveryState = {
  outcome: 'idle',
  message: '',
}
