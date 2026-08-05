import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger, requestPath, loggerContext } from './logger'
import { AppError, sanitizeDetails } from './errors'
import { auth } from '@clerk/nextjs/server'
import { RateLimiterService } from '../security/RateLimiter'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler<T = any> = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: any }
) => Promise<NextResponse<T>> | NextResponse<T>

// T is intentionally left at its `any` default rather than inferred from the handler:
// routes legitimately return several response shapes (success DTO, 401, 422, ...) and
// inferring T from the first branch would reject every multi-shape route.
export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    const path = requestPath(req.url)
    const requestId = crypto.randomUUID()

    // Retrieve userId conditionally, it might throw if outside clerk middleware context, 
    // but in Next.js App Router we can just await auth()
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult?.userId || null
    } catch {
      // Ignored: route might not be protected or clerk is not configured
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const store = { requestId, userId, path, ip }

    return loggerContext.run(store, async () => {
      try {
        // Enforce global rate limit based on IP or userId
        const identifier = userId || ip
        await RateLimiterService.enforce({ type: 'global', identifier })

        return await handler(req, context)
      } catch (error) {
        if (error instanceof ZodError) {
          logger.warn(
            { event: 'api_validation_failed', issueCount: error.issues.length },
            'API request validation failed',
          )
          return NextResponse.json(
            {
              error: 'Validation failed',
              // Projected to path/code/message: raw issues carry the rejected input on
              // `received` for literal and enum failures.
              details: sanitizeDetails(error.issues),
            },
            { status: 400 }
          )
        }

        if (error instanceof AppError) {
          if (error.statusCode >= 500) {
            logger.error(
              { err: error, event: 'api_operational_error', statusCode: error.statusCode },
              'API operational error',
            )
          } else {
            logger.warn(
              { event: 'api_request_rejected', code: error.code, statusCode: error.statusCode },
              'API request rejected',
            )
          }

          if (error.statusCode >= 500) {
            return NextResponse.json(
              { error: 'Internal Server Error', code: error.code },
              { status: error.statusCode },
            )
          }

          // 4xx messages are authored by us and are meant for the caller; `details` is
          // caller-supplied and is sanitized before it crosses the trust boundary.
          const details = sanitizeDetails(error.details)
          return NextResponse.json(
            {
              error: error.message,
              code: error.code,
              ...(details === undefined ? {} : { details }),
            },
            { status: error.statusCode }
          )
        }

        // Unhandled generic errors (e.g., SyntaxError, TypeError, Prisma errors)
        logger.error({ err: error, event: 'api_unhandled_error' }, 'Unhandled API exception')
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      }
    })
  }
}
