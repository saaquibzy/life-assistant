import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Play, RotateCcw } from 'lucide-react'
import { deriveExitGateChecklist, getContinueTask, habitStreak, isoWeekKey, optionalHours, progressByPhase } from '../lib/roadmap'
import { useRoadmap, type HabitKey } from '../store'
import { EmptyState, ExitGateChecklist, PageTitle, Panel, ProgressBar, Ring, TopicCard, topics } from '../components/shared'
import phaseRows from '../../data/phases.json'

const phaseData = phaseRows as Array<{ phase: number; name: string; gate: string }>
const habitItems: Array<{ id: HabitKey; label: string }> = [
  { id: 'daily-review', label: 'Daily review' },
  { id: 'coding-practice', label: 'Coding practice' },
  { id: 'git-push', label: 'Git push' },
  { id: 'clip-due', label: 'Clip due' },
]

function Dashboard() {
  const navigate = useNavigate()
  const state = useRoadmap()
  const tasks = state.tasks
  const coreTasks = tasks.filter((task) => !task.optional)
  const doneTasks = coreTasks.filter((task) => task.status === 'done')
  const doneHours = doneTasks.reduce((sum, task) => sum + task.budgetHours, 0)
  const totalHours = coreTasks.reduce((sum, task) => sum + task.budgetHours, 0)
  const continueTask = getContinueTask(tasks)
  const parked = tasks.filter((task) => task.status === 'parked' && !task.optional)
  const today = new Date().toISOString().slice(0, 10)
  const week = isoWeekKey(new Date())
  const daysWithFocus = new Set(state.timerSessions.map(s => s.startedAt.slice(0,10))).size
  const recentFocusMs = state.timerSessions.reduce((sum, s) => { const end = Date.parse(s.endedAt ?? new Date().toISOString()); const start = Math.max(Date.parse(s.startedAt), Date.now() - 14*86400000); return sum + Math.max(0, end - start) }, 0)
  const recentDays = new Set(Array.from({length:14},(_,i)=>{const d=new Date(); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10)}).filter(day=>new Date(day).getDay()%6!==0)).size
  const averageDaily = recentDays ? recentFocusMs / 3600000 / recentDays : 0
  const remaining = Math.max(0, totalHours - doneHours)
  const projected = averageDaily > 0 ? new Date(Date.now() + remaining / averageDaily * 86400000).toLocaleDateString() : null

  const start = () => {
    if (!continueTask) return
    const active = state.timerSessions.find(s => s.id === state.activeSessionId)
    if (active && active.taskId !== continueTask.id) { const old = state.tasks.find(t => t.id === active.taskId); if (!window.confirm(`Pause ${old?.id ?? active.taskId} and start ${continueTask.id}?`)) return; state.pauseTask(active.taskId) }
    const current = useRoadmap.getState().timerSessions.find(s => s.id === useRoadmap.getState().activeSessionId)
    if ((current?.taskId === continueTask.id) || state.startTask(continueTask.id)) navigate(`/focus/${continueTask.id}`)
  }

  return <>
    <PageTitle eyebrow="HOURS-BASED ROADMAP" title="Dashboard" subtitle="A topic-first view of progress, prerequisites, and the next useful step." action={<Link className="button secondary" to="/tracker">Open tracker <ArrowRight size={15} /></Link>} />
    <div className="dashboard-grid phase-b-dashboard">
      <Panel className="continue-card" title="Continue">
        {continueTask ? <div className="continue-content">
          <div><span className="eyebrow">{continueTask.id} · {continueTask.topic}</span><h2>{continueTask.step}</h2><p>{continueTask.budgetHours} core hours · Phase {continueTask.phase}</p></div>
          <button className="button primary" onClick={start}>{continueTask.status === 'in_progress' ? <RotateCcw size={15} /> : <Play size={15} />}{continueTask.status === 'in_progress' ? 'Continue' : 'Start'}</button>
        </div> : <EmptyState title="No core steps remain" text="The core roadmap is complete." />}
      </Panel>
      <Panel className="budget-card" title="Core progress" meta={<span className="tag muted-tag">{optionalHours(tasks).toFixed(1)} OPTIONAL H</span>}>
        <div className="budget-progress"><Ring value={totalHours ? Math.round(doneHours / totalHours * 100) : 0} size={82} /><div><strong>{doneHours.toFixed(1)} <small>/ {totalHours.toFixed(1)} h</small></strong><span>{doneTasks.length} / {coreTasks.length} core steps</span></div></div>
        <ProgressBar value={totalHours ? doneHours / totalHours * 100 : 0} />
      </Panel>
      <Panel className="pace-card" title="Pace"><div className="pace-metrics"><span>Average focused / working day<strong>{averageDaily.toFixed(1)} h</strong></span><span>Core hours remaining<strong>{remaining.toFixed(1)} h</strong></span><span>Projected finish<strong>{projected ?? '—'}</strong></span></div>{daysWithFocus === 0 && <p className="muted">Start a timer to build your pace estimate.</p>}<Link to="/analytics">View time analytics <ArrowRight size={14}/></Link></Panel>
      {state.habitsEnabled && <Panel className="habits-card" title="Habits" meta={<span className="tag muted-tag">TODAY</span>}>
        <div className="habit-list">{habitItems.map(({ id, label }) => <label className="habit-row" key={id}><input type="checkbox" checked={state.habits[id].includes(today)} onChange={() => state.toggleHabit(id, today)} /><span>{label}</span><small>{habitStreak(state.habits[id])} day streak</small></label>)}
          <label className="habit-row"><input type="checkbox" checked={state.restWeeks.includes(week)} onChange={() => state.toggleRestWeek(week)} /><span>Rest day this week</span><small>{state.restWeeks.includes(week) ? 'Logged' : 'Not logged'}</small></label>
        </div>
      </Panel>}
      <section className="topic-card-grid" aria-label="Topics">{topics.map((topic) => <TopicCard key={topic.slug} topic={topic} tasks={tasks} />)}</section>
      <Panel className="phase-overview" title="Phase progress">
        <div className="phase-card-list">{phaseData.map((phase) => {
          const checks = deriveExitGateChecklist(tasks, phase.phase, phase.gate, state.gateChecks)
          const progress = progressByPhase(tasks, phase.phase)
          const percent = progress.percentHours
          return <article className="phase-card" key={phase.phase}>
            <Link to={`/phases/${phase.phase}`} className="phase-card-heading"><span>PHASE {phase.phase}</span><strong>{phase.name}</strong><ArrowRight size={14} /></Link>
            <div className="phase-card-progress"><ProgressBar value={percent} /><small>{progress.doneHours.toFixed(1)}/{progress.totalHours.toFixed(1)} core h · {progress.doneSteps}/{progress.totalSteps} steps</small></div>
            <ExitGateChecklist checks={checks} onToggle={state.setGateCheck} />
          </article>
        })}</div>
      </Panel>
      {parked.length > 0 && <Panel className="parked-panel" title="Parked" meta={<span className="tag muted-tag">{parked.length}</span>}>
        {parked.map((task) => <div className="parked-row" key={task.id}><Link to={`/task/${task.id}`}><span><strong>{task.id}</strong> {task.step}</span><small>{task.notes}</small></Link><button className="button secondary" onClick={() => { const active=useRoadmap.getState().timerSessions.find(s=>s.id===useRoadmap.getState().activeSessionId); if(active&&active.taskId!==task.id){const old=useRoadmap.getState().tasks.find(t=>t.id===active.taskId);if(!window.confirm(`Pause ${old?.id??active.taskId} and start ${task.id}?`))return;useRoadmap.getState().pauseTask(active.taskId)} if(useRoadmap.getState().startTask(task.id,true))navigate(`/focus/${task.id}`) }}>Resume</button></div>)}
      </Panel>}
    </div>
  </>
}

export default Dashboard
