import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  registerAurora: vi.fn(),
  registerGamify: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/src/modules/aurora/events/AuroraEventConsumers', () => ({
  registerAuroraConsumers: mocks.registerAurora,
}))
vi.mock('@/src/modules/gamify/events/GamifyQuestEventConsumers', () => ({
  registerGamifyQuestConsumers: mocks.registerGamify,
}))

import {
  registerAllEventConsumers,
  resetEventConsumerRegistrationForTests,
} from '../registerConsumers'

describe('registerAllEventConsumers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetEventConsumerRegistrationForTests()
  })

  it('registers both the aurora and gamify consumer sets', () => {
    registerAllEventConsumers()

    expect(mocks.registerAurora).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamify).toHaveBeenCalledTimes(1)
  })

  it('is idempotent across repeated calls in the same process', () => {
    registerAllEventConsumers()
    registerAllEventConsumers()
    registerAllEventConsumers()

    expect(mocks.registerAurora).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamify).toHaveBeenCalledTimes(1)
  })
})

describe('EventDispatcher duplicate registration contract', () => {
  it('warns and returns instead of double-registering a consumerKey', async () => {
    const { EventDispatcher } = await import('../EventDispatcher')
    EventDispatcher.clearAll()

    const first = vi.fn()
    const second = vi.fn()

    EventDispatcher.register('test.duplicate', 'dup.consumer', first)
    EventDispatcher.register('test.duplicate', 'dup.consumer', second)

    const consumers = EventDispatcher.getConsumers('test.duplicate')
    expect(consumers).toHaveLength(1)
    expect(consumers[0].handler).toBe(first)

    EventDispatcher.clearAll()
  })
})
