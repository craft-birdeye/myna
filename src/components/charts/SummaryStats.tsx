import { Icon } from '../Icon/Icon'

export interface SummaryStat {
  id: string
  value: string
  label: string
  /** e.g. "8.4%" — sign comes from `trend`. */
  delta?: string
  trend?: 'up' | 'down'
  /** Shows a small tune-icon button next to the label — e.g. to configure how this stat is calculated. */
  onConfigure?: () => void
}

export interface SummaryStatsProps {
  title?: string
  stats: SummaryStat[]
}

function kFormat(raw: string): { display: string; tooltip?: string } {
  const numeric = parseFloat(raw.replace(/,/g, ''))
  if (!isNaN(numeric) && numeric >= 1000) {
    const k = parseFloat((numeric / 1000).toFixed(1))
    return { display: `${k}K`, tooltip: numeric.toLocaleString() }
  }
  return { display: raw }
}

export function SummaryStats({ title = 'Summary', stats }: SummaryStatsProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-2xl">
      <h3 className="mb-lg text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h3>
      <div className="grid gap-y-lg" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
        {stats.map((s) => {
          const { display, tooltip } = kFormat(s.value)
          return (
            <div key={s.id} title={tooltip}>
              <div className="flex items-end gap-sm">
                <span className="text-[24px] leading-8 text-text-primary">{display}</span>
                {s.delta && (
                  <span
                    className={`mb-[2px] text-small font-medium ${
                      s.trend === 'down' ? 'text-chip-danger-text' : 'text-chip-success-text'
                    }`}
                  >
                    {s.trend === 'down' ? '-' : '+'}{s.delta.replace(/^[+-]/, '')}
                  </span>
                )}
              </div>
              <p className="flex items-center gap-xs text-body text-text-secondary">
                {s.label}
                {s.onConfigure && (
                  <button
                    type="button"
                    aria-label={`Configure ${s.label}`}
                    onClick={s.onConfigure}
                    className="flex size-5 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                  >
                    <Icon name="tune" size={14} />
                  </button>
                )}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
