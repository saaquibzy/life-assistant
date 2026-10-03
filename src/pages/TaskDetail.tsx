import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Play, SkipForward } from 'lucide-react'
import { getBlockingParents, getParentIds, isUnlocked } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { DetailField, NotFound, PageTitle, Panel, StatusPill } from '../components/shared'

function TaskDetail() {
  const { id = '' } = useParams()
  const state = useRoadmap()
  const task = state.tasks.find((item) => item.id === id)
  const [blockerNote, setBlockerNote] = useState('')
  const [doneWhenConfirmed, setDoneWhenConfirmed] = useState(false)
  if (!task) return <NotFound />
  const unlocked = isUnlocked(task, { tasks: state.tasks })
  const blockers = getBlockingParents(task, state.tasks)
  const index = state.tasks.findIndex((item) => item.id === id)
  const lockedNeedsConfirmation = !unlocked && !state.strictGates
  const start = () => {
    if (lockedNeedsConfirmation && !window.confirm(`Start ${task.id} before its prerequisites are complete?`)) return
    if (state.startTask(task.id, lockedNeedsConfirmation)) setBlockerNote('')
  }
  const complete = () => {
    if (lockedNeedsConfirmation && !window.confirm(`Complete ${task.id} before its prerequisites are complete?`)) return
    state.completeTask(task.id, doneWhenConfirmed, lockedNeedsConfirmation)
  }
  const parentIds = new Set(getParentIds(task, state.tasks))
  const parentTasks = state.tasks.filter((candidate) => parentIds.has(candidate.id))

  return <>
    <Link to="/tracker" className="back-link"><ArrowLeft size={15} /> Tracker</Link>
    <PageTitle eyebrow={`${task.id} · PHASE ${task.phase}`} title={task.step} subtitle={`${task.topic} · ${task.group}`} action={<StatusPill status={task.status} />} />
    {!unlocked && <Panel className={`task-lock-notice${state.strictGates ? ' strict' : ''}`} title={state.strictGates ? 'Locked by strict gates' : 'Prerequisites incomplete'}>
      <p className="muted">{state.strictGates ? 'This task cannot be started until every prerequisite is complete.' : 'You can start this task after confirming the prerequisite override.'}</p>
      <div className="blocking-chips">{blockers.length ? <>{blockers.slice(0, 6).map((parent) => <Link key={parent.id} to={`/task/${parent.id}`}><LockKeyhole size={12} /> {parent.id}</Link>)}{blockers.length > 6 && <span>+{blockers.length - 6} more</span>}</> : <span>No direct prerequisite IDs</span>}</div>
    </Panel>}
    <div className="detail-grid phase-b-task-detail">
      <div className="detail-main">
        <Panel title="Done when"><p className="output-text">{task.doneWhen || 'No completion criteria supplied.'}</p></Panel>
        <Panel title="Working notes" meta={<span className="saved-label"><span className="live-dot" /> Auto-saved</span>}>
          <textarea className="notes-area" value={task.notes} onChange={(event) => state.updateTask(task.id, { notes: event.target.value })} placeholder="Capture an idea, blocker, or useful detail..." />
        </Panel>
        <Panel title="Proof link"><label className="field-label">Evidence URL<input type="url" value={task.proofLink} onChange={(event) => state.updateTask(task.id, { proofLink: event.target.value })} placeholder="https://" /></label></Panel>
        <Panel title="Needs"><p className="muted">{parentTasks.length ? `${blockers.length} incomplete · ${parentTasks.length} total` : 'No prerequisites'}</p>{parentTasks.length > 8 ? <details className="needs-details"><summary>View linked prerequisites</summary><div className="needs-list">{parentTasks.map((parent) => <Link to={`/task/${parent.id}`} key={parent.id} className={parent.status === 'done' ? 'need-complete' : 'need-open'}><span>{parent.status === 'done' ? <Check size={13} /> : <LockKeyhole size={13} />}</span><strong>{parent.id}</strong><small>{parent.step}</small></Link>)}</div></details> : <div className="needs-list">{parentTasks.map((parent) => <Link to={`/task/${parent.id}`} key={parent.id} className={parent.status === 'done' ? 'need-complete' : 'need-open'}><span>{parent.status === 'done' ? <Check size={13} /> : <LockKeyhole size={13} />}</span><strong>{parent.id}</strong><small>{parent.step}</small></Link>)}</div>}</Panel>
        <Panel title="Task navigation"><div className="task-navigation">
          {state.tasks[index - 1] ? <Link to={`/task/${state.tasks[index - 1].id}`}><ArrowLeft size={15} /><span><small>PREVIOUS</small>{state.tasks[index - 1].id}</span></Link> : <span />}
          {state.tasks[index + 1] ? <Link className="next-task" to={`/task/${state.tasks[index + 1].id}`}><span><small>NEXT</small>{state.tasks[index + 1].id}</span><ArrowRight size={15} /></Link> : <span />}
        </div></Panel>
      </div>
      <aside className="detail-aside">
        <Panel title="Status controls">
          <div className="task-action-stack">
            <button className="button primary full-button" disabled={!unlocked && state.strictGates} onClick={start}><Play size={15} />{task.status === 'in_progress' ? 'Continue' : 'Start step'}</button>
            <label className="review-check"><input type="checkbox" checked={doneWhenConfirmed} onChange={(event) => setDoneWhenConfirmed(event.target.checked)} /> I confirmed the “Done when” criteria</label>
            <button className="button secondary full-button" disabled={!doneWhenConfirmed || (!unlocked && state.strictGates)} onClick={complete}><Check size={15} />Complete step</button>
            {task.status !== 'parked' ? <><label className="field-label">Blocker note (required to park)<textarea value={blockerNote} onChange={(event) => setBlockerNote(event.target.value)} placeholder="What is blocking this step?" /></label><button className="button secondary full-button" disabled={!blockerNote.trim()} onClick={() => { if (state.parkTask(task.id, blockerNote)) setBlockerNote('') }}><SkipForward size={15} />Park step</button></> : <DetailField label="Parked on" value={task.skippedAt ?? 'Not recorded'} />}
            <label className="review-check"><input type="checkbox" checked={task.minimumPass} onChange={(event) => state.updateTask(task.id, { minimumPass: event.target.checked })} /> Minimum pass</label>
          </div>
        </Panel>
        <Panel title="Plan details"><DetailField label="ID" value={task.id} /><DetailField label="Track" value={task.trackCode} /><DetailField label="Group" value={task.group} /><DetailField label="Phase" value={task.phase} /><DetailField label="Core hours" value={!task.optional ? task.budgetHours : 'Optional step'} /><DetailField label="Optional hours" value={task.optional ? task.budgetHours : '—'} /></Panel>
      </aside>
    </div>
  </>
}

export default TaskDetail