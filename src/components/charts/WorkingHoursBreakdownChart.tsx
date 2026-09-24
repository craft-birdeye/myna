import { useState } from 'react'
import { ChartTooltip } from './ChartTooltip'

export interface WorkingHoursBreakdownRow {
  label: string
  officeHours: number
  afterHours: number
}

export interface WorkingHoursBreakdownChartProps {
  data: WorkingHoursBreakdownRow[]
  officeColor?: string
  afterColor?: string
  height?: number
}

function Legend({ officeColor, afterColor }: { officeColor: string; afterColor: string }) {
  return (
    <div className="mt-md flex items-center gap-lg">
      {[
        { label: 'Office hours', color: officeColor },
        { label: 'After hours', color: afterColor },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-sm">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-small text-text-secondary">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function WorkingHoursBreakdownChart({
  data,
  officeColor = '#7e57c2',
  afterColor = '#c4b5fd',
  height = 280,
}: WorkingHoursBreakdownChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const maxValue = Math.max(...data.map((row) => row.officeHours), 1)

  return (
    <div className="relative" style={{ minHeight: height }}>
      <div className="flex flex-col justify-between" style={{ minHeight: height - 28 }}>
        {data.map((row) => {
          const active = hovered === row.label
          return (
            <div
              key={row.label}
              className={`flex items-center gap-md rounded-sm px-sm py-xs transition-colors ${active ? 'bg-black/[0.04]' : ''}`}
              onMouseEnter={(e) => {
                setHovered(row.label)
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltipPos({ x: rect.right - 12, y: rect.top + rect.height / 2 })
              }}
              onMouseLeave={() => {
                setHovered(null)
                setTooltipPos(null)
              }}
            >
              <p className="w-[108px] shrink-0 text-small leading-4 text-text-primary">{row.label}</p>
              <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <div className="h-[10px] w-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(row.officeHours / maxValue) * 100}%`,
                      backgroundColor: officeColor,
                    }}
                  />
                </div>
                <div className="h-[10px] w-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(row.afterHours / maxValue) * 100}%`,
                      backgroundColor: afterColor,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Legend officeColor={officeColor} afterColor={afterColor} />
      {hovered && tooltipPos && (() => {
        const row = data.find((r) => r.label === hovered)
        if (!row) return null
        return (
          <div
            className="pointer-events-none fixed z-[120]"
            style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-100%, -50%)' }}
          >
            <ChartTooltip
              label={row.label}
              items={[
                { color: officeColor, label: 'Office hours', value: row.officeHours },
                { color: afterColor, label: 'After hours', value: row.afterHours },
              ]}
            />
          </div>
        )
      })()}
    </div>
  )
}
