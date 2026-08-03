import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

type ErrorWithCode = Error & {
  code?: unknown
  statusCode?: unknown
}

export function serializeLogError(error: unknown) {
  if (!(error instanceof Error)) {
    return { type: 'UnknownError' }
  }

  const codedError = error as ErrorWithCode
  return {
    type: error.name || 'Error',
    ...(typeof codedError.code === 'string' ? { code: codedError.code } : {}),
    ...(typeof codedError.statusCode === 'number' ? { statusCode: codedError.statusCode } : {}),
  }
}

export function requestPath(url: string) {
  try {
    return new URL(url).pathname
  } catch {
    return '/unknown'
  }
}

export const LOG_REDACT_PATHS = [
  'email',
  '*.email',
  'userId',
  '*.userId',
  'clerkId',
  '*.clerkId',
  'description',
  '*.description',
  'feedback',
  '*.feedback',
  'authorization',
  '*.authorization',
  'token',
  '*.token',
  'apiKey',
  '*.apiKey',
  'secret',
  '*.secret',
  'password',
  '*.password',
  'req.headers.authorization',
  'headers.authorization',
] as const

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [...LOG_REDACT_PATHS],
    censor: '[REDACTED]',
  },
  serializers: {
    err: serializeLogError,
    error: serializeLogError,
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
  formatters: {
    level: (label) => ({ level: label }),
  },
})
