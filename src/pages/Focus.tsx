import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pause, Play, Check } from 'lucide-react'
import { useRoadmap } from '../store'
import { elapsedAcrossSessions } from '../lib/timer'
import { PageTitle, Panel } from '../components/shared'

export default function Focus() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const state = useRoadmap(); const task = state.tasks.find(t => t.id === id)
  const [now, setNow] = useState(Date.now()); const [done, setDone] = useState(false); const [proof, setProof] = useState(task?.proofLink ?? ''); const [notes, setNotes] = useState(task?.notes ?? ''); const [minimum, setMinimum] = useState(task?.minimumPass ?? false)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { if (task) { setProof(task.proofLink); setNotes(task.notes); setMinimum(task.minimumPass) } }, [task?.id])
  useEffect(() => { const timer = setTimeout(() => task && useRoadmap.getState().updateTask(task.id, { notes, proofLink: proof, minimumPass: minimum }), 500); return () => clearTimeout(timer) }, [task?.id, notes, proof, minimum])
  useEffect(() => { document.title = task ? `${format(elapsedAcrossSessions(state.timerSessions, id, now))} · ${id}` : 'Focus'; return () => { document.title = 'Route/Hrs' } }, [task, id, now, state.timerSessions])
  if (!task) return <PageTitle title="Step not found" />
  const elapsed = elapsedAcrossSessions(state.timerSessions, id, now); const active = state.timerSessions.some(s => s.id === state.activeSessionId && s.taskId === id)
  const complete = () => { if (!done) return; state.updateTask(id, { proofLink: proof, notes, minimumPass: minimum }); state.completeTask(id, true); setDone(false); navigate('/') }
  return <>
    <PageTitle eyebrow={`${task.id} · ${task.topic}`} title="Focus" subtitle={task.step} action={<Link className="button secondary" to="/">Dashboard</Link>} />
    <div className="focus-layout"><Panel className="focus-clock"><span className="eyebrow">ELAPSED · {task.budgetHours} H BUDGET</span><strong>{format(elapsed)}</strong><div className="focus-controls"><button className="button secondary" onClick={() => active ? state.pauseTask(id) : state.startTask(id)}>{active ? <><Pause size={15}/>Pause</> : <><Play size={15}/>Resume</>}</button><button className="button primary" onClick={() => setDone(true)}><Check size={15}/>Complete</button></div></Panel><Panel title="Done when"><p>{task.doneWhen}</p></Panel><Panel title="Session notes"><label className="field-label">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes save automatically"/></label><label className="field-label">Proof link<input value={proof} onChange={e => setProof(e.target.value)} placeholder="https://…"/></label></Panel></div>
    {done && <div className="command-backdrop"><div className="command-box completion-dialog"><h2>Complete {task.id}</h2><p>{task.step}</p><label className="check-row"><input type="checkbox" checked={done} onChange={e => setDone(e.target.checked)}/>Done when: {task.doneWhen}</label><label className="field-label">Proof link (optional)<input value={proof} onChange={e => setProof(e.target.value)}/></label><label className="field-label">Note (optional)<textarea value={notes} onChange={e => setNotes(e.target.value)}/></label><label className="check-row"><input type="checkbox" checked={minimum} onChange={e => setMinimum(e.target.checked)}/>Minimum pass</label><button className="button primary" disabled={!done} onClick={complete}>Complete step</button><button className="button secondary" onClick={() => setDone(false)}>Cancel</button></div></div>}
  </>
}
function format(ms: number) { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor(s / 60) % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}` }
