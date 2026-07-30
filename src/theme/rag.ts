import type { HealthStatus } from '../model/types'
import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from 'lucide-react'

export const RAG_META: Record<HealthStatus, { label: string; textClass: string; bgClass: string; ringClass: string; icon: typeof CheckCircle2 }> = {
  complete: {
    label: 'Complete',
    textClass: 'text-[var(--color-rag-green)]',
    bgClass: 'bg-[var(--color-rag-green)]/10',
    ringClass: 'ring-[var(--color-rag-green)]/30',
    icon: CheckCircle2,
  },
  'at-risk': {
    label: 'At risk',
    textClass: 'text-[var(--color-rag-amber)]',
    bgClass: 'bg-[var(--color-rag-amber)]/10',
    ringClass: 'ring-[var(--color-rag-amber)]/30',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Late',
    textClass: 'text-[var(--color-rag-red)]',
    bgClass: 'bg-[var(--color-rag-red)]/10',
    ringClass: 'ring-[var(--color-rag-red)]/30',
    icon: XCircle,
  },
  'on-track': {
    label: 'On track',
    textClass: 'text-[var(--color-rag-grey)]',
    bgClass: 'bg-[var(--color-rag-grey)]/10',
    ringClass: 'ring-[var(--color-rag-grey)]/30',
    icon: CircleDashed,
  },
}

export function trackColour(track: string | null): string {
  if (!track) return 'var(--color-track-programme)'
  const t = track.toLowerCase()
  if (t.includes('track a')) return 'var(--color-track-a)'
  if (t.includes('track b')) return 'var(--color-track-b)'
  return 'var(--color-track-programme)'
}

const MODULE_PALETTE = ['#2e5395', '#b8860b', '#6b4a8a', '#2e7d32', '#c62828', '#0f766e', '#9333ea']

export function moduleColour(moduleName: string | null): string {
  if (!moduleName) return 'var(--color-rag-grey)'
  let hash = 0
  for (let i = 0; i < moduleName.length; i++) hash = (hash * 31 + moduleName.charCodeAt(i)) >>> 0
  return MODULE_PALETTE[hash % MODULE_PALETTE.length]
}
