import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCheck, LockKeyhole } from 'lucide-react'
import { isUnlocked } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { DetailField, NotFound, PageTitle, Panel, StatusPill } from '../components/shared'

function TaskDetail() {
  const { id = '' } = useParams()
  const tasks = useRoadmap((state) => state.tasks)
  const updateTask = useRoadmap((state) => state.updateTask)
  const task = tasks.find((item) => item.id === id)
  if (!task) return <NotFound />
  const unlocked = isUnlocked(task, { tasks })
  const done = task.status === 'done'
  const index = tasks.findIndex((item) => item.id === id)
  return <>
    <Link to="/tracker" className="back-link"><ArrowLeft size={15} /> All tasks</Link>
    <PageTitle eyebrow={`${task.id} · PHASE ${task.phase}`} title={task.step} subtitle={`${task.topic} · ${task.budgetHours} planned hours`} action={<StatusPill status={task.status} disabled={!unlocked} onChange={(status) => updateTask(task.id, { status })} />} />
    {!unlocked && <Panel><p className="muted"><LockKeyhole size={15} /> This task is locked until its prerequisites are complete.</p></Panel>}
    <div className="detail-grid">
      <div className="detail-main">
        <Panel title="Done when"><p className="output-text">{task.doneWhen || 'No completion criteria supplied.'}</p></Panel>
        <Panel title="Working notes" meta={<span className="saved-label"><span className="live-dot" /> Auto-saved</span>}>
          <textarea className="notes-area" value={task.notes} onChange={(event) => updateTask(task.id, { notes: event.target.value })} placeholder="Capture an idea, blocker, or useful detail..." />
        </Panel>
        <Panel title="Proof link"><label className="field-label">Evidence URL<input type="url" value={task.proofLink} onChange={(event) => updateTask(task.id, { proofLink: event.target.value })} placeholder="https://" /></label></Panel>
        <Panel title="Task navigation"><div className="task-navigation">
          {tasks[index - 1] ? <Link to={`/task/${tasks[index - 1].id}`}><ArrowLeft size={15} /><span><small>PREVIOUS</small>{tasks[index - 1].id}</span></Link> : <span />}
          {tasks[index + 1] ? <Link className="next-task" to={`/task/${tasks[index + 1].id}`}><span><small>NEXT</small>{tasks[index + 1].id}</span><ArrowRight size={15} /></Link> : <span />}
        </div></Panel>
      </div>
      <aside className="detail-aside">
        <Panel title="Task status"><StatusPill status={task.status} disabled={!unlocked} onChange={(status) => updateTask(task.id, { status })} />
          <label className="field-label">Date completed<input type="date" value={task.doneAt} onChange={(event) => updateTask(task.id, { status: event.target.value ? 'done' : 'in_progress', doneAt: event.target.value })} /></label>
          {task.status === 'parked' && <DetailField label="Parked on" value={task.skippedAt ?? 'Not recorded'} />}
          <button className={`button ${done ? 'secondary' : 'primary'} full-button`} disabled={!unlocked} onClick={() => updateTask(task.id, { status: done ? 'not_started' : 'done' })}>{done ? <CheckCheck size={15} /> : <Check size={15} />}{done ? 'Completed' : 'Mark as done'}</button>
          <label className="review-check"><input type="checkbox" checked={task.minimumPass} onChange={(event) => updateTask(task.id, { minimumPass: event.target.checked })} /> Minimum pass</label>
        </Panel>
        <Panel title="Plan details"><DetailField label="Track" value={task.trackCode} /><DetailField label="Group" value={task.group} /><DetailField label="Phase" value={`${task.phase} · ${task.hoursNote}`} /><DetailField label="Prerequisites" value={Array.isArray(task.needs) ? task.needs.join(', ') : task.needs} /></Panel>
      </aside>
    </div>
  </>
}

export default TaskDetail