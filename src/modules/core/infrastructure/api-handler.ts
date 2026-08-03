import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger, requestPath } from './logger'
import { AppError } from './errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler<T = any> = (
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: any }
) => Promise<NextResponse<T>> | NextResponse<T>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withApiHandler<T = any>(handler: RouteHandler<T>): RouteHandler {
  return async (req, context) => {
    const path = requestPath(req.url)

    try {
      return await handler(req, context)
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(
          { event: 'api_validation_failed', issueCount: error.issues.length, path },
          'API request validation failed',
        )
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        )
      }

      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logger.error(
            { err: error, event: 'api_operational_error', path, statusCode: error.statusCode },
            'API operational error',
          )
        } else {
          logger.warn(
            { event: 'api_request_rejected', code: error.code, path, statusCode: error.statusCode },
            'API request rejected',
          )
        }

        if (error.statusCode >= 500) {
          return NextResponse.json(
            { error: 'Internal Server Error', code: error.code },
            { status: error.statusCode },
          )
        }

        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: error.statusCode }
        )
      }

      // Unhandled generic errors (e.g., SyntaxError, TypeError, Prisma errors)
      logger.error({ err: error, event: 'api_unhandled_error', path }, 'Unhandled API exception')
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
}
