import { differenceInCalendarDays } from 'date-fns'
import type { Task } from '../../model/types'

export type GanttZoom = 'quarter' | 'month' | 'week'

export const ROW_HEIGHT = 32

export function dayWidthForZoom(zoom: GanttZoom): number {
  switch (zoom) {
    case 'week':
      return 14
    case 'month':
      return 5
    case 'quarter':
      return 1.8
  }
}

export function xForDate(date: Date, programmeStart: Date, dayWidth: number): number {
  return differenceInCalendarDays(date, programmeStart) * dayWidth
}

export interface VisibleRow {
  task: Task
  depth: number
  hasChildren: boolean
  isCollapsed: boolean
}

export function flattenVisible(
  rootIds: number[],
  tasksById: Map<number, Task>,
  visibleIds: Set<number> | null,
  collapsed: Set<number>,
  depth = 0,
): VisibleRow[] {
  const rows: VisibleRow[] = []
  for (const id of rootIds) {
    const task = tasksById.get(id)
    if (!task) continue
    const included = visibleIds === null || visibleIds.has(id) || task.children.some((c) => subtreeIncluded(c, tasksById, visibleIds))
    if (!included) continue
    rows.push({ task, depth, hasChildren: task.children.length > 0, isCollapsed: collapsed.has(id) })
    if (task.children.length && !collapsed.has(id)) {
      rows.push(...flattenVisible(task.children, tasksById, visibleIds, collapsed, depth + 1))
    }
  }
  return rows
}

function subtreeIncluded(id: number, tasksById: Map<number, Task>, visibleIds: Set<number> | null): boolean {
  if (visibleIds === null) return true
  if (visibleIds.has(id)) return true
  const task = tasksById.get(id)
  if (!task) return false
  return task.children.some((c) => subtreeIncluded(c, tasksById, visibleIds))
}

export interface DependencyLine {
  id: string
  path: string
  critical: boolean
  lagDays: number
  labelX: number
  labelY: number
}

export function buildDependencyLines(
  visibleRows: VisibleRow[],
  programmeStart: Date,
  dayWidth: number,
): DependencyLine[] {
  const rowIndexById = new Map(visibleRows.map((r, idx) => [r.task.id, idx]))
  const lines: DependencyLine[] = []

  visibleRows.forEach((row) => {
    const toIdx = rowIndexById.get(row.task.id)
    if (toIdx === undefined) return
    row.task.predecessors.forEach((dep) => {
      const fromIdx = rowIndexById.get(dep.fromId)
      if (fromIdx === undefined) return
      const fromTask = row.task
      const predecessor = visibleRows[fromIdx].task
      const fromDate = dep.type === 'SS' || dep.type === 'SF' ? predecessor.start : predecessor.finish
      const toDate = dep.type === 'FF' || dep.type === 'SF' ? fromTask.finish : fromTask.start
      if (!fromDate || !toDate) return

      const x1 = xForDate(fromDate, programmeStart, dayWidth)
      const y1 = fromIdx * ROW_HEIGHT + ROW_HEIGHT / 2
      const x2 = xForDate(toDate, programmeStart, dayWidth)
      const y2 = toIdx * ROW_HEIGHT + ROW_HEIGHT / 2

      const midX = (x1 + x2) / 2
      const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
      lines.push({
        id: `${dep.fromId}-${row.task.id}-${dep.type}`,
        path,
        critical: predecessor.criticalPath && fromTask.criticalPath,
        lagDays: dep.lagDays,
        labelX: midX,
        labelY: (y1 + y2) / 2,
      })
    })
  })

  return lines
}
