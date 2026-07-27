import { Icon } from '../Icon/Icon'
import { MetricTilesProps } from './MetricTiles.types'

export function MetricTiles({ metrics }: MetricTilesProps) {
  return (
    <div className="flex gap-md">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex flex-1 flex-col items-start rounded-md border border-border px-xl pb-xl pt-lg transition-colors hover:bg-surface-hover"
        >
          <div className="flex items-baseline gap-sm">
            <span className="text-display text-text-primary">{metric.value}</span>
            {metric.delta && (
              <span className={`text-small ${
                (metric.positiveDown ? metric.trend === 'up' : metric.trend === 'down')
                  ? 'text-chip-danger-text' : 'text-chip-success-text'
              }`}>
                {metric.trend === 'down' ? '-' : '+'}
                {metric.delta}
              </span>
            )}
          </div>
          <div className="mt-xs flex items-center gap-xs">
            <span className="text-body text-text-primary">{metric.label}</span>
            {metric.info && (
              <span className="relative group flex items-center">
                <Icon name="info" size={16} className="text-text-tertiary cursor-default" />
                {metric.tooltip && (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-xs -translate-x-1/2 w-max max-w-[280px] rounded-sm bg-tooltip px-sm py-xs text-small text-white opacity-0 shadow-tooltip transition-opacity group-hover:opacity-100">
                    {metric.tooltip}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
