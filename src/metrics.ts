export type PostingReview = { postedThisWeek?: boolean }
export type Completion = { status: string; dateDone: string }

export function postingSummary(reviews: Record<number, PostingReview>, currentWeek: number) {
  const weeksPosted = Object.values(reviews).filter((review) => review.postedThisWeek).length
  let streak = 0
  for (let week = currentWeek; week > 0 && reviews[week]?.postedThisWeek; week--) streak++
  return { streak, weeksPosted }
}

export function completionWeek(dateDone: string, planStartDate: string) {
  if (!dateDone) return null
  const done = Date.parse(`${dateDone}T00:00:00Z`)
  const start = Date.parse(`${planStartDate}T00:00:00Z`)
  if (!Number.isFinite(done) || !Number.isFinite(start)) return null
  return Math.floor((done - start) / 604800000) + 1
}

export function weeklyVelocity(completedTasks: number, elapsedWeeks: number) {
  return elapsedWeeks > 0 ? completedTasks / elapsedWeeks : 0
}

export function elapsedWeeksSince(startDate: string, asOf = new Date()) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const today = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())
  return Number.isFinite(start) ? Math.max(1, Math.floor((today - start) / 604800000) + 1) : 0
}

export function finishForecast(startDate: string, totalTasks: number, completedTasks: number, velocity: number, asOf = new Date()) {
  const planDate = new Date(`${startDate}T00:00:00Z`)
  if (!Number.isFinite(planDate.getTime())) return { projectedDate: null, planDate: null }
  planDate.setUTCDate(planDate.getUTCDate() + 24 * 7)
  const projectedDate = velocity > 0
    ? new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate() + Math.ceil(Math.max(0, totalTasks - completedTasks) / velocity * 7)))
    : null
  return { projectedDate: projectedDate?.toISOString().slice(0, 10) ?? null, planDate: planDate.toISOString().slice(0, 10) }
}

export function completionByWeek(tasks: Completion[], planStartDate: string) {
  const counts = Array.from({ length: 24 }, (_, index) => ({ week: index + 1, completed: 0 }))
  for (const task of tasks) {
    if (task.status !== 'Done') continue
    const week = completionWeek(task.dateDone, planStartDate)
    if (week !== null && week >= 1 && week <= counts.length) counts[week - 1].completed++
  }
  return counts.map((item, index) => ({ week: item.week, completed: item.completed, total: counts.slice(0, index + 1).reduce((sum, row) => sum + row.completed, 0) }))
}