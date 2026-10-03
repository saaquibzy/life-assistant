import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import taskRows from '../data/tasks.json'
import { canStartTask, normalizeNeeds, type RoadmapTask, type TaskStatus } from './lib/roadmap'
import { syncRecordId, type SyncRecord } from './syncMerge'
import { closeSession, openSession, trimOpenSession, validateTimerSessions, type TimerSession } from './lib/timer'
import { newId } from './lib/id'

export type Task = RoadmapTask
export type Status = TaskStatus
export type TaskUpdate = Partial<Pick<Task, 'status' | 'doneAt' | 'notes' | 'proofLink' | 'minimumPass' | 'skippedAt'>>
export type HabitKey = 'daily-review' | 'coding-practice' | 'git-push' | 'clip-due'
type TaskData = Omit<Task, 'trackCode' | 'status' | 'needs'> & {
  trackCode: string
  status: string
  needs: unknown
}
type AppState = {
  schemaVersion: 2
  timerSessions: TimerSession[]
  activeSessionId: string | null
  lastSeenAt: string | null
  budgetNotifications: boolean
  swipeMode: boolean
  swipeDefaultMobile: boolean
  tasks: Task[]
  theme: 'dark' | 'light'
  strictGates: boolean
  gateChecks: Record<string, boolean>
  habitsEnabled: boolean
  habits: Record<HabitKey, string[]>
  restWeeks: string[]
  syncRecords: Record<string, SyncRecord>
  migrationBackup: string | null
  updateTask: (id: string, update: TaskUpdate, confirmedLocked?: boolean) => void
  updateMany: (ids: string[], status: Status) => void
  startTask: (id: string, confirmedLocked?: boolean) => boolean
  pauseTask: (id?: string) => void
  updateLastSeen: (at?: string) => void
  trimActiveSession: (at: string) => void
  parkTask: (id: string, blockerNote: string) => boolean
  completeTask: (id: string, doneWhenConfirmed: boolean, confirmedLocked?: boolean) => boolean
  setTheme: (theme: 'dark' | 'light') => void
  setStrictGates: (value: boolean) => void
  setGateCheck: (key: string, value: boolean) => void
  setHabitsEnabled: (value: boolean) => void
  setBudgetNotifications: (value: boolean) => void
  setSwipeMode: (value: boolean) => void
  setSwipeDefaultMobile: (value: boolean) => void
  toggleHabit: (habit: HabitKey, date?: string) => void
  toggleRestWeek: (week: string) => void
  applySyncRecords: (records: SyncRecord[]) => void
  importData: (data: {
    tasks?: Task[]
    theme?: 'dark' | 'light'
    strictGates?: boolean
    gateChecks?: Record<string, boolean>
    habitsEnabled?: boolean
    habits?: Record<HabitKey, string[]>
    restWeeks?: string[]
    timerSessions?: TimerSession[]
    activeSessionId?: string | null
    lastSeenAt?: string | null
  }) => void
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

type PersistedState = Pick<AppState, 'schemaVersion' | 'tasks' | 'theme' | 'strictGates' | 'gateChecks' | 'habitsEnabled' | 'habits' | 'restWeeks' | 'syncRecords' | 'migrationBackup' | 'timerSessions' | 'activeSessionId' | 'lastSeenAt' | 'budgetNotifications' | 'swipeMode' | 'swipeDefaultMobile'>

function isPersistedV2(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false
  const saved = value as Record<string, unknown>
  return saved.schemaVersion === 2 && Array.isArray(saved.tasks) &&
    (saved.theme === 'dark' || saved.theme === 'light') &&
    typeof saved.syncRecords === 'object' && saved.syncRecords !== null &&
    (typeof saved.migrationBackup === 'string' || saved.migrationBackup === null) &&
    (saved.timerSessions === undefined || validateTimerSessions(saved.timerSessions))
}

const freshState = (): PersistedState => ({
  schemaVersion: 2,
  tasks: initialTasks.map((task) => ({ ...task })),
  theme: 'dark',
  strictGates: true,
  gateChecks: {},
  habitsEnabled: false,
  habits: { 'daily-review': [], 'coding-practice': [], 'git-push': [], 'clip-due': [] },
  restWeeks: [],
  syncRecords: {},
  migrationBackup: null,
  timerSessions: [], activeSessionId: null, lastSeenAt: null, budgetNotifications: false, swipeMode: false, swipeDefaultMobile: false,
})

export function migratePersistedState(persisted: unknown, version: number): PersistedState {
  if (version === 2 && isPersistedV2(persisted)) return { ...freshState(), ...persisted, timerSessions: (persisted as any).timerSessions ?? [], activeSessionId: (persisted as any).activeSessionId ?? null, lastSeenAt: (persisted as any).lastSeenAt ?? null }
  if (!persisted || typeof persisted !== 'object' || !Object.keys(persisted).length) return freshState()
  return { ...freshState(), migrationBackup: JSON.stringify(persisted, null, 2) }
}

export function mergeTaskProgress(currentTasks: Task[], persistedTasks: Task[]): Task[] {
  const persistedById = new Map(persistedTasks.map((task) => [task.id, task]))
  return currentTasks.map((task) => {
    const saved = persistedById.get(task.id)
    return saved ? {
      ...task,
      status: saved.status,
      doneAt: saved.doneAt,
      notes: saved.notes,
      proofLink: saved.proofLink,
      minimumPass: saved.minimumPass,
      skippedAt: saved.skippedAt,
    } : task
  })
}

function mergePersistedState(persisted: unknown, current: AppState): AppState {
  if (!persisted || typeof persisted !== 'object') return current
  const saved = persisted as Partial<AppState>
  return {
    ...current,
    ...saved,
    schemaVersion: 2,
    tasks: mergeTaskProgress(current.tasks, Array.isArray(saved.tasks) ? saved.tasks : []),
    timerSessions: Array.isArray(saved.timerSessions) ? saved.timerSessions : [],
    activeSessionId: typeof saved.activeSessionId === 'string' && (saved.timerSessions ?? []).some(s => s.id === saved.activeSessionId && !s.endedAt)
      ? saved.activeSessionId : (saved.timerSessions ?? []).find(s => !s.endedAt)?.id ?? null,
    lastSeenAt: typeof saved.lastSeenAt === 'string' ? saved.lastSeenAt : null,
  }
}

export function applyTaskUpdate(task: Task, update: TaskUpdate): Task {
  const status = update.status ?? task.status
  const doneAt = status === 'done'
    ? (update.doneAt ?? task.doneAt) || today()
    : ''
  const skippedAt = update.skippedAt !== undefined
    ? update.skippedAt
    : status === 'parked' ? task.skippedAt ?? today() : status === 'done' ? null : task.skippedAt
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

function changeTask(
  state: Pick<AppState, 'tasks' | 'syncRecords' | 'strictGates'>,
  id: string,
  update: TaskUpdate,
  confirmedLocked = false,
): Pick<AppState, 'tasks' | 'syncRecords'> | null {
  const current = state.tasks.find((task) => task.id === id)
  if (!current) return null
  if ((update.status === 'in_progress' || update.status === 'done') &&
      !canStartTask(current, state.tasks, state.strictGates, confirmedLocked)) return null
  if (update.status === 'parked' && !(update.notes ?? current.notes).trim()) return null
  const updated = applyTaskUpdate(current, update)
  const record = makeTaskRecord(updated)
  return {
    tasks: state.tasks.map((task) => task.id === id ? updated : task),
    syncRecords: { ...state.syncRecords, [syncRecordId(record)]: record },
  }
}

export const useRoadmap = create<AppState>()(persist((set) => ({
  ...freshState(),
  updateTask: (id, update, confirmedLocked = false) => set((state) => {
    const changed = changeTask(state, id, update, confirmedLocked)
    if (!changed) return state
    if ((update.status === 'done' || update.status === 'parked') && state.timerSessions.some(s => s.id === state.activeSessionId && s.taskId === id)) return { ...changed, timerSessions: closeSession(state.timerSessions, timestamp()), activeSessionId: null }
    return changed
  }),
  updateMany: (ids, status) => set((state) => {
    const selected = new Set(ids)
    const updated_at = timestamp()
    const syncRecords = { ...state.syncRecords }
    const tasks = state.tasks.map((task) => {
      if (!selected.has(task.id) ||
          ((status === 'in_progress' || status === 'done') && !canStartTask(task, state.tasks, state.strictGates))) return task
      if (status === 'parked' && !task.notes.trim()) return task
      const updated = applyTaskUpdate(task, { status })
      const record = makeTaskRecord(updated, updated_at)
      syncRecords[syncRecordId(record)] = record
      return updated
    })
    const active = state.timerSessions.find(s => s.id === state.activeSessionId)
    if (active && selected.has(active.taskId) && (status === 'done' || status === 'parked')) return { tasks, syncRecords, timerSessions: closeSession(state.timerSessions, timestamp()), activeSessionId: null }
    return { tasks, syncRecords }
  }),
  startTask: (id, confirmedLocked = false) => {
    let started = false
    set((state) => {
      const updated = changeTask(state, id, { status: 'in_progress' }, confirmedLocked)
      if (!updated) return state
      started = true
      const at = timestamp()
      const sessions = openSession(state.timerSessions, { id: newId(), taskId: id, startedAt: at, endedAt: null })
      return { ...updated, timerSessions: sessions, activeSessionId: sessions[sessions.length - 1].id, lastSeenAt: at }
    })
    return started
  },
  pauseTask: (id) => set((state) => {
    const active = state.timerSessions.find(s => s.id === state.activeSessionId)
    if (!active || (id && active.taskId !== id)) return state
    return { timerSessions: closeSession(state.timerSessions, timestamp()), activeSessionId: null }
  }),
  updateLastSeen: (at = timestamp()) => set({ lastSeenAt: at }),
  trimActiveSession: (at) => set((state) => ({ timerSessions: trimOpenSession(state.timerSessions, at), activeSessionId: null })),
  parkTask: (id, blockerNote) => {
    if (!blockerNote.trim()) return false
    let parked = false
    set((state) => {
      const updated = changeTask(state, id, { status: 'parked', notes: blockerNote.trim() }, true)
      if (!updated) return state
      parked = true
      return { ...updated, timerSessions: closeSession(state.timerSessions, timestamp()), activeSessionId: null }
    })
    return parked
  },
  completeTask: (id, doneWhenConfirmed, confirmedLocked = false) => {
    if (!doneWhenConfirmed) return false
    let completed = false
    set((state) => {
      const updated = changeTask(state, id, { status: 'done' }, confirmedLocked)
      if (!updated) return state
      completed = true
      return { ...updated, timerSessions: closeSession(state.timerSessions, timestamp()), activeSessionId: null }
    })
    return completed
  },
  setTheme: (theme) => set({ theme }),
  setStrictGates: (strictGates) => set({ strictGates }),
  setGateCheck: (key, value) => set((state) => ({ gateChecks: { ...state.gateChecks, [key]: value } })),
  setHabitsEnabled: (habitsEnabled) => set({ habitsEnabled }),
  setBudgetNotifications: (budgetNotifications) => set({ budgetNotifications }),
  setSwipeMode: (swipeMode) => set({ swipeMode }),
  setSwipeDefaultMobile: (swipeDefaultMobile) => set({ swipeDefaultMobile }),
  toggleHabit: (habit, date = today()) => set((state) => {
    const dates = state.habits[habit]
    return { habits: { ...state.habits, [habit]: dates.includes(date) ? dates.filter((item) => item !== date) : [...dates, date] } }
  }),
  toggleRestWeek: (week) => set((state) => ({
    restWeeks: state.restWeeks.includes(week) ? state.restWeeks.filter((item) => item !== week) : [...state.restWeeks, week],
  })),
  applySyncRecords: (records) => set((state) => ({
    tasks: applyTaskRecords(state.tasks, records),
    syncRecords: Object.fromEntries(records.map((record) => [syncRecordId(record), record])),
  })),
  importData: (data) => set((state) => ({
    ...state,
    theme: data.theme ?? state.theme,
    strictGates: data.strictGates ?? state.strictGates,
    gateChecks: data.gateChecks ?? state.gateChecks,
    habitsEnabled: data.habitsEnabled ?? state.habitsEnabled,
    habits: data.habits ?? state.habits,
    restWeeks: data.restWeeks ?? state.restWeeks,
    timerSessions: data.timerSessions ?? state.timerSessions,
    activeSessionId: data.activeSessionId ?? data.timerSessions?.find(s => !s.endedAt)?.id ?? null,
    lastSeenAt: data.lastSeenAt ?? state.lastSeenAt,
    tasks: data.tasks ? initialTasks.map((task) => data.tasks!.find((imported) => imported.id === task.id) ?? task) : state.tasks,
  })),
  clearMigrationBackup: () => set({ migrationBackup: null }),
  reset: () => set({ ...freshState() }),
}), {
  name: 'roadmap-tracker-v1',
  version: 2,
  migrate: migratePersistedState,
  merge: mergePersistedState,
  partialize: (state) => ({
    schemaVersion: state.schemaVersion,
    tasks: state.tasks,
    theme: state.theme,
    strictGates: state.strictGates,
    gateChecks: state.gateChecks,
    habitsEnabled: state.habitsEnabled,
    habits: state.habits,
    restWeeks: state.restWeeks,
    syncRecords: state.syncRecords,
    migrationBackup: state.migrationBackup,
    timerSessions: state.timerSessions,
    activeSessionId: state.activeSessionId,
    lastSeenAt: state.lastSeenAt,
    budgetNotifications: state.budgetNotifications,
    swipeMode: state.swipeMode,
    swipeDefaultMobile: state.swipeDefaultMobile,
  }),
}))
