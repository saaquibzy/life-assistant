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

  const start = () => {
    if (!continueTask) return
    if (continueTask.status === 'in_progress' || state.startTask(continueTask.id)) navigate(`/task/${continueTask.id}`)
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
        {parked.map((task) => <Link className="parked-row" to={`/task/${task.id}`} key={task.id}><span><strong>{task.id}</strong> {task.step}</span><small>{task.notes}</small></Link>)}
      </Panel>}
    </div>
  </>
}

export default Dashboard