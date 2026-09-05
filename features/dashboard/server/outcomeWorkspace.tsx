import 'server-only'
import { LeadQueryService } from '@/src/modules/leads/application/LeadQueryService'
import { listCurrentUserScanRuns } from '@/features/scans/queries'
import { OutcomeWorkspace } from '../components/OutcomeWorkspace'

export async function DashboardOutcomeWorkspace({ userId }: { userId: string }) {
  const [pipeline, scans] = await Promise.allSettled([
    LeadQueryService.pipeline(userId), listCurrentUserScanRuns(),
  ])
  return <OutcomeWorkspace pipeline={pipeline.status === 'fulfilled' ? pipeline.value : null}
    scans={scans.status === 'fulfilled' ? scans.value.runs : null} checkedAt={new Date().toISOString()} />
}
