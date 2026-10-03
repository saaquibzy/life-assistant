export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'parked'

export type NeedsValue = string[] | 'none' | 'all' | 'all earlier gates'

export type RoadmapTask = {
  id: string
  trackCode: 'ML' | 'RB' | 'DW' | 'VD' | 'JB'
  phase: number
  step: string
  budgetHours: number
  hoursNote: string
  needs: NeedsValue
  doneWhen: string
  optional: boolean
  topic: string
  group: string
  status: TaskStatus
  doneAt: string
  notes: string
  proofLink: string
  minimumPass: boolean
  skippedAt: string | null
}

export type RoadmapState = {
  tasks: RoadmapTask[]
  strictGates?: boolean
}

export const normalizeNeeds = (value: unknown): NeedsValue => {
  if (value === undefined || value === null || value === 'none') return 'none'
  if (value === 'all') return 'all'
  if (value === 'all earlier gates') return 'all earlier gates'
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return 'none'
    return trimmed.split(',').map((part) => part.trim()).filter(Boolean)
  }
  return 'none'
}

export function parseHours(raw: string): { hours: number; note: string } {
  const text = String(raw ?? '').trim()
  if (!text) return { hours: 0, note: '' }

  const candidate = text.replace(/\s+/g, ' ')
  const rangeMatch = candidate.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
  if (rangeMatch) {
    return { hours: Number(rangeMatch[1]), note: candidate }
  }

  const numericMatch = candidate.match(/(\d+(?:\.\d+)?)/)
  if (!numericMatch) return { hours: 0, note: candidate }

  return { hours: Number(numericMatch[1]), note: candidate }
}

export function getParentIds(task: Pick<RoadmapTask, 'id' | 'needs' | 'phase' | 'optional'>, tasks: RoadmapTask[]): string[] {
  if (task.needs === 'none') return []
  if (task.needs === 'all') {
    return tasks
      .filter((candidate) => !candidate.optional && candidate.phase < task.phase && candidate.id !== task.id)
      .map((candidate) => candidate.id)
  }
  if (task.needs === 'all earlier gates') {
    return tasks
      .filter((candidate) => !candidate.optional && candidate.phase < task.phase && candidate.id !== task.id)
      .map((candidate) => candidate.id)
  }
  return Array.isArray(task.needs) ? task.needs.filter(Boolean) : []
}

export function isTaskDone(task: Pick<RoadmapTask, 'status'>): boolean {
  return task.status === 'done'
}

export function isUnlocked(task: RoadmapTask, state: RoadmapState): boolean {
  if (task.optional) return true
  if (task.status === 'done') return true

  const parentIds = getParentIds(task, state.tasks)
  if (!parentIds.length) return true

  return parentIds.every((id) => {
    const parent = state.tasks.find((candidate) => candidate.id === id)
    return Boolean(parent && isTaskDone(parent))
  })
}

export function nextUnlocked(topic: string, state: RoadmapState): RoadmapTask | undefined {
  const topicTasks = state.tasks
    .filter((task) => task.topic === topic)
    .sort((a, b) => a.phase - b.phase || a.id.localeCompare(b.id))

  return topicTasks.find((task) => !isTaskDone(task) && isUnlocked(task, state))
}

export function progressByPhase(tasks: RoadmapTask[], phase: number): {
  totalSteps: number
  doneSteps: number
  totalHours: number
  doneHours: number
  percentSteps: number
  percentHours: number
} {
  const phaseTasks = tasks.filter((task) => task.phase === phase)
  const totalSteps = phaseTasks.length
  const doneSteps = phaseTasks.filter((task) => isTaskDone(task)).length
  const totalHours = phaseTasks.reduce((sum, task) => sum + task.budgetHours, 0)
  const doneHours = phaseTasks
    .filter((task) => isTaskDone(task))
    .reduce((sum, task) => sum + task.budgetHours, 0)

  return {
    totalSteps,
    doneSteps,
    totalHours,
    doneHours,
    percentSteps: totalSteps ? (doneSteps / totalSteps) * 100 : 0,
    percentHours: totalHours ? (doneHours / totalHours) * 100 : 0,
  }
}

export function progressByTopic(tasks: RoadmapTask[], topic: string): {
  totalSteps: number
  doneSteps: number
  totalHours: number
  doneHours: number
  percentSteps: number
  percentHours: number
} {
  const topicTasks = tasks.filter((task) => task.topic === topic)
  const totalSteps = topicTasks.length
  const doneSteps = topicTasks.filter((task) => isTaskDone(task)).length
  const totalHours = topicTasks.reduce((sum, task) => sum + task.budgetHours, 0)
  const doneHours = topicTasks
    .filter((task) => isTaskDone(task))
    .reduce((sum, task) => sum + task.budgetHours, 0)

  return {
    totalSteps,
    doneSteps,
    totalHours,
    doneHours,
    percentSteps: totalSteps ? (doneSteps / totalSteps) * 100 : 0,
    percentHours: totalHours ? (doneHours / totalHours) * 100 : 0,
  }
}

export function gateCycleCheck(tasks: RoadmapTask[]): { hasCycle: boolean; cycle: string[] } {
  const graph = new Map<string, string[]>()
  for (const task of tasks) {
    const dependencies = getParentIds(task, tasks)
    graph.set(task.id, dependencies.filter((parent) => tasks.some((candidate) => candidate.id === parent)))
  }

  const visited = new Set<string>()
  const stack = new Set<string>()
  const cycle: string[] = []

  const visit = (id: string): boolean => {
    if (stack.has(id)) {
      cycle.push(id)
      return true
    }
    if (visited.has(id)) return false

    visited.add(id)
    stack.add(id)
    const deps = graph.get(id) ?? []
    for (const dep of deps) {
      if (visit(dep)) {
        cycle.push(id)
        return true
      }
    }
    stack.delete(id)
    return false
  }

  const found = Array.from(graph.keys()).some((key) => visit(key))
  const uniqueCycle = Array.from(new Set(cycle)).filter(Boolean)
  return { hasCycle: found, cycle: uniqueCycle }
}

export function resolveSwipe(offsetX: number, velocityX: number, threshold = 110): 'left' | 'right' | 'none' {
  if (offsetX > threshold || velocityX > 600) return 'right'
  if (offsetX < -threshold || velocityX < -600) return 'left'
  return 'none'
}

export function elapsedAcrossSessions(sessions: Array<{ startedAt: string; endedAt: string | null }>, trimTo?: string): number {
  const safeTrim = trimTo ? Date.parse(trimTo) : Number.POSITIVE_INFINITY
  let totalMs = 0

  for (const session of sessions) {
    const started = Date.parse(session.startedAt)
    const endedAt = session.endedAt ? Date.parse(session.endedAt) : Date.now()
    const effectiveEnd = Math.min(endedAt, safeTrim)
    if (!Number.isFinite(started) || !Number.isFinite(effectiveEnd)) continue
    if (effectiveEnd > started) totalMs += effectiveEnd - started
  }

  return Math.round(totalMs / 1000)
}
