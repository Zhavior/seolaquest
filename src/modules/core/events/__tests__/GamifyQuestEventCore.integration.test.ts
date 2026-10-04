import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventFactory } from '../EventFactory'
import { EventDispatcher } from '../EventDispatcher'
import {
  GAMIFY_QUEST_CONSUMER_KEY,
  registerGamifyQuestConsumers,
} from '../../../gamify/events/GamifyQuestEventConsumers'

describe('Gamify Quest controlled Event Core integration', () => {
  afterEach(() => EventDispatcher.clearAll())

  it('registers only canonical verified-action events and forwards their envelopes', async () => {
    const contributeForEvent = vi.fn().mockResolvedValue([])
    const ensureEnrolled = vi.fn().mockResolvedValue({ enrolled: true, assigned: 0 })
    registerGamifyQuestConsumers({ contributeForEvent }, { ensureEnrolled })

    expect(EventDispatcher.getConsumers('opportunity.discovered')).toEqual([])
    expect(EventDispatcher.getConsumers('opportunity.engaged')[0]?.consumerKey).toBe(GAMIFY_QUEST_CONSUMER_KEY)
    expect(EventDispatcher.getConsumers('lead.converted')[0]?.consumerKey).toBe(GAMIFY_QUEST_CONSUMER_KEY)
    expect(EventDispatcher.getConsumers('aurora.feedback.recorded')[0]?.consumerKey).toBe(GAMIFY_QUEST_CONSUMER_KEY)

    const event = EventFactory.create({
      type: 'lead.converted',
      actorId: 'user_1',
      source: 'leads',
      payload: {
        leadId: 'lead_1',
        opportunityId: 'opp_1',
        convertedAt: '2026-08-08T12:00:00.000Z',
      },
    })
    await EventDispatcher.getConsumers('lead.converted')[0].handler(event)

    expect(ensureEnrolled).toHaveBeenCalledWith(event.actorId, new Date(event.occurredAt))
    expect(ensureEnrolled.mock.invocationCallOrder[0]).toBeLessThan(contributeForEvent.mock.invocationCallOrder[0])
    expect(contributeForEvent).toHaveBeenCalledWith(event)
    ensureEnrolled.mockRejectedValueOnce(new Error('database unavailable'))
    await expect(EventDispatcher.getConsumers('lead.converted')[0].handler(event)).rejects.toThrow('database unavailable')
    expect(contributeForEvent).toHaveBeenCalledTimes(1)
  })
})
