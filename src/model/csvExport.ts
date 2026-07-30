import type { Task } from './types'

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function tasksToCsv(tasks: Task[]): string {
  const headers = [
    'ID', 'WBS', 'Name', 'Outline Level', 'Task Type', 'Milestone', 'Track', 'Module',
    'Primary Owner', 'Start', 'Finish', 'Duration Days', '% Complete', 'Critical Path', 'Status', 'Health',
  ]
  const rows = tasks.map((t) => [
    t.id,
    t.wbs,
    t.name,
    t.outlineLevel,
    t.taskType,
    t.milestone ?? '',
    t.track ?? '',
    t.module ?? '',
    t.primaryOwner ?? '',
    t.start ? t.start.toISOString().slice(0, 10) : '',
    t.finish ? t.finish.toISOString().slice(0, 10) : '',
    t.durationDays ?? '',
    t.percentComplete,
    t.criticalPath ? 'Yes' : 'No',
    t.status ?? '',
    t.health,
  ])
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
