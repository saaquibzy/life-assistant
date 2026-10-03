import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageTitle, Panel, ProgressBar, TaskStepItem, topics, NotFound, taskProgress } from '../components/shared'
import { useRoadmap } from '../store'
import { progressByTopic } from '../lib/roadmap'
import phaseRows from '../../data/phases.json'

const phaseData = phaseRows as Array<{ phase: number; name: string; gate: string }>

export default function TopicDetailPage() {
  const { slug = '' } = useParams()
  const topic = topics.find((item) => item.slug === slug)
  const tasks = useRoadmap((state) => state.tasks)
  if (!topic) return <NotFound />
  const progress = progressByTopic(tasks, topic.name)
  const optional = progressByTopic(tasks, topic.name, true)
  return <>
    <PageTitle eyebrow={`${topic.code} · TOPIC`} title={topic.name} subtitle={topic.description} action={<span className="tag muted-tag">{progress.totalHours.toFixed(1)} CORE H</span>} />
    <div className="topic-detail-stats"><div><strong>{progress.doneHours.toFixed(1)} / {progress.totalHours.toFixed(1)} h</strong><span>Core hours</span></div><div><strong>{progress.doneSteps} / {progress.totalSteps}</strong><span>Core steps</span></div><div><strong>{optional.totalHours - progress.totalHours > 0 ? (optional.totalHours - progress.totalHours).toFixed(1) : '0'} h</strong><span>Optional hours</span></div></div>
    <section className="topic-groups">{topic.groups.map((group) => {
      const groupTasks = tasks.filter((task) => task.topic === topic.name && task.group === group.name)
      const core = groupTasks.filter((task) => !task.optional)
      const optionalTasks = groupTasks.filter((task) => task.optional)
      const progressPct = taskProgress(core)
      return <Panel key={group.name} title={group.name} meta={<span className="tag muted-tag">{progressPct}% · {core.filter((task) => task.status === 'done').length}/{core.length}</span>}>
        <ProgressBar value={progressPct} />
        <div className="topic-step-list">{core.map((task) => <TaskStepItem key={task.id} task={task} tasks={tasks} />)}</div>
        {optionalTasks.length > 0 && <details className="optional-steps"><summary>Optional · {optionalTasks.reduce((sum, task) => sum + task.budgetHours, 0).toFixed(1)} h</summary>{optionalTasks.map((task) => <TaskStepItem key={task.id} task={task} tasks={tasks} />)}</details>}
      </Panel>
    })}</section>
    <Panel title="Phase timeline" className="topic-phase-timeline">
      {phaseData.filter((phase) => tasks.some((task) => task.topic === topic.name && task.phase === phase.phase)).map((phase) => {
        const phaseTasks = tasks.filter((task) => task.topic === topic.name && task.phase === phase.phase && !task.optional)
        const value = taskProgress(phaseTasks)
        return <Link className="topic-phase-row" to={`/phases/${phase.phase}`} key={phase.phase}><span>PHASE {phase.phase}</span><strong>{phase.name}</strong><ProgressBar value={value} /><small>{value}%</small><ArrowRight size={14} /></Link>
      })}
    </Panel>
  </>
}