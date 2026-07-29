import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export async function GET(req: Request) {
  try {
    // Verify optional Cron Secret header if CRON_SECRET is configured
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized Cron Request', { status: 401 })
    }

    const activeKeywords = await prisma.trackedKeyword.findMany({
      where: { active: true },
      take: 50,
    })

    let totalLeadsCreated = 0

    for (const keyword of activeKeywords) {
      try {
        const query = encodeURIComponent(keyword.phrase)
        const response = await fetch(`https://www.reddit.com/search.json?q=${query}&type=link&sort=new&limit=5`, {
          cache: 'no-store',
          headers: { 'User-Agent': 'HypeQuest/1.0 automated-background-cron' },
        })

        if (!response.ok) continue

        const json = (await response.json()) as { data?: { children?: Array<{ data?: Record<string, unknown> }> } }
        const children = json.data?.children ?? []

        for (const child of children) {
          const post = child.data
          if (!post) continue
          const postId = typeof post?.name === 'string' ? post.name : null
          const permalink = typeof post?.permalink === 'string' ? post.permalink : null
          if (!postId || !permalink) continue

          const title = typeof post.title === 'string' ? post.title : ''
          const body = typeof post.selftext === 'string' ? post.selftext : ''
          const content = cleanText(`${title} ${body}`, 700)
          if (!content) continue

          const author = typeof post.author === 'string' ? `u/${post.author}` : 'u/[deleted]'
          const createdUtc = typeof post.created_utc === 'number' ? new Date(post.created_utc * 1000) : null

          const existing = await prisma.lead.findUnique({
            where: { userId_externalPostId: { userId: keyword.userId, externalPostId: postId } },
            select: { id: true },
          })

          if (!existing) {
            await prisma.lead.create({
              data: {
                userId: keyword.userId,
                keywordId: keyword.id,
                platform: 'REDDIT',
                externalPostId: postId,
                author,
                content,
                matched: keyword.phrase,
                url: `https://www.reddit.com${permalink}`,
                sourceCreatedAt: createdUtc,
              },
            })
            totalLeadsCreated += 1
          }
        }
      } catch {
        // Continue with other keywords if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Automated scan complete. Created ${totalLeadsCreated} new leads.`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Scanner Error]:', error)
    return NextResponse.json({ error: 'Automated scan failed' }, { status: 500 })
  }
}
