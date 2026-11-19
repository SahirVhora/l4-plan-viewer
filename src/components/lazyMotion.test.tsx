import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, domAnimation, motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import type { MilestoneSummaryRow, ProgrammePlan } from '../model/types'

// main.tsx wraps the app in <LazyMotion strict>, which throws at render time if
// any component uses the full `motion` export instead of the lightweight `m`.
function renderStrict(node: ReactNode) {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => {
    root.render(
      <LazyMotion features={domAnimation} strict>
        {node}
      </LazyMotion>,
    )
  })
  root.unmount()
}

async function loadComponents() {
  // The app store reads localStorage at import time; jsdom here has none.
  const memory = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, value),
    removeItem: (key: string) => void memory.delete(key),
  })
  const [{ KpiCard }, { DropZone }, { TaskDrawer }, { MilestoneTimeline }] = await Promise.all([
    import('./KpiCard'),
    import('./DropZone'),
    import('./TaskDrawer'),
    import('./MilestoneTimeline'),
  ])
  return { KpiCard, DropZone, TaskDrawer, MilestoneTimeline }
}

// Only the fields these components read; one dated milestone renders an animated button.
const plan = {
  milestoneSummary: [
    { milestone: 'M1', planningTarget: new Date('2026-10-01'), paymentPct: 0.2 } as MilestoneSummaryRow,
  ],
  tasksById: new Map(),
} as unknown as ProgrammePlan

describe('LazyMotion strict mode', () => {
  it('renders animated components without the full motion bundle', async () => {
    const { KpiCard, DropZone, TaskDrawer, MilestoneTimeline } = await loadComponents()
    expect(() => renderStrict(<KpiCard label="Tasks" value="12" icon={Activity} />)).not.toThrow()
    expect(() => renderStrict(<DropZone />)).not.toThrow()
    expect(() => renderStrict(<TaskDrawer plan={plan} />)).not.toThrow()
    expect(() => renderStrict(<MilestoneTimeline plan={plan} />)).not.toThrow()
  })

  it('rejects the full motion component', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderStrict(<motion.div />)).toThrow()
    error.mockRestore()
  })
})
