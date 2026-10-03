import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock3 } from 'lucide-react'
import { coreHours, isUnlocked, optionalHours, progressByPhase } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { EmptyState, PageTitle, Panel, ProgressBar, Ring, phases, taskProgress } from '../components/shared'

function Dashboard() {
  const tasks = useRoadmap((state) => state.tasks);
  const coreTasks = tasks.filter((task) => task.id !== 'RB-59')
  const done = coreTasks.filter((task) => task.status === 'done').length
  const completedHours = coreTasks.filter((task) => task.status === 'done').reduce((sum, task) => sum + task.budgetHours, 0)
  const nextTask = tasks.find((task) => task.status !== 'done' && isUnlocked(task, { tasks }))
  return <>
    <PageTitle eyebrow="HOURS-BASED ROADMAP" title="Build your next chapter." subtitle="Track the work, evidence, and hours that move your roadmap forward." action={<Link className="button primary" to="/tracker">Open tracker <ArrowRight size={16} /></Link>} />
    <div className="dashboard-grid">
      <section className="hero-panel panel">
        <div className="hero-copy"><span className="eyebrow">ROADMAP PROGRESS</span><h2>Small steps.<br /><em>Real momentum.</em></h2><p>{done ? `${done} task${done === 1 ? '' : 's'} complete. Keep building proof.` : 'Your first milestone is ready when you are.'}</p><Link to="/tracker" className="text-link">View all tasks <ArrowRight size={15} /></Link></div>
                <div className="hero-ring"><Ring value={taskProgress(coreTasks)} /><span>{done} <i>/</i> {coreTasks.length} core tasks</span></div>
      </section>
      <Panel className="week-panel">
        <div className="week-stat"><div><span className="eyebrow">TIME BUDGET</span><strong>{coreHours(tasks).toFixed(1)}<small> core h</small></strong></div><div className="week-icon"><Clock3 size={19} /></div></div>
        <ProgressBar value={completedHours / Math.max(1, coreHours(tasks)) * 100} />
        <div className="week-foot"><span>{completedHours.toFixed(1)} h completed</span><span className="streak-label"><Check size={14} /> {optionalHours(tasks).toFixed(1)} optional h</span></div>
        {nextTask ? <Link className="panel-link" to={`/task/${nextTask.id}`}>Continue · {nextTask.id} <ArrowRight size={14} /></Link> : <EmptyState title="All tasks complete" text="The roadmap has no remaining unlocked work." />}
      </Panel>
      <Panel className="track-panel" title="Phase progress">
        <div className="phase-progress">{phases.map((phase, index) => {
          const items = tasks.filter((task) => task.phase === index)
          if (!items.length) return null
          const progress = progressByPhase(tasks, index).percentSteps
          return <Link className="phase-progress-row" to={`/phases/${index}`} key={phase}><span>{String(index).padStart(2, '0')}</span><strong>{phase}</strong><ProgressBar value={progress} /><small>{Math.round(progress)}%</small></Link>
        })}</div>
      </Panel>
      <Panel className="hours-panel" title="Next unlocked task" meta={nextTask && <span className="tag muted-tag">{nextTask.budgetHours} h</span>}>
        {nextTask ? <Link className="milestone-row" to={`/task/${nextTask.id}`}><span className="milestone-copy"><strong>{nextTask.id} · {nextTask.step}</strong><small>{nextTask.topic} · Phase {nextTask.phase}</small></span><ArrowRight size={15} /></Link> : <EmptyState title="No task available" text="All tasks are complete or waiting on their prerequisites." />}
      </Panel>
    </div>
  </>
}

export default Dashboard;
