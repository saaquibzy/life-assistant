import { describe, expect, it } from 'vitest'

import { normalizeTask } from './store'
import { coreHours, nextUnlocked, progressByPhase } from './lib/roadmap'
import taskRows from '../data/tasks.json'

const tasks = taskRows as Array<Record<string, unknown>>

describe('task state', () => {
  it('normalizes the supplied roadmap data without the old 24-week assumptions', () => {
    const normalized = normalizeTask(tasks[0] as never)
    expect(normalized).toMatchObject({ id: 'JB-01', phase: 0, topic: 'Resume and Jobs' })
    expect(tasks).toHaveLength(186)
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

    expect(coreHours(tasks as never[])).toBeCloseTo(289.1)
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