import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import taskRows from '../data/tasks.json'
import { syncRecordId, type SyncRecord, type SyncRecordType } from './syncMerge'

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
  resumeChecks: Record<string, boolean>
  syncRecords: Record<string, SyncRecord>
  updateTask: (id: string, update: Partial<Pick<Task, 'status' | 'dateDone' | 'notes'>>) => void
  updateMany: (ids: string[], status: Status) => void
  saveReview: (week: number, review: Review) => void
  setTheme: (theme: 'dark' | 'light') => void
  setStartDate: (date: string) => void
  setPausedWeeks: (weeks: number) => void
  setProjectLinks: (name: string, links: { github: string; demo: string; live: string }) => void
  setResumeCheck: (id: string, value: boolean) => void
  applySyncRecords: (records: SyncRecord[]) => void
  importData: (data: {
    tasks?: TaskInput[]
    reviews?: Record<number, Review>
    theme?: 'dark' | 'light'
    startDate?: string
    pausedWeeks?: number
    projectLinks?: Record<string, { github: string; demo: string; live: string }>
    resumeChecks?: Record<string, boolean>
  }) => void
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
const timestamp = () => new Date().toISOString()
const makeRecord = (record_type: SyncRecordType, record_key: string, payload: unknown | null, updated_at = timestamp()): SyncRecord => ({ record_type, record_key, payload, updated_at })
const recordsById = (records: SyncRecord[]) => Object.fromEntries(records.map((record) => [syncRecordId(record), record]))
const isBlankReview = (review: Review) => !review.hoursSpent && !review.whatIFinished && !review.whatBlockedMe && !review.postedThisWeek && !review.nextWeeksGoals

