import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This route currently reads existing results; it does not execute provider work.
    // Keep the read tenant-scoped and do not charge until a real scan is accepted.
    const dbLeads = await prisma.lead.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const cachedLeads = dbLeads.map((lead) => ({
      id: lead.id,
      platform: lead.platform,
      source: lead.platform,
      author: lead.author,
      content: lead.content,
      sourceCreatedAt: lead.sourceCreatedAt?.toISOString() ?? null,
      url: lead.url,
    }))

    return NextResponse.json({
      success: true,
      scanAccepted: false,
      resultSource: 'cached',
      // Keep the legacy key until its client migrates; these are cached leads, not a new scan result.
      questsFound: cachedLeads,
      creditsDeducted: 0,
      questsRemaining: user.questsRemaining,
    })
  } catch (error) {
    console.error('[Scan Endpoint Error]:', error)
    return NextResponse.json({ error: 'Scan request failed' }, { status: 500 })
  }
}
