import { format } from 'date-fns'
import type { ProgrammePlan } from '../model/types'
import { contractValueReleased, countByHealth, criticalPathCount, leafTasks, overallPercentComplete } from '../model/selectors'
import { trackColour } from '../theme/rag'

/**
 * A dedicated, non-interactive rendition for print/PDF export. The live Gantt and
 * Task table use absolute-positioned scrolling and row virtualisation, neither of
 * which paginates correctly in print, so this renders a flat, page-break-friendly
 * equivalent instead. Hidden on screen; shown only under @media print (see index.css).
 */
export function PrintLayout({ plan }: { plan: ProgrammePlan }) {
  const today = new Date()
  const health = countByHealth(plan)
  const leaves = leafTasks(plan)
  const rangeStart = plan.programmeStart
  const rangeEnd = plan.programmeFinish
  const totalDays = rangeStart && rangeEnd ? Math.max((rangeEnd.getTime() - rangeStart.getTime()) / 86400000, 1) : 1

  return (
    <div id="print-layout" className="hidden print:block bg-white text-black">
      <section className="print-page-break p-10">
        <div className="text-xs uppercase tracking-wide text-gray-500">Programme plan export</div>
        <h1 className="text-3xl font-semibold mt-2">{plan.fileName.replace(/\.xlsx$/i, '')}</h1>
        <div className="text-sm text-gray-500 mt-1">Generated {format(today, 'd MMMM yyyy')}</div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <PrintKpi label="Total tasks" value={String(leaves.length)} />
          <PrintKpi label="Milestones" value={String(plan.milestoneSummary.length)} />
          <PrintKpi label="Programme complete" value={`${overallPercentComplete(plan)}%`} />
          <PrintKpi label="On critical path" value={String(criticalPathCount(plan))} />
          <PrintKpi label="At risk / late" value={String(health['at-risk'] + health.blocked)} />
          <PrintKpi label="Value released" value={`${(contractValueReleased(plan, today) * 100).toFixed(0)}%`} />
        </div>
      </section>

      <section className="print-page-break p-10">
        <h2 className="text-xl font-semibold mb-4">Milestone timeline</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-1.5 pr-3">Code</th>
              <th className="py-1.5 pr-3">Stage / track</th>
              <th className="py-1.5 pr-3">Target</th>
              <th className="py-1.5 pr-3">Payment</th>
              <th className="py-1.5 pr-3">Acceptance authority</th>
              <th className="py-1.5 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.milestoneSummary.map((m) => (
              <tr key={m.milestone} className="border-b border-gray-100">
                <td className="py-1.5 pr-3 font-medium">{m.milestone}</td>
                <td className="py-1.5 pr-3">{m.contractStageTrack ?? '-'}</td>
                <td className="py-1.5 pr-3">{m.planningTarget ? format(m.planningTarget, 'd MMM yyyy') : '-'}</td>
                <td className="py-1.5 pr-3">{(m.paymentPct * 100).toFixed(0)}%</td>
                <td className="py-1.5 pr-3">{m.acceptanceAuthority ?? '-'}</td>
                <td className="py-1.5 pr-3">{m.scheduleStatus ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-page-break p-10" style={{ pageBreakAfter: 'always' }}>
        <div style={{ transform: 'rotate(0)' }}>
          <h2 className="text-xl font-semibold mb-4">Gantt (landscape)</h2>
          <div className="space-y-1">
            {leaves.map((t) => {
              const left = rangeStart && t.start ? ((t.start.getTime() - rangeStart.getTime()) / 86400000 / totalDays) * 100 : 0
              const width = t.start && t.finish ? Math.max(((t.finish.getTime() - t.start.getTime()) / 86400000 / totalDays) * 100, 0.4) : 0
              return (
                <div key={t.id} className="flex items-center gap-2 text-[10px]">
                  <span className="w-56 truncate shrink-0" style={{ paddingLeft: (t.outlineLevel - 1) * 8 }}>
                    {t.name}
                  </span>
                  <span className="flex-1 relative h-3 bg-gray-100">
                    {t.start && t.finish && (
                      <span
                        className="absolute top-0 h-full rounded-sm"
                        style={{ left: `${left}%`, width: `${width}%`, background: trackColour(t.track) }}
                      />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="p-10">
        <h2 className="text-xl font-semibold mb-4">Task table</h2>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="py-1 pr-2">ID</th>
              <th className="py-1 pr-2">WBS</th>
              <th className="py-1 pr-2">Name</th>
              <th className="py-1 pr-2">Milestone</th>
              <th className="py-1 pr-2">Owner</th>
              <th className="py-1 pr-2">Start</th>
              <th className="py-1 pr-2">Finish</th>
              <th className="py-1 pr-2">%</th>
              <th className="py-1 pr-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.tasks.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 print-avoid-break">
                <td className="py-1 pr-2">{t.id}</td>
                <td className="py-1 pr-2">{t.wbs}</td>
                <td className="py-1 pr-2" style={{ paddingLeft: 8 + (t.outlineLevel - 1) * 8 }}>{t.name}</td>
                <td className="py-1 pr-2">{t.milestone ?? '-'}</td>
                <td className="py-1 pr-2">{t.primaryOwner ?? '-'}</td>
                <td className="py-1 pr-2">{t.start ? format(t.start, 'd MMM yy') : '-'}</td>
                <td className="py-1 pr-2">{t.finish ? format(t.finish, 'd MMM yy') : '-'}</td>
                <td className="py-1 pr-2">{t.percentComplete}%</td>
                <td className="py-1 pr-2">{t.status ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function PrintKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  )
}
