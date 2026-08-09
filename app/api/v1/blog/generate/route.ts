import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateAndSaveBlogPost } from '@/lib/aiBlogger'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { AppError, ValidationError } from '@/src/modules/core/infrastructure/errors'

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

export const POST = withApiHandler(async (req) => {
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

    /**
     * Both ways a body can be rejected now render as the same 400.
     *
     * They used to diverge. `safeJson` raises ValidationError for a malformed, empty or
     * oversized body, which withApiHandler renders as the canonical
     * `{ error, code: 'VALIDATION_ERROR', details? }`. A body that parsed but failed the
     * schema was caught locally instead and answered
     * `{ success: false, error: 'INVALID_REQUEST', details: <zod fieldErrors> }` — no
     * `code`, an extra `success`, a machine token in `error` where the other shape puts a
     * human message, and a details object keyed by field where the other is an array. So
     * the same endpoint answered two structurally incompatible ways depending only on
     * *how* the body was bad, and a client could not write one error path for it.
     *
     * Raising ValidationError here routes the schema failure through the identical branch.
     * `sanitizeDetails` in withApiHandler projects the issues to path/code/message: the raw
     * zod issues carry the rejected input on `received`, which must not be echoed back.
     */
    const parsed = GenerateBlogPostSchema.safeParse(await safeJson(req))
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.issues)
    }

    const { topic, tag, category, author, authorRole } = parsed.data
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
    // Typed errors already carry their own status and code — including the ValidationError
    // raised above and the one safeJson raises. Let withApiHandler render them rather than
    // mislabelling a client mistake as a server-side generation failure.
    if (error instanceof AppError) throw error

    logger.error({ err: error, outcomeCode: 'BLOG_GENERATION_FAILED' }, 'Blog generation failed')
    return NextResponse.json(
      { success: false, error: 'GENERATION_FAILED', message: 'Blog generation failed.' },
      { status: 500 }
    )
  }
})
