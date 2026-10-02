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
  importData: (data: Partial<Pick<AppState, 'tasks' | 'reviews' | 'theme' | 'startDate' | 'pausedWeeks' | 'projectLinks'>>) => void
  reset: () => void
}

const initialTasks = taskRows as Task[]
const blankReview = (): Review => ({ hoursSpent: 0, whatIFinished: '', whatBlockedMe: '', postedThisWeek: false, nextWeeksGoals: '' })

export const useRoadmap = create<AppState>()(persist((set) => ({
  tasks: initialTasks,
  taskEdits: {},
  reviews: {},
  theme: 'dark',
  startDate: new Date().toISOString().slice(0, 10),
  pausedWeeks: 0,
  projectLinks: {},
  updateTask: (id, update) => set((state) => ({
    tasks: state.tasks.map((task) => task.id === id ? { ...task, ...update } : task),
    taskEdits: { ...state.taskEdits, [id]: { ...state.taskEdits[id], ...update } },
  })),
  updateMany: (ids, status) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    const tasks = state.tasks.map((task) => {
      if (!ids.includes(task.id)) return task
      const dateDone = status === 'Done' ? task.dateDone || new Date().toISOString().slice(0, 10) : task.dateDone
      taskEdits[task.id] = { ...taskEdits[task.id], status, dateDone }
      return { ...task, status, dateDone }
    })
    return { tasks, taskEdits }
  }),
  saveReview: (week, review) => set((state) => ({ reviews: { ...state.reviews, [week]: review } })),
  setTheme: (theme) => set({ theme }),
  setStartDate: (startDate) => set({ startDate }),
  setPausedWeeks: (pausedWeeks) => set({ pausedWeeks }),
  setProjectLinks: (name, links) => set((state) => ({ projectLinks: { ...state.projectLinks, [name]: links } })),
  importData: (data) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    for (const imported of data.tasks ?? []) {
      if (!state.tasks.some((task) => task.id === imported.id)) continue
      taskEdits[imported.id] = { status: imported.status, dateDone: imported.dateDone, notes: imported.notes }
    }
    return {
      ...state,
      ...data,
      tasks: state.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })),
      taskEdits,
    }
  }),
  reset: () => set({ tasks: initialTasks, taskEdits: {}, reviews: {}, theme: 'dark', startDate: new Date().toISOString().slice(0, 10), pausedWeeks: 0, projectLinks: {} }),
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