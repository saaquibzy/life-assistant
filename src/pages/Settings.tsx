import { useState } from 'react'
import { ArrowDownToLine, Download, Moon, Sun } from 'lucide-react'
import { type Task, useRoadmap } from '../store'
import { PageTitle, Panel } from '../components/shared'
import { useSync } from '../SyncProvider'
import cutOrder from '../../data/cut-order.json'

const statuses = ['not_started', 'in_progress', 'done', 'parked']
const tracks = ['ML', 'RB', 'DW', 'VD', 'JB']
function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const task = value as Record<string, unknown>
  const validNeeds = task.needs === 'none' || task.needs === 'all' || task.needs === 'all earlier gates' ||
    (Array.isArray(task.needs) && task.needs.every((id) => typeof id === 'string'))
  return typeof task.id === 'string' && tracks.includes(String(task.trackCode)) &&
    typeof task.phase === 'number' && typeof task.step === 'string' &&
    typeof task.budgetHours === 'number' && typeof task.hoursNote === 'string' && validNeeds &&
    typeof task.doneWhen === 'string' && typeof task.optional === 'boolean' &&
    typeof task.topic === 'string' && typeof task.group === 'string' && statuses.includes(String(task.status)) &&
    typeof task.doneAt === 'string' && typeof task.notes === 'string' &&
    typeof task.proofLink === 'string' && typeof task.minimumPass === 'boolean' &&
    (typeof task.skippedAt === 'string' || task.skippedAt === null)
}

