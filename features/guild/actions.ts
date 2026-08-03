'use server'

type ActionResult = { ok: boolean; message?: string }

export async function createPostAction(content: string): Promise<ActionResult> {
  const { PostService } = await import('@/src/modules/posts/application/PostService')
  return PostService.createPost(content)
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const { PostService } = await import('@/src/modules/posts/application/PostService')
  return PostService.deletePost(id)
}

export async function getAnalyticsAction() {
  const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
  return AnalyticsService.getAnalytics()
}

export async function getLeaderboardAction() {
  const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
  return AnalyticsService.getLeaderboard()
}

export async function getGuildStatsAction(timeframe: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'weekly') {
  const { AnalyticsService } = await import('@/src/modules/analytics/application/AnalyticsService')
  return AnalyticsService.getGuildStats(timeframe)
}
