import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import taskRows from '../data/tasks.json'
import { isUnlocked, normalizeNeeds, type RoadmapTask, type TaskStatus } from './lib/roadmap'
import { syncRecordId, type SyncRecord } from './syncMerge'

export type Task = RoadmapTask
export type Status = TaskStatus
export type TaskUpdate = Partial<Pick<Task, 'status' | 'doneAt' | 'notes' | 'proofLink' | 'minimumPass' | 'skippedAt'>>
type TaskData = Omit<Task, 'trackCode' | 'status' | 'needs'> & {
  trackCode: string
  status: string
  needs: unknown
}
type AppState = {
  schemaVersion: 2
  tasks: Task[]
  theme: 'dark' | 'light'
  syncRecords: Record<string, SyncRecord>
  migrationBackup: string | null
  updateTask: (id: string, update: TaskUpdate) => void
  updateMany: (ids: string[], status: Status) => void
  setTheme: (theme: 'dark' | 'light') => void
  applySyncRecords: (records: SyncRecord[]) => void
  importData: (data: { tasks?: Task[]; theme?: 'dark' | 'light' }) => void
  clearMigrationBackup: () => void
  reset: () => void
}

const today = () => new Date().toISOString().slice(0, 10)
const timestamp = () => new Date().toISOString()

function parseTrackCode(value: string): Task['trackCode'] {
  switch (value) {
    case 'ML':
    case 'RB':
    case 'DW':
    case 'VD':
    case 'JB': return value
    default: throw new Error(`Unknown track code: ${value}`)
  }
}

function parseStatus(value: string): TaskStatus {
  switch (value) {
    case 'not_started':
    case 'in_progress':
    case 'done':
    case 'parked': return value
    default: throw new Error(`Unknown task status: ${value}`)
  }
}

export function normalizeTask(task: TaskData): Task {
  return {
    ...task,
    trackCode: parseTrackCode(task.trackCode),
    status: parseStatus(task.status),
    needs: normalizeNeeds(task.needs),
  }
}

export const initialTasks: Task[] = taskRows.map(normalizeTask)

type PersistedState = Pick<AppState, 'schemaVersion' | 'tasks' | 'theme' | 'syncRecords' | 'migrationBackup'>

function isPersistedV2(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false
  const saved = value as Record<string, unknown>
  return saved.schemaVersion === 2 && Array.isArray(saved.tasks) &&
    (saved.theme === 'dark' || saved.theme === 'light') &&
    typeof saved.syncRecords === 'object' && saved.syncRecords !== null &&
    (typeof saved.migrationBackup === 'string' || saved.migrationBackup === null)
}

const freshState = (): PersistedState => ({
  schemaVersion: 2,
  tasks: initialTasks.map((task) => ({ ...task })),
  theme: 'dark',
  syncRecords: {},
  migrationBackup: null,
})

export function migratePersistedState(persisted: unknown, version: number): PersistedState {
  if (version === 2 && isPersistedV2(persisted)) return persisted
  if (!persisted || typeof persisted !== 'object' || !Object.keys(persisted).length) return freshState()
  return { ...freshState(), migrationBackup: JSON.stringify(persisted, null, 2) }
}

export function applyTaskUpdate(task: Task, update: TaskUpdate): Task {
  const status = update.status ?? task.status
  const doneAt = status === 'done'
    ? (update.doneAt ?? task.doneAt) || today()
    : ''
  const skippedAt = status === 'parked'
    ? update.skippedAt ?? task.skippedAt ?? today()
    : null
  return { ...task, ...update, status, doneAt, skippedAt }
}

const makeTaskRecord = (task: Task, updated_at = timestamp()): SyncRecord => ({
  record_type: 'task',
  record_key: task.id,
  payload: {
    status: task.status,
    doneAt: task.doneAt,
    notes: task.notes,
    proofLink: task.proofLink,
    minimumPass: task.minimumPass,
    skippedAt: task.skippedAt,
  },
  updated_at,
})

function applyTaskRecords(tasks: Task[], records: SyncRecord[]): Task[] {
  const updates = new Map(records.filter((record) => record.record_type === 'task' && record.payload)
    .map((record) => [record.record_key, record.payload as TaskUpdate]))
  return tasks.map((task) => updates.has(task.id) ? applyTaskUpdate(task, updates.get(task.id)!) : task)
}

export const useRoadmap = create<AppState>()(persist((set) => ({
  ...freshState(),
  updateTask: (id, update) => set((state) => {
    const current = state.tasks.find((task) => task.id === id)
    if (!current || (update.status && !isUnlocked(current, { tasks: state.tasks }))) return state
    const updated = applyTaskUpdate(current, update)
    const record = makeTaskRecord(updated)
    return {
      tasks: state.tasks.map((task) => task.id === id ? updated : task),
      syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record },
    }
  }),
  updateMany: (ids, status) => set((state) => {
    const selected = new Set(ids)
    const updated_at = timestamp()
    const syncRecords = { ...state.syncRecords }
    const tasks = state.tasks.map((task) => {
      if (!selected.has(task.id) || !isUnlocked(task, { tasks: state.tasks })) return task
      const updated = applyTaskUpdate(task, { status })
      const record = makeTaskRecord(updated, updated_at)
      syncRecords[syncRecordId(record)] = record
      return updated
    })
    return { tasks, syncRecords }
  }),
  setTheme: (theme) => set({ theme }),
  applySyncRecords: (records) => set((state) => ({
    tasks: applyTaskRecords(state.tasks, records),
    syncRecords: Object.fromEntries(records.map((record) => [syncRecordId(record), record])),
  })),
  importData: (data) => set((state) => ({
    ...state,
    theme: data.theme ?? state.theme,
    tasks: data.tasks ? initialTasks.map((task) => data.tasks!.find((imported) => imported.id === task.id) ?? task) : state.tasks,
  })),
  clearMigrationBackup: () => set({ migrationBackup: null }),
  reset: () => set({ ...freshState() }),
}), {
  name: 'roadmap-tracker-v1',
  version: 2,
  migrate: migratePersistedState,
  partialize: (state) => ({
    schemaVersion: state.schemaVersion,
    tasks: state.tasks,
    theme: state.theme,
    syncRecords: state.syncRecords,
    migrationBackup: state.migrationBackup,
  }),
}))