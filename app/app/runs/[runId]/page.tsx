import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ScanRunDetail } from '@/features/scans/components/ScanRunDetail'
import { getCurrentUserScanRun } from '@/features/scans/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scan Run | SEOlaQuest',
  description: 'Review one durable scan run.',
}

export default async function ScanRunPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params
  const run = await getCurrentUserScanRun(runId)
  if (!run) notFound()

  return (
    <div className="min-h-screen bg-canvas p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <ScanRunDetail run={run} />
      </div>
    </div>
  )
}
