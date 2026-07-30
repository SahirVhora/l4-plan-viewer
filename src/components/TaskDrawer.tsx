import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import type { ProgrammePlan } from '../model/types'
import { useAppStore } from '../state/store'
import { RAG_META } from '../theme/rag'

function fmt(d: Date | null): string {
  return d ? format(d, 'd MMM yyyy') : 'Not set'
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-4 border-b border-[var(--border-hairline)] last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-36 shrink-0 text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[var(--text-primary)] break-words">{value}</span>
    </div>
  )
}

export function TaskDrawer({ plan }: { plan: ProgrammePlan }) {
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)
  const selectTask = useAppStore((s) => s.selectTask)
  const task = selectedTaskId !== null ? plan.tasksById.get(selectedTaskId) : null

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 no-print"
            onClick={() => selectTask(null)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--bg-surface)] border-l border-[var(--border-hairline)] z-50 overflow-y-auto no-print shadow-2xl"
          >
            <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] px-6 py-4 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <div className="text-xs text-[var(--text-tertiary)] tabular">WBS {task.wbs} - ID {task.id}</div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mt-0.5">{task.name}</h2>
                <div className="flex items-center gap-1.5 mt-2">
                  {(() => {
                    const meta = RAG_META[task.health]
                    const Icon = meta.icon
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.bgClass} ${meta.textClass}`}>
                        <Icon size={12} /> {meta.label}
                      </span>
                    )
                  })()}
                  {task.criticalPath && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-rag-red)]/10 text-[var(--color-rag-red)]">Critical path</span>
                  )}
                </div>
              </div>
              <button onClick={() => selectTask(null)} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-hover)]">
                <X size={16} />
              </button>
            </div>

            <div className="px-6">
              <Section title="Overview">
                <Field label="Task type" value={task.taskType} />
                <Field label="Milestone" value={task.milestone} />
                <Field label="Track" value={task.track} />
                <Field label="Module / workstream" value={task.module} />
                <Field label="Stage" value={task.stage} />
                <Field label="Party" value={task.party} />
              </Section>

              <Section title="Schedule">
                <Field label="Start" value={fmt(task.start)} />
                <Field label="Finish" value={fmt(task.finish)} />
                <Field label="Duration" value={task.duration} />
                <Field label="% Complete" value={`${task.percentComplete}%`} />
                <Field label="Constraint" value={task.constraintType} />
                <Field label="Constraint date" value={task.constraintDate ? fmt(task.constraintDate) : null} />
                <Field label="Deadline" value={task.deadline ? fmt(task.deadline) : null} />
                <Field label="Calendar" value={task.calendar} />
                {task.rolledUp && (
                  <div className="text-xs text-[var(--text-tertiary)] italic">Dates rolled up from child tasks.</div>
                )}
              </Section>

              <Section title="Ownership">
                <Field label="Primary owner" value={task.primaryOwner} />
                <Field label="Resources" value={task.resourceNames.join(', ')} />
              </Section>

              <Section title="Governance & acceptance">
                <Field label="Deliverable / evidence" value={task.deliverable} />
                <Field label="Acceptance authority" value={task.acceptanceAuthority} />
                <Field label="Contract reference" value={task.contractReference} />
                <Field label="Baseline confidence" value={task.baselineConfidence} />
                <Field label="Status" value={task.status} />
              </Section>

              <Section title="Dependencies">
                <div className="text-xs text-[var(--text-tertiary)] mb-1">Predecessors</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {task.predecessors.length === 0 && <span className="text-sm text-[var(--text-secondary)]">None</span>}
                  {task.predecessors.map((dep) => {
                    const pred = plan.tasksById.get(dep.fromId)
                    return (
                      <button
                        key={dep.fromId}
                        onClick={() => selectTask(dep.fromId)}
                        className="text-xs px-2 py-1 rounded-full border border-[var(--border-hairline)] hover:bg-[var(--bg-hover)]"
                      >
                        #{dep.fromId} {dep.type}{dep.lagDays ? (dep.lagDays > 0 ? `+${dep.lagDays}d` : `${dep.lagDays}d`) : ''} - {pred?.name ?? 'Unknown'}
                      </button>
                    )
                  })}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mb-1">Successors</div>
                <div className="flex flex-wrap gap-1.5">
                  {task.successors.length === 0 && <span className="text-sm text-[var(--text-secondary)]">None</span>}
                  {task.successors.map((id) => {
                    const succ = plan.tasksById.get(id)
                    return (
                      <button
                        key={id}
                        onClick={() => selectTask(id)}
                        className="text-xs px-2 py-1 rounded-full border border-[var(--border-hairline)] hover:bg-[var(--bg-hover)]"
                      >
                        #{id} - {succ?.name ?? 'Unknown'}
                      </button>
                    )
                  })}
                </div>
              </Section>

              {task.notes && (
                <Section title="Notes">
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{task.notes}</p>
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
