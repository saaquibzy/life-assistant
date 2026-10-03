import { describe, expect, it } from 'vitest'

import {
  elapsedAcrossSessions,
  gateCycleCheck,
  isUnlocked,
  nextUnlocked,
  parseHours,
  progressByPhase,
  resolveSwipe,
  type RoadmapTask,
} from './roadmap'
import { parseTableRow } from '../../scripts/parse-roadmap'

const tasks: RoadmapTask[] = [
  {
    id: 'ML-01',
    trackCode: 'ML',
    phase: 0,
    step: 'Python setup',
    budgetHours: 2,
    hoursNote: '2',
    needs: 'none',
    doneWhen: 'Repo ready',
    optional: false,
    topic: 'Python and Data Tools',
    group: 'setup',
    status: 'done',
    doneAt: '2026-01-05',
    notes: '',
    proofLink: '',
    minimumPass: false,
    skippedAt: null,
  },
  {
    id: 'ML-02',
    trackCode: 'ML',
    phase: 0,
    step: 'Pandas basics',
    budgetHours: 4,
    hoursNote: '4',
    needs: ['ML-01'],
    doneWhen: 'Notebook complete',
    optional: false,
    topic: 'Python and Data Tools',
    group: 'script',
    status: 'in_progress',
    doneAt: '',
    notes: '',
    proofLink: '',
    minimumPass: false,
    skippedAt: null,
  },
  {
    id: 'ML-03',
    trackCode: 'ML',
    phase: 1,
    step: 'Optional warm-up',
    budgetHours: 1,
    hoursNote: '1',
    needs: ['ML-02'],
    doneWhen: 'Optional follow-up',
    optional: true,
    topic: 'Python and Data Tools',
    group: 'extras',
    status: 'not_started',
    doneAt: '',
    notes: '',
    proofLink: '',
    minimumPass: false,
    skippedAt: null,
  },
  {
    id: 'JB-22',
    trackCode: 'JB',
    phase: 5,
    step: 'Retrospective',
    budgetHours: 3,
    hoursNote: '3',
    needs: 'all',
    doneWhen: 'Repo reviewed',
    optional: false,
    topic: 'Retrospective',
    group: 'review',
    status: 'not_started',
    doneAt: '',
    notes: '',
    proofLink: '',
    minimumPass: false,
    skippedAt: null,
  },
]

describe('markdown parser', () => {
  it('keeps escaped pipes as literal content inside a table cell', () => {
    const row = '| DW-01 | Tracker: secrets check (`grep -rniE "sk-\\|api[_-]?key\\|secret\\|token" api/ src/`), push (`--force-with-lease` after checking the remote), deploy on Vercel, README with screenshots | 0.75 | none | Live URL, README with screenshots,no secrets in the repo |'
    expect(parseTableRow(row)).toEqual([
      'DW-01',
      'Tracker: secrets check (`grep -rniE "sk-|api[_-]?key|secret|token" api/ src/`), push (`--force-with-lease` after checking the remote), deploy on Vercel, README with screenshots',
      '0.75',
      'none',
      'Live URL, README with screenshots,no secrets in the repo',
    ])
  })
})

describe('roadmap parsing and gating', () => {
  it('parses standard and range-based hour strings', () => {
    expect(parseHours('1.5')).toEqual({ hours: 1.5, note: '1.5' })
    expect(parseHours('0.75')).toEqual({ hours: 0.75, note: '0.75' })
    expect(parseHours('1.5 (up to 4 if installing an OS)')).toEqual({ hours: 1.5, note: '1.5 (up to 4 if installing an OS)' })
    expect(parseHours('6-8')).toEqual({ hours: 6, note: '6-8' })
  })

  it('locks tasks by parent completion and treats optional tasks as non-blocking', () => {
    expect(isUnlocked(tasks[1], { tasks })).toBe(true)
    expect(isUnlocked(tasks[2], { tasks })).toBe(true)
    expect(isUnlocked(tasks[3], { tasks })).toBe(false)
  })

  it('finds the next unlocked task within a topic', () => {
    expect(nextUnlocked('Python and Data Tools', { tasks })?.id).toBe('ML-02')
  })

  it('tracks progress by phase in steps and hours', () => {
    expect(progressByPhase(tasks, 0)).toMatchObject({ totalSteps: 2, doneSteps: 1, totalHours: 6, doneHours: 2 })
  })

  it('catches dependency cycles', () => {
    const cycleTasks: RoadmapTask[] = [
      { ...tasks[1], id: 'A', needs: ['B'], topic: 'Loop', group: 'cycle', status: 'not_started' },
      { ...tasks[1], id: 'B', needs: ['A'], topic: 'Loop', group: 'cycle', status: 'not_started' },
    ]
    expect(gateCycleCheck(cycleTasks)).toMatchObject({ hasCycle: true })
  })

  it('resolves swipe direction from drag offset and velocity', () => {
    expect(resolveSwipe(140, 0)).toBe('right')
    expect(resolveSwipe(-140, 0)).toBe('left')
    expect(resolveSwipe(30, 0)).toBe('none')
  })

  it('sums elapsed time over sessions and trims to a cutoff timestamp', () => {
    const sessions = [
      { startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T01:00:00Z' },
      { startedAt: '2026-01-01T02:00:00Z', endedAt: null },
    ]
    expect(elapsedAcrossSessions(sessions, '2026-01-01T03:00:00Z')).toBe(7200)
  })
})
