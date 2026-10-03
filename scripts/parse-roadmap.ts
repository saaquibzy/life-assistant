import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { gateCycleCheck, normalizeNeeds, parseHours, type RoadmapTask } from '../src/lib/roadmap'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const docsPath = path.join(projectRoot, 'docs', 'Roadmap_by_Hours.md')
const outDir = path.join(projectRoot, 'data')

const topicCatalog = [
  { slug: 'robotics', name: 'Robotics', code: 'RB', color: '#7dd3fc', icon: 'bot', description: 'ROS 2, service robots, warehouse systems, and robotic hardening work.' },
  { slug: 'ai-ml', name: 'AI/ML', code: 'ML', color: '#a78bfa', icon: 'brain', description: 'Python tooling, classical ML, neural nets, LLMs, and deployment skills.' },
  { slug: 'github-polishing', name: 'GitHub Polishing', code: 'DW', color: '#34d399', icon: 'sparkles', description: 'Repo hygiene, profile polish, and public-facing developer work.' },
  { slug: 'design', name: 'Design', code: 'DW', color: '#fbbf24', icon: 'palette', description: 'Visual systems, dashboards, and design foundations for portfolio work.' },
  { slug: 'portfolio-website', name: 'Portfolio Website', code: 'DW', color: '#fb7185', icon: 'layout', description: 'Portfolio buildout, case studies, and SEO polish.' },
  { slug: 'videos', name: 'Videos', code: 'VD', color: '#f472b6', icon: 'video', description: 'Editing, recording, reels, and social storytelling for projects.' },
  { slug: 'resume-and-jobs', name: 'Resume and Jobs', code: 'JB', color: '#60a5fa', icon: 'briefcase', description: 'Profiles, resumes, job applications, and interview prep.' },
]

export function parseTableRow(raw: string): string[] {
  const cells: string[] = []
  let current = ''

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]

    if (char === '\\' && raw[index + 1] === '|') {
      current += '|'
      index += 1
      continue
    }

    if (char === '|') {
      if (index === 0 || index === raw.length - 1) continue
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  const last = current.trim()
  if (last.length > 0 || cells.length > 0) {
    cells.push(last)
  }

  return cells
}

function normalizeTrackCode(raw: string): RoadmapTask['trackCode'] {
  const match = String(raw ?? '').trim().match(/^[A-Z]+/)
  if (!match) return 'ML'
  const code = match[0].toUpperCase() as RoadmapTask['trackCode']
  return ['ML', 'RB', 'DW', 'VD', 'JB'].includes(code) ? code : 'ML'
}

function detectTopicFromId(taskId: string): string {
  const code = taskId.split('-')[0]?.toUpperCase() ?? 'ML'
  const found = topicCatalog.find((item) => item.code === code)
  return found?.name ?? 'General'
}

