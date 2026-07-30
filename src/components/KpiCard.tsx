import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accentClass = 'text-[var(--color-brand-navy)]',
}: {
  label: string
  value: string
  sublabel?: string
  icon: LucideIcon
  accentClass?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</span>
        <Icon size={16} className={accentClass} />
      </div>
      <div className={`mt-3 text-3xl font-semibold tabular ${accentClass}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-[var(--text-secondary)]">{sublabel}</div>}
    </motion.div>
  )
}
