import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { History, Sparkles } from 'lucide-react'
import { listCurrentUserScanRuns } from '@/features/scans/queries'
import { QuestPageHeader, QuestPageShell, QuestStatusPill, QuestTicker } from '@/components/quest'
import { ScanRunListSkeleton } from './loading'

const ScanRunList = dynamic(() => import('@/features/scans/components/ScanRunList').then((m) => m.ScanRunList))

export const metadata: Metadata = {
  title: 'Scan Runs | SEOlaQuest',
  description: 'Review the durable backend status of every scan this account has queued.',
}

/**
 * The scan-run ledger.
 *
 * This page used to be called the Quest Board, which it never was: it lists
 * jobs, counts and timestamps. The real board — quests, progress and rewards —
 * lives at /app/quests. A page named after a game surface that renders an audit
 * log teaches users to distrust both.
 */
export default function ScanRunsPage() {
  return (
    <QuestPageShell watermark={<History className="h-[650px] w-[650px] text-ink" />}>
      <QuestTicker label="Battle scans. Measured run ledger.">
        <Sparkles className="h-5 w-5 text-ink" /> 🛡️ BATTLE SCANS{' '}
        <Sparkles className="h-5 w-5 text-ink" /> 📊 MEASURED RUN LEDGER
      </QuestTicker>

      <QuestPageHeader
        className="mt-4"
        icon={<History className="h-8 w-8" />}
        eyebrow={<>SIGNAL EXPEDITIONS</>}
        title="Scan Runs"
        subtitle="Durable Record of Every Queued Scan"
        status={<QuestStatusPill label="Durable ledger" value="Active [Monitored]" />}
      />

      <Suspense fallback={<ScanRunListSkeleton />}>
        <ScanRunListData />
      </Suspense>
    </QuestPageShell>
  )
}

async function ScanRunListData() {
  const result = await listCurrentUserScanRuns()
  return <ScanRunList {...result} />
}
