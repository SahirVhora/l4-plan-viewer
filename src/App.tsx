import { lazy, Suspense, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { FilterChips } from './components/FilterChips'
import { DropZone } from './components/DropZone'
import { TaskDrawer } from './components/TaskDrawer'
import { PrintLayout } from './components/PrintLayout'
import { Dashboard } from './views/Dashboard'
import { useAppStore } from './state/store'

const GanttView = lazy(() => import('./views/GanttView').then((m) => ({ default: m.GanttView })))
const TableView = lazy(() => import('./views/TableView').then((m) => ({ default: m.TableView })))
const MilestonesView = lazy(() => import('./views/MilestonesView').then((m) => ({ default: m.MilestonesView })))
const RaidView = lazy(() => import('./views/RaidView').then((m) => ({ default: m.RaidView })))
const ResourcesView = lazy(() => import('./views/ResourcesView').then((m) => ({ default: m.ResourcesView })))

function ViewLoader() {
  return (
    <div className="flex items-center justify-center h-full text-sm text-[var(--text-tertiary)]">
      Loading...
    </div>
  )
}

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
              <Suspense fallback={<ViewLoader />}>
                {view === 'gantt' && <GanttView plan={plan} />}
                {view === 'table' && <TableView plan={plan} />}
                {view === 'milestones' && <MilestonesView plan={plan} />}
                {view === 'raid' && <RaidView plan={plan} />}
                {view === 'resources' && <ResourcesView plan={plan} />}
              </Suspense>
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
