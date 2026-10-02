import { describe, expect, it } from 'vitest'
import { applyTaskUpdate, normalizeTask, type Task, type TaskInput } from './store'
import { completionByWeek, elapsedWeeksSince, postingSummary, weeklyVelocity } from './metrics'
import { exportTasksCsv, importTasksCsv } from './taskCsv'
import taskRows from '../data/tasks.json'

const task: Task = {
  id: '1', phase: 1, week: 1, track: 'AI/ML', project: 'Foundations', topic: 'A topic',
  output: 'An output', resource: '', status: 'Not started', dateDone: '', notes: '',
}

describe('task state', () => {
  it('fills today when a task becomes done and clears the date when it leaves done', () => {
    const done = applyTaskUpdate(task, { status: 'Done' })
    expect(done.dateDone).toBe(new Date().toISOString().slice(0, 10))
    expect(applyTaskUpdate(done, { status: 'In progress' })).toMatchObject({ status: 'In progress', dateDone: '' })
  })

  it('moves a done task to in progress when its completion date is cleared', () => {
    const done = { ...task, status: 'Done' as const, dateDone: '2026-10-01' }
    expect(applyTaskUpdate(done, { dateDone: '' })).toMatchObject({ status: 'In progress', dateDone: '' })
  })

  it('normalizes the supplied numeric ID and phase label', () => {
    const normalized = normalizeTask(taskRows[0] as TaskInput)
    expect(normalized).toMatchObject({ id: '1', phase: 1, week: 1 })
    expect(taskRows).toHaveLength(187)
  })
})

describe('roadmap metrics', () => {
  it('counts a consecutive streak ending at the current week and total weeks posted separately', () => {
    const reviews = { 1: { postedThisWeek: true }, 2: { postedThisWeek: true }, 4: { postedThisWeek: true } }
    expect(postingSummary(reviews, 2)).toEqual({ streak: 2, weeksPosted: 3 })
    expect(postingSummary(reviews, 3)).toEqual({ streak: 0, weeksPosted: 3 })
  })

  it('uses elapsed calendar weeks for velocity', () => {
    const elapsed = elapsedWeeksSince('2026-01-01', new Date('2026-01-22T00:00:00Z'))
    expect(elapsed).toBe(4)
    expect(weeklyVelocity(12, elapsed)).toBe(3)
  })

  it('attributes done tasks to the week of dateDone', () => {
    const rows = completionByWeek([
      { status: 'Done', dateDone: '2026-01-08' },
      { status: 'Done', dateDone: '2026-01-15' },
      { status: 'Not started', dateDone: '' },
    ], '2026-01-01')
    expect(rows[1]).toMatchObject({ week: 2, completed: 1, total: 1 })
    expect(rows[2]).toMatchObject({ week: 3, completed: 1, total: 2 })
  })
})

describe('task CSV', () => {
  it('round-trips quoted commas, quotes, and newlines', () => {
    const original = [{ ...task, topic: 'Topic, with "quotes"\nand a newline', notes: 'Note, another field' }]
    expect(importTasksCsv(exportTasksCsv(original))).toEqual(original)
  })
})