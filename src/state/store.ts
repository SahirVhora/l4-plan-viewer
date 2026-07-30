import { create } from 'zustand'
import type { ProgrammePlan } from '../model/types'

export type ViewName = 'dashboard' | 'gantt' | 'table' | 'milestones' | 'raid' | 'resources'

export interface Filters {
  milestones: string[]
  tracks: string[]
  modules: string[]
  parties: string[]
  statuses: string[]
  owners: string[]
  criticalOnly: boolean
  atRiskOnly: boolean
}

export const EMPTY_FILTERS: Filters = {
  milestones: [],
  tracks: [],
  modules: [],
  parties: [],
  statuses: [],
  owners: [],
  criticalOnly: false,
  atRiskOnly: false,
}

interface AppState {
  plan: ProgrammePlan | null
  parseError: string | null
  view: ViewName
  theme: 'light' | 'dark'
  filters: Filters
  search: string
  selectedTaskId: number | null
  ganttZoom: 'quarter' | 'month' | 'week'
  ganttColourBy: 'track' | 'module'
  showDependencyLinks: boolean

  setPlan: (plan: ProgrammePlan) => void
  setParseError: (message: string | null) => void
  setView: (view: ViewName) => void
  toggleTheme: () => void
  setFilters: (filters: Partial<Filters>) => void
  resetFilters: () => void
  setSearch: (query: string) => void
  selectTask: (id: number | null) => void
  setGanttZoom: (zoom: 'quarter' | 'month' | 'week') => void
  setGanttColourBy: (mode: 'track' | 'module') => void
  toggleDependencyLinks: () => void
  filterByMilestone: (code: string) => void
}

const THEME_KEY = 'sf-l4-plan-viewer:theme'
const FILTERS_KEY = 'sf-l4-plan-viewer:filters'

function loadTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function loadFilters(): Filters {
  if (typeof window === 'undefined') return EMPTY_FILTERS
  try {
    const stored = window.localStorage.getItem(FILTERS_KEY)
    if (!stored) return EMPTY_FILTERS
    return { ...EMPTY_FILTERS, ...JSON.parse(stored) }
  } catch {
    return EMPTY_FILTERS
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  plan: null,
  parseError: null,
  view: 'dashboard',
  theme: loadTheme(),
  filters: loadFilters(),
  search: '',
  selectedTaskId: null,
  ganttZoom: 'month',
  ganttColourBy: 'track',
  showDependencyLinks: true,

  setPlan: (plan) => set({ plan, parseError: null, view: 'dashboard' }),
  setParseError: (message) => set({ parseError: message }),
  setView: (view) => set({ view }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      window.localStorage.setItem(THEME_KEY, next)
      return { theme: next }
    }),
  setFilters: (partial) =>
    set((state) => {
      const next = { ...state.filters, ...partial }
      window.localStorage.setItem(FILTERS_KEY, JSON.stringify(next))
      return { filters: next }
    }),
  resetFilters: () => {
    window.localStorage.removeItem(FILTERS_KEY)
    set({ filters: EMPTY_FILTERS })
  },
  setSearch: (query) => set({ search: query }),
  selectTask: (id) => set({ selectedTaskId: id }),
  setGanttZoom: (zoom) => set({ ganttZoom: zoom }),
  setGanttColourBy: (mode) => set({ ganttColourBy: mode }),
  toggleDependencyLinks: () => set((state) => ({ showDependencyLinks: !state.showDependencyLinks })),
  filterByMilestone: (code) => {
    const current = get().filters
    get().setFilters({ ...current, milestones: [code] })
    set({ view: 'gantt' })
  },
}))
