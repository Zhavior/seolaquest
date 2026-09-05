import 'server-only'
import { LeadQueryService } from '@/src/modules/leads/application/LeadQueryService'

// All dashboard surfaces share the domain-owned queue and its evidence contract.
export const fetchDashboardLeads = (userId: string) => LeadQueryService.openQueue(userId)
