import { lockedReason, resolveSwipe, type RoadmapTask } from './roadmap'
export { resolveSwipe }

export type SwipeStage = 'topics' | 'steps'
export type SwipeAction = 'defer-topic' | 'choose-topic' | 'skip-step' | 'start-step'
export function swipeAction(stage: SwipeStage, direction: 'left' | 'right'): SwipeAction {
  if (stage === 'topics') return direction === 'right' ? 'choose-topic' : 'defer-topic'
  return direction === 'right' ? 'start-step' : 'skip-step'
}

export function isSkippedToday(task: Pick<RoadmapTask, 'skippedAt'>, date = new Date().toISOString().slice(0, 10)): boolean {
  return task.skippedAt === date
}

export function buildStepDeck(tasks: RoadmapTask[], topic: string, date = new Date().toISOString().slice(0, 10)): RoadmapTask[] {
  return tasks.filter(task => task.topic === topic && task.status !== 'done' && task.status !== 'parked' && !isSkippedToday(task, date))
    .sort((a, b) => Number(lockedReason(a, { tasks }).length > 0) - Number(lockedReason(b, { tasks }).length > 0) || Number(a.optional) - Number(b.optional))
}

export function skipStep(tasks: RoadmapTask[], id: string, date = new Date().toISOString().slice(0, 10)): RoadmapTask[] {
  return tasks.map(task => task.id === id ? { ...task, skippedAt: date } : task)
}

export function undoStepSkip(tasks: RoadmapTask[], id: string, previous: string | null = null): RoadmapTask[] {
  return tasks.map(task => task.id === id ? { ...task, skippedAt: previous } : task)
}
