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
  /** Optional Y-axis domain, e.g. `[0, 5]` for star ratings */
  yDomain?: [number, number]
  valueLabel?: string
}

const axisTick = { fontSize: 12, fill: '#212121', fontFamily: 'Roboto' }

export function TrendLineChart({ data, height = 300, color = chartColors.resolved, yDomain, valueLabel = 'Value' }: TrendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: chartColors.grid }} />
        <YAxis domain={yDomain} tick={axisTick} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const raw = Number(payload[0]?.value ?? 0)
            return (
              <ChartTooltip
                label={String(label ?? '')}
                items={[{ color, label: valueLabel, value: raw }]}
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
