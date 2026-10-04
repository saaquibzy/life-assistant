import { describe, expect, it } from 'vitest'
import { mergeSyncRecords, type SyncRecord } from './syncMerge'

const row = (record_type: SyncRecord['record_type'], record_key: string, payload: unknown | null, updated_at: string): SyncRecord => ({ record_type, record_key, payload, updated_at })
const task = (value: string) => ({ status: value, doneAt: '', notes: '', proofLink: '', minimumPass: false, skippedAt: null })
const session = (startedAt: string, endedAt: string | null = null) => ({ taskId: 'ML-01', startedAt, endedAt })

describe('v2 sync merge', () => {
  it('uses newer per-record writes and keeps local-only and remote-only records', () => {
    const local = [row('task', 'ML-01', task('in_progress'), '2026-01-01T00:00:00.000Z'), row('task', 'ML-02', task('done'), '2026-01-01T00:00:00.000Z')]
    const remote = [row('task', 'ML-01', task('done'), '2026-01-02T00:00:00.000Z'), row('task', 'ML-03', task('parked'), '2026-01-01T00:00:00.000Z')]
    expect(mergeSyncRecords(local, remote)).toEqual([remote[0], local[1], remote[1]])
  })

  it('lets tombstones beat older writes and newer writes beat tombstones', () => {
    expect(mergeSyncRecords([row('task', 'ML-01', task('done'), '2026-01-01T00:00:00.000Z')], [row('task', 'ML-01', null, '2026-01-02T00:00:00.000Z')])[0].payload).toBeNull()
    expect(mergeSyncRecords([row('habit', '2026-01-01:daily-review', null, '2026-01-01T00:00:00.000Z')], [row('habit', '2026-01-01:daily-review', true, '2026-01-02T00:00:00.000Z')])[0].payload).toBe(true)
  })

  it('keeps the local value stable on equal timestamps', () => {
    const local = row('setting', 'strictGates', true, '2026-01-01T00:00:00.000Z')
    const remote = row('setting', 'strictGates', false, local.updated_at)
    expect(mergeSyncRecords([local], [remote])).toEqual([local])
  })

  it('unions session ids and prefers an ended duplicate to an open one', () => {
    const open = row('session', 's1', session('2026-01-01T09:00:00.000Z'), '2026-01-01T09:00:00.000Z')
    const ended = row('session', 's1', session('2026-01-01T09:00:00.000Z', '2026-01-01T10:00:00.000Z'), '2026-01-01T09:30:00.000Z')
    const remoteOnly = row('session', 's2', session('2026-01-02T09:00:00.000Z'), '2026-01-02T09:00:00.000Z')
    expect(mergeSyncRecords([open], [ended, remoteOnly])).toEqual([ended, remoteOnly])
  })

  it('gives the ended session the freshest row timestamp so it can propagate', () => {
    const ended = row('session', 's1', session('2026-01-01T09:00:00.000Z', '2026-01-01T10:00:00.000Z'), '2026-01-01T09:30:00.000Z')
    const open = row('session', 's1', session('2026-01-01T09:00:00.000Z'), '2026-01-01T11:00:00.000Z')
    expect(mergeSyncRecords([ended], [open])).toEqual([{ ...ended, updated_at: open.updated_at }])
  })

  it('keeps the newest started open session and closes all other open sessions at that start', () => {
    const older = row('session', 's1', session('2026-01-01T09:00:00.000Z'), '2026-01-01T09:00:00.000Z')
    const newer = row('session', 's2', session('2026-01-02T09:00:00.000Z'), '2026-01-02T09:00:00.000Z')
    expect(mergeSyncRecords([older, newer], [])).toEqual([
      { ...older, payload: session('2026-01-01T09:00:00.000Z', '2026-01-02T09:00:00.000Z'), updated_at: '2026-01-02T09:00:00.000Z' },
      newer,
    ])
  })
})
