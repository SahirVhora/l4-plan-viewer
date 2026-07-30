import { BarChart3, GanttChartSquare, LayoutDashboard, ListTodo, ShieldAlert, Users, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useState } from 'react'
import { useAppStore, type ViewName } from '../state/store'

const ITEMS: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gantt', label: 'Gantt', icon: GanttChartSquare },
  { id: 'table', label: 'Task table', icon: ListTodo },
  { id: 'milestones', label: 'Milestones', icon: BarChart3 },
  { id: 'raid', label: 'Assumptions & Decisions', icon: ShieldAlert },
  { id: 'resources', label: 'Resources', icon: Users },
]

export function Sidebar() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`no-print flex flex-col shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-[var(--border-hairline)]">
        <div className="h-8 w-8 rounded-lg bg-[var(--color-brand-navy)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
          L4
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">Programme Plan</div>
            <div className="text-xs text-[var(--text-tertiary)] truncate">Executive view</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            title={label}
            aria-label={label}
            aria-current={view === id ? 'page' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              view === id
                ? 'bg-[var(--color-brand-navy)] text-white font-medium'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="m-2 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  )
}
