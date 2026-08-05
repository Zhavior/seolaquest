import { describe, expect, it } from 'vitest'

import { GET } from './route'

describe('liveness route', () => {
  it('answers without touching any dependency', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'live' })
  })
})
