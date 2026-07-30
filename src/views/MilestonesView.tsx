import { format } from 'date-fns'
import type { ProgrammePlan } from '../model/types'
import { tasksForMilestone } from '../model/selectors'
import { useAppStore } from '../state/store'

export function MilestonesView({ plan }: { plan: ProgrammePlan }) {
  const selectTask = useAppStore((s) => s.selectTask)

  if (!plan.milestoneSummary.length) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Milestones</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-2">No Milestone Summary sheet was found in this workbook.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Milestones</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Contractual payment gates and their acceptance detail.</p>

      <div className="relative pl-8">
        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[var(--border-hairline)]" />
        <div className="space-y-6">
          {plan.milestoneSummary.map((m) => {
            const tasks = tasksForMilestone(plan, m.milestone)
            const isGate = m.paymentPct >= 0.15
            return (
              <div key={m.milestone} className="relative print-avoid-break">
                <div
                  className="absolute -left-8 top-1 h-6 w-6 rounded-full border-4 border-[var(--bg-canvas)]"
                  style={{ background: isGate ? 'var(--gate-gold)' : 'var(--color-brand-blue)' }}
                />
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">{m.milestone}</h2>
                        {isGate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--gate-gold-tint)', color: 'var(--gate-gold)' }}>
                            payment gate
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{m.contractStageTrack ?? 'No stage/track recorded'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold tabular text-[var(--text-primary)]">{(m.paymentPct * 100).toFixed(0)}%</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{m.planningTarget ? format(m.planningTarget, 'd MMM yyyy') : 'No target'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                    <Stat label="Executable tasks" value={m.executableTasks ?? tasks.length} />
                    <Stat label="Critical tasks" value={m.criticalTasks ?? tasks.filter((t) => t.criticalPath).length} />
                    <Stat label="Baseline confidence" value={m.baselineConfidence ?? '-'} />
                    <Stat label="Schedule status" value={m.scheduleStatus ?? '-'} />
                  </div>

                  <div className="mt-4 text-sm space-y-1">
                    <div><span className="text-[var(--text-tertiary)]">Acceptance authority: </span><span className="text-[var(--text-primary)]">{m.acceptanceAuthority ?? '-'}</span></div>
                    <div><span className="text-[var(--text-tertiary)]">Acceptance evidence: </span><span className="text-[var(--text-primary)]">{m.acceptanceEvidence ?? '-'}</span></div>
                    {m.comment && <div className="text-[var(--text-secondary)] italic">{m.comment}</div>}
                  </div>

                  {tasks.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                      <div className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Tasks in this phase ({tasks.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tasks.slice(0, 12).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => selectTask(t.id)}
                            className="text-xs px-2 py-1 rounded-full border border-[var(--border-hairline)] hover:bg-[var(--bg-hover)] truncate max-w-[220px]"
                          >
                            {t.name}
                          </button>
                        ))}
                        {tasks.length > 12 && <span className="text-xs text-[var(--text-tertiary)] px-2 py-1">+{tasks.length - 12} more</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--bg-canvas)] px-3 py-2">
      <div className="text-[var(--text-tertiary)]">{label}</div>
      <div className="text-[var(--text-primary)] font-medium mt-0.5">{value}</div>
    </div>
  )
}
