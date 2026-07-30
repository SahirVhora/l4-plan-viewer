import type { ProgrammePlan } from '../model/types'

const PALETTE = ['#1f3864', '#2e5395', '#5b7fb5', '#8ba6cf', '#b8860b', '#d4a537', '#6b4a8a', '#8a6bab', '#2e7d32']

export function PaymentDonut({ plan }: { plan: ProgrammePlan }) {
  const milestones = plan.milestoneSummary
  if (!milestones.length) return null

  const radius = 60
  const stroke = 22
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} viewBox="0 0 160 160" className="shrink-0 -rotate-90">
        <circle cx={80} cy={80} r={radius} fill="none" stroke="var(--border-hairline)" strokeWidth={stroke} />
        {milestones.map((m, idx) => {
          const length = m.paymentPct * circumference
          const dasharray = `${length} ${circumference - length}`
          const dashoffset = -offset
          offset += length
          const isGate = m.paymentPct >= 0.15
          return (
            <circle
              key={m.milestone}
              cx={80}
              cy={80}
              r={radius}
              fill="none"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth={isGate ? stroke + 4 : stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>
      <div className="flex-1 grid grid-cols-1 gap-1.5 text-xs">
        {milestones.map((m, idx) => (
          <div key={m.milestone} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: PALETTE[idx % PALETTE.length] }} />
            <span className="text-[var(--text-secondary)] w-8 shrink-0">{m.milestone}</span>
            <span className="font-medium text-[var(--text-primary)] tabular">{(m.paymentPct * 100).toFixed(0)}%</span>
            {m.paymentPct >= 0.15 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--gate-gold-tint)', color: 'var(--gate-gold)' }}>
                gate
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
