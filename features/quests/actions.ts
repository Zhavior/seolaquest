'use server'

import { revalidatePath } from 'next/cache'
import { requireCurrentUser } from '@/lib/auth'
import { withServerAction } from '@/src/modules/core/infrastructure/server-action'

type ClaimRewardResult = {
  ok: boolean
  message?: string
  /** Lifetime XP after the claim, so the board can confirm the ledger moved. */
  lifetimeXp?: number
  level?: number
}

/**
 * Collects the XP a completed quest is holding.
 *
 * Tier `global` rather than `billing`: this spends nothing and provisions no
 * capacity. It is also idempotent by construction — `GamifyQuestService.claimQuest`
 * locks the assignment row and the ledger writes under a
 * `quest-claim:{assignmentId}` idempotency key, so a double-clicked button pays
 * once and reports `claimed: false` the second time.
 */
export const claimQuestRewardAction = withServerAction(
  {
    name: 'claimQuestRewardAction',
    tier: 'global',
    onError: (failure): ClaimRewardResult => ({ ok: false, message: failure.message }),
  },
  async (assignmentId: string): Promise<ClaimRewardResult> => {
    const user = await requireCurrentUser()
    const { GamifyQuestService } = await import('@/src/modules/gamify/GamifyQuestService')

    try {
      const result = await new GamifyQuestService().claimQuest(user.id, assignmentId)
      revalidatePath('/app/quests')
      revalidatePath('/app')

      return {
        ok: true,
        message: result.claimed ? 'Reward claimed.' : 'This reward was already claimed.',
        lifetimeXp: result.profile.lifetimeXp,
        level: result.profile.level,
      }
    } catch (error) {
      // The domain codes are the useful part here — "not complete" and "expired"
      // are different answers and the board should say which one it got.
      const code = (error as { code?: string } | null)?.code
      if (code === 'QUEST_NOT_COMPLETE') {
        return { ok: false, message: 'This quest is not finished yet.' }
      }
      if (code === 'QUEST_EXPIRED') {
        return { ok: false, message: 'This quest expired before it was claimed.' }
      }
      throw error
    }
  },
)