function migrateRecords(saved: Partial<AppState>): Record<string, SyncRecord> {
  if (saved.syncRecords) return saved.syncRecords
  const updated_at = new Date(0).toISOString()
  const records: SyncRecord[] = []
  for (const [id, edit] of Object.entries(saved.taskEdits ?? {})) records.push(makeRecord('task', id, edit, updated_at))
  for (const [week, review] of Object.entries(saved.reviews ?? {})) records.push(makeRecord('review', week, review, updated_at))
  for (const [name, links] of Object.entries(saved.projectLinks ?? {})) records.push(makeRecord('project-link', name, links, updated_at))
  for (const [id, value] of Object.entries(saved.resumeChecks ?? {})) records.push(makeRecord('resume-check', id, value, updated_at))
  if (saved.startDate) records.push(makeRecord('setting', 'startDate', saved.startDate, updated_at))
  if (saved.pausedWeeks !== undefined) records.push(makeRecord('setting', 'pausedWeeks', saved.pausedWeeks, updated_at))
  return recordsById(records)
}

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
  resumeChecks: {},
  syncRecords: {},
  updateTask: (id, update) => set((state) => {
    const task = state.tasks.find((item) => item.id === id)
    if (!task) return state
    const updated = applyTaskUpdate(task, update)
    return {
      tasks: state.tasks.map((item) => item.id === id ? updated : item),
      taskEdits: { ...state.taskEdits, [id]: { status: updated.status, dateDone: updated.dateDone, notes: updated.notes } },
      syncRecords: { ...state.syncRecords, [syncRecordId({ record_type: 'task', record_key: id })]: makeRecord('task', id, { status: updated.status, dateDone: updated.dateDone, notes: updated.notes }) },
    }
  }),
  updateMany: (ids, status) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    const syncRecords = { ...state.syncRecords }
    const updated_at = timestamp()
    const tasks = state.tasks.map((task) => {
      if (!ids.includes(task.id)) return task
      const updated = applyTaskUpdate(task, { status })
      const edit = { status: updated.status, dateDone: updated.dateDone, notes: updated.notes }
      taskEdits[task.id] = edit
      const record = makeRecord('task', task.id, edit, updated_at)
      syncRecords[syncRecordId(record)] = record
      return updated
    })
    return { tasks, taskEdits, syncRecords }
  }),
  saveReview: (week, review) => set((state) => {
    const reviews = { ...state.reviews }
    const payload = isBlankReview(review) ? null : review
    if (payload) reviews[week] = review
    else delete reviews[week]
    const record = makeRecord('review', String(week), payload)
    return { reviews, syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record } }
  }),
  setTheme: (theme) => set({ theme }),
  setStartDate: (startDate) => set((state) => {
    const record = makeRecord('setting', 'startDate', startDate)
    return { startDate, syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record } }
  }),
  setPausedWeeks: (pausedWeeks) => set((state) => {
    const start = new Date(`${state.startDate}T00:00:00Z`)
    start.setUTCDate(start.getUTCDate() + (pausedWeeks - state.pausedWeeks) * 7)
    const startDate = start.toISOString().slice(0, 10)
    const updated_at = timestamp()
    const startRecord = makeRecord('setting', 'startDate', startDate, updated_at)
    const pauseRecord = makeRecord('setting', 'pausedWeeks', pausedWeeks, updated_at)
    return { startDate, pausedWeeks, syncRecords: { ...state.syncRecords, [syncRecordId(startRecord)]: startRecord, [syncRecordId(pauseRecord)]: pauseRecord } }
  }),
  setProjectLinks: (name, links) => set((state) => {
    const projectLinks = { ...state.projectLinks }
    const payload = Object.values(links).some(Boolean) ? links : null
    if (payload) projectLinks[name] = links
    else delete projectLinks[name]
    const record = makeRecord('project-link', name, payload)
    return { projectLinks, syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record } }
  }),
  setResumeCheck: (id, value) => set((state) => {
    const resumeChecks = { ...state.resumeChecks, [id]: value }
    const record = makeRecord('resume-check', id, value)
    return { resumeChecks, syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record } }
  }),
  applySyncRecords: (records) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    const reviews = { ...state.reviews }
    const projectLinks = { ...state.projectLinks }
    const resumeChecks = { ...state.resumeChecks }
    let startDate = state.startDate
    let pausedWeeks = state.pausedWeeks
    for (const record of records) {
      const { record_key: key, payload } = record
      if (record.record_type === 'task') {
        if (payload === null) delete taskEdits[key]
        else taskEdits[key] = payload as Partial<Pick<Task, 'status' | 'dateDone' | 'notes'>>
      } else if (record.record_type === 'review') {
        if (payload === null) delete reviews[Number(key)]
        else reviews[Number(key)] = payload as Review
      } else if (record.record_type === 'project-link') {
        if (payload === null) delete projectLinks[key]
        else projectLinks[key] = payload as { github: string; demo: string; live: string }
      } else if (record.record_type === 'resume-check') {
        if (payload === null) delete resumeChecks[key]
        else resumeChecks[key] = payload as boolean
      } else if (record.record_type === 'setting') {
        if (key === 'startDate' && typeof payload === 'string') startDate = payload
        if (key === 'pausedWeeks' && typeof payload === 'number') pausedWeeks = payload
      }
    }
    return {
      syncRecords: recordsById(records), taskEdits, reviews, projectLinks, resumeChecks,
      startDate, pausedWeeks,
      tasks: state.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })),
    }
  }),
  importData: (data) => set((state) => {
    const taskEdits = { ...state.taskEdits }
    const syncRecords = { ...state.syncRecords }
    const updated_at = timestamp()
    for (const imported of data.tasks ?? []) {
      const normalized = normalizeTask(imported)
      const current = state.tasks.find((task) => task.id === normalized.id)
      if (!current || !['Not started', 'In progress', 'Done'].includes(normalized.status)) continue
      const updated = applyTaskUpdate(current, { status: normalized.status, dateDone: normalized.dateDone, notes: normalized.notes })
      const edit = { status: updated.status, dateDone: updated.dateDone, notes: updated.notes }
      taskEdits[current.id] = edit
      const record = makeRecord('task', current.id, edit, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    const reviews = data.reviews ?? state.reviews
    const projectLinks = data.projectLinks ?? state.projectLinks
    const resumeChecks = data.resumeChecks ?? state.resumeChecks
    if (data.reviews) for (const week of new Set([...Object.keys(state.reviews), ...Object.keys(data.reviews)])) {
      const record = makeRecord('review', week, data.reviews[Number(week)] ?? null, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    if (data.projectLinks) for (const name of new Set([...Object.keys(state.projectLinks), ...Object.keys(data.projectLinks)])) {
      const record = makeRecord('project-link', name, data.projectLinks[name] ?? null, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    if (data.resumeChecks) for (const id of new Set([...Object.keys(state.resumeChecks), ...Object.keys(data.resumeChecks)])) {
      const record = makeRecord('resume-check', id, data.resumeChecks[id] ?? null, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    if (data.startDate !== undefined) {
      const record = makeRecord('setting', 'startDate', data.startDate, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    if (data.pausedWeeks !== undefined) {
      const record = makeRecord('setting', 'pausedWeeks', data.pausedWeeks, updated_at)
      syncRecords[syncRecordId(record)] = record
    }
    return {
      ...state,
      ...data, reviews, projectLinks, resumeChecks, syncRecords,
      tasks: state.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })),
      taskEdits,
    }
  }),
  reset: () => set((state) => {
    const startDate = today()
    const updated_at = timestamp()
    const syncRecords: Record<string, SyncRecord> = Object.fromEntries(Object.entries(state.syncRecords).map(([id, record]) => [id, { ...record, payload: null, updated_at }]))
    const startRecord = makeRecord('setting', 'startDate', startDate, updated_at)
    const pauseRecord = makeRecord('setting', 'pausedWeeks', 0, updated_at)
    syncRecords[syncRecordId(startRecord)] = startRecord
    syncRecords[syncRecordId(pauseRecord)] = pauseRecord
    return { tasks: initialTasks, taskEdits: {}, reviews: {}, theme: 'dark', startDate, pausedWeeks: 0, projectLinks: {}, resumeChecks: {}, syncRecords }
  }),
}), {
  name: 'roadmap-tracker-v1',
  partialize: (state) => ({ taskEdits: state.taskEdits, reviews: state.reviews, theme: state.theme, startDate: state.startDate, pausedWeeks: state.pausedWeeks, projectLinks: state.projectLinks, resumeChecks: state.resumeChecks, syncRecords: state.syncRecords }) as AppState,
  merge: (persisted, current) => {
    const saved = persisted as Partial<AppState>
    const taskEdits = saved.taskEdits ?? {}
    return { ...current, ...saved, taskEdits, syncRecords: migrateRecords(saved), resumeChecks: saved.resumeChecks ?? {}, tasks: current.tasks.map((task) => ({ ...task, ...taskEdits[task.id] })) }
  },
}))

export const getReview = (reviews: Record<number, Review>, week: number) => reviews[week] ?? blankReview()