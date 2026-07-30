import { useMemo } from 'react'
import type { ProgrammePlan } from '../model/types'
import { useAppStore } from '../state/store'
import { applyFilters } from '../state/filteredTasks'
import { GanttChart } from '../components/gantt/GanttChart'

export function GanttView({ plan }: { plan: ProgrammePlan }) {
  const filters = useAppStore((s) => s.filters)
  const search = useAppStore((s) => s.search)
  const visibleTaskIds = useMemo(() => new Set(applyFilters(plan, filters, search).map((t) => t.id)), [plan, filters, search])

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Gantt</h1>
        <p className="text-sm text-[var(--text-secondary)]">Full programme schedule with hierarchy, dependencies and critical path.</p>
      </div>
      <div className="flex-1 min-h-0">
        <GanttChart plan={plan} visibleTaskIds={visibleTaskIds} />
      </div>
    </div>
  )
}
