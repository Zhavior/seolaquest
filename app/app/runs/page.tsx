import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ScanRunList } from '@/features/scans/components/ScanRunList'
import { listCurrentUserScanRuns } from '@/features/scans/queries'
import ScanRunsLoading from './loading'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scan Runs | CoQuest',
  description: 'Review the durable backend status of your scan runs.',
}

export default function ScanRunsPage() {
  return (
    <div className="min-h-screen bg-[#F4F0EA] p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Scan ledger</p>
          <h1 className="mt-2 text-4xl font-black uppercase sm:text-5xl">Durable scan runs</h1>
          <p className="mt-3 max-w-2xl font-bold text-zinc-700">
            Saved backend state, stored counts, and recorded refunds. Provider errors are summarized without exposing internal details.
          </p>
        </header>
        <Suspense fallback={<ScanRunsLoading />}>
          <ScanRunListData />
        </Suspense>
      </div>
    </div>
  )
}

async function ScanRunListData() {
  const result = await listCurrentUserScanRuns()
  return <ScanRunList {...result} />
}
