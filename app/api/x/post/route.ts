import { NextResponse } from 'next/server'
import { getXClient } from '@/lib/x'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

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
