import type { HealthStatus, ProgrammePlan, Task } from './types'

export function getDescendants(task: Task, tasksById: Map<number, Task>): Task[] {
  const out: Task[] = []
  const stack = [...task.children]
  while (stack.length) {
    const id = stack.pop()!
    const t = tasksById.get(id)
    if (!t) continue
    out.push(t)
    stack.push(...t.children)
  }
  return out
}

export function leafTasks(plan: ProgrammePlan): Task[] {
  return plan.tasks.filter((t) => t.taskType !== 'Summary')
}

export function overallPercentComplete(plan: ProgrammePlan): number {
  const leaves = leafTasks(plan).filter((t) => t.taskType === 'Task')
  if (!leaves.length) return 0
  const totalDuration = leaves.reduce((sum, t) => sum + (t.durationDays ?? 1), 0)
  if (totalDuration === 0) return 0
  const weighted = leaves.reduce((sum, t) => sum + (t.durationDays ?? 1) * t.percentComplete, 0)
  return Math.round(weighted / totalDuration)
}

export function countByHealth(plan: ProgrammePlan): Record<HealthStatus, number> {
  const counts: Record<HealthStatus, number> = { complete: 0, 'at-risk': 0, blocked: 0, 'on-track': 0 }
  for (const t of leafTasks(plan)) counts[t.health]++
  return counts
}

export function criticalPathCount(plan: ProgrammePlan): number {
  return plan.tasks.filter((t) => t.criticalPath).length
}

export function contractValueReleased(plan: ProgrammePlan, today: Date): number {
  return plan.milestoneSummary.reduce((sum, m) => {
    const isPast = m.planningTarget ? m.planningTarget.getTime() < today.getTime() : false
    const isComplete = (m.scheduleStatus ?? '').toLowerCase().includes('complete')
    return sum + (isPast || isComplete ? m.paymentPct : 0)
  }, 0)
}

export interface GroupBreakdown {
  key: string
  taskCount: number
  percentComplete: number
}

export function breakdownBy(plan: ProgrammePlan, field: 'track' | 'module'): GroupBreakdown[] {
  const groups = new Map<string, Task[]>()
  for (const t of leafTasks(plan)) {
    const key = (field === 'track' ? t.track : t.module) ?? 'Unassigned'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  return Array.from(groups.entries())
    .map(([key, ts]) => ({
      key,
      taskCount: ts.length,
      percentComplete: Math.round(ts.reduce((s, t) => s + t.percentComplete, 0) / ts.length),
    }))
    .sort((a, b) => b.taskCount - a.taskCount)
}

export interface ResourceLoad {
  resource: string
  organisation: string
  tasks: Task[]
  start: Date | null
  finish: Date | null
}

export function buildResourceLoad(plan: ProgrammePlan): ResourceLoad[] {
  const orgByResource = new Map(plan.resourceDictionary.map((r) => [r.resource, r.organisation]))
  const byResource = new Map<string, Task[]>()
  for (const t of leafTasks(plan)) {
    const names = t.resourceNames.length ? t.resourceNames : t.primaryOwner ? [t.primaryOwner] : []
    for (const name of names) {
      if (!byResource.has(name)) byResource.set(name, [])
      byResource.get(name)!.push(t)
    }
  }
  return Array.from(byResource.entries())
    .map(([resource, tasks]) => {
      const starts = tasks.map((t) => t.start).filter((d): d is Date => d !== null)
      const finishes = tasks.map((t) => t.finish).filter((d): d is Date => d !== null)
      return {
        resource,
        organisation: orgByResource.get(resource) ?? 'Joint',
        tasks,
        start: starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : null,
        finish: finishes.length ? new Date(Math.max(...finishes.map((d) => d.getTime()))) : null,
      }
    })
    .sort((a, b) => b.tasks.length - a.tasks.length)
}

export function tasksForMilestone(plan: ProgrammePlan, milestoneCode: string): Task[] {
  return plan.tasks.filter((t) => t.milestone === milestoneCode)
}

export function fuzzyMatch(needle: string, haystack: string | null | undefined): boolean {
  if (!haystack) return false
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export function searchTasks(plan: ProgrammePlan, query: string): Task[] {
  if (!query.trim()) return plan.tasks
  const q = query.trim()
  return plan.tasks.filter(
    (t) =>
      fuzzyMatch(q, t.name) ||
      fuzzyMatch(q, t.wbs) ||
      fuzzyMatch(q, t.primaryOwner) ||
      fuzzyMatch(q, t.deliverable) ||
      fuzzyMatch(q, t.notes),
  )
}
