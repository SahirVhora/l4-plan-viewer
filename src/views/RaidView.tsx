import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import type { AssumptionDecisionRow, ProgrammePlan } from '../model/types'

export function RaidView({ plan }: { plan: ProgrammePlan }) {
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [attentionOnly, setAttentionOnly] = useState(false)

  const statuses = useMemo(() => Array.from(new Set(plan.assumptions.map((a) => a.status).filter(Boolean))) as string[], [plan])

  const filtered = useMemo(() => {
    let rows = plan.assumptions
    if (statusFilter) rows = rows.filter((a) => a.status === statusFilter)
    if (attentionOnly) rows = rows.filter((a) => (a.mdAttention ?? '').toLowerCase() === 'high')
    return [...rows].sort((a, b) => {
      const aHigh = (a.mdAttention ?? '').toLowerCase() === 'high'
      const bHigh = (b.mdAttention ?? '').toLowerCase() === 'high'
      if (aHigh !== bHigh) return aHigh ? -1 : 1
      const at = a.targetDecisionDate?.getTime() ?? Infinity
      const bt = b.targetDecisionDate?.getTime() ?? Infinity
      return at - bt
    })
  }, [plan, statusFilter, attentionOnly])

  if (!plan.assumptions.length) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Assumptions & Decisions</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-2">No Assumptions Decisions sheet was found in this workbook.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Assumptions & Decisions</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">RAID log, sorted by MD attention and target decision date.</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            className={`text-xs px-2.5 py-1 rounded-full border ${statusFilter === s ? 'bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setAttentionOnly((v) => !v)}
          className={`text-xs px-2.5 py-1 rounded-full border ${attentionOnly ? 'bg-[var(--color-rag-amber)] text-white border-[var(--color-rag-amber)]' : 'border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
        >
          High attention only
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <RaidCard key={a.id} row={a} />
        ))}
      </div>
    </div>
  )
}

function RaidCard({ row }: { row: AssumptionDecisionRow }) {
  const isHigh = (row.mdAttention ?? '').toLowerCase() === 'high'
  return (
    <div
      className={`rounded-2xl border bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break ${
        isHigh ? 'border-[var(--color-rag-amber)]/50 ring-1 ring-[var(--color-rag-amber)]/20' : 'border-[var(--border-hairline)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tabular text-[var(--text-tertiary)]">{row.id}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-canvas)] text-[var(--text-secondary)]">{row.type ?? 'Item'}</span>
          {isHigh && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-rag-amber)]/10 text-[var(--color-rag-amber)] font-medium">MD attention: High</span>
          )}
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">
          {row.status ?? 'Unknown status'}
          {row.targetDecisionDate && <span> - due {format(row.targetDecisionDate, 'd MMM yyyy')}</span>}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-2">{row.topic}</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field label="Current planning position" value={row.currentPlanningPosition} />
        <Field label="Impact if wrong" value={row.impactIfWrong} />
        <Field label="Decision / evidence required" value={row.decisionEvidenceRequired} />
        <Field label="Owner" value={row.owner} />
        <Field label="Affects milestone" value={row.affectsMilestone} />
        <Field label="Schedule treatment" value={row.scheduleTreatment} />
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide">{label}</div>
      <div className="text-[var(--text-primary)] mt-0.5">{value}</div>
    </div>
  )
}
