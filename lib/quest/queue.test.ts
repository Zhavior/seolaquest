import { describe, it, expect, beforeEach } from 'vitest'
import { questStore, triggerDemoScanSequence } from './queue'

describe('questStore Queue System', () => {
  beforeEach(() => {
    questStore.getState().clearEvents()
  })

  it('pushes and pops events correctly', () => {
    questStore.getState().pushEvent({
      type: 'quest_started',
      runId: 'test_run',
      biome: 'reddit-forest',
      scoutCount: 3,
    })

    const queue = questStore.getState().queue
    expect(queue.length).toBe(1)
    expect(queue[0].type).toBe('quest_started')

    const popped = questStore.getState().popEvent()
    expect(popped?.type).toBe('quest_started')
    expect(questStore.getState().queue.length).toBe(0)
  })

  it('enforces safety cap buffer of max 50 events', () => {
    for (let i = 0; i < 60; i++) {
      questStore.getState().pushEvent({
        type: 'mana_consumed',
        amount: 5,
        source: `pulse_${i}`,
      })
    }

    const queue = questStore.getState().queue
    expect(queue.length).toBe(50)
  })

  it('triggers demo scan sequence events', () => {
    triggerDemoScanSequence()
    const queue = questStore.getState().queue
    expect(queue.length).toBeGreaterThan(0)
    expect(queue[0].type).toBe('quest_started')
  })
})
