export type BusinessEvent =
  | {
      type: 'scan_started'
      scanId: string
      startedAt: string
      source: string
      keywordCount: number
    }
  | {
      type: 'source_connected'
      scanId: string
      occurredAt: string
      source: string
      status: 'connected' | 'rate_limited' | 'failed'
    }
  | {
      type: 'post_discovered'
      scanId: string
      occurredAt: string
      source: string
      postId: string
      authorHandle?: string
    }
  | {
      type: 'post_analyzed'
      scanId: string
      occurredAt: string
      postId: string
      relevanceScore: number
      intentScore?: number
    }
  | {
      type: 'lead_qualified'
      scanId: string
      occurredAt: string
      leadId: string
      source: string
      quality: 'low' | 'medium' | 'high' | 'mythic'
      revenueBand?: 'small' | 'mid' | 'enterprise'
    }
  | {
      type: 'crm_delivery_created'
      scanId: string
      occurredAt: string
      deliveryId: string
      leadId: string
      destination: string
    }
  | {
      type: 'scan_finished'
      scanId: string
      finishedAt: string
      discoveredCount: number
      qualifiedCount: number
      deliveredCount: number
    }
