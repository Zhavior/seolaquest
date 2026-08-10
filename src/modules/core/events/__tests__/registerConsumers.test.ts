import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  registerAurora: vi.fn(),
  registerGamify: vi.fn(),
  registerGamifyLedger: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/src/modules/aurora/events/AuroraEventConsumers', () => ({
  registerAuroraConsumers: mocks.registerAurora,
}))
vi.mock('@/src/modules/gamify/events/GamifyQuestEventConsumers', () => ({
  registerGamifyQuestConsumers: mocks.registerGamify,
}))
vi.mock('@/src/modules/gamify/events/GamifyLedgerEventConsumers', () => ({
  registerGamifyLedgerConsumers: mocks.registerGamifyLedger,
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

  /*
   * The ledger set is listed here explicitly because leaving it out is exactly
   * the bug this file exists to catch. `GamifyLedgerService` was fully built and
   * completely unreachable: nothing registered it, so every outcome event was
   * marked PROCESSED with zero consumers and the XP it should have minted was
   * lost with a clean audit trail and no error anywhere.
   */
  it('registers the aurora, gamify quest and gamify ledger consumer sets', () => {
    registerAllEventConsumers()

    expect(mocks.registerAurora).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamify).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamifyLedger).toHaveBeenCalledTimes(1)
  })

  it('is idempotent across repeated calls in the same process', () => {
    registerAllEventConsumers()
    registerAllEventConsumers()
    registerAllEventConsumers()

    expect(mocks.registerAurora).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamify).toHaveBeenCalledTimes(1)
    expect(mocks.registerGamifyLedger).toHaveBeenCalledTimes(1)
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
