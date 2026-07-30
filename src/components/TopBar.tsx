import { useRef } from 'react'
import { Download, FileSpreadsheet, Moon, Printer, Search, Sun, Upload } from 'lucide-react'
import { useAppStore } from '../state/store'
import { parseWorkbook, WorkbookParseError } from '../parsing/parseWorkbook'
import { applyFilters } from '../state/filteredTasks'
import { tasksToCsv, downloadCsv } from '../model/csvExport'
import type { ProgrammePlan } from '../model/types'

export function TopBar({ plan }: { plan: ProgrammePlan }) {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const search = useAppStore((s) => s.search)
  const setSearch = useAppStore((s) => s.setSearch)
  const filters = useAppStore((s) => s.filters)
  const setPlan = useAppStore((s) => s.setPlan)
  const setParseError = useAppStore((s) => s.setParseError)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleReplace = async (file: File) => {
    try {
      const next = await parseWorkbook(file)
      setPlan(next)
    } catch (err) {
      setParseError(err instanceof WorkbookParseError ? err.message : 'Could not read this workbook.')
    }
  }

  const handleExportCsv = () => {
    const filtered = applyFilters(plan, filters, search)
    downloadCsv(tasksToCsv(filtered), `${plan.fileName.replace(/\.xlsx$/i, '')}-tasks.csv`)
  }

  return (
    <header className="no-print flex items-center gap-4 h-16 px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 min-w-0">
        <FileSpreadsheet size={16} className="text-[var(--text-tertiary)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[220px]" title={plan.fileName}>
          {plan.fileName}
        </span>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] shrink-0"
      >
        <Upload size={14} /> Load / replace file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleReplace(file)
          e.target.value = ''
        }}
      />

      <div className="flex-1 max-w-md relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks, WBS, owner, deliverable, notes..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 shrink-0">
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          <Download size={14} /> CSV
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          <Printer size={14} /> Print / Export PDF
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}
