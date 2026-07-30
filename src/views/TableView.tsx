import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { format } from 'date-fns'
import { ArrowDownUp, Download } from 'lucide-react'
import type { ProgrammePlan, Task } from '../model/types'
import { useAppStore } from '../state/store'
import { applyFilters } from '../state/filteredTasks'
import { RAG_META } from '../theme/rag'
import { tasksToCsv, downloadCsv } from '../model/csvExport'

type SortKey = 'id' | 'wbs' | 'name' | 'start' | 'finish' | 'percentComplete'

const ROW_H = 44

export function TableView({ plan }: { plan: ProgrammePlan }) {
  const filters = useAppStore((s) => s.filters)
  const search = useAppStore((s) => s.search)
  const selectTask = useAppStore((s) => s.selectTask)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const parentRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => applyFilters(plan, filters, search), [plan, filters, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * sortDir
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir
      return String(av).localeCompare(String(bv)) * sortDir
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1))
    else {
      setSortKey(key)
      setSortDir(1)
    }
  }

  function headerCell(label: string, key: SortKey, extraClass = '') {
    return (
      <button onClick={() => toggleSort(key)} className={`flex items-center gap-1 text-left hover:text-[var(--text-primary)] ${extraClass}`}>
        {label}
        {sortKey === key && <ArrowDownUp size={11} />}
      </button>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Task table</h1>
          <p className="text-sm text-[var(--text-secondary)]">{sorted.length} of {plan.tasks.length} tasks shown</p>
        </div>
        <button
          onClick={() => downloadCsv(tasksToCsv(sorted), `${plan.fileName.replace(/\.xlsx$/i, '')}-tasks.csv`)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          <Download size={14} /> Export filtered CSV
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
        <div className="grid grid-cols-[70px_100px_1fr_100px_110px_140px_90px_90px_110px_70px_100px] gap-2 px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] sticky top-0 z-10">
          {headerCell('ID', 'id')}
          {headerCell('WBS', 'wbs')}
          {headerCell('Name', 'name')}
          <span>Milestone</span>
          <span>Track</span>
          <span>Owner</span>
          {headerCell('Start', 'start')}
          {headerCell('Finish', 'finish')}
          {headerCell('% Complete', 'percentComplete')}
          <span>Critical</span>
          <span>Status</span>
        </div>
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const t = sorted[vi.index]
              return (
                <Row key={t.id} task={t} style={{ position: 'absolute', top: vi.start, left: 0, right: 0, height: ROW_H }} onClick={() => selectTask(t.id)} />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ task, style, onClick }: { task: Task; style: CSSProperties; onClick: () => void }) {
  const meta = RAG_META[task.health]
  return (
    <div
      style={style}
      onClick={onClick}
      className="grid grid-cols-[70px_100px_1fr_100px_110px_140px_90px_90px_110px_70px_100px] gap-2 px-4 items-center text-sm border-b border-[var(--border-hairline)]/60 cursor-pointer hover:bg-[var(--bg-hover)]"
    >
      <span className="tabular text-[var(--text-tertiary)]">{task.id}</span>
      <span className="tabular text-[var(--text-tertiary)] truncate">{task.wbs}</span>
      <span className="truncate" style={{ paddingLeft: (task.outlineLevel - 1) * 12 }} title={task.name}>
        {task.name}
      </span>
      <span className="text-[var(--text-secondary)] truncate">{task.milestone ?? '-'}</span>
      <span className="text-[var(--text-secondary)] truncate">{task.track ?? '-'}</span>
      <span className="text-[var(--text-secondary)] truncate">{task.primaryOwner ?? '-'}</span>
      <span className="tabular text-[var(--text-secondary)]">{task.start ? format(task.start, 'd MMM yy') : '-'}</span>
      <span className="tabular text-[var(--text-secondary)]">{task.finish ? format(task.finish, 'd MMM yy') : '-'}</span>
      <span className="flex items-center gap-1.5">
        <span className="w-10 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden shrink-0">
          <span className="block h-full bg-[var(--color-brand-blue)]" style={{ width: `${task.percentComplete}%` }} />
        </span>
        <span className="tabular text-xs text-[var(--text-tertiary)]">{task.percentComplete}%</span>
      </span>
      <span>
        {task.criticalPath ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-rag-red)]/10 text-[var(--color-rag-red)]">Critical</span>
        ) : (
          <span className="text-[var(--text-tertiary)]">-</span>
        )}
      </span>
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${meta.bgClass} ${meta.textClass}`}>
        {meta.label}
      </span>
    </div>
  )
}
