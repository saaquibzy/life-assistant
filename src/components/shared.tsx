import { Link } from 'react-router-dom'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ArrowLeft, Check, CircleHelp, LockKeyhole } from 'lucide-react'
import { type Status, type Task, useRoadmap } from '../store'
import { isUnlocked, lockedReason, progressByTopic, selectNextUnlockedInGroup } from '../lib/roadmap'
import topicRows from '../../data/topics.json'

export const phases = ['Setup', 'Foundations', 'Core builds', 'Research', 'Deployment', 'Finish']
export type TopicInfo = { slug: string; name: string; code: string; color: string; icon: string; description: string; groups: Array<{ name: string; taskIds: string[] }> }
export const topics = topicRows as TopicInfo[]
const slugify = (value: string) => value.replaceAll('_', '-').toLowerCase()
export const trackClass: Record<Task['trackCode'], string> = {
  ML: 'violet',
  RB: 'cyan',
  DW: 'pink',
  VD: 'amber',
  JB: 'green',
}
export const taskProgress = (tasks: Task[]) =>
  tasks.length ? Math.round(tasks.filter((task) => task.status === 'done').length / tasks.length * 100) : 0

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Panel({
  title,
  meta,
  children,
  className = '',
}: {
  title?: string
  meta?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || meta) && <div className="panel-heading">{title && <h2>{title}</h2>}{meta}</div>}
      {children}
    </section>
  )
}

export function ProgressBar({ value, color = 'violet' }: { value: number; color?: string }) {
  return <div className={`progress-track ${color}`}><i style={{ width: `${value}%` }} /></div>
}

export function Ring({ value, size = 122, label }: { value: number; size?: number; label?: string }) {
  return (
    <div className="ring" style={{ width: size, height: size, background: `conic-gradient(var(--lime) ${value * 3.6}deg, var(--line) 0deg)` }}>
      <div className="ring-inner"><strong>{value}<small>%</small></strong>{label && <span>{label}</span>}</div>
    </div>
  )
}

export function StatusPill({ status, onChange, disabled = false }: { status: Status; onChange?: (status: Status) => void; disabled?: boolean }) {
  const options: Status[] = ['not_started', 'in_progress', 'done', 'parked']
  return onChange ? (
    <select className={`status-select status-${slugify(status)}`} value={status} onChange={(event) => onChange(event.target.value as Status)} aria-label="Task status" disabled={disabled}>
      {options.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
    </select>
  ) : <span className={`status-badge status-${slugify(status)}`}>{status.replace('_', ' ')}</span>
}

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const updateTask = useRoadmap((state) => state.updateTask)
  const tasks = useRoadmap((state) => state.tasks)
  const unlocked = isUnlocked(task, { tasks })
  return (
    <div className={`task-row${compact ? ' compact' : ''}`}>
      <button className={`task-check ${task.status === 'done' ? 'checked' : ''}`} aria-label={`Mark ${task.id} ${task.status === 'done' ? 'not done' : 'done'}`} disabled={!unlocked} onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'not_started' : 'done' })}>
        {task.status === 'done' && <Check size={13} />}
      </button>
      <Link to={`/task/${task.id}`} className="task-main">
        <span className="task-title">{task.step}</span>
        <span className="task-subline"><span className={`track-dot ${trackClass[task.trackCode]}`} />{task.id} · {task.topic} · Phase {task.phase}</span>
      </Link>
      <span className="task-week">{task.budgetHours} h</span>
      {!compact && <StatusPill status={task.status} disabled={!unlocked} onChange={(status) => updateTask(task.id, { status })} />}
    </div>
  )
}

export function TaskStepItem({ task, tasks }: { task: Task; tasks: Task[] }) {
  const unlocked = isUnlocked(task, { tasks })
  const blockers = lockedReason(task, { tasks })
  return <article className={`task-step-item${unlocked ? '' : ' locked'}`}>
    {!unlocked && <LockKeyhole size={15} aria-label="Locked" />}
    <span className="task-step-id">{task.id}</span>
    <div className="task-step-copy"><Link to={`/task/${task.id}`}><strong>{task.step}</strong></Link><small>{task.budgetHours} h · Phase {task.phase}{task.optional ? ' · Optional' : ''}</small>
      {blockers.length > 0 && <div className="blocking-chips"><span>Needs</span>{blockers.slice(0, 4).map((id) => <Link key={id} to={`/task/${id}`}>{id}</Link>)}{blockers.length > 4 && <span>+{blockers.length - 4}</span>}</div>}
    </div>
    <StatusPill status={task.status} />
  </article>
}

