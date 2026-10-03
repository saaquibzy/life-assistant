import { describe, expect, it } from 'vitest'

import { applyTaskUpdate, initialTasks, mergeTaskProgress, migratePersistedState } from './store'
import { coreHours, nextUnlocked, optionalHours, progressByPhase } from './lib/roadmap'
import taskRows from '../data/tasks.json'
import topicRows from '../data/topics.json'
import phaseRows from '../data/phases.json'

const tasks = taskRows as Array<Record<string, unknown>>
const topics = topicRows as Array<{ name: string; groups: Array<{ name: string; taskIds: string[] }> }>

describe('task state', () => {
  it('assigns every task ID to exactly one matching topic and group', () => {
    const assignments = topics.flatMap((topic) => topic.groups.flatMap((group) =>
      group.taskIds.map((id) => ({ id, topic: topic.name, group: group.name }))))
    const taskIds = new Set(tasks.map((task) => String(task.id)))
    const assignmentCounts = new Map<string, number>()
    for (const assignment of assignments) {
      assignmentCounts.set(assignment.id, (assignmentCounts.get(assignment.id) ?? 0) + 1)
    }
    const orphanIds = [...taskIds].filter((id) => !assignmentCounts.has(id))
    const duplicateIds = [...assignmentCounts].filter(([, count]) => count > 1).map(([id]) => id)
    const extraIds = [...assignmentCounts.keys()].filter((id) => !taskIds.has(id))
    const mismatchedIds = assignments.filter((assignment) => {
      const task = tasks.find((candidate) => candidate.id === assignment.id)
      return task && (task.topic !== assignment.topic || task.group !== assignment.group)
    }).map((assignment) => assignment.id)

    console.info('Topic taxonomy audit', { orphanIds, duplicateIds, extraIds, mismatchedIds })
    expect({ orphanIds, duplicateIds, extraIds, mismatchedIds }).toEqual({
      orphanIds: [], duplicateIds: [], extraIds: [], mismatchedIds: [],
    })
  })

  it('populates all seven topics, meaningful groups, and six parsed exit gates', () => {
    expect(topics).toHaveLength(7)
    expect(topics.every((topic) => topic.groups.length > 0)).toBe(true)
    expect(tasks.every((task) => task.group !== 'general')).toBe(true)
    expect(phaseRows).toHaveLength(6)
    expect(phaseRows.every((phase) => phase.name && phase.gate)).toBe(true)
    expect(tasks.find((task) => task.id === 'DW-06')?.topic).toBe('Design')
    expect(tasks.find((task) => task.id === 'DW-12')?.topic).toBe('Portfolio Website')
  })

  it('normalizes the supplied roadmap data without the old 24-week assumptions', () => {
    expect(initialTasks[0]).toMatchObject({ id: 'JB-01', phase: 0, topic: 'Resume and Jobs' })
    expect(tasks).toHaveLength(186)
  })

  it('migrates v1 numeric week tasks to a fresh v2 plan and preserves a JSON backup', () => {
    const migrated = migratePersistedState({ tasks: [{ id: 1, week: 1 }], taskEdits: { 1: { status: 'Done' } } }, 1)
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.tasks).toHaveLength(186)
    expect(migrated.tasks[0].id).toBe('JB-01')
    expect(JSON.parse(migrated.migrationBackup ?? '{}')).toMatchObject({ tasks: [{ id: 1, week: 1 }] })
  })

  it('loads valid legacy v2 data with additive timer defaults', () => {
    const persisted = {
      schemaVersion: 2 as const,
      tasks: initialTasks,
      theme: 'light' as const,
      syncRecords: {},
      migrationBackup: null,
    }
    expect(migratePersistedState(persisted, 2)).toMatchObject({ ...persisted, timerSessions: [], activeSessionId: null, lastSeenAt: null })
  })

  it('refreshes plan metadata while preserving saved task progress', () => {
    const current = initialTasks.find((task) => task.id === 'DW-04')!
    const saved = { ...current, topic: 'GitHub Polishing', group: 'general', status: 'done' as const, notes: 'design notes' }
    const [merged] = mergeTaskProgress([current], [saved])
    expect(merged).toMatchObject({
      topic: 'Design',
      group: 'Design the portfolio in Figma',
      status: 'done',
      notes: 'design notes',
    })
  })

  it('starts empty storage with the fresh v2 task list and no backup prompt', () => {
    const fresh = migratePersistedState(undefined, 0)
    expect(fresh).toMatchObject({ schemaVersion: 2, migrationBackup: null })
    expect(fresh.tasks).toHaveLength(186)
    expect(fresh.tasks[0].id).toBe('JB-01')
  })

  it('stores v2 task fields and does not persist derived lock state', () => {
    const task = initialTasks[0]
    const done = applyTaskUpdate(task, { status: 'done' })
    const parked = applyTaskUpdate(task, { status: 'parked' })
    expect(done).toMatchObject({ status: 'done', doneAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) })
    expect(parked).toMatchObject({ status: 'parked', skippedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) })
    expect(['not_started', 'in_progress', 'done', 'parked']).toContain(task.status)
    expect('locked' in task).toBe(false)
  })

  it('matches the current hours-based roadmap totals', () => {
    expect(tasks.filter((task) => task.trackCode === 'ML')).toHaveLength(53)
    expect(tasks.filter((task) => task.trackCode === 'RB')).toHaveLength(58)
    expect(tasks.filter((task) => task.trackCode === 'DW')).toHaveLength(27)
    expect(tasks.filter((task) => task.trackCode === 'VD')).toHaveLength(26)
    expect(tasks.filter((task) => task.trackCode === 'JB')).toHaveLength(22)

    const phaseTotals = Object.fromEntries(
      Array.from({ length: 6 }, (_, phase) => [phase, tasks
        .filter((task) => Number(task.phase) === phase)
        .reduce((sum, task) => sum + Number(task.budgetHours), 0)]),
    )

    expect(phaseTotals[0]).toBeCloseTo(6.1)
    expect(phaseTotals[1]).toBeCloseTo(72.5)
    expect(phaseTotals[2]).toBeCloseTo(40.5)
    expect(phaseTotals[3]).toBeCloseTo(69.5)
    expect(phaseTotals[4]).toBeCloseTo(47.5)
    expect(phaseTotals[5]).toBeCloseTo(59)

    expect(coreHours(tasks as never[])).toBeCloseTo(280.6)
    expect(optionalHours(tasks as never[])).toBeCloseTo(14.5)
    expect(tasks.filter((task) => task.optional)).toHaveLength(5)
    expect(tasks.find((task) => task.id === 'RB-59')?.optional).toBe(true)
    expect(progressByPhase(tasks as never[], 0)).toMatchObject({ totalSteps: 9, totalHours: 6.1 })
  })

  it('keeps the task unlock chain and required IDs aligned to the real roadmap', () => {
    const required = ['JB-01', 'JB-02', 'RB-01', 'DW-01', 'VD-01', 'ML-01', 'RB-59']
    for (const id of required) {
      expect(tasks.some((task) => task.id === id)).toBe(true)
    }

    const resumeTopic = tasks.filter((task) => task.topic === 'Resume and Jobs')
    expect(resumeTopic).toHaveLength(22)
    expect(nextUnlocked('Resume and Jobs', { tasks: tasks as never[] })?.id).toBe('JB-01')
    expect(tasks.find((task) => task.id === 'JB-01')?.needs).toBe('none')
  })
})
