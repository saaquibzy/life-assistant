export type TimerSession = { id: string; taskId: string; startedAt: string; endedAt: string | null; trimmedFrom?: string }

export function validateTimerSessions(value: unknown): value is TimerSession[] {
  return Array.isArray(value) && value.every((s: any) => s && typeof s.id === 'string' && typeof s.taskId === 'string' && typeof s.startedAt === 'string' && (typeof s.endedAt === 'string' || s.endedAt === null)) && oneOpenSession(value as TimerSession[])
}

export function loadTimerSessions(value: unknown): TimerSession[] { return value === undefined ? [] : validateTimerSessions(value) ? value : [] }

export function elapsedAcrossSessions(sessions: TimerSession[], taskId: string, now = Date.now()): number {
  return sessions.filter(s => s.taskId === taskId).reduce((total, s) => {
    const start = Date.parse(s.startedAt)
    const end = s.endedAt ? Date.parse(s.endedAt) : now
    return total + Math.max(0, end - start)
  }, 0)
}

export function closeSession(sessions: TimerSession[], at: string, trimmedFrom?: string): TimerSession[] {
  let closed = false
  return sessions.map(s => {
    if (!s.endedAt && !closed) { closed = true; return { ...s, endedAt: at, ...(trimmedFrom ? { trimmedFrom } : {}) } }
    return s
  })
}

export function openSession(sessions: TimerSession[], session: TimerSession): TimerSession[] {
  return [...closeSession(sessions, session.startedAt), { ...session, endedAt: null }]
}

export function oneOpenSession(sessions: TimerSession[]): boolean { return sessions.filter(s => !s.endedAt).length <= 1 }
export function ringLevel(percent: number): 'normal' | 'amber' | 'red' { return percent >= 150 ? 'red' : percent >= 100 ? 'amber' : 'normal' }
export function isOverTwoX(elapsedMs: number, budgetHours: number): boolean { return budgetHours > 0 && elapsedMs >= budgetHours * 7200000 }
export function trimOpenSession(sessions: TimerSession[], leftAt: string): TimerSession[] {
  return sessions.map(s => !s.endedAt ? { ...s, endedAt: leftAt, trimmedFrom: s.startedAt } : s)
}