export function TopicCard({ topic, tasks }: { topic: TopicInfo; tasks: Task[] }) {
  const topicTasks = tasks.filter((task) => task.topic === topic.name)
  const coreTasks = topicTasks.filter((task) => !task.optional)
  const progress = progressByTopic(tasks, topic.name)
  const next = topic.groups.flatMap((group) => selectNextUnlockedInGroup(tasks, topic.name, group.name, 1))[0]
  const unlocked = coreTasks.filter((task) => task.status !== 'done' && isUnlocked(task, { tasks })).length
  const hours = coreTasks.reduce((sum, task) => sum + task.budgetHours, 0)
  const doneHours = coreTasks.filter((task) => task.status === 'done').reduce((sum, task) => sum + task.budgetHours, 0)
  const optionalBudget = topicTasks.filter((task) => task.optional).reduce((sum, task) => sum + task.budgetHours, 0)
  return <article className="topic-card panel" style={{ '--topic-color': topic.color } as React.CSSProperties}>
    <div className="topic-card-head"><span className="topic-icon">{topic.code}</span><Ring value={progress.percentHours} size={58} /></div>
    <h2><Link to={`/topics/${topic.slug}`}>{topic.name}</Link></h2><p>{topic.description}</p>
    <div className="topic-card-hours"><strong>{doneHours.toFixed(1)} / {hours.toFixed(1)} core h</strong><span>{unlocked} unlocked</span></div>
    {optionalBudget > 0 && <small className="optional-summary">+ {optionalBudget.toFixed(1)} optional h</small>}
    {next ? <Link className="button secondary small" to={`/task/${next.id}`}>Next · {next.id}</Link> : <Link className="button secondary small" to={`/topics/${topic.slug}`}>Open topic</Link>}
  </article>
}

export function ExitGateChecklist({ checks, onToggle }: { checks: Array<{ key: string; label: string; source: 'steps' | 'manual'; complete: boolean; completedSteps: number; totalSteps: number }>; onToggle: (key: string, value: boolean) => void }) {
  return <div className="exit-gate-list">{checks.map((check) => <label className="exit-gate-item" key={check.key}>
    {check.source === 'manual' ? <input type="checkbox" checked={check.complete} onChange={(event) => onToggle(check.key, event.target.checked)} /> : <span className={`gate-check${check.complete ? ' complete' : ''}`}>{check.complete && <Check size={12} />}</span>}
    <span>{check.label}</span>{check.source === 'steps' && <small>{check.completedSteps}/{check.totalSteps}</small>}
  </label>)}</div>
}

export function KanbanColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return <div ref={setNodeRef} className={`kanban-column ${isOver ? 'drag-over' : ''}`}>
    <div className="kanban-heading"><span className={`status-dot ${slugify(status)}`} />{status.replace('_', ' ')}<b>{tasks.length}</b></div>
    {tasks.map((task) => <DraggableTask task={task} key={task.id} />)}
  </div>
}

export function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return <Link ref={setNodeRef} to={`/task/${task.id}`} className={`kanban-card${isDragging ? ' dragging' : ''}`} style={transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined} {...listeners} {...attributes}>
    <span className="mono">{task.id}</span><strong>{task.step}</strong><span className="task-subline">{task.topic} · {task.budgetHours} h</span>
  </Link>
}

export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="detail-field"><span>{label}</span><strong>{value}</strong></div>
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><CircleHelp size={19} /></div><strong>{title}</strong><span>{text}</span></div>
}

export function NotFound() {
  return <div className="not-found"><span className="eyebrow">404 / OFF THE MAP</span><h1>This route isn't in the plan.</h1><p>The page may have moved, or this item has not been added yet.</p><Link className="button primary" to="/">Back to overview <ArrowLeft size={15} /></Link></div>
}

export function PhasePlaceholder({ title }: { title: string }) {
  return <><PageTitle eyebrow="ROADMAP UI UPDATE" title={title} subtitle="This legacy view is paused during the roadmap interface update." /><Panel title="View unavailable"><p className="muted">Your task progress is preserved in the hours-based tracker. This view will return in a later phase.</p><Link className="button secondary" to="/tracker">Open task tracker</Link></Panel></>
}

export function PageSkeleton() {
  return <div className="page-skeleton" aria-label="Loading page"><i /><i /><i /></div>
}
