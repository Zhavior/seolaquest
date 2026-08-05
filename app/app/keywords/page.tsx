import React, { Suspense } from 'react'
import nextDynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { KeywordService } from '@/src/modules/keywords/application/KeywordService'
import type { Keyword } from '@/features/dashboard/components/KeywordsClient'

const KeywordsClient = nextDynamic(() =>
  import('@/features/dashboard/components/KeywordsClient').then((m) => m.KeywordsClient)
)

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Quest Log & Keyword Monitors | CoQuest',
  description: 'Manage active keyword streams and track live signal sources.',
}

export default function KeywordsPage() {
  return (
    <Suspense fallback={<KeywordsLoading />}>
      <KeywordsData />
    </Suspense>
  )
}

async function KeywordsData() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const keywords: Keyword[] = await KeywordService.listKeywords()
  return <KeywordsClient initialKeywords={keywords} />
}

function KeywordsLoading() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FDFBF7] p-4 sm:p-8 space-y-6">
      <div className="h-32 border-4 border-black bg-zinc-200 animate-pulse shadow-[6px_6px_0_0_#000]" />
      <div className="h-64 border-4 border-black bg-zinc-200 animate-pulse shadow-[6px_6px_0_0_#000]" />
    </div>
  )
}
