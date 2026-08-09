import { NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'
import { getServerEnv } from '@/lib/env'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().max(2000),
})

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty.').max(1000, 'Message is too long (max 1000 characters).'),
  history: z.array(chatMessageSchema).max(20).optional().default([]),
})

const SYSTEM_INSTRUCTION =
  'You are Axion’s helpful product assistant. Be concise, practical, accurate, and never claim you completed an action you cannot verify.'

export async function POST(request: Request) {
  try {
    // Clerk middleware already rejects anonymous callers (see proxy.ts), but the
    // spend here lands on our Gemini account, so the route states the
    // requirement itself rather than inheriting it from the route matcher.
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const ai = getGeminiClient()
    const env = getServerEnv()

    if (!ai || !env.GEMINI_API_KEY) {
      logger.error(
        { event: 'gemini_chat_unconfigured', outcomeCode: 'GEMINI_CHAT_NOT_CONFIGURED' },
        'Gemini chat is not configured',
      )
      return NextResponse.json(
        { error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch (error) {
      logger.warn(
        { err: error, event: 'gemini_chat_malformed_body', outcomeCode: 'GEMINI_CHAT_MALFORMED_JSON' },
        'Gemini chat request body was not valid JSON',
      )
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parseResult = chatRequestSchema.safeParse(body)
    if (!parseResult.success) {
      // Issue count only: the raw issues carry the rejected input.
      logger.warn(
        {
          event: 'gemini_chat_validation_failed',
          outcomeCode: 'GEMINI_CHAT_INVALID_REQUEST',
          issueCount: parseResult.error.issues.length,
        },
        'Gemini chat request validation failed',
      )
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid chat parameters.'
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const { message, history } = parseResult.data
    const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash'

    // Format contents for @google/genai SDK
    const contents = [
      ...history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: message }],
      },
    ]

    // Timeout protection via Promise.race
    const TIMEOUT_MS = 15000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
    )

    const apiPromise = ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    })

    const response = await Promise.race([apiPromise, timeoutPromise])

    const text = response.text
    if (!text) {
      logger.warn(
        { event: 'gemini_chat_empty_response', outcomeCode: 'GEMINI_CHAT_EMPTY_RESPONSE', model: modelName },
        'Gemini returned an empty or blocked response',
      )
      return NextResponse.json(
        { error: 'Received an empty response from Gemini API or content was blocked by safety filters.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply: text })
  } catch (error: unknown) {
    const timedOut = error instanceof Error && error.message === 'Request timed out'

    // This route is not wrapped in withApiHandler, so there is no AsyncLocalStorage
    // request context to inherit: nothing here may be left unlogged.
    logger.error(
      {
        err: error,
        event: 'gemini_chat_failed',
        outcomeCode: timedOut ? 'GEMINI_CHAT_TIMED_OUT' : 'GEMINI_CHAT_FAILED',
        route: '/api/gemini/chat',
      },
      'Gemini chat request failed',
    )

    if (timedOut) {
      return NextResponse.json({ error: 'Gemini API request timed out. Please try again.' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'An error occurred while generating a response from Gemini.' },
      { status: 500 }
    )
  }
}
