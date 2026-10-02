import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import taskRows from '../data/tasks.json'

export type Status = 'Not started' | 'In progress' | 'Done'
export type Track = 'AI/ML' | 'Robotics' | 'Design/Web' | 'Video/Social' | 'Resume'
export type Task = {
  id: string
  phase: number
  week: number
  track: Track
  project: string
  topic: string
  output: string
  resource: string
  status: Status
  dateDone: string
  notes: string
}
export type TaskInput = Omit<Task, 'id' | 'phase'> & { id: string | number; phase: number | string }
export type Review = {
  hoursSpent: number
  whatIFinished: string
  whatBlockedMe: string
  postedThisWeek: boolean
  nextWeeksGoals: string
}
type AppState = {
  tasks: Task[]
  taskEdits: Record<string, Partial<Pick<Task, 'status' | 'dateDone' | 'notes'>>>
  reviews: Record<number, Review>
  theme: 'dark' | 'light'
  startDate: string
  pausedWeeks: number
  projectLinks: Record<string, { github: string; demo: string; live: string }>
  updateTask: (id: string, update: Partial<Pick<Task, 'status' | 'dateDone' | 'notes'>>) => void
  updateMany: (ids: string[], status: Status) => void
  saveReview: (week: number, review: Review) => void
  setTheme: (theme: 'dark' | 'light') => void
  setStartDate: (date: string) => void
  setPausedWeeks: (weeks: number) => void
  setProjectLinks: (name: string, links: { github: string; demo: string; live: string }) => void
  importData: (data: Partial<Omit<AppState, 'tasks' | 'taskEdits'>> & { tasks?: TaskInput[] }) => void
  reset: () => void
}

export const normalizeTask = (task: TaskInput): Task => ({
  ...task,
  id: String(task.id),
  phase: typeof task.phase === 'number' ? task.phase : Number(task.phase.match(/^\d+/)?.[0]),
})
const initialTasks = (taskRows as TaskInput[]).map(normalizeTask)
const blankReview = (): Review => ({ hoursSpent: 0, whatIFinished: '', whatBlockedMe: '', postedThisWeek: false, nextWeeksGoals: '' })
const today = () => new Date().toISOString().slice(0, 10)

export const applyTaskUpdate = (task: Task, update: Partial<Pick<Task, 'status' | 'dateDone' | 'notes'>>) => {
  let status = update.status ?? task.status
  let dateDone = update.dateDone ?? task.dateDone
  if (update.status && update.status !== task.status) dateDone = update.status === 'Done' ? dateDone || today() : ''
  else if (task.status === 'Done' && 'dateDone' in update && !update.dateDone) status = 'In progress'
  if (status === 'Done' && !dateDone) dateDone = today()
  if (status !== 'Done') dateDone = ''
  return { ...task, ...update, status, dateDone }
}

export const useRoadmap = create<AppState>()(persist((set) => ({
  tasks: initialTasks,
  taskEdits: {},
  reviews: {},
  theme: 'dark',
  startDate: today(),
  pausedWeeks: 0,
  projectLinks: {},
  updateTask: (id, update) => set((state) => {
    const task = state.tasks.find((item) => item.id === id)
    if (!task) return state
    const updated = applyTaskUpdate(task, update)
    return {
      tasks: state.tasks.map((item) => item.id === id ? updated : item),
      taskEdits: { ...state.taskEdits, [id]: { status: updated.status, dateDone: updated.dateDone, notes: updated.notes } },
    }
  }),
  updateMany: (ids, status) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    const tasks = state.tasks.map((task) => {
      if (!ids.includes(task.id)) return task
      const updated = applyTaskUpdate(task, { status })
      taskEdits[task.id] = { status: updated.status, dateDone: updated.dateDone, notes: updated.notes }
      return updated
    })
    return { tasks, taskEdits }
  }),
  saveReview: (week, review) => set((state) => ({ reviews: { ...state.reviews, [week]: review } })),
  setTheme: (theme) => set({ theme }),
  setStartDate: (startDate) => set({ startDate }),
  setPausedWeeks: (pausedWeeks) => set((state) => {
    const start = new Date(`${state.startDate}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() + (pausedWeeks - state.pausedWeeks) * 7)
    return { startDate: start.toISOString().slice(0, 10), pausedWeeks }
  }),
  setProjectLinks: (name, links) => set((state) => ({ projectLinks: { ...state.projectLinks, [name]: links } })),
  importData: (data) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    for (const imported of data.tasks ?? []) {
      const normalized = normalizeTask(imported)
      const current = state.tasks.find((task) => task.id === normalized.id)
      if (!current || !['Not started', 'In progress', 'Done'].includes(normalized.status)) continue
      const updated = applyTaskUpdate(current, { status: normalized.status, dateDone: normalized.dateDone, notes: normalized.notes })
      taskEdits[current.id] = { status: updated.status, dateDone: updated.dateDone, notes: updated.notes }
    }
    return {
      ...state,
      ...data,
      tasks: state.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })),
      taskEdits,
    }
  }),
  reset: () => set({ tasks: initialTasks, taskEdits: {}, reviews: {}, theme: 'dark', startDate: today(), pausedWeeks: 0, projectLinks: {} }),
}), {
  name: 'roadmap-tracker-v1',
  partialize: (state) => ({ taskEdits: state.taskEdits, reviews: state.reviews, theme: state.theme, startDate: state.startDate, pausedWeeks: state.pausedWeeks, projectLinks: state.projectLinks }) as AppState,
  merge: (persisted, current) => {
    const saved = persisted as Partial<AppState>
    const taskEdits = saved.taskEdits ?? {}
    return { ...current, ...saved, taskEdits, tasks: current.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })) }
  },
}))

export const getReview = (reviews: Record<number, Review>, week: number) => reviews[week] ?? blankReview()