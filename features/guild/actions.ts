'use server'

import { withServerAction } from '@/src/modules/core/infrastructure/server-action'

type ActionResult = { ok: boolean; message?: string }

export const createPostAction = withServerAction(
  { name: 'createPostAction', tier: 'global' },
  async (content: string): Promise<ActionResult> => {
    const { PostService } = await import('@/src/modules/posts/application/PostService')
    return PostService.createPost(content)
  },
)

export const deletePostAction = withServerAction(
  { name: 'deletePostAction', tier: 'global' },
  async (id: string): Promise<ActionResult> => {
    const { PostService } = await import('@/src/modules/posts/application/PostService')
    return PostService.deletePost(id)
  },
)

/**
 * The three read actions below return raw domain data (a day series, a leaderboard array, a
 * stats view model), not an `{ ok }` envelope, and they reject today when
 * `requireCurrentUser()` refuses. `onError: 'rethrow'` is therefore the only policy that
 * leaves their contract untouched — returning a `ServerActionFailure` instead would widen
 * every one of these return types into a union no reader is written against. The wrapper is
 * still doing real work for them: rate limiting, the request-scoped log context, and
 * classified error logging on the way out.
 */
export const getAnalyticsAction = withServerAction(
  { name: 'getAnalyticsAction', tier: 'global', onError: 'rethrow' },
  async () => {
    const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
    return AnalyticsService.getAnalytics()
  },
)

export const getLeaderboardAction = withServerAction(
  { name: 'getLeaderboardAction', tier: 'global', onError: 'rethrow' },
  async () => {
    const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
    return AnalyticsService.getLeaderboard()
  },
)

export const getGuildStatsAction = withServerAction(
  { name: 'getGuildStatsAction', tier: 'global', onError: 'rethrow' },
  async (timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'weekly') => {
    const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
    return AnalyticsService.getGuildStats(timeframe)
  },
)
