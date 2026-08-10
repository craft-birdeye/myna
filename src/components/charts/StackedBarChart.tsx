import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { chartColors } from './chartColors'

export interface BarSeries {
  key: string
  label: string
  color: string
}

export interface StackedBarChartProps {
  data: Array<Record<string, string | number>>
  series: BarSeries[]
  xKey: string
  height?: number
  /** Render bars side-by-side instead of stacked. */
  grouped?: boolean
  /** Rotate x-axis labels by this angle (e.g. -45). */
  xAxisAngle?: number
  /** Wrap x-axis labels onto 2 lines (horizontal, color #212121). */
  wrapXLabels?: boolean
  /** Show value labels above each bar and hide the Y-axis + horizontal grid lines. */
  showBarLabels?: boolean
  /** Hide the bottom legend. */
  hideLegend?: boolean
}

const axisTick = { fontSize: 12, fill: '#0d0d12', fontFamily: 'Inter, sans-serif' }

function WrapTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const value = String(payload?.value ?? '')
  const spaceIdx = value.indexOf(' ')
  const line1 = spaceIdx > -1 ? value.slice(0, spaceIdx) : value
  const line2 = spaceIdx > -1 ? value.slice(spaceIdx + 1) : ''
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={0} dy={14} textAnchor="middle" fill="#0d0d12" fontSize={12} fontFamily="Inter, sans-serif">{line1}</text>
      {line2 && <text x={0} dy={28} textAnchor="middle" fill="#0d0d12" fontSize={12} fontFamily="Inter, sans-serif">{line2}</text>}
    </g>
  )
}

function kFormat(val: number | string): string {
  const n = Number(val)
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}K`
  return String(n)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StackedBarTooltip({
  active,
  payload,
  label,
  series,
  data,
  xKey,
  grouped,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  series: BarSeries[]
  data: Array<Record<string, string | number>>
  xKey: string
  grouped: boolean
}) {
  if (!active || !payload?.length) return null

  const row = data.find((d) => String(d[xKey]) === String(label))
  if (!row) return null

  const hoveredKey = String(payload[0]?.dataKey ?? '')
  const accentColor =
    series.find((s) => s.key === hoveredKey)?.color ??
    payload[0]?.color ??
    series[0].color

  const items = series.map((s) => ({
    color: s.color,
    label: s.label,
    value: Number(row[s.key] ?? 0),
  }))

  return (
    <ChartTooltip
      label={label}
      items={items}
      accentColor={accentColor}
      showSplit={!grouped}
    />
  )
}

export function StackedBarChart({ data, series, xKey, height = 300, grouped = false, xAxisAngle, wrapXLabels, showBarLabels, hideLegend }: StackedBarChartProps) {
  const xTick = xAxisAngle
    ? { ...axisTick, angle: xAxisAngle, textAnchor: 'end' as const, dy: 4 }
    : axisTick
  const xAxisHeight = wrapXLabels ? 52 : xAxisAngle ? 60 : undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedTick = wrapXLabels ? (WrapTick as any) : xTick
  const margin = showBarLabels
    ? { top: 24, right: 16, left: 0, bottom: 0 }
    : { top: 8, right: 8, left: -8, bottom: 0 }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={margin} barCategoryGap="28%">
        <CartesianGrid stroke={chartColors.grid} vertical={false} horizontal={!showBarLabels} />
        <XAxis dataKey={xKey} tick={resolvedTick} tickLine={false} axisLine={{ stroke: chartColors.grid }} height={xAxisHeight} />
        {showBarLabels
          ? <YAxis hide width={0} />
          : <YAxis tick={axisTick} tickLine={false} axisLine={false} width={40} />
        }
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          content={(props) => (
            <StackedBarTooltip
              {...props}
              series={series}
              data={data}
              xKey={xKey}
              grouped={!!grouped}
            />
          )}
        />
        {!hideLegend && (
          <Legend
            align="left"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#717182' }}>{value}</span>}
            wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', paddingTop: 8 }}
          />
        )}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={grouped ? undefined : 'a'}
            fill={s.color}
            radius={grouped || i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          >
            {showBarLabels && i === series.length - 1 && (
              <LabelList
                dataKey={s.key}
                position="top"
                formatter={kFormat}
                style={{ fontSize: 12, fill: '#0d0d12', fontFamily: 'Inter, sans-serif' }}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
