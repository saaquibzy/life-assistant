import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { deriveExitGateChecklist } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { ExitGateChecklist, NotFound, PageTitle, Panel, ProgressBar, TaskStepItem, trackClass, taskProgress } from '../components/shared'
import phaseRows from '../../data/phases.json'

const phaseData = phaseRows as Array<{ phase: number; name: string; gate: string }>
const tracks = [
  { code: 'ML', name: 'AI/ML' },
  { code: 'RB', name: 'Robotics' },
  { code: 'DW', name: 'Design/Web' },
  { code: 'VD', name: 'Videos' },
  { code: 'JB', name: 'Resume and Jobs' },
] as const

export default function PhaseDetailPage() {
  const { id = '' } = useParams()
  const phase = phaseData.find((item) => item.phase === Number(id))
  const state = useRoadmap()
  if (!phase) return <NotFound />
  const phaseTasks = state.tasks.filter((task) => task.phase === phase.phase)
  const coreTasks = phaseTasks.filter((task) => !task.optional)
  const optionalTasks = phaseTasks.filter((task) => task.optional)
  const checks = deriveExitGateChecklist(state.tasks, phase.phase, phase.gate, state.gateChecks)
  return <>
    <Link className="back-link" to="/phases"><ArrowLeft size={14} /> All phases</Link>
    <PageTitle eyebrow={`PHASE ${phase.phase}`} title={phase.name} subtitle={`${coreTasks.filter((task) => task.status === 'done').length} / ${coreTasks.length} core steps complete`} action={<span className="tag muted-tag">{coreTasks.reduce((sum, task) => sum + task.budgetHours, 0).toFixed(1)} CORE H</span>} />
    <Panel title="Exit gate"><ExitGateChecklist checks={checks} onToggle={state.setGateCheck} /></Panel>
    <section className="phase-track-list">{tracks.map((track) => {
      const trackTasks = coreTasks.filter((task) => task.trackCode === track.code)
      const optionalTrackTasks = optionalTasks.filter((task) => task.trackCode === track.code)
      if (!trackTasks.length && !optionalTrackTasks.length) return null
      const value = taskProgress(trackTasks)
      return <Panel className="phase-track-card" key={track.code} title={track.name} meta={<span className={`track-dot ${trackClass[track.code]}`} />}>
        <div className="phase-card-progress"><ProgressBar value={value} color={trackClass[track.code]} /><small>{value}% · {trackTasks.filter((task) => task.status === 'done').length}/{trackTasks.length}</small></div>
        <div className="topic-step-list">{trackTasks.map((task) => <TaskStepItem key={task.id} task={task} tasks={state.tasks} />)}</div>
        {optionalTrackTasks.length > 0 && <details className="optional-steps"><summary>Optional · {optionalTrackTasks.reduce((sum, task) => sum + task.budgetHours, 0).toFixed(1)} h</summary>{optionalTrackTasks.map((task) => <TaskStepItem key={task.id} task={task} tasks={state.tasks} />)}</details>}
      </Panel>
    })}</section>
    <nav className="phase-stepper">{phaseData.filter((item) => item.phase !== phase.phase).map((item) => <Link key={item.phase} to={`/phases/${item.phase}`}>Phase {item.phase}: {item.name} <ArrowRight size={13} /></Link>)}</nav>
  </>
}