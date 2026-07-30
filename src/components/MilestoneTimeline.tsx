import { format } from 'date-fns'
import { motion } from 'framer-motion'
import type { ProgrammePlan } from '../model/types'
import { useAppStore } from '../state/store'

function statusColour(status: string | null): string {
  const s = (status ?? '').toLowerCase()
  if (s.includes('complete')) return 'var(--color-rag-green)'
  if (s.includes('risk') || s.includes('late') || s.includes('slip')) return 'var(--color-rag-red)'
  if (s.includes('progress')) return 'var(--color-rag-amber)'
  return 'var(--color-rag-grey)'
}

export function MilestoneTimeline({ plan }: { plan: ProgrammePlan }) {
  const filterByMilestone = useAppStore((s) => s.filterByMilestone)
  const milestones = plan.milestoneSummary
  if (!milestones.length) {
    return (
      <div className="text-sm text-[var(--text-tertiary)] px-2 py-8 text-center">
        No Milestone Summary sheet was found in this workbook.
      </div>
    )
  }

  const dated = milestones.filter((m) => m.planningTarget)
  const minTime = dated.length ? Math.min(...dated.map((m) => m.planningTarget!.getTime())) : Date.now()
  const maxTime = dated.length ? Math.max(...dated.map((m) => m.planningTarget!.getTime())) : Date.now()
  const span = Math.max(maxTime - minTime, 1)

  return (
    <div className="relative py-10 px-4 overflow-x-auto">
      <div className="relative h-1 rounded-full bg-[var(--border-hairline)] min-w-[640px]">
        {milestones.map((m, idx) => {
          const pct = m.planningTarget ? ((m.planningTarget.getTime() - minTime) / span) * 100 : (idx / Math.max(milestones.length - 1, 1)) * 100
          const isGate = m.paymentPct >= 0.15
          return (
            <motion.button
              key={m.milestone}
              onClick={() => filterByMilestone(m.milestone)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              style={{ left: `${pct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 group"
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isGate ? 'ring-2 ring-offset-2 ring-[var(--gate-gold)]' : ''}`}
                style={{ background: statusColour(m.scheduleStatus), borderColor: 'var(--bg-surface)' }}
              />
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-40 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] px-3 py-2">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{m.milestone}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {m.planningTarget ? format(m.planningTarget, 'd MMM yyyy') : 'No target date'}
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--gate-gold)' }}>
                    {(m.paymentPct * 100).toFixed(0)}% payment
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[var(--text-secondary)] whitespace-nowrap">
                {m.milestone}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
