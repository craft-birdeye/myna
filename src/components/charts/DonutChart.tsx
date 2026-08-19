import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from './ChartTooltip'

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export interface DonutChartProps {
  data: DonutDatum[]
  centerValue?: string
  centerLabel?: string
  height?: number
  /** Show percentage labels inside each segment */
  showLabels?: boolean
  /** Use dark text on light-colored slices instead of always-white, so labels stay readable on e.g. grey segments */
  autoContrastLabels?: boolean
}

function contrastTextColor(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#0d0d12' : '#fff'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload, autoContrast }: any) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const pct = Math.round(percent * 100)
  if (pct < 5) return null
  const textColor = autoContrast && payload?.color ? contrastTextColor(payload.color) : '#fff'
  return (
    <text x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="Inter, sans-serif">
      {pct}%
    </text>
  )
}

export function DonutChart({ data, centerValue, centerLabel, height = 260, showLabels = true, autoContrastLabels = false }: DonutChartProps) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="90%"
            paddingAngle={1}
            stroke="none"
            isAnimationActive={false}
            labelLine={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={showLabels ? (props: any) => <PctLabel {...props} autoContrast={autoContrastLabels} /> : undefined}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const entry = payload[0]
              const color = (entry.payload as DonutDatum | undefined)?.color ?? entry.color ?? '#4cae3d'
              return (
                <ChartTooltip
                  label={String(entry.name ?? '')}
                  items={[{ color, label: String(entry.name ?? ''), value: Number(entry.value ?? 0) }]}
                  accentColor={color}
                />
              )
            }}
          />
          <Legend
            align="left"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#717182' }}>{value}</span>}
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div
          className="pointer-events-none absolute inset-x-0 flex flex-col items-center justify-center"
          style={{ top: 0, bottom: 40 }}
        >
          {centerValue && <span className="text-[22px] leading-7 text-text-primary">{centerValue}</span>}
          {centerLabel && <span className="text-small text-text-secondary">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
