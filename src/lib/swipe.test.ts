import { describe, expect, it } from 'vitest'
import { resolveSwipe, type RoadmapTask } from './roadmap'
import { buildStepDeck, isSkippedToday, skipStep, swipeAction, undoStepSkip } from './swipe'

const task = (id: string, values: Partial<RoadmapTask> = {}): RoadmapTask => ({
  id, trackCode: 'RB', phase: 0, step: id, budgetHours: 1, hoursNote: '1', needs: 'none', doneWhen: 'Done', optional: false,
  topic: 'Robotics', group: 'Setup', status: 'not_started', doneAt: '', notes: '', proofLink: '', minimumPass: false, skippedAt: null, ...values,
})

describe('swipe helpers', () => {
  it.each([[99, 0, 'none'], [100, 0, 'right'], [-100, 0, 'left'], [0, 500, 'right'], [0, -500, 'left'], [0, 499, 'none']] as const)('resolves swipe x=%i velocity=%i', (x, velocity, expected) => expect(resolveSwipe(x, velocity)).toBe(expected))
  it('orders optional steps last and excludes skipped, done, parked, and locked steps', () => {
    const rows = [task('core'), task('optional', { optional: true }), task('skipped', { skippedAt: '2026-02-03' }), task('done', { status: 'done' }), task('parked', { status: 'parked' }), task('locked', { needs: ['missing'] })]
    expect(buildStepDeck(rows, 'Robotics', '2026-02-03').map(row => row.id)).toEqual(['core', 'optional'])
  })
  it('lets skipped steps rejoin after local midnight', () => {
    const skipped = task('skip', { skippedAt: '2026-02-03' })
    expect(isSkippedToday(skipped, '2026-02-03')).toBe(true)
    expect(isSkippedToday(skipped, '2026-02-04')).toBe(false)
  })
  it('undo restores the prior skipped date', () => {
    const rows = [task('one', { skippedAt: '2026-02-02' })]
    expect(undoStepSkip(skipStep(rows, 'one', '2026-02-03'), 'one', rows[0].skippedAt)[0].skippedAt).toBe('2026-02-02')
  })
  it('maps a right swipe on a step card to the start action', () => {
    expect(swipeAction('steps', 'right')).toBe('start-step')
    expect(swipeAction('topics', 'right')).toBe('choose-topic')
  })
})
