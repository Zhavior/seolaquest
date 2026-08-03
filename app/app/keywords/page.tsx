import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { KeywordService } from '@/src/modules/keywords/application/KeywordService'
import { KeywordsClient, type Keyword } from '@/features/dashboard/components/KeywordsClient'

export const dynamic = 'force-dynamic'

export default async function KeywordsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const keywords: Keyword[] = await KeywordService.listKeywords()

  return <KeywordsClient initialKeywords={keywords} />
}
