import { NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'
import { getServerEnv } from '@/lib/env'
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
    const ai = getGeminiClient()
    const env = getServerEnv()

    if (!ai || !env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API is not configured. Missing GEMINI_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const parseResult = chatRequestSchema.safeParse(body)
    if (!parseResult.success) {
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
      return NextResponse.json(
        { error: 'Received an empty response from Gemini API or content was blocked by safety filters.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply: text })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Gemini Chat Error]:', err?.message || 'Unknown error')
    if (err?.message === 'Request timed out') {
      return NextResponse.json({ error: 'Gemini API request timed out. Please try again.' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'An error occurred while generating a response from Gemini.' },
      { status: 500 }
    )
  }
}
