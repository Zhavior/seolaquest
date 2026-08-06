import { describe, expect, it } from 'vitest'
import { LOG_REDACT_PATHS, requestPath, serializeLogError } from './logger'

describe('core logger privacy boundary', () => {
  it('drops error messages and stacks from structured error metadata', () => {
    const error = Object.assign(new Error('email=user@example.com token=secret'), {
      code: 'P2002',
      statusCode: 409,
    })

    expect(serializeLogError(error)).toEqual({ type: 'Error', code: 'P2002', statusCode: 409 })
  })

  it('logs only the pathname and drops query parameters', () => {
    expect(requestPath('https://seolaquest.test/api/items?email=user%40example.com&token=secret'))
      .toBe('/api/items')
    expect(requestPath('not a URL')).toBe('/unknown')
  })

  it('redacts identity, credentials, and feedback text', () => {
    expect(LOG_REDACT_PATHS).toEqual(expect.arrayContaining([
      'email',
      'userId',
      'clerkId',
      'description',
      'feedback',
      'authorization',
      'token',
      'apiKey',
      'secret',
      'password',
    ]))
  })
})
