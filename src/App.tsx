import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { FilterChips } from './components/FilterChips'
import { DropZone } from './components/DropZone'
import { TaskDrawer } from './components/TaskDrawer'
import { PrintLayout } from './components/PrintLayout'
import { Dashboard } from './views/Dashboard'
import { GanttView } from './views/GanttView'
import { TableView } from './views/TableView'
import { MilestonesView } from './views/MilestonesView'
import { RaidView } from './views/RaidView'
import { ResourcesView } from './views/ResourcesView'
import { useAppStore } from './state/store'

function App() {
  const plan = useAppStore((s) => s.plan)
  const theme = useAppStore((s) => s.theme)
  const view = useAppStore((s) => s.view)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] print:h-auto print:w-auto print:overflow-visible print:block">
      {plan && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0 print:block">
        {plan ? (
          <>
            <TopBar plan={plan} />
            <FilterChips plan={plan} />
            <div className="flex-1 min-h-0 overflow-y-auto print:hidden">
              {view === 'dashboard' && <Dashboard plan={plan} />}
              {view === 'gantt' && <GanttView plan={plan} />}
              {view === 'table' && <TableView plan={plan} />}
              {view === 'milestones' && <MilestonesView plan={plan} />}
              {view === 'raid' && <RaidView plan={plan} />}
              {view === 'resources' && <ResourcesView plan={plan} />}
            </div>
            <TaskDrawer plan={plan} />
            <PrintLayout plan={plan} />
          </>
        ) : (
          <DropZone />
        )}
      </div>
    </div>
  )
}

export default App
