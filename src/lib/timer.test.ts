import { describe, expect, it } from 'vitest'
import { elapsedAcrossSessions, isOverTwoX, loadTimerSessions, oneOpenSession, openSession, ringLevel, trimOpenSession, type TimerSession } from './timer'
import { migratePersistedState } from '../store'

const sessions: TimerSession[] = [
  { id: 'a', taskId: 'RB-02', startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T01:00:00Z' },
  { id: 'b', taskId: 'RB-02', startedAt: '2026-01-01T02:00:00Z', endedAt: null },
]
describe('timer functions', () => {
  it('derives elapsed time across pause and resume sessions', () => expect(elapsedAcrossSessions(sessions, 'RB-02', Date.parse('2026-01-01T02:30:00Z'))).toBe(5400000))
  it('trims the open session to the last seen timestamp', () => expect(trimOpenSession(sessions, '2026-01-01T02:10:00Z')[1]).toMatchObject({ endedAt: '2026-01-01T02:10:00Z', trimmedFrom: '2026-01-01T02:00:00Z' }))
  it('maintains only one open session when opening another', () => expect(oneOpenSession(openSession(sessions, { id: 'c', taskId: 'X', startedAt: '2026-01-01T03:00:00Z', endedAt: null }))).toBe(true))
  it.each([[99, 'normal'], [100, 'amber'], [149, 'amber'], [150, 'red'], [199, 'red'], [200, 'red']] as const)('uses %i%% ring threshold', (percent, level) => expect(ringLevel(percent)).toBe(level))
  it('detects twice the budget', () => { expect(isOverTwoX(7200000, 1)).toBe(true); expect(isOverTwoX(7199999, 1)).toBe(false) })
  it('loads old v2 state without timer fields', () => {
    const migrated = migratePersistedState({ schemaVersion: 2, tasks: [], theme: 'dark', syncRecords: {}, migrationBackup: null }, 2)
    expect(migrated.timerSessions).toEqual([]); expect(migrated.activeSessionId).toBeNull()
  })
  it('round-trips sessions through JSON backup data', () => {
    const restored = loadTimerSessions(JSON.parse(JSON.stringify(sessions)))
    expect(restored).toEqual(sessions)
  })
})
