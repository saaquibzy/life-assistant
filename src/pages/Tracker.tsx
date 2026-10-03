import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { coreHours, filterRoadmapTasks, isUnlocked, optionalHours, readRoadmapFilters, selectNextUnlockedInGroup, writeRoadmapFilters, type RoadmapFilters } from '../lib/roadmap'
import { useRoadmap } from '../store'
import { EmptyState, PageTitle, ProgressBar, TaskStepItem, topics, taskProgress } from '../components/shared'

function Tracker() {
  const tasks = useRoadmap((state) => state.tasks)
  const [params, setParams] = useSearchParams()
  const [showAll, setShowAll] = useState<Record<string, boolean>>({})
  const filters = readRoadmapFilters(params)
  const filtered = filterRoadmapTasks(tasks, filters)
  const setFilter = <Key extends keyof RoadmapFilters>(key: Key, value: RoadmapFilters[Key]) => {
    setParams((current) => writeRoadmapFilters({ ...readRoadmapFilters(current), [key]: value }), { replace: true })
  }

  return <>
    <PageTitle eyebrow="ALL ROADMAP STEPS" title="Tracker" subtitle={`${filtered.length} matching steps · ${coreHours(filtered).toFixed(1)} core h${optionalHours(filtered) ? ` · ${optionalHours(filtered).toFixed(1)} optional h` : ''}`} />
    <section className="panel filter-panel topic-filter-panel">
      <label className="tracker-search"><Search size={15} /><input value={filters.q} onChange={(event) => setFilter('q', event.target.value)} placeholder="Search ID, step, topic, group" /></label>
      <label className="filter-control">Topic<select value={filters.topic} onChange={(event) => setFilter('topic', event.target.value)}><option value="">All topics</option>{topics.map((topic) => <option key={topic.slug} value={topic.name}>{topic.name}</option>)}</select></label>
      <label className="filter-control">Phase<select value={filters.phase} onChange={(event) => setFilter('phase', event.target.value)}><option value="">All phases</option>{Array.from({ length: 6 }, (_, phase) => <option key={phase} value={String(phase)}>Phase {phase}</option>)}</select></label>
      <label className="filter-control">Status<select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">All statuses</option>{['not_started', 'in_progress', 'done', 'parked'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></label>
      <label className="filter-control">Optional<select value={filters.optional} onChange={(event) => setFilter('optional', event.target.value as RoadmapFilters['optional'])}><option value="core">Core only</option><option value="optional">Optional only</option><option value="all">Core + optional</option></select></label>
      <label className="filter-control">Lock<select value={filters.locked} onChange={(event) => setFilter('locked', event.target.value as RoadmapFilters['locked'])}><option value="all">All steps</option><option value="unlocked">Unlocked</option><option value="locked">Locked</option></select></label>
    </section>
    {topics.map((topic) => {
      const topicMatches = filtered.filter((task) => task.topic === topic.name)
      if (topicMatches.length === 0) return null
      const topicTasks = tasks.filter((task) => task.topic === topic.name)
      const core = topicTasks.filter((task) => !task.optional)
      const topicPercent = taskProgress(core)
      return <details className="topic-accordion" key={topic.slug}>
        <summary className="topic-accordion-summary"><span className="topic-summary-mark" style={{ backgroundColor: topic.color }}>{topic.code}</span><span className="topic-summary-name">{topic.name}<small>{topicMatches.length} matching steps</small></span><ProgressBar value={topicPercent} /><span className="topic-summary-progress">{topicPercent}%</span><span className="accordion-chevron" /></summary>
        <div className="topic-group-list">{topic.groups.map((group) => {
          const key = `${topic.slug}:${group.name}`
          const groupTasks = topicTasks.filter((task) => task.group === group.name)
          const matchingGroup = topicMatches.filter((task) => task.group === group.name)
          if (!matchingGroup.length) return null
          const groupCore = groupTasks.filter((task) => !task.optional)
          const groupPercent = taskProgress(groupCore)
          const selectable = filters.optional === 'optional' ? groupTasks.filter((task) => task.optional) : groupTasks
          const next = selectNextUnlockedInGroup(selectable, topic.name, group.name, 3, filters.optional === 'all', tasks)
          const nextIds = new Set(next.map((task) => task.id))
          const alwaysVisible = matchingGroup.filter((task) => !isUnlocked(task, { tasks }) || task.status === 'parked')
          const visible = showAll[key] ? matchingGroup : [
            ...matchingGroup.filter((task) => nextIds.has(task.id)),
            ...alwaysVisible.filter((task) => !nextIds.has(task.id)),
          ]
          return <details className="group-accordion" key={group.name}>
            <summary className="group-accordion-summary"><span className="group-name">{group.name}</span><ProgressBar value={groupPercent} /><small>{groupPercent}% · {groupCore.filter((task) => task.status === 'done').length}/{groupCore.length} core</small><span className="accordion-chevron" /></summary>
            <div className="group-step-list">{visible.length ? visible.map((task) => <TaskStepItem key={task.id} task={task} tasks={tasks} />) : <EmptyState title="No matching steps" text="Change a filter to show steps in this group." />}
              {!showAll[key] && visible.length < matchingGroup.length && <button className="show-all-button" onClick={() => setShowAll((current) => ({ ...current, [key]: true }))}>Show all {matchingGroup.length} steps</button>}
              {showAll[key] && <button className="show-all-button" onClick={() => setShowAll((current) => ({ ...current, [key]: false }))}>Show next unlocked + locked</button>}
            </div>
          </details>
        })}</div>
      </details>
    })}
    {filtered.length === 0 && <div className="panel"><EmptyState title="No steps match" text="Adjust or clear the URL-backed filters." /></div>}
  </>
}

export default Tracker