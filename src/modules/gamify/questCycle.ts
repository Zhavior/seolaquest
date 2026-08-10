/**
 * When a quest assignment starts over.
 *
 * The cycle key is part of `GamifyQuestAssignment`'s uniqueness constraint, so
 * it is what makes "one assignment per hunter per day" true in the database
 * rather than in application code. DAILY and WEEKLY roll on UTC boundaries;
 * everything else is issued once and never expires on a cycle.
 *
 * Shared by `GamifyQuestService` (which assigns on demand) and
 * `GamifyEnrollmentService` (which assigns in bulk). Two copies of this maths
 * would eventually disagree, and the disagreement would show up as a duplicate
 * assignment or a quest that silently never resets.
 */
export interface QuestCycle {
  key: string
  expiresAt: Date | null
}

export function assignmentCycle(type: string, at: Date): QuestCycle {
  if (type === 'DAILY') {
    const year = at.getUTCFullYear()
    const month = String(at.getUTCMonth() + 1).padStart(2, '0')
    const day = String(at.getUTCDate()).padStart(2, '0')
    return {
      key: `${year}-${month}-${day}`,
      expiresAt: new Date(Date.UTC(year, at.getUTCMonth(), at.getUTCDate() + 1)),
    }
  }

  if (type === 'WEEKLY') {
    const day = at.getUTCDay() || 7
    const monday = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() - day + 1))
    const thursday = new Date(monday)
    thursday.setUTCDate(monday.getUTCDate() + 3)
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
    const firstThursdayDay = firstThursday.getUTCDay() || 7
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 4)
    const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const nextMonday = new Date(monday)
    nextMonday.setUTCDate(monday.getUTCDate() + 7)
    return {
      key: `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
      expiresAt: nextMonday,
    }
  }

  return { key: 'once', expiresAt: null }
}

/** An assignment can never outlive the quest window that issued it. */
export function earliestDate(first: Date | null, second: Date | null): Date | null {
  if (!first) return second
  if (!second) return first
  return first < second ? first : second
}
