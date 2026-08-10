import {
  CartesianGrid,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { chartColors } from './chartColors'

export interface TrendPoint {
  label: string
  value: number
}

export interface TrendLineChartProps {
  data: TrendPoint[]
  height?: number
  color?: string
}

const axisTick = { fontSize: 12, fill: '#0d0d12', fontFamily: 'Inter, sans-serif' }

export function TrendLineChart({ data, height = 300, color = chartColors.resolved }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: chartColors.grid }} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <ChartTooltip
                label={String(label ?? '')}
                items={[{ color, label: 'Value', value: Number(payload[0]?.value ?? 0) }]}
                accentColor={color}
              />
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      </RLineChart>
    </ResponsiveContainer>
  )
}
