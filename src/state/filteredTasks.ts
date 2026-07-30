import type { ProgrammePlan, Task } from '../model/types'
import type { Filters } from './store'
import { fuzzyMatch } from '../model/selectors'

export function applyFilters(plan: ProgrammePlan, filters: Filters, search: string): Task[] {
  return plan.tasks.filter((t) => {
    if (filters.milestones.length && !(t.milestone && filters.milestones.includes(t.milestone))) return false
    if (filters.tracks.length && !(t.track && filters.tracks.includes(t.track))) return false
    if (filters.modules.length && !(t.module && filters.modules.includes(t.module))) return false
    if (filters.parties.length && !(t.party && filters.parties.includes(t.party))) return false
    if (filters.statuses.length && !(t.status && filters.statuses.includes(t.status))) return false
    if (filters.owners.length && !(t.primaryOwner && filters.owners.includes(t.primaryOwner))) return false
    if (filters.criticalOnly && !t.criticalPath) return false
    if (filters.atRiskOnly && t.health !== 'at-risk' && t.health !== 'blocked') return false
    if (search.trim()) {
      const q = search.trim()
      const matches =
        fuzzyMatch(q, t.name) ||
        fuzzyMatch(q, t.wbs) ||
        fuzzyMatch(q, t.primaryOwner) ||
        fuzzyMatch(q, t.deliverable) ||
        fuzzyMatch(q, t.notes)
      if (!matches) return false
    }
    return true
  })
}

export function uniqueValues(plan: ProgrammePlan, field: 'milestone' | 'track' | 'module' | 'party' | 'status' | 'primaryOwner'): string[] {
  const set = new Set<string>()
  for (const t of plan.tasks) {
    const value = t[field]
    if (value) set.add(value)
  }
  return Array.from(set).sort()
}
