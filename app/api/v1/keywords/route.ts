import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { KeywordService } from '@/src/modules/keywords/application/KeywordService'

export const GET = withApiHandler(async () => {
  const keywords = await KeywordService.listKeywords()
  return NextResponse.json({ success: true, keywords })
})

const PostKeywordSchema = z.object({
  phrase: z.string().min(3, 'Use at least 3 characters for a keyword.').max(80, 'Phrase is too long.'),
})

export const POST = withApiHandler(async (req) => {
  const body = await req.json()
  const { phrase } = PostKeywordSchema.parse(body)
  const keyword = await KeywordService.addKeyword(phrase)

  return NextResponse.json({ success: true, keyword })
})

const DeleteKeywordSchema = z.object({
  id: z.string().min(1, 'Keyword ID required'),
})

export const DELETE = withApiHandler(async (req) => {
  const body = await req.json()
  const { id } = DeleteKeywordSchema.parse(body)

  await KeywordService.removeKeyword(id)

  return NextResponse.json({ success: true })
})
