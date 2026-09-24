import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  ChartCard,
  ChartStatRow,
  DateRangeSelector,
  DonutChart,
  HBarList,
  ReportHeader,
  StackedBarChart,
  SummaryStats,
  TopNav,
} from '../components'

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 12 months', 'Custom']

// ── Summary KPIs ─────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { id: 'leads',      value: '1,347',  label: 'Leads handled by Myna',  delta: '18%',   trend: 'up' as const },
  { id: 'appt-rate',  value: '28.4%',  label: 'Appointments set rate',   delta: '3.4%',  trend: 'up' as const },
  { id: 'speed',      value: '3m 48s', label: 'Avg speed-to-lead',       delta: '24%',   trend: 'up' as const },
  { id: 'completion', value: '73.1%',  label: 'Journey completion rate', delta: '3.1%',  trend: 'up' as const },
]

// ── Lead pipeline stages ─────────────────────────────────────────────────────
const PIPELINE = [
  { label: 'Internet leads received', count: 1347, pct: 100  },
  { label: 'First contact made',      count: 1264, pct: 93.8 },
  { label: 'Lead qualified',          count: 824,  pct: 61.2 },
  { label: 'Test drive scheduled',    count: 483,  pct: 35.9 },
  { label: 'Appointment set',         count: 382,  pct: 28.4 },
]

// ── SLA compliance by source ─────────────────────────────────────────────────
type SlaStatus = 'ok' | 'warn' | 'fail'
const SLA_DATA: { source: string; pct: number; status: SlaStatus }[] = [
  { source: 'Website form', pct: 94, status: 'ok'   },
  { source: 'AutoTrader',   pct: 89, status: 'ok'   },
  { source: 'Cars.com',     pct: 86, status: 'ok'   },
  { source: 'CarGurus',     pct: 82, status: 'ok'   },
  { source: 'Phone-in',     pct: 71, status: 'warn' },
]
const SLA_BAR_COLOR: Record<SlaStatus, string> = {
  ok:   '#4cae3d',
  warn: '#de1b0c',
  fail: '#de1b0c',
}

// ── Outbound journey performance ─────────────────────────────────────────────
const JOURNEY_DATA = [
  { journey: 'Internet lead',     touches: 2400, apptSet: 382 },
  { journey: 'Missed call',       touches: 870,  apptSet: 148 },
  { journey: 'Unsold showroom',   touches: 620,  apptSet: 112 },
  { journey: 'No-show re-engage', touches: 430,  apptSet: 67  },
  { journey: 'Lease maturity',    touches: 310,  apptSet: 58  },
  { journey: 'Equity mining',     touches: 180,  apptSet: 24  },
]
const JOURNEY_SERIES = [
  { key: 'touches', label: 'Touches sent',     color: '#90caf9' },
  { key: 'apptSet', label: 'Appointment set',  color: '#4cae3d' },
]

// ── Lead type breakdown ───────────────────────────────────────────────────────
const LEAD_TYPE_DATA = [
  { name: 'New vehicle', value: 35, color: '#5c6bc0' },
  { name: 'Used / CPO',  value: 25, color: '#42a5f5' },
  { name: 'Trade-in',    value: 15, color: '#4cae3d' },
  { name: 'Finance',     value: 15, color: '#f59e0b' },
  { name: 'Test drive',  value: 10, color: '#9e9e9e' },
]

export function SalesScreen() {
  const [dateRange, setDateRange] = useState('Last 30 days')

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">

        <ReportHeader
          title="Sales"
          subtitle="All human and agent-driven sales appointment outcomes across all channels and locations."
          rightSlot={
            <DateRangeSelector
              value={dateRange}
              options={DATE_RANGE_OPTIONS}
              onChange={setDateRange}
            />
          }
        />

        <div className="flex flex-col gap-lg px-2xl pb-2xl">

          {/* Summary KPIs */}
          <SummaryStats stats={SUMMARY_STATS} />

          {/* Mid row: pipeline + SLA */}
          <div className="grid grid-cols-2 gap-lg">

            <ChartCard title="Lead pipeline — inbound to appointment" showActions={false}>
              <HBarList
                items={PIPELINE.map(s => ({
                  label:   s.label,
                  pct:     s.pct,
                  color:   '#1976d2',
                  tooltip: s.count.toLocaleString(),
                }))}
              />
            </ChartCard>

            <ChartCard
              title="Speed-to-lead SLA compliance by source"
              showActions={false}
              titleSuffix={
                <div className="group relative flex items-center">
                  <Info className="size-4 cursor-help text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  <div className="pointer-events-none absolute left-0 top-6 z-50 hidden w-72 rounded-sm border border-border bg-surface p-sm text-small leading-5 text-text-secondary shadow-dropdown group-hover:block">
                    Shows out of all leads from this source, what % got a first contact attempt within 5 minutes
                  </div>
                </div>
              }
            >
              <HBarList
                items={SLA_DATA.map(r => ({
                  label: r.source,
                  pct:   r.pct,
                  color: SLA_BAR_COLOR[r.status],
                }))}
                className="flex flex-1 flex-col justify-between overflow-y-auto"
              />
            </ChartCard>

          </div>

          {/* Outbound journey — full width */}
          <ChartCard title="Outbound journey performance">
            <StackedBarChart
              data={JOURNEY_DATA}
              series={JOURNEY_SERIES}
              xKey="journey"
              height={320}
              grouped
              wrapXLabels
              showBarLabels
            />
          </ChartCard>

          {/* Lead type breakdown — full width */}
          <ChartCard title="Lead type breakdown">
            <ChartStatRow stats={[
              { value: '1,347', label: 'Total leads'    },
              { value: '35%',   label: 'New vehicle'    },
              { value: '25%',   label: 'Used / CPO'     },
              { value: '15%',   label: 'Trade-in'       },
            ]} />
            <DonutChart data={LEAD_TYPE_DATA} height={320} />
          </ChartCard>

        </div>
      </div>
    </div>
  )
}
