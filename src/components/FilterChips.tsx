import { X } from 'lucide-react'
import { useAppStore } from '../state/store'
import { uniqueValues } from '../state/filteredTasks'
import type { ProgrammePlan } from '../model/types'

function MultiChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  if (!options.length) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-[var(--text-tertiary)] mr-0.5">{label}</span>
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => onChange(active ? selected.filter((v) => v !== opt) : [...selected, opt])}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              active
                ? 'bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]'
                : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function FilterChips({ plan }: { plan: ProgrammePlan }) {
  const filters = useAppStore((s) => s.filters)
  const setFilters = useAppStore((s) => s.setFilters)
  const resetFilters = useAppStore((s) => s.resetFilters)

  const milestones = uniqueValues(plan, 'milestone')
  const tracks = uniqueValues(plan, 'track')
  const modules = uniqueValues(plan, 'module')
  const parties = uniqueValues(plan, 'party')

  const anyActive =
    filters.milestones.length ||
    filters.tracks.length ||
    filters.modules.length ||
    filters.parties.length ||
    filters.statuses.length ||
    filters.owners.length ||
    filters.criticalOnly ||
    filters.atRiskOnly

  return (
    <div className="no-print flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/60">
      <MultiChipGroup label="Milestone" options={milestones} selected={filters.milestones} onChange={(v) => setFilters({ milestones: v })} />
      <MultiChipGroup label="Track" options={tracks} selected={filters.tracks} onChange={(v) => setFilters({ tracks: v })} />
      <MultiChipGroup label="Module" options={modules} selected={filters.modules} onChange={(v) => setFilters({ modules: v })} />
      <MultiChipGroup label="Party" options={parties} selected={filters.parties} onChange={(v) => setFilters({ parties: v })} />

      <button
        onClick={() => setFilters({ criticalOnly: !filters.criticalOnly })}
        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
          filters.criticalOnly
            ? 'bg-[var(--color-rag-red)] text-white border-[var(--color-rag-red)]'
            : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        Critical path only
      </button>
      <button
        onClick={() => setFilters({ atRiskOnly: !filters.atRiskOnly })}
        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
          filters.atRiskOnly
            ? 'bg-[var(--color-rag-amber)] text-white border-[var(--color-rag-amber)]'
            : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        At risk / late only
      </button>

      {anyActive ? (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] ml-auto"
        >
          <X size={12} /> Clear filters
        </button>
      ) : null}
    </div>
  )
}
