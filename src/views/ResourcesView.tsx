import { useMemo } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import type { ProgrammePlan } from '../model/types'
import { buildResourceLoad } from '../model/selectors'
import { useAppStore } from '../state/store'

function orgColour(org: string): string {
  const o = org.toLowerCase()
  if (o.includes('ve3')) return 'var(--color-track-a)'
  if (o.includes('council')) return 'var(--color-track-b)'
  return 'var(--color-track-programme)'
}

export function ResourcesView({ plan }: { plan: ProgrammePlan }) {
  const selectTask = useAppStore((s) => s.selectTask)
  const loads = useMemo(() => buildResourceLoad(plan), [plan])

  const allStarts = loads.map((l) => l.start).filter((d): d is Date => d !== null)
  const allFinishes = loads.map((l) => l.finish).filter((d): d is Date => d !== null)
  const rangeStart = allStarts.length ? new Date(Math.min(...allStarts.map((d) => d.getTime()))) : new Date()
  const rangeEnd = allFinishes.length ? new Date(Math.max(...allFinishes.map((d) => d.getTime()))) : new Date()
  const totalDays = Math.max(differenceInCalendarDays(rangeEnd, rangeStart), 1)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Resources</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Task load and assignment span per owner or resource, coloured by organisation.</p>

      <div className="flex items-center gap-4 mb-4 text-xs text-[var(--text-secondary)]">
        <Legend colour="var(--color-track-a)" label="VE3" />
        <Legend colour="var(--color-track-b)" label="Council" />
        <Legend colour="var(--color-track-programme)" label="Joint / unassigned" />
      </div>

      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] divide-y divide-[var(--border-hairline)] overflow-hidden">
        {loads.map((load) => (
          <div key={load.resource} className="flex items-center gap-4 px-5 py-3 print-avoid-break">
            <div className="w-44 shrink-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate" title={load.resource}>{load.resource}</div>
              <div className="text-xs text-[var(--text-tertiary)]">{load.tasks.length} tasks</div>
            </div>
            <div className="flex-1 relative h-6 rounded-md bg-[var(--bg-canvas)] overflow-hidden">
              {load.tasks
                .filter((t) => t.start && t.finish)
                .map((t) => {
                  const left = (differenceInCalendarDays(t.start!, rangeStart) / totalDays) * 100
                  const width = Math.max((differenceInCalendarDays(t.finish!, t.start!) / totalDays) * 100, 0.5)
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectTask(t.id)}
                      title={t.name}
                      style={{ left: `${left}%`, width: `${width}%`, background: orgColour(load.organisation) }}
                      className="absolute top-0.5 bottom-0.5 rounded-sm opacity-80 hover:opacity-100"
                    />
                  )
                })}
            </div>
          </div>
        ))}
        {loads.length === 0 && <div className="p-6 text-sm text-[var(--text-tertiary)]">No resource assignments found.</div>}
      </div>
    </div>
  )
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colour }} />
      <span>{label}</span>
    </div>
  )
}
