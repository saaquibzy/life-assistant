import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { Download, FolderKanban, ListTodo, Search, Table2, X } from 'lucide-react'
import { type Status, useRoadmap } from '../store'
import { coreHours, isUnlocked, optionalHours } from '../lib/roadmap'
import { KanbanColumn, PageTitle, StatusPill, TaskRow, phases } from '../components/shared'

const statuses: Status[] = ['not_started', 'in_progress', 'done', 'parked']

function Tracker() {
  const tasks = useRoadmap((state) => state.tasks)
  const updateMany = useRoadmap((state) => state.updateMany)
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<'list' | 'kanban' | 'table'>('list')
  const [selected, setSelected] = useState<string[]>([])
  const query = params.get('q') ?? ''
  const topic = params.get('topic') ?? ''
  const phase = params.get('phase') ?? ''
  const status = params.get('status') ?? ''
  const filtered = tasks.filter((task) =>
    (!query || `${task.id} ${task.step} ${task.topic}`.toLowerCase().includes(query.toLowerCase())) &&
    (!topic || task.topic === topic) &&
    (!phase || task.phase === Number(phase)) &&
    (!status || task.status === status))
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }
  const grouped = Object.fromEntries(statuses.map((item) => [item, filtered.filter((task) => task.status === item)])) as Record<Status, typeof tasks>
  return <>
    <PageTitle eyebrow="HOURS-BASED PLAN" title="Task tracker" subtitle={`${filtered.length} tasks · ${coreHours(filtered).toFixed(1)} core h${optionalHours(filtered) ? ` + ${optionalHours(filtered).toFixed(1)} optional h` : ''}`} action={<button className="button secondary" onClick={() => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([JSON.stringify({ schemaVersion: 2, tasks }, null, 2)], { type: 'application/json' }))
      link.download = 'roadmap-tasks-v2.json'
      link.click()
      URL.revokeObjectURL(link.href)
    }}><Download size={15} /> Export</button>} />
    <section className="panel filter-panel">
      <div className="tracker-search"><Search size={16} /><input value={query} onChange={(event) => setFilter('q', event.target.value)} placeholder="Search tasks, topics, IDs..." /></div>
      <select value={topic} onChange={(event) => setFilter('topic', event.target.value)}><option value="">All topics</option>{[...new Set(tasks.map((task) => task.topic))].sort().map((item) => <option key={item}>{item}</option>)}</select>
      <select value={phase} onChange={(event) => setFilter('phase', event.target.value)}><option value="">All phases</option>{phases.map((item, index) => <option value={index} key={item}>Phase {index} · {item}</option>)}</select>
      <select value={status} onChange={(event) => setFilter('status', event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select>
      <div className="view-switch">{([{ id: 'list', icon: ListTodo }, { id: 'kanban', icon: FolderKanban }, { id: 'table', icon: Table2 }] as const).map(({ id, icon: Icon }) => <button className={view === id ? 'selected' : ''} onClick={() => setView(id)} key={id} aria-label={`${id} view`}><Icon size={16} /></button>)}</div>
    </section>
    {selected.length > 0 && <div className="bulk-bar"><span>{selected.length} selected</span><select id="bulk-status">{statuses.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select><button className="button primary small" onClick={() => { updateMany(selected, (document.querySelector('#bulk-status') as HTMLSelectElement).value as Status); setSelected([]) }}>Apply status</button><button className="icon-button" onClick={() => setSelected([])} aria-label="Clear selection"><X size={15} /></button></div>}
    {view === 'list' ? <div className="panel task-list-panel">{filtered.map((task) => <div className="selectable-task" key={task.id}><input type="checkbox" checked={selected.includes(task.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, task.id] : selected.filter((id) => id !== task.id))} aria-label={`Select ${task.id}`} /><TaskRow task={task} /></div>)}</div> : view === 'table' ? <div className="panel table-scroll"><table className="task-table"><thead><tr><th></th><th>ID</th><th>Step</th><th>Topic</th><th>Phase</th><th>Hours</th><th>Status</th></tr></thead><tbody>{filtered.map((task) => <tr key={task.id}><td><input type="checkbox" checked={selected.includes(task.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, task.id] : selected.filter((id) => id !== task.id))} /></td><td className="mono">{task.id}</td><td><Link to={`/task/${task.id}`}>{task.step}</Link></td><td>{task.topic}</td><td>{task.phase}</td><td>{task.budgetHours}</td><td><StatusPill status={task.status} disabled={!isUnlocked(task, { tasks })} /></td></tr>)}</tbody></table></div> : <DndContext onDragEnd={(event: DragEndEvent) => {
      const id = String(event.active.id)
      const nextStatus = String(event.over?.id ?? '') as Status
      if (statuses.includes(nextStatus)) updateMany([id], nextStatus)
    }}><div className="kanban-grid">{statuses.map((column) => <KanbanColumn key={column} status={column} tasks={grouped[column]} />)}</div></DndContext>}
  </>
}

export default Tracker