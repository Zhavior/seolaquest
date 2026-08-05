import { NextResponse } from 'next/server'
import { getXClient } from '@/lib/x'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * Posting here writes to the one connected X account, not to anything the
 * caller owns, so being signed in is not enough to authorize it. Sign-up is
 * public, which would otherwise make "any account" mean "anyone".
 *
 * Unset means nobody is allowed. The allowlist fails closed on purpose: an
 * empty variable in production must not read as "no restriction".
 */
function configuredPosterIds() {
  return new Set(
    (process.env.X_POST_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

const postSchema = z.object({
  text: z.string().trim().min(1, 'Post text cannot be empty.').max(280, 'Post text exceeds 280 characters.'),
})

// In-memory per-process rate limiting window (5 posts per 60 seconds)
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 5
const requestTimestamps: number[] = []

function checkRateLimit(): boolean {
  const now = Date.now()
  // Purge expired timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  requestTimestamps.push(now)
  return true
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }
    if (!configuredPosterIds().has(user.id)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    if (process.env.NODE_ENV === 'production' && process.env.X_POSTING_ENABLED !== 'true') {
      return NextResponse.json({ error: 'X_POSTING_DISABLED' }, { status: 503 })
    }

    const xClient = getXClient()
    if (!xClient) {
      return NextResponse.json(
        { error: 'X API is not configured. Missing X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, or X_ACCESS_TOKEN_SECRET.' },
        { status: 503 }
      )
    }

    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute before posting again.' },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parseResult = postSchema.safeParse(body)
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid post text.'
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { text } = parseResult.data

    const response = await xClient.v2.tweet(text)
    if (!response || !response.data || !response.data.id) {
      return NextResponse.json({ error: 'Failed to create post on X.' }, { status: 500 })
    }

    return NextResponse.json({
      id: response.data.id,
      text: response.data.text || text,
    })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: number }
    console.error('[X Post Error]:', err?.message || 'Unknown error')
    if (err?.code === 429) {
      return NextResponse.json({ error: 'X API rate limit reached. Try again later.' }, { status: 429 })
    }
    return NextResponse.json(
      { error: 'An error occurred while posting to X. Ensure your X API app has read/write permissions.' },
      { status: 500 }
    )
  }
}
