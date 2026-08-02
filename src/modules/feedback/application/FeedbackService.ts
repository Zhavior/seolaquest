import { requireCurrentUser } from '@/lib/auth'
import { logger } from '@/src/modules/core/infrastructure/logger'

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export class FeedbackService {
  static async submitBugReport(input: { category: string; severity: string; description: string }) {
    await requireCurrentUser()
    cleanText(input.category, 60)
    cleanText(input.severity, 30)
    const description = cleanText(input.description, 1000)

    if (!description) {
      return { ok: false, message: 'Please describe the glitch before submitting.' }
    }

    logger.info(
      { event: 'feedback_submission_unavailable', kind: 'bug_report', contentLength: description.length },
      'Feedback persistence is unavailable',
    )
    return {
      ok: false,
      message: 'Bug report delivery is not available yet. Nothing was submitted.',
    }
  }

  static async submitFeedbackScroll(input: { title: string; category: string; description: string }) {
    await requireCurrentUser()
    const title = cleanText(input.title, 100)
    cleanText(input.category, 50)
    const description = cleanText(input.description, 1000)

    if (!title || !description) {
      return { ok: false, message: 'Please provide both a title and description for your scroll.' }
    }

    logger.info(
      {
        event: 'feedback_submission_unavailable',
        kind: 'feedback_scroll',
        titleLength: title.length,
        contentLength: description.length,
      },
      'Feedback persistence is unavailable',
    )
    return {
      ok: false,
      message: 'Feedback delivery is not available yet. Nothing was submitted.',
    }
  }
}
