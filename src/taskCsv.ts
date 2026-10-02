import { normalizeTask, type Task, type TaskInput } from './store'

const fields: (keyof Task)[] = ['id', 'phase', 'week', 'track', 'project', 'topic', 'output', 'resource', 'status', 'dateDone', 'notes']

export function exportTasksCsv(tasks: Task[]) {
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [fields.join(','), ...tasks.map((task) => fields.map((field) => quote(task[field])).join(','))].join('\n')
}

function parseRows(csv: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index]
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index++ }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field); field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[index + 1] === '\n') index++
      row.push(field); field = ''
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
    } else field += char
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.')
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((value) => value !== '')) rows.push(row)
  }
  return rows
}

export function importTasksCsv(csv: string): Task[] {
  const [header = [], ...rows] = parseRows(csv)
  const columns = new Map(header.map((name, index) => [name.trim(), index]))
  for (const field of fields) if (!columns.has(field)) throw new Error(`CSV is missing the "${field}" column.`)
  const ids = new Set<string>()
  return rows.map((row, rowIndex) => {
    const read = (field: keyof Task) => row[columns.get(field)!] ?? ''
    const id = read('id')
    const phase = read('phase')
    const week = Number(read('week'))
    const status = read('status')
    if (!id || !Number.isInteger(week) || week < 1 || week > 24 || !['Not started', 'In progress', 'Done'].includes(status)) {
      throw new Error(`CSV row ${rowIndex + 2} has an invalid id, week, or status.`)
    }
    if (ids.has(id)) throw new Error(`CSV row ${rowIndex + 2} duplicates task ID "${id}".`)
    ids.add(id)
    const task = normalizeTask({
      id,
      phase,
      week,
      track: read('track') as Task['track'],
      project: read('project'),
      topic: read('topic'),
      output: read('output'),
      resource: read('resource'),
      status: status as Task['status'],
      dateDone: read('dateDone'),
      notes: read('notes'),
    } satisfies TaskInput)
    if (!Number.isInteger(task.phase) || !['AI/ML', 'Robotics', 'Design/Web', 'Video/Social', 'Resume'].includes(task.track)) {
      throw new Error(`CSV row ${rowIndex + 2} has an invalid phase or track.`)
    }
    return task
  })
}