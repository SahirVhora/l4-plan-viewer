import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { format } from 'date-fns'
import { ArrowDownUp, Columns3, Download } from 'lucide-react'
import type { ProgrammePlan, Task } from '../model/types'
import { useAppStore } from '../state/store'
import { applyFilters } from '../state/filteredTasks'
import { RAG_META } from '../theme/rag'
import { tasksToCsv, downloadCsv } from '../model/csvExport'

type SortKey = 'id' | 'wbs' | 'name' | 'start' | 'finish' | 'percentComplete'

const ROW_H = 44
const COLUMN_VISIBILITY_KEY = 'sf-l4-plan-viewer:table-columns'

interface ColumnDef {
  key: string
  label: string
  width: string
  sortKey?: SortKey
  required?: boolean
  render: (task: Task) => ReactNode
}

const COLUMNS: ColumnDef[] = [
  { key: 'id', label: 'ID', width: '70px', sortKey: 'id', required: true, render: (t) => <span className="tabular text-[var(--text-tertiary)]">{t.id}</span> },
  { key: 'wbs', label: 'WBS', width: '100px', sortKey: 'wbs', render: (t) => <span className="tabular text-[var(--text-tertiary)] truncate block">{t.wbs}</span> },
  {
    key: 'name',
    label: 'Name',
    width: '1fr',
    sortKey: 'name',
    required: true,
    render: (t) => (
      <span className="truncate block" style={{ paddingLeft: (t.outlineLevel - 1) * 12 }} title={t.name}>
        {t.name}
      </span>
    ),
  },
  { key: 'milestone', label: 'Milestone', width: '100px', render: (t) => <span className="text-[var(--text-secondary)] truncate block">{t.milestone ?? '-'}</span> },
  { key: 'track', label: 'Track', width: '110px', render: (t) => <span className="text-[var(--text-secondary)] truncate block">{t.track ?? '-'}</span> },
  { key: 'module', label: 'Module', width: '140px', render: (t) => <span className="text-[var(--text-secondary)] truncate block">{t.module ?? '-'}</span> },
  { key: 'owner', label: 'Owner', width: '140px', render: (t) => <span className="text-[var(--text-secondary)] truncate block">{t.primaryOwner ?? '-'}</span> },
  {
    key: 'start',
    label: 'Start',
    width: '90px',
    sortKey: 'start',
    render: (t) => <span className="tabular text-[var(--text-secondary)]">{t.start ? format(t.start, 'd MMM yy') : '-'}</span>,
  },
  {
    key: 'finish',
    label: 'Finish',
    width: '90px',
    sortKey: 'finish',
    render: (t) => <span className="tabular text-[var(--text-secondary)]">{t.finish ? format(t.finish, 'd MMM yy') : '-'}</span>,
  },
  {
    key: 'percentComplete',
    label: '% Complete',
    width: '110px',
    sortKey: 'percentComplete',
    render: (t) => (
      <span className="flex items-center gap-1.5">
        <span className="w-10 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden shrink-0">
          <span className="block h-full bg-[var(--color-brand-blue)]" style={{ width: `${t.percentComplete}%` }} />
        </span>
        <span className="tabular text-xs text-[var(--text-tertiary)]">{t.percentComplete}%</span>
      </span>
    ),
  },
  {
    key: 'critical',
    label: 'Critical',
    width: '80px',
    render: (t) =>
      t.criticalPath ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-rag-red)]/10 text-[var(--color-rag-red)]">Critical</span>
      ) : (
        <span className="text-[var(--text-tertiary)]">-</span>
      ),
  },
  { key: 'party', label: 'Party', width: '80px', render: (t) => <span className="text-[var(--text-secondary)] truncate block">{t.party ?? '-'}</span> },
  {
    key: 'status',
    label: 'Health',
    width: '100px',
    required: true,
    render: (t) => {
      const meta = RAG_META[t.health]
      return <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${meta.bgClass} ${meta.textClass}`}>{meta.label}</span>
    },
  },
]

const DEFAULT_HIDDEN = new Set(['module', 'party'])

function allExcept(hidden: Set<string>): Set<string> {
  return new Set(COLUMNS.map((c) => c.key).filter((k) => !hidden.has(k)))
}

function loadVisibility(): Set<string> {
  if (typeof window === 'undefined') return allExcept(DEFAULT_HIDDEN)
  try {
    const stored = window.localStorage.getItem(COLUMN_VISIBILITY_KEY)
    if (!stored) return allExcept(DEFAULT_HIDDEN)
    const hidden = new Set<string>(JSON.parse(stored))
    return allExcept(hidden)
  } catch {
    return allExcept(DEFAULT_HIDDEN)
  }
}

export function TableView({ plan }: { plan: ProgrammePlan }) {
  const filters = useAppStore((s) => s.filters)
  const search = useAppStore((s) => s.search)
  const selectTask = useAppStore((s) => s.selectTask)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [visible, setVisible] = useState<Set<string>>(loadVisibility)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)

  const visibleColumns = useMemo(() => COLUMNS.filter((c) => visible.has(c.key)), [visible])
  const gridTemplate = useMemo(() => visibleColumns.map((c) => c.width).join(' '), [visibleColumns])

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

  function toggleColumn(key: string) {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      const hidden = COLUMNS.filter((c) => !next.has(c.key)).map((c) => c.key)
      window.localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(hidden))
      return next
    })
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Task table</h1>
          <p className="text-sm text-[var(--text-secondary)]">{sorted.length} of {plan.tasks.length} tasks shown</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              <Columns3 size={14} /> Columns
            </button>
            {showColumnMenu && (
              <>
                <div className="fixed inset-0 z-10 no-print" onClick={() => setShowColumnMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] p-2 max-h-80 overflow-y-auto">
                  {COLUMNS.map((c) => (
                    <label
                      key={c.key}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${c.required ? 'opacity-50' : 'hover:bg-[var(--bg-hover)] cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        checked={visible.has(c.key)}
                        disabled={c.required}
                        onChange={() => toggleColumn(c.key)}
                        className="accent-[var(--color-brand-blue)]"
                      />
                      <span className="text-[var(--text-primary)]">{c.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => downloadCsv(tasksToCsv(sorted), `${plan.fileName.replace(/\.xlsx$/i, '')}-tasks.csv`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            <Download size={14} /> Export filtered CSV
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
        <div
          style={{ gridTemplateColumns: gridTemplate }}
          className="grid gap-2 px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] sticky top-0 z-10"
        >
          {visibleColumns.map((c) =>
            c.sortKey ? (
              <button
                key={c.key}
                onClick={() => toggleSort(c.sortKey!)}
                className="flex items-center gap-1 text-left hover:text-[var(--text-primary)]"
              >
                {c.label}
                {sortKey === c.sortKey && <ArrowDownUp size={11} />}
              </button>
            ) : (
              <span key={c.key}>{c.label}</span>
            ),
          )}
        </div>
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const t = sorted[vi.index]
              return (
                <Row
                  key={t.id}
                  task={t}
                  columns={visibleColumns}
                  gridTemplate={gridTemplate}
                  style={{ position: 'absolute', top: vi.start, left: 0, right: 0, height: ROW_H }}
                  onClick={() => selectTask(t.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  task,
  columns,
  gridTemplate,
  style,
  onClick,
}: {
  task: Task
  columns: ColumnDef[]
  gridTemplate: string
  style: CSSProperties
  onClick: () => void
}) {
  return (
    <div
      style={{ ...style, gridTemplateColumns: gridTemplate }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="grid gap-2 px-4 items-center text-sm border-b border-[var(--border-hairline)]/60 cursor-pointer hover:bg-[var(--bg-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-brand-blue)] focus-visible:-outline-offset-2"
    >
      {columns.map((c) => (
        <div key={c.key} className="min-w-0 overflow-hidden">
          {c.render(task)}
        </div>
      ))}
    </div>
  )
}
