import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateAndSaveBlogPost } from '@/lib/aiBlogger'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'

const GenerateBlogPostSchema = z.object({
  topic: z.string().trim().min(3).max(160),
  tag: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  author: z.string().trim().max(80).optional(),
  authorRole: z.string().trim().max(120).optional(),
})

function configuredAdminIds() {
  return new Set(
    (process.env.BLOG_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!configuredAdminIds().has(user.id)) {
      return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 })
    }

    if (process.env.NODE_ENV === 'production' && process.env.BLOG_PUBLISHING_ENABLED !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'PUBLISHING_DISABLED',
          message: 'Durable blog publishing is not enabled in production.',
        },
        { status: 503 },
      )
    }

    const { topic, tag, category, author, authorRole } = GenerateBlogPostSchema.parse(await req.json())
    const resolvedTag = category || tag

    const result = await generateAndSaveBlogPost({
      topic,
      tag: resolvedTag,
      author,
      authorRole,
      apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
    })

    return NextResponse.json({
      success: true,
      published: false,
      slug: result.slug,
      title: result.title,
      url: null,
      readTimeMinutes: result.readTimeMinutes,
      message: result.message,
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', details: error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    logger.error({ err: error, outcomeCode: 'BLOG_GENERATION_FAILED' }, 'Blog generation failed')
    return NextResponse.json(
      { success: false, error: 'GENERATION_FAILED', message: 'Blog generation failed.' },
      { status: 500 }
    )
  }
}
