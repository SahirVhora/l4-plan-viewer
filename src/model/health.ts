import type { HealthStatus, Task } from './types'

/**
 * Single pure function driving RAG derivation, kept isolated so the thresholds
 * (e.g. the 14-day at-risk window) are easy to tune in one place.
 */
export function deriveHealth(task: Task, today: Date): HealthStatus {
  if (task.status?.toLowerCase() === 'complete' || task.percentComplete >= 100) {
    return 'complete'
  }
  if (task.finish && task.finish.getTime() < startOfDay(today).getTime() && task.percentComplete < 100) {
    return 'blocked'
  }
  if (task.criticalPath && task.percentComplete === 0 && task.start) {
    const daysUntilStart = daysBetween(today, task.start)
    if (daysUntilStart <= 14) {
      return 'at-risk'
    }
  }
  return 'on-track'
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY)
}
