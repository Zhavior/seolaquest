import 'server-only'

type CodedError = Error & { code?: unknown }

export function durableErrorCode(error: unknown) {
  if (error instanceof Error) {
    const code = (error as CodedError).code
    if (typeof code === 'string' && /^[A-Z0-9_]{1,80}$/.test(code)) return code
    if (error.name && /^[A-Za-z0-9_]{1,80}$/.test(error.name)) {
      return error.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
    }
  }
  return 'UNEXPECTED_ERROR'
}

export class DurableJobError extends Error {
  constructor(
    public readonly code: string,
    message = code,
  ) {
    super(message)
    this.name = 'DurableJobError'
  }
}
