import { describe, expect, it } from 'vitest'
import { lockedReason, resolveSwipe, type RoadmapTask } from './roadmap'
import { buildStepDeck, isSkippedToday, skipStep, swipeAction, undoStepSkip } from './swipe'

const task = (id: string, values: Partial<RoadmapTask> = {}): RoadmapTask => ({
  id, trackCode: 'RB', phase: 0, step: id, budgetHours: 1, hoursNote: '1', needs: 'none', doneWhen: 'Done', optional: false,
  topic: 'Robotics', group: 'Setup', status: 'not_started', doneAt: '', notes: '', proofLink: '', minimumPass: false, skippedAt: null, ...values,
})

describe('swipe helpers', () => {
  it.each([[99, 0, 'none'], [100, 0, 'right'], [-100, 0, 'left'], [0, 500, 'right'], [0, -500, 'left'], [0, 499, 'none']] as const)('resolves swipe x=%i velocity=%i', (x, velocity, expected) => expect(resolveSwipe(x, velocity)).toBe(expected))
  it('orders optional steps last and excludes skipped, done, parked, and locked steps', () => {
    const rows = [task('core'), task('optional', { optional: true }), task('skipped', { skippedAt: '2026-02-03' }), task('done', { status: 'done' }), task('parked', { status: 'parked' }), task('locked', { needs: ['missing'] })]
    expect(buildStepDeck(rows, 'Robotics', '2026-02-03').map(row => row.id)).toEqual(['core', 'optional', 'locked'])
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
  it('reports one blocking parent', () => {
    const parent=task('RB-04'); const child=task('RB-05',{needs:['RB-04']})
    expect(lockedReason(child,{tasks:[parent,child]})).toEqual(['RB-04'])
  })
  it('reports multiple blocking parents in needs order', () => {
    const p1=task('RB-01'); const p2=task('RB-02'); const child=task('RB-03',{needs:['RB-02','RB-01']})
    expect(lockedReason(child,{tasks:[p1,p2,child]})).toEqual(['RB-02','RB-01'])
  })
  it('resolves all earlier gates to incomplete earlier core steps', () => {
    const done=task('RB-01',{phase:0,status:'done'}); const pending=task('RB-02',{phase:1}); const optional=task('RB-03',{phase:1,optional:true}); const later=task('RB-04',{phase:2,needs:'all earlier gates'})
    expect(lockedReason(later,{tasks:[done,pending,optional,later]})).toEqual(['RB-02'])
  })
  it('returns a cross-topic parent id', () => {
    const parent=task('ML-04',{trackCode:'ML',topic:'Machine Learning'}); const child=task('RB-05',{needs:['ML-04']})
    expect(parent.topic).not.toBe(child.topic); expect(lockedReason(child,{tasks:[parent,child]})).toEqual(['ML-04'])
  })
  it('returns no reason when every parent is done', () => {
    const parent=task('RB-04',{status:'done'}); const child=task('RB-05',{needs:['RB-04']})
    expect(lockedReason(child,{tasks:[parent,child]})).toEqual([])
  })
})