export function parseRoadmapMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const tasks: RoadmapTask[] = []
  const phaseGates: Record<number, string> = {}
  const cutOrder: string[] = []
  let currentPhase: number | null = null
  let inTable = false
  let currentTableHeaders: string[] = []
  let currentTableType: 'tasks' | 'summary' | null = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim()

    const phaseMatch = line.match(/^#+\s*Phase\s+(\d+)/i)
    if (phaseMatch) {
      currentPhase = Number(phaseMatch[1])
      inTable = false
      currentTableType = null
      continue
    }

    if (/^#+\s*Exit\s+gate/i.test(line)) {
      const gateLines: string[] = []
      for (let j = index + 1; j < lines.length; j += 1) {
        const next = lines[j].trim()
        if (!next || /^#+\s+/.test(next)) break
        gateLines.push(next)
      }
      if (currentPhase !== null) phaseGates[currentPhase] = gateLines.join(' ')
      continue
    }

    if (/^#+\s*Cut\s+order/i.test(line)) {
      for (let j = index + 1; j < lines.length; j += 1) {
        const next = lines[j].trim()
        if (!next || /^#+\s+/.test(next)) break
        if (next.startsWith('- ') || next.startsWith('* ')) cutOrder.push(next.replace(/^[-*]\s*/, ''))
      }
      continue
    }

    if (line.startsWith('|')) {
      const row = parseTableRow(line)
      if (!row.length) continue
      const header = row.map((cell) => cell.toLowerCase())
      if (header.includes('id')) {
        currentTableHeaders = row.map((cell) => cell.trim())
        inTable = true
        currentTableType = /hours|budget|step/i.test(header.join(' ')) ? 'tasks' : 'summary'
        continue
      }

      if (!inTable || !currentTableHeaders.length || currentPhase === null) continue

      const normalized = Object.fromEntries(
        currentTableHeaders.map((headerName, idx) => [headerName.toLowerCase(), row[idx] ?? '']),
      )

      const id = String(normalized.id ?? '').trim()
      if (!id || !/^[A-Z]+-\d+/i.test(id)) continue

      if (currentTableType === 'tasks') {
        const { hours, note } = parseHours(String(normalized.hours ?? normalized['budget hours'] ?? '0'))
        const needs = normalizeNeeds(normalized.needs ?? 'none')
        const step = String(normalized.step ?? normalized.task ?? '').trim()
        const optional = /opt|optional/i.test(String(normalized.optional ?? '')) || /^\(opt\)/i.test(step)
        const task: RoadmapTask = {
          id: id.toUpperCase(),
          trackCode: normalizeTrackCode(id),
          phase: currentPhase,
          step,
          budgetHours: hours,
          hoursNote: note || String(normalized.hours ?? normalized['budget hours'] ?? '').trim(),
          needs,
          doneWhen: String(normalized['done when'] ?? normalized.donewhen ?? '').trim(),
          optional,
          topic: String(normalized.topic ?? detectTopicFromId(id)).trim() || detectTopicFromId(id),
          group: String(normalized.group ?? 'general').trim() || 'general',
          status: 'not_started',
          doneAt: '',
          notes: '',
          proofLink: '',
          minimumPass: false,
          skippedAt: null,
        }
        tasks.push(task)
      }
    }
  }

  return { tasks, phaseGates, cutOrder }
}

function validateTasks(tasks: RoadmapTask[]) {
  const ids = tasks.map((task) => task.id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length) {
    throw new Error(`Duplicate task IDs detected: ${[...new Set(duplicates)].join(', ')}`)
  }

  const lookup = new Set(ids)
  const missingNeeds = tasks.flatMap((task) => {
    const dependencies = Array.isArray(task.needs) ? task.needs : []
    return dependencies.filter((id) => !lookup.has(id))
  })

  if (missingNeeds.length) {
    throw new Error(`Tasks reference missing parent IDs: ${[...new Set(missingNeeds)].join(', ')}`)
  }

  const dupsByTopicGroup = new Map<string, string[]>()
  for (const task of tasks) {
    const key = `${task.topic}::${task.group}`
    if (!dupsByTopicGroup.has(key)) dupsByTopicGroup.set(key, [])
    dupsByTopicGroup.get(key)!.push(task.id)
  }

  const orphans = tasks.filter((task) => !task.topic || !task.group)
  if (orphans.length) {
    throw new Error(`Tasks missing topic/group: ${orphans.map((task) => task.id).join(', ')}`)
  }

  const cycle = gateCycleCheck(tasks)
  if (cycle.hasCycle) {
    throw new Error(`Dependency cycle detected: ${cycle.cycle.join(' -> ')}`)
  }

  return { duplicates, missingNeeds }
}

function buildTopicCatalog(tasks: RoadmapTask[]) {
  return topicCatalog.map((topic) => {
    const topicTasks = tasks.filter((task) => task.topic === topic.name)
    const groups = [...new Set(topicTasks.map((task) => task.group))].map((name) => ({
      name,
      taskIds: topicTasks.filter((task) => task.group === name).map((task) => task.id),
    }))
    return { ...topic, groups }
  })
}

function ensureOutputs(tasks: RoadmapTask[], phaseGates: Record<number, string>, cutOrder: string[]) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'tasks.json'), JSON.stringify(tasks, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'phases.json'), JSON.stringify(
    Object.entries(phaseGates).map(([phase, gate]) => ({ phase: Number(phase), gate })),
    null,
    2,
  ) + '\n')
  fs.writeFileSync(path.join(outDir, 'cut-order.json'), JSON.stringify(cutOrder, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'topics.json'), JSON.stringify(buildTopicCatalog(tasks), null, 2) + '\n')
}

function main() {
  if (!fs.existsSync(docsPath)) {
    console.warn(`Missing ${path.relative(projectRoot, docsPath)}. Create it before running the parser.`)
    return
  }

  const markdown = fs.readFileSync(docsPath, 'utf8')
  const { tasks, phaseGates, cutOrder } = parseRoadmapMarkdown(markdown)
  validateTasks(tasks)
  ensureOutputs(tasks, phaseGates, cutOrder)

  console.log(`Parsed ${tasks.length} tasks from ${path.relative(projectRoot, docsPath)}`)
  console.log(`Generated: ${path.relative(projectRoot, path.join(outDir, 'tasks.json'))}, ${path.relative(projectRoot, path.join(outDir, 'phases.json'))}, ${path.relative(projectRoot, path.join(outDir, 'cut-order.json'))}, ${path.relative(projectRoot, path.join(outDir, 'topics.json'))}`)
}

const isDirectExecution = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectExecution) {
  main()
}
