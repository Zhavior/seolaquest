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
    registerGamifyQuestConsumers({ contributeForEvent })

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

    expect(contributeForEvent).toHaveBeenCalledWith(event)
  })
})
