import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Scroll, Sparkles } from 'lucide-react'
import { listCurrentUserScanRuns } from '@/features/scans/queries'
import { QuestPageHeader, QuestPageShell, QuestStatusPill, QuestTicker } from '@/components/quest'
import { ScanRunListSkeleton } from './loading'

const ScanRunList = dynamic(() => import('@/features/scans/components/ScanRunList').then((m) => m.ScanRunList))

export const metadata: Metadata = {
  title: 'Quest Board & Scan Runs | SEOlaQuest',
  description: 'Review the durable backend status of your scan runs and active bounties.',
}

export default function ScanRunsPage() {
  return (
    <QuestPageShell watermark={<Scroll className="h-[650px] w-[650px] text-ink" />}>
      <QuestTicker label="Quest board and battle scans. Measured run ledger.">
        <Sparkles className="h-5 w-5 text-ink" /> 📜 QUEST BOARD &amp; BATTLE SCANS{' '}
        <Sparkles className="h-5 w-5 text-ink" /> 🛡️ MEASURED RUN LEDGER
      </QuestTicker>

      <QuestPageHeader
        className="mt-4"
        icon={<Scroll className="h-8 w-8" />}
        eyebrow={<>COMMANDER&apos;S MAP &amp; SIGNAL EXPEDITIONS</>}
        title="Quest Board"
        subtitle="Durable Scan Runs & Quest Bounties"
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
