import { AlertTriangle, CheckCircle2, Clock, GitBranch, Layers, Target } from 'lucide-react'
import type { ProgrammePlan } from '../model/types'
import { KpiCard } from '../components/KpiCard'
import { MilestoneTimeline } from '../components/MilestoneTimeline'
import { PaymentDonut } from '../components/PaymentDonut'
import {
  breakdownBy,
  contractValueReleased,
  countByHealth,
  criticalPathCount,
  leafTasks,
  overallPercentComplete,
} from '../model/selectors'
import { useAppStore } from '../state/store'

export function Dashboard({ plan }: { plan: ProgrammePlan }) {
  const selectTask = useAppStore((s) => s.selectTask)
  const setView = useAppStore((s) => s.setView)
  const today = new Date()
  const health = countByHealth(plan)
  const attentionTasks = leafTasks(plan)
    .filter((t) => t.health === 'at-risk' || t.health === 'blocked')
    .slice(0, 6)
  const highAttentionAssumptions = plan.assumptions.filter((a) => (a.mdAttention ?? '').toLowerCase() === 'high').slice(0, 6)
  const byTrack = breakdownBy(plan, 'track')
  const byModule = breakdownBy(plan, 'module')

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {plan.dataNotes.length > 0 && (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 text-xs text-[var(--text-secondary)] space-y-1 print-avoid-break">
          <div className="font-medium text-[var(--text-tertiary)] uppercase tracking-wide text-[11px] mb-1">Data notes</div>
          {plan.dataNotes.map((n, i) => (
            <div key={i} className={n.level === 'warning' ? 'text-[var(--color-rag-amber)]' : ''}>
              {n.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Total tasks" value={String(leafTasks(plan).length)} icon={Layers} />
        <KpiCard label="Milestones" value={String(plan.milestoneSummary.length)} icon={Target} />
        <KpiCard label="Programme complete" value={`${overallPercentComplete(plan)}%`} icon={CheckCircle2} accentClass="text-[var(--color-rag-green)]" />
        <KpiCard label="On critical path" value={String(criticalPathCount(plan))} icon={GitBranch} accentClass="text-[var(--color-rag-red)]" />
        <KpiCard label="At risk / late" value={String(health['at-risk'] + health.blocked)} icon={AlertTriangle} accentClass="text-[var(--color-rag-amber)]" />
        <KpiCard
          label="Value released"
          value={`${(contractValueReleased(plan, today) * 100).toFixed(0)}%`}
          sublabel="of contract payment milestones"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Milestone timeline</h2>
          <p className="text-xs text-[var(--text-tertiary)] mb-2">Click a milestone to filter the plan to that phase.</p>
          <MilestoneTimeline plan={plan} />
        </div>
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Payment value by milestone</h2>
          <PaymentDonut plan={plan} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard title="By track" rows={byTrack} />
        <BreakdownCard title="By module / workstream" rows={byModule} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">MD priority decisions</h2>
          {plan.mdPriorities.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No MD Brief priorities found in this workbook.</p>
          ) : (
            <ol className="space-y-2.5">
              {plan.mdPriorities.slice(0, 5).map((p, i) => (
                <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2">
                  <span className="text-[var(--text-tertiary)] tabular shrink-0">{i + 1}.</span>
                  <span>{p.decision}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Attention needed</h2>
          <div className="space-y-2">
            {highAttentionAssumptions.map((a) => (
              <button
                key={a.id}
                onClick={() => setView('raid')}
                className="w-full text-left flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-rag-amber)]/10 text-[var(--color-rag-amber)] shrink-0">Decision</span>
                <span className="truncate text-[var(--text-primary)]">{a.topic}</span>
              </button>
            ))}
            {attentionTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTask(t.id)}
                className="w-full text-left flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${t.health === 'blocked' ? 'bg-[var(--color-rag-red)]/10 text-[var(--color-rag-red)]' : 'bg-[var(--color-rag-amber)]/10 text-[var(--color-rag-amber)]'}`}
                >
                  {t.health === 'blocked' ? 'Late' : 'At risk'}
                </span>
                <span className="truncate text-[var(--text-primary)]">{t.name}</span>
              </button>
            ))}
            {highAttentionAssumptions.length === 0 && attentionTasks.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)]">Nothing needs attention right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BreakdownCard({ title, rows }: { title: string; rows: { key: string; taskCount: number; percentComplete: number }[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5 print-avoid-break">
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{title}</h2>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 text-sm">
            <span className="w-36 truncate text-[var(--text-secondary)]" title={r.key}>{r.key}</span>
            <span className="flex-1 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden">
              <span className="block h-full bg-[var(--color-brand-blue)]" style={{ width: `${r.percentComplete}%` }} />
            </span>
            <span className="tabular text-xs text-[var(--text-tertiary)] w-16 text-right">{r.taskCount} tasks</span>
          </div>
        ))}
      </div>
    </div>
  )
}
