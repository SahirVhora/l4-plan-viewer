import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronRight, Link2, Link2Off } from 'lucide-react'
import type { ProgrammePlan, Task } from '../../model/types'
import { useAppStore } from '../../state/store'
import { dayWidthForZoom, flattenVisible, xForDate, buildDependencyLines, ROW_HEIGHT, type GanttZoom } from './ganttMath'
import { buildRuler, totalWidth, paddedProgrammeRange } from './ganttRuler'
import { trackColour, moduleColour } from '../../theme/rag'

const ZOOM_OPTIONS: GanttZoom[] = ['quarter', 'month', 'week']
const LEFT_MIN = 280
const LEFT_MAX = 640

export function GanttChart({ plan, visibleTaskIds }: { plan: ProgrammePlan; visibleTaskIds: Set<number> }) {
  const ganttZoom = useAppStore((s) => s.ganttZoom)
  const setGanttZoom = useAppStore((s) => s.setGanttZoom)
  const ganttColourBy = useAppStore((s) => s.ganttColourBy)
  const setGanttColourBy = useAppStore((s) => s.setGanttColourBy)
  const showDependencyLinks = useAppStore((s) => s.showDependencyLinks)
  const toggleDependencyLinks = useAppStore((s) => s.toggleDependencyLinks)
  const selectTask = useAppStore((s) => s.selectTask)

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [leftWidth, setLeftWidth] = useState(360)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const dragging = useRef(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(
    () => flattenVisible(plan.rootIds, plan.tasksById, visibleTaskIds, collapsed),
    [plan, visibleTaskIds, collapsed],
  )

  const { start: rangeStart, end: rangeEnd } = paddedProgrammeRange(plan.programmeStart, plan.programmeFinish)
  const dayWidth = dayWidthForZoom(ganttZoom)
  const chartWidth = totalWidth(rangeStart, rangeEnd, dayWidth)
  const ticks = useMemo(() => buildRuler(rangeStart, rangeEnd, dayWidth, ganttZoom), [rangeStart, rangeEnd, dayWidth, ganttZoom])
  const depLines = useMemo(
    () => (showDependencyLinks ? buildDependencyLines(rows, rangeStart, dayWidth) : []),
    [rows, rangeStart, dayWidth, showDependencyLinks],
  )
  const todayX = xForDate(new Date(), rangeStart, dayWidth)

  function toggleCollapse(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onDividerDown() {
    dragging.current = true
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setLeftWidth(Math.min(LEFT_MAX, Math.max(LEFT_MIN, e.clientX - 24)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function syncScroll(from: 'header' | 'body') {
    if (!bodyRef.current || !headerRef.current) return
    if (from === 'body') headerRef.current.scrollLeft = bodyRef.current.scrollLeft
    else bodyRef.current.scrollLeft = headerRef.current.scrollLeft
  }

  const chartHeight = rows.length * ROW_HEIGHT

  return (
    <div className="flex flex-col h-full rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden shadow-[var(--shadow-card)] print-avoid-break">
      <div className="no-print flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <span className="text-xs text-[var(--text-tertiary)]">Zoom</span>
        <div className="flex rounded-lg border border-[var(--border-hairline)] overflow-hidden">
          {ZOOM_OPTIONS.map((z) => (
            <button
              key={z}
              onClick={() => setGanttZoom(z)}
              className={`px-2.5 py-1 text-xs capitalize ${ganttZoom === z ? 'bg-[var(--color-brand-navy)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              {z}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--text-tertiary)] ml-2">Colour by</span>
        <div className="flex rounded-lg border border-[var(--border-hairline)] overflow-hidden">
          {(['track', 'module'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGanttColourBy(mode)}
              className={`px-2.5 py-1 text-xs capitalize ${ganttColourBy === mode ? 'bg-[var(--color-brand-navy)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <button
          onClick={toggleDependencyLinks}
          className="ml-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          {showDependencyLinks ? <Link2 size={13} /> : <Link2Off size={13} />} Dependencies
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div style={{ width: leftWidth }} className="shrink-0 flex flex-col border-r border-[var(--border-hairline)]">
          <div className="h-10 shrink-0 flex items-center px-3 text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
            Task
          </div>
          <div className="flex-1 overflow-y-auto" onScroll={() => {}}>
            {rows.map((row) => (
              <div
                key={row.task.id}
                onMouseEnter={() => setHoveredId(row.task.id)}
                onMouseLeave={() => setHoveredId((h) => (h === row.task.id ? null : h))}
                onClick={() => selectTask(row.task.id)}
                style={{ height: ROW_HEIGHT, paddingLeft: 8 + row.depth * 16 }}
                className={`flex items-center gap-1.5 pr-2 text-sm cursor-pointer border-b border-[var(--border-hairline)]/60 ${
                  hoveredId === row.task.id ? 'bg-[var(--bg-hover)]' : ''
                } ${row.task.criticalPath ? 'border-l-2 border-l-[var(--color-rag-red)]' : ''}`}
              >
                {row.hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCollapse(row.task.id)
                    }}
                    className="shrink-0 h-4 w-4 flex items-center justify-center text-[var(--text-tertiary)]"
                  >
                    {row.isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </button>
                ) : (
                  <span className="shrink-0 w-4" />
                )}
                <span
                  className={`truncate ${row.task.taskType === 'Summary' ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                  title={row.task.name}
                >
                  {row.task.name}
                </span>
                {row.task.taskType === 'Task' && (
                  <span className="ml-auto shrink-0 w-10 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden">
                    <span
                      className="block h-full bg-[var(--color-brand-blue)]"
                      style={{ width: `${row.task.percentComplete}%` }}
                    />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div onMouseDown={onDividerDown} className="no-print w-1 shrink-0 cursor-col-resize bg-[var(--border-hairline)] hover:bg-[var(--color-brand-blue)] transition-colors" />

        <div className="flex-1 min-w-0 flex flex-col">
          <div ref={headerRef} onScroll={() => syncScroll('header')} className="h-10 shrink-0 overflow-x-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] relative">
            <div style={{ width: chartWidth, height: '100%', position: 'relative' }}>
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  style={{ left: tick.x }}
                  className={`absolute top-0 h-full flex items-center pl-1.5 text-[11px] border-l ${tick.isMajor ? 'border-[var(--border-hairline)] text-[var(--text-primary)] font-medium' : 'border-[var(--border-hairline)]/50 text-[var(--text-tertiary)]'}`}
                >
                  {tick.label}
                </div>
              ))}
            </div>
          </div>

          <div ref={bodyRef} onScroll={() => syncScroll('body')} className="flex-1 overflow-auto relative">
            <div style={{ width: chartWidth, height: chartHeight, position: 'relative' }}>
              {ticks.map((tick, i) => (
                <div key={i} style={{ left: tick.x }} className={`absolute top-0 bottom-0 border-l ${tick.isMajor ? 'border-[var(--border-hairline)]' : 'border-[var(--border-hairline)]/40'}`} />
              ))}

              {todayX >= 0 && todayX <= chartWidth && (
                <div style={{ left: todayX }} className="absolute top-0 bottom-0 border-l-2 border-[var(--gate-gold)] z-10">
                  <div className="absolute -top-0 left-1 text-[10px] font-medium whitespace-nowrap" style={{ color: 'var(--gate-gold)' }}>
                    Today
                  </div>
                </div>
              )}

              {showDependencyLinks && (
                <svg width={chartWidth} height={chartHeight} className="absolute inset-0 pointer-events-none">
                  {depLines.map((line) => (
                    <path
                      key={line.id}
                      d={line.path}
                      fill="none"
                      stroke={line.critical ? 'var(--color-rag-red)' : 'var(--text-tertiary)'}
                      strokeWidth={line.critical ? 1.5 : 1}
                      strokeOpacity={0.55}
                      markerEnd="url(#gantt-arrow)"
                    />
                  ))}
                  <defs>
                    <marker id="gantt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-tertiary)" opacity={0.6} />
                    </marker>
                  </defs>
                </svg>
              )}

              {rows.map((row, idx) => (
                <GanttBar
                  key={row.task.id}
                  task={row.task}
                  y={idx * ROW_HEIGHT}
                  rangeStart={rangeStart}
                  dayWidth={dayWidth}
                  colourBy={ganttColourBy}
                  hovered={hoveredId === row.task.id}
                  onHover={setHoveredId}
                  onClick={() => selectTask(row.task.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GanttBar({
  task,
  y,
  rangeStart,
  dayWidth,
  colourBy,
  hovered,
  onHover,
  onClick,
}: {
  task: Task
  y: number
  rangeStart: Date
  dayWidth: number
  colourBy: 'track' | 'module'
  hovered: boolean
  onHover: (id: number | null) => void
  onClick: () => void
}) {
  if (!task.start || !task.finish) return null
  const x1 = xForDate(task.start, rangeStart, dayWidth)
  const x2 = xForDate(task.finish, rangeStart, dayWidth)
  const width = Math.max(x2 - x1, task.taskType === 'Milestone' ? 0 : 3)
  const colour = colourBy === 'track' ? trackColour(task.track) : moduleColour(task.module)
  const barHeight = ROW_HEIGHT - 12

  const content = (() => {
    if (task.taskType === 'Milestone') {
      const size = 14
      return (
        <div
          style={{
            position: 'absolute',
            left: x1 - size / 2,
            top: (ROW_HEIGHT - size) / 2,
            width: size,
            height: size,
            transform: 'rotate(45deg)',
            background: colour,
            borderRadius: 3,
          }}
          className={task.criticalPath ? 'ring-2 ring-[var(--color-rag-red)] ring-offset-1' : ''}
        />
      )
    }
    if (task.taskType === 'Summary') {
      return (
        <div style={{ position: 'absolute', left: x1, top: ROW_HEIGHT / 2 - 3, width, height: 6 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 2, height: 6, background: colour }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: colour }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: 2, height: 6, background: colour }} />
        </div>
      )
    }
    return (
      <div
        style={{ position: 'absolute', left: x1, top: (ROW_HEIGHT - barHeight) / 2, width, height: barHeight, background: 'var(--border-hairline)' }}
        className={`rounded-md overflow-hidden ${task.criticalPath ? 'ring-2 ring-[var(--color-rag-red)]' : ''}`}
      >
        <div style={{ width: `${task.percentComplete}%`, height: '100%', background: colour }} />
      </div>
    )
  })()

  return (
    <div
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      style={{ position: 'absolute', top: y, left: 0, right: 0, height: ROW_HEIGHT }}
      className="cursor-pointer group"
    >
      {content}
      {hovered && (
        <div
          style={{ position: 'absolute', left: x1, top: ROW_HEIGHT }}
          className="z-20 min-w-[220px] rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] px-3 py-2 pointer-events-none"
        >
          <div className="text-xs font-semibold text-[var(--text-primary)]">{task.name}</div>
          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {format(task.start, 'd MMM yyyy')} - {format(task.finish, 'd MMM yyyy')}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            {task.percentComplete}% complete - {task.primaryOwner ?? 'Unassigned'}
          </div>
        </div>
      )}
    </div>
  )
}
