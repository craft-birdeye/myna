import type { ComponentProps } from 'react'
import { ChartCard } from './ChartCard'
import { ChartStatRow } from './ChartStatRow'
import { DonutChart } from './DonutChart'
import { StackedBarChart, type BarSeries } from './StackedBarChart'

/** Matches Front desk overview `HCCard` — tune action + Aero chart chrome. */
function OutcomesCard(props: ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

// Front-desk-style vibrant palette
const C = {
  green: '#4cae3d',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#9c27b0',
  blue: '#1976d2',
  teal: '#00bcd4',
} as const

// ─── Reviews responded over time ─────────────────────────────────────────────

const RESPONDED_OVER_TIME = [
  { month: 'Dec 2025', agent: 380, human: 140 },
  { month: 'Jan 2026', agent: 450, human: 160 },
  { month: 'Feb', agent: 420, human: 160 },
  { month: 'Mar', agent: 510, human: 180 },
  { month: 'Apr', agent: 560, human: 180 },
  { month: 'May', agent: 635, human: 200 },
]
const RESPONDED_SERIES: BarSeries[] = [
  { key: 'agent', label: 'Agent responded', color: C.green },
  { key: 'human', label: 'Human assisted', color: C.teal },
]

// ─── Response rate donut ─────────────────────────────────────────────────────

const RESPONSE_RATE_DONUT = [
  { name: 'Responded', value: 78, color: C.purple },
  { name: 'Pending', value: 14, color: C.amber },
  { name: 'Escalated', value: 8, color: C.green },
]

// ─── Reviews by platform ─────────────────────────────────────────────────────

const PLATFORM_DONUT = [
  { name: 'Google', value: 42, color: C.purple },
  { name: 'Yelp', value: 31, color: C.amber },
  { name: 'Facebook', value: 27, color: C.green },
]

// ─── Time saved by week ──────────────────────────────────────────────────────

const TIME_SAVED_DATA = [
  { week: 'W1', agent: 2.1, human: 1.0 },
  { week: 'W2', agent: 2.6, human: 1.2 },
  { week: 'W3', agent: 3.0, human: 1.3 },
  { week: 'W4', agent: 3.4, human: 1.5 },
  { week: 'W5', agent: 3.8, human: 1.7 },
  { week: 'W6', agent: 4.2, human: 2.0 },
]
const TIME_SAVED_SERIES: BarSeries[] = [
  { key: 'agent', label: 'Agent responded', color: C.blue },
  { key: 'human', label: 'Human assisted', color: C.green },
]

/**
 * Review response exploration Outcomes — Aero ChartCards with Front-desk-style
 * color. Terminology: agent responded / human assisted.
 */
export function ReviewResponseOutcomesCharts() {
  return (
    <div className="flex flex-col gap-lg px-2xl pb-2xl pt-lg">
      <OutcomesCard
        title="Reviews responded over time"
        tooltip="Monthly view of reviews the agent replied to across all locations."
      >
        <ChartStatRow
          stats={[
            { value: '835', label: 'Total responded' },
            { value: '1.3%', label: 'vs prior period' },
          ]}
        />
        <StackedBarChart
          data={RESPONDED_OVER_TIME}
          series={RESPONDED_SERIES}
          xKey="month"
          height={280}
          showBarLabels
        />
      </OutcomesCard>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <OutcomesCard
          title="Response rate"
          tooltip="Share of eligible reviews that received a reply, are still pending, or were escalated."
        >
          <ChartStatRow
            stats={[
              { value: '768', label: 'Responded' },
              { value: '67', label: 'Pending' },
              { value: '42', label: 'Escalated' },
            ]}
          />
          <DonutChart
            data={RESPONSE_RATE_DONUT}
            centerValue="92%"
            centerLabel="Response rate"
          />
        </OutcomesCard>

        <OutcomesCard
          title="Reviews by platform"
          tooltip="Share of reviews received by platform across the selected period."
        >
          <ChartStatRow
            stats={[
              { value: '350', label: 'Google' },
              { value: '259', label: 'Yelp' },
              { value: '226', label: 'Facebook' },
            ]}
          />
          <DonutChart
            data={PLATFORM_DONUT}
            centerValue="835"
            centerLabel="Total reviews"
          />
        </OutcomesCard>
      </div>

      <OutcomesCard
        title="Time saved by week"
        tooltip="Estimated staff hours saved each week, split by agent-responded vs human-assisted replies."
      >
        <ChartStatRow
          stats={[
            { value: '6h 20m', label: 'Total time saved' },
            { value: '1.3%', label: 'vs prior period' },
          ]}
        />
        <StackedBarChart
          data={TIME_SAVED_DATA}
          series={TIME_SAVED_SERIES}
          xKey="week"
          height={280}
          showBarLabels
        />
      </OutcomesCard>
    </div>
  )
}
