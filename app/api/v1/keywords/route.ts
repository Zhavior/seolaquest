import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiHandler } from '@/src/modules/core/infrastructure/api-handler'
import { safeJson } from '@/src/modules/core/infrastructure/safeJson'
import { KeywordService } from '@/src/modules/keywords/application/KeywordService'

export const GET = withApiHandler(async () => {
  const keywords = await KeywordService.listKeywords()
  return NextResponse.json({ success: true, keywords })
})

const PostKeywordSchema = z.object({
  phrase: z.string().min(3, 'Use at least 3 characters for a keyword.').max(80, 'Phrase is too long.'),
})

export const POST = withApiHandler(async (req) => {
  const { phrase } = PostKeywordSchema.parse(await safeJson(req))
  const keyword = await KeywordService.addKeyword(phrase)

  return NextResponse.json({ success: true, keyword })
})

const DeleteKeywordSchema = z.object({
  // TrackedKeyword.id is `String @id @default(uuid())` (prisma/schema.prisma), and the sibling
  // id-taking routes (scans/[id], crm-deliveries/[id]) already validate as uuid. A bare
  // `min(1)` accepted an arbitrarily long string and forwarded it into a $transaction, opening
  // a DB transaction and connection per request for input that can never match a row.
  id: z.string().uuid('Keyword ID must be a valid UUID'),
})

export const DELETE = withApiHandler(async (req) => {
  const { id } = DeleteKeywordSchema.parse(await safeJson(req))

  await KeywordService.removeKeyword(id)

  return NextResponse.json({ success: true })
})
