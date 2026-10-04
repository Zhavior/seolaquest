import 'server-only'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppError, RateLimitError, UnauthorizedError, ValidationError } from '@/src/modules/core/infrastructure/errors'
import { logger } from '@/src/modules/core/infrastructure/logger'
import { brandPresence, parseAgentResponse, type GeoSource } from '../domain/parseAgentResponse'
import { hostMatches, normalizeBrandDomain } from '../domain/sourceType'
import {
  PERPLEXITY_PRESET,
  PerplexityRequestError,
  runPerplexityAgent,
} from '../infrastructure/PerplexityAgentClient'

/**
 * Single-user AI-citation scan prototype (decision 2026-10-04).
 *
 * Every scan spends real money, so the feature fails closed: it runs only when
 * GEO_SCAN_ENABLED is exactly 'true' AND a Perplexity key is configured, and
 * each user is capped per rolling 24 hours. The cap is a cost guard for the
 * prototype, not a pricing tier — tier limits wait until per-scan cost is known.
 */

export const MAX_GEO_SCANS_PER_DAY = 20
const DAY_MS = 24 * 60 * 60 * 1000
const ENGINE = 'PERPLEXITY'

export class GeoScanDisabledError extends AppError {
  constructor() {
    super('AI citation scanning is not enabled on this deployment.', 503, 'GEO_SCAN_DISABLED')
  }
}

function cleanQuery(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 300)
}

function scanConfig() {
  const apiKey = process.env.PERPLEXITY_API_KEY?.trim()
  if (process.env.GEO_SCAN_ENABLED !== 'true' || !apiKey) throw new GeoScanDisabledError()
  return { apiKey }
}

export interface GeoScanDto {
  id: string
  query: string
  brandDomain: string
  engine: string
  status: string
  errorCode: string | null
  brandCited: boolean | null
  brandCitedRank: number | null
  brandRetrieved: boolean | null
  sourceCount: number
  citedCount: number
  /** Sources that out-cited the brand: every cited source not on the brand's domain, in citation order. */
  winningSources: GeoSource[]
  sources: GeoSource[]
  answerText: string | null
  inputTokens: number | null
  outputTokens: number | null
  /** Engine-reported USD as a decimal string, or null when the engine did not report it. */
  costUsd: string | null
  latencyMs: number | null
  createdAt: string
}

type GeoQueryRow = Prisma.GeoQueryGetPayload<object>

function toDto(row: GeoQueryRow): GeoScanDto {
  const sources = (Array.isArray(row.sources) ? row.sources : []) as unknown as GeoSource[]
  const winningSources = sources
    .filter((source) => source.cited && !(source.domain && hostMatches(source.domain, row.brandDomain)))
    .sort((a, b) => (a.citedRank ?? 0) - (b.citedRank ?? 0))
  return {
    id: row.id,
    query: row.query,
    brandDomain: row.brandDomain,
    engine: row.engine,
    status: row.status,
    errorCode: row.errorCode,
    brandCited: row.brandCited,
    brandCitedRank: row.brandCitedRank,
    brandRetrieved: row.brandRetrieved,
    sourceCount: row.sourceCount,
    citedCount: row.citedCount,
    winningSources,
    sources,
    answerText: row.answerText,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    costUsd: row.costUsd === null ? null : row.costUsd.toString(),
    latencyMs: row.latencyMs,
    createdAt: row.createdAt.toISOString(),
  }
}

async function requireUserId() {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError()
  return user.id
}

export class GeoScanService {
  static async runScan(input: { query: string; brandDomain: string }): Promise<GeoScanDto> {
    const userId = await requireUserId()
    const { apiKey } = scanConfig()

    const query = cleanQuery(input.query)
    if (query.length < 3) throw new ValidationError('Use at least 3 characters for the query.')
    const brandDomain = normalizeBrandDomain(input.brandDomain)
    if (!brandDomain) throw new ValidationError('Enter a domain like example.com.')

    // Reserve the scan row under a per-user lock before spending money, so
    // concurrent requests cannot slip past the daily cap. Failed calls keep
    // their row and count against the cap: they may still have been billed.
    const reserved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
      const recent = await tx.geoQuery.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      })
      if (recent >= MAX_GEO_SCANS_PER_DAY) {
        throw new RateLimitError(`AI citation scans are limited to ${MAX_GEO_SCANS_PER_DAY} per 24 hours.`)
      }
      return tx.geoQuery.create({
        data: { userId, query, brandDomain, engine: ENGINE, enginePreset: PERPLEXITY_PRESET, status: 'RUNNING' },
        select: { id: true },
      })
    })

    const startedAt = Date.now()
    let raw: unknown
    try {
      raw = await runPerplexityAgent(query, apiKey)
    } catch (error) {
      const errorCode = error instanceof PerplexityRequestError
        ? `${error.code}${error.httpStatus ? `_${error.httpStatus}` : ''}`
        : 'UNKNOWN'
      const row = await prisma.geoQuery.update({
        where: { id: reserved.id },
        data: { status: 'FAILED', errorCode, latencyMs: Date.now() - startedAt },
      })
      logger.warn({ geoQueryId: row.id, errorCode }, 'geo scan engine call failed')
      return toDto(row)
    }
    const latencyMs = Date.now() - startedAt

    let parsed: ReturnType<typeof parseAgentResponse>
    try {
      parsed = parseAgentResponse(raw)
    } catch {
      const row = await prisma.geoQuery.update({
        where: { id: reserved.id },
        data: { status: 'FAILED', errorCode: 'UNPARSEABLE_RESPONSE', latencyMs },
      })
      logger.warn({ geoQueryId: row.id }, 'geo scan response did not match the documented schema')
      return toDto(row)
    }

    const presence = brandPresence(parsed.sources, brandDomain)
    const row = await prisma.geoQuery.update({
      where: { id: reserved.id },
      data: {
        status: 'COMPLETED',
        engineModel: parsed.model,
        providerResponseId: parsed.responseId,
        answerText: parsed.answerText,
        sources: parsed.sources as unknown as Prisma.InputJsonValue,
        sourceCount: parsed.sources.length,
        citedCount: parsed.sources.filter((source) => source.cited).length,
        ...presence,
        inputTokens: parsed.inputTokens,
        outputTokens: parsed.outputTokens,
        costUsd: parsed.costUsd === null ? null : new Prisma.Decimal(parsed.costUsd),
        costDetails: parsed.costDetails === null ? Prisma.JsonNull : (parsed.costDetails as Prisma.InputJsonValue),
        latencyMs,
      },
    })

    // One structured line per scan so unit economics can be read straight from logs.
    logger.info(
      {
        geoQueryId: row.id,
        engine: ENGINE,
        model: parsed.model,
        inputTokens: parsed.inputTokens,
        outputTokens: parsed.outputTokens,
        costUsd: parsed.costUsd,
        latencyMs,
        sourceCount: row.sourceCount,
        citedCount: row.citedCount,
      },
      'geo scan completed',
    )

    return toDto(row)
  }

  static async listRecent(limit = 20): Promise<GeoScanDto[]> {
    const userId = await requireUserId()
    const rows = await prisma.geoQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
    })
    return rows.map(toDto)
  }
}
