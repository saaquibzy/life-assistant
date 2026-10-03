import { describe, expect, it } from 'vitest'

import {
  coreHours,
  canStartTask,
  deriveExitGateChecklist,
  elapsedAcrossSessions,
  getBlockingParents,
  getContinueTask,
  gateCycleCheck,
  habitStreak,
  isoWeekKey,
  isUnlocked,
  nextUnlocked,
  optionalHours,
  parseHours,
  progressByPhase,
  readRoadmapFilters,
  resolveSwipe,
  selectNextUnlockedInGroup,
  type RoadmapTask,
  writeRoadmapFilters,
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

  it('selects at most the next three unlocked core steps per group', () => {
    const groupTasks = Array.from({ length: 5 }, (_, index) => ({
      ...tasks[1], id: `G-${String(index + 1).padStart(2, '0')}`, topic: 'Group topic', group: 'Core',
      phase: index, needs: 'none' as const, status: 'not_started' as const, optional: false,
    }))
    expect(selectNextUnlockedInGroup(groupTasks, 'Group topic', 'Core').map((task) => task.id))
      .toEqual(['G-01', 'G-02', 'G-03'])
    expect(selectNextUnlockedInGroup(groupTasks, 'Group topic', 'Core', 3, true)).toHaveLength(3)
    expect(selectNextUnlockedInGroup([tasks[1]], tasks[1].topic, tasks[1].group, 3, false, tasks).map((task) => task.id))
      .toEqual(['ML-02'])
  })

  it('derives phase-step completion and leaves exit-gate statements manual', () => {
    const checklist = deriveExitGateChecklist(tasks, 0, 'Demo published. Project reviewed.', { 'phase-0-gate-0': true })
    expect(checklist.map(({ source, complete }) => [source, complete])).toEqual([
      ['steps', false], ['manual', true], ['manual', false],
    ])
    expect(checklist[0]).toMatchObject({ completedSteps: 1, totalSteps: 2 })
  })

  it('round-trips tracker filters through URL parameters', () => {
    const filters = {
      q: 'Neural nets', topic: 'AI/ML', phase: '2', status: 'in_progress',
      optional: 'optional' as const, locked: 'locked' as const,
    }
    expect(readRoadmapFilters(writeRoadmapFilters(filters))).toEqual(filters)
  })

  it('requires confirmation for locked tasks only when strict gates are off', () => {
    const lockedTask = tasks[3]
    expect(canStartTask(lockedTask, tasks, true, true)).toBe(false)
    expect(canStartTask(lockedTask, tasks, false)).toBe(false)
    expect(canStartTask(lockedTask, tasks, false, true)).toBe(true)
    expect(canStartTask(tasks[1], tasks, true)).toBe(true)
    expect(getBlockingParents(lockedTask, tasks).map((task) => task.id)).toEqual(['ML-02'])
  })

  it('continues the existing core in-progress step before recommending new work', () => {
    expect(getContinueTask(tasks)?.id).toBe('ML-02')
    const staleInProgress = tasks.map((task) => task.id === 'ML-02'
      ? { ...task, status: 'not_started' as const }
      : task.id === 'JB-22' ? { ...task, status: 'in_progress' as const } : task)
    expect(getContinueTask(staleInProgress)?.id).toBe('ML-02')
  })

  it('calculates habit streaks and ISO week keys in UTC', () => {
    expect(habitStreak(['2026-10-01', '2026-10-02'], new Date('2026-10-03T12:00:00Z'))).toBe(2)
    expect(isoWeekKey(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01')
  })

  it('tracks progress by phase in steps and hours', () => {
    expect(progressByPhase(tasks, 0)).toMatchObject({ totalSteps: 2, doneSteps: 1, totalHours: 6, doneHours: 2 })
  })

  it('keeps core and optional hour totals separate', () => {
    const withOptional: RoadmapTask[] = [
      ...tasks,
      { ...tasks[0], id: 'RB-59', phase: 5, step: 'Humanoid RL', budgetHours: 8, topic: 'Robotics', group: 'R4', status: 'not_started', optional: true },
    ]
    expect(coreHours(withOptional)).toBe(9)
    expect(optionalHours(withOptional)).toBe(9)
    expect(progressByPhase(withOptional, 5).totalHours).toBe(3)
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