function SettingsPage() {
  const state = useRoadmap()
  const [message, setMessage] = useState('')
  const [syncEmail, setSyncEmail] = useState('')
  const sync = useSync()
  const download = (filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const exportData = () => download('roadmap-tracker-v2.json', JSON.stringify({
    schemaVersion: 2,
    tasks: state.tasks,
    theme: state.theme,
    strictGates: state.strictGates,
    gateChecks: state.gateChecks,
    habitsEnabled: state.habitsEnabled,
    habits: state.habits,
    restWeeks: state.restWeeks,
    timerSessions: state.timerSessions,
    budgetNotifications: state.budgetNotifications,
    activeSessionId: state.activeSessionId,
    lastSeenAt: state.lastSeenAt,
  }, null, 2), 'application/json')
  const importFile = async (file?: File) => {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object') throw new Error('That file does not look like a v2 roadmap backup.')
      const backup = parsed as { schemaVersion?: unknown; tasks?: unknown; theme?: unknown; strictGates?: unknown; gateChecks?: unknown; habitsEnabled?: unknown; habits?: unknown; restWeeks?: unknown; timerSessions?: unknown; activeSessionId?: unknown; lastSeenAt?: unknown }
      if (backup.schemaVersion !== 2 || !Array.isArray(backup.tasks) || !backup.tasks.every(isTask)) {
        throw new Error('Import a schema v2 JSON backup with valid task records.')
      }
      if (backup.strictGates !== undefined && typeof backup.strictGates !== 'boolean') throw new Error('Invalid strict-gate setting in backup.')
      if (backup.timerSessions !== undefined && (!Array.isArray(backup.timerSessions) || !backup.timerSessions.every((s: any) => s && typeof s.id === 'string' && typeof s.taskId === 'string' && typeof s.startedAt === 'string' && (typeof s.endedAt === 'string' || s.endedAt === null)))) throw new Error('Invalid timer sessions in backup.')
      if (backup.activeSessionId !== undefined && backup.activeSessionId !== null && typeof backup.activeSessionId !== 'string') throw new Error('Invalid active session in backup.')
      if (backup.lastSeenAt !== undefined && backup.lastSeenAt !== null && typeof backup.lastSeenAt !== 'string') throw new Error('Invalid last seen timestamp in backup.')
      state.importData({
        tasks: backup.tasks,
        theme: backup.theme === 'light' ? 'light' : 'dark',
        strictGates: backup.strictGates as boolean | undefined,
        gateChecks: backup.gateChecks as Record<string, boolean> | undefined,
        habitsEnabled: backup.habitsEnabled as boolean | undefined,
        habits: backup.habits as typeof state.habits | undefined,
        restWeeks: backup.restWeeks as string[] | undefined,
        timerSessions: backup.timerSessions as typeof state.timerSessions | undefined,
        activeSessionId: backup.activeSessionId as string | null | undefined,
        lastSeenAt: backup.lastSeenAt as string | null | undefined,
      })
      setMessage(`Imported ${backup.tasks.length} tasks.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read that backup.')
    }
  }
  return <>
    <PageTitle eyebrow="ROADMAP PREFERENCES" title="Settings" subtitle="Keep your data portable and choose your display preferences." />
    <div className="settings-grid">
      <Panel title="Appearance"><div className="setting-row"><div><strong>Color theme</strong><small>Choose the contrast that feels right.</small></div><button className="theme-toggle" onClick={() => state.setTheme(state.theme === 'dark' ? 'light' : 'dark')}>{state.theme === 'dark' ? <><Moon size={15} /> Dark</> : <><Sun size={15} /> Light</>}</button></div></Panel>
      <Panel title="Roadmap behavior">
        <label className="setting-row setting-toggle-row"><span><strong>Swipe as default home on mobile</strong><small>Open the swipe topic deck when you visit home on a phone.</small></span><input type="checkbox" checked={state.swipeDefaultMobile} onChange={(event) => state.setSwipeDefaultMobile(event.target.checked)} /></label>
        <label className="setting-row setting-toggle-row"><span><strong>Strict gates</strong><small>{state.strictGates ? 'Locked tasks cannot start before prerequisites.' : 'Starting locked tasks requires confirmation.'}</small></span><input type="checkbox" checked={state.strictGates} onChange={(event) => state.setStrictGates(event.target.checked)} /></label>
        <label className="setting-row setting-toggle-row"><span><strong>Habits card</strong><small>Show daily habits and streaks on Dashboard.</small></span><input type="checkbox" checked={state.habitsEnabled} onChange={(event) => state.setHabitsEnabled(event.target.checked)} /></label>
        <label className="setting-row setting-toggle-row"><span><strong>Budget notification</strong><small>Notify when a focused step reaches its estimate.</small></span><input type="checkbox" checked={state.budgetNotifications} onChange={async (event) => { if (event.target.checked && typeof window.Notification !== 'undefined' && window.Notification.permission === 'default') { try { await window.Notification.requestPermission() } catch { /* Keep the optional setting available if permission prompts fail. */ } } state.setBudgetNotifications(event.target.checked) }} /></label>
      </Panel>
      <Panel title="Cross-device sync"><div className="setting-row"><div><strong>{sync.email ? `Signed in as ${sync.email}` : 'Signed out'}</strong><small>{sync.configured ? sync.status : 'Supabase is not configured'}</small></div><span className={`tag ${sync.status === 'Synced' ? 'green-tag' : 'muted-tag'}`}>{sync.status}</span></div>
        {!sync.configured ? <p className="setting-hint">Add the Supabase environment variables to enable optional sync.</p> : sync.email ? <div className="settings-actions">{(sync.status === 'Error' || sync.status === 'Offline') && <button className="button secondary" disabled={!navigator.onLine} onClick={() => void sync.retry()}>Retry sync</button>}<button className="button secondary" onClick={() => void sync.signOut().catch(() => {})}>Sign out</button></div> : <><label className="field-label">Email<input type="email" value={syncEmail} onChange={(event) => setSyncEmail(event.target.value)} /></label><button className="button secondary" disabled={!syncEmail.trim() || sync.status === 'Syncing'} onClick={() => void sync.signIn(syncEmail.trim()).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not send sign-in link.'))}>Send magic link</button></>}
        {sync.message && <p className="setting-hint">{sync.message}</p>}
      </Panel>
      <Panel title="Data portability"><p className="muted">Task status, notes, proof links, and completion details are stored in this browser.</p><div className="settings-actions"><button className="button secondary" onClick={exportData}><ArrowDownToLine size={15} /> Export v2 JSON</button><label className="button secondary file-button"><Download size={15} /> Import v2 JSON<input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} /></label></div>{message && <p className="inline-confirm">{message}</p>}</Panel>
      <Panel title="Cut order"><ol className="cut-order-list">{cutOrder.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol><p className="setting-hint">Read-only priority from the roadmap source.</p></Panel>
      <Panel title="Reset progress" className="danger-panel"><p className="muted">This removes task updates from this browser. Export a backup first.</p><button className="button danger" onClick={() => { if (window.confirm('Reset all roadmap data stored in this browser?')) { state.reset(); setMessage('Roadmap reset to its original task plan.') } }}>Reset all data</button></Panel>
      <Panel title="Plan data"><div className="data-summary"><span>Loaded task rows</span><strong>{state.tasks.length}</strong></div><p className="setting-hint">Schema version {state.schemaVersion} · roadmap source: <code>data/tasks.json</code></p></Panel>
    </div>
  </>
}

export default SettingsPage
