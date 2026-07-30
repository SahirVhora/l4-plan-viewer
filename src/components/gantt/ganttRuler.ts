import { addDays, addMonths, addQuarters, addWeeks, format, startOfMonth, startOfQuarter, startOfWeek } from 'date-fns'
import type { GanttZoom } from './ganttMath'

export interface RulerTick {
  x: number
  label: string
  isMajor: boolean
}

export function buildRuler(programmeStart: Date, programmeEnd: Date, dayWidth: number, zoom: GanttZoom): RulerTick[] {
  const ticks: RulerTick[] = []
  const dayOf = (d: Date) => Math.round((d.getTime() - programmeStart.getTime()) / 86400000)

  if (zoom === 'week') {
    let cursor = startOfWeek(programmeStart)
    while (cursor <= programmeEnd) {
      ticks.push({ x: dayOf(cursor) * dayWidth, label: format(cursor, 'd MMM'), isMajor: cursor.getDate() <= 7 })
      cursor = addWeeks(cursor, 1)
    }
  } else if (zoom === 'month') {
    let cursor = startOfMonth(programmeStart)
    while (cursor <= programmeEnd) {
      ticks.push({ x: dayOf(cursor) * dayWidth, label: format(cursor, 'MMM yyyy'), isMajor: cursor.getMonth() === 0 })
      cursor = addMonths(cursor, 1)
    }
  } else {
    let cursor = startOfQuarter(programmeStart)
    while (cursor <= programmeEnd) {
      ticks.push({ x: dayOf(cursor) * dayWidth, label: `Q${Math.floor(cursor.getMonth() / 3) + 1} ${format(cursor, 'yyyy')}`, isMajor: cursor.getMonth() === 0 })
      cursor = addQuarters(cursor, 1)
    }
  }
  return ticks
}

export function totalWidth(programmeStart: Date, programmeEnd: Date, dayWidth: number): number {
  const days = Math.max(Math.round((programmeEnd.getTime() - programmeStart.getTime()) / 86400000), 1)
  return (days + 14) * dayWidth
}

export function paddedProgrammeRange(start: Date | null, end: Date | null): { start: Date; end: Date } {
  const fallback = new Date()
  const s = start ?? fallback
  const e = end ?? addDays(fallback, 90)
  return { start: addDays(s, -14), end: addDays(e, 14) }
}
