import { isUnlocked, resolveSwipe, type RoadmapTask } from './roadmap'
export { resolveSwipe }

export function isSkippedToday(task: Pick<RoadmapTask, 'skippedAt'>, date = new Date().toISOString().slice(0, 10)): boolean {
  return task.skippedAt === date
}

export function buildStepDeck(tasks: RoadmapTask[], topic: string, date = new Date().toISOString().slice(0, 10)): RoadmapTask[] {
  return tasks.filter(task => task.topic === topic && task.status !== 'done' && task.status !== 'parked' && !isSkippedToday(task, date) && isUnlocked(task, { tasks }))
    .sort((a, b) => Number(a.optional) - Number(b.optional))
}

export function skipStep(tasks: RoadmapTask[], id: string, date = new Date().toISOString().slice(0, 10)): RoadmapTask[] {
  return tasks.map(task => task.id === id ? { ...task, skippedAt: date } : task)
}

export function undoStepSkip(tasks: RoadmapTask[], id: string, previous: string | null = null): RoadmapTask[] {
  return tasks.map(task => task.id === id ? { ...task, skippedAt: previous } : task)
}
