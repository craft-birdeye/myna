import { useState } from 'react'
import { Info } from 'lucide-react'
import {
  ChartCard,
  ChartStatRow,
  Chip,
  DataTable,
  DateRangeSelector,
  DonutChart,
  HBarList,
  RatingBarChart,
  ReportHeader,
  StackedBarChart,
  SummaryStats,
  TopNav,
  TrendLineChart,
  type Column,
} from '../components'

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 12 months', 'Custom']

// ── Summary KPIs ─────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { id: 'booked',   value: '2,104',   label: 'Appointments booked by Myna',   delta: '22%',   trend: 'up'   as const },
  { id: 'no-show',  value: '6.2%',    label: 'No-show rate',                  delta: '31%',   trend: 'down' as const },
  { id: 'confirm',  value: '84.7%',   label: 'Confirmation rate (reminders)', delta: '13.7%', trend: 'up'   as const },
  { id: 'csat',     value: '4.4 / 5', label: 'CSAT score',                   delta: '0.2',   trend: 'up'   as const },
]

// ── Appointments booked vs no-shows ───────────────────────────────────────────
const WEEKLY_DATA = [
  { week: 'Week 1', booked: 495, noShow: 35 },
  { week: 'Week 2', booked: 505, noShow: 28 },
  { week: 'Week 3', booked: 540, noShow: 32 },
  { week: 'Week 4', booked: 564, noShow: 25 },
]
const WEEKLY_SERIES = [
  { key: 'booked', label: 'Booked',  color: '#4cae3d' },
  { key: 'noShow', label: 'No-show', color: '#f59e0b' },
]

// ── Reminder channel effectiveness (individual channels only) ─────────────────
const REMINDER_CHANNELS = [
  { label: 'SMS — T-immediate', pct: 62, color: '#1976d2' },
  { label: 'SMS — T-24h',       pct: 71, color: '#1976d2' },
  { label: 'Email — T-24h',     pct: 48, color: '#1976d2' },
  { label: 'Voice — T-2h',      pct: 85, color: '#1976d2' },
]

// ── Communication mode effectiveness ─────────────────────────────────────────
const COMM_MODES = [
  { label: 'Concurrent mode',  pct: 84.7, color: '#4cae3d' },
  { label: 'Sequential mode',  pct: 71.0, color: '#4cae3d' },
]

// ── CSI rating chart ──────────────────────────────────────────────────────────
const CSI_DATA = [
  { label: 'No rating', value: 338,    color: '#9e9e9e' },
  { label: '1 star',    value: 17000,  color: '#de1b0c' },
  { label: '2 star',    value: 4300,   color: '#f97316' },
  { label: '3 star',    value: 7400,   color: '#f59e0b' },
  { label: '4 star',    value: 19900,  color: '#8bc34a' },
  { label: '5 star',    value: 163300, color: '#4cae3d' },
]

// ── Service lapse re-engagement ───────────────────────────────────────────────
const LAPSE_DATA = [
  { week: 'Week 1', booked: 25, noResponse: 65, optedOut: 10 },
  { week: 'Week 2', booked: 22, noResponse: 68, optedOut: 10 },
  { week: 'Week 3', booked: 26, noResponse: 64, optedOut: 10 },
  { week: 'Week 4', booked: 24, noResponse: 66, optedOut: 10 },
]
const LAPSE_SERIES = [
  { key: 'booked',     label: 'Booked appt',  color: '#4cae3d' },
  { key: 'noResponse', label: 'No response',  color: '#de1b0c' },
  { key: 'optedOut',   label: 'Opted out',    color: '#f59e0b' },
]

// ── NHTSA summary stats ───────────────────────────────────────────────────────
const NHTSA_STATS = [
  { id: 'campaigns', value: '3',     label: 'Active campaigns'    },
  { id: 'vins',      value: '847',   label: 'Affected VINs'       },
  { id: 'contact',   value: '83.1%', label: 'Contact rate',       delta: '3.1%',  trend: 'up' as const },
  { id: 'repairs',   value: '512',   label: 'Repairs scheduled',  delta: '60.4%', trend: 'up' as const },
]

// ── NHTSA campaigns ───────────────────────────────────────────────────────────
interface Campaign {
  campaign: string
  affectedVINs: number
  contacted: string
  scheduled: number
  status: string
  [key: string]: string | number
}
const CAMPAIGNS: Campaign[] = [
  { campaign: 'Brake system — Campaign #24-012',    affectedVINs: 412, contacted: '89.1%', scheduled: 318, status: 'On track' },
  { campaign: 'Airbag inflator — Campaign #24-008', affectedVINs: 298, contacted: '77.5%', scheduled: 164, status: 'At risk'  },
  { campaign: 'Software update — Campaign #24-019', affectedVINs: 137, contacted: '82.5%', scheduled: 30,  status: 'On track' },
]
const CAMPAIGN_COLUMNS: Column<Campaign>[] = [
  { key: 'campaign',     label: 'Campaign',      width: 280, sortable: true },
  { key: 'affectedVINs', label: 'Affected VINs', width: 140, sortable: true },
  { key: 'contacted',    label: 'Contacted',     width: 120, sortable: true },
  { key: 'scheduled',    label: 'Scheduled',     width: 120, sortable: true },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    render: (v) => <Chip label={String(v)} variant={v === 'On track' ? 'success' : 'warning'} />,
  },
]

// ── Service type breakdown ────────────────────────────────────────────────────
const SERVICE_TYPE_DATA = [
  { name: 'Maintenance',  value: 45, color: '#4cae3d' },
  { name: 'Repair/diag',  value: 25, color: '#42a5f5' },
  { name: 'Recall',       value: 15, color: '#5c6bc0' },
  { name: 'Warranty',     value: 10, color: '#f59e0b' },
  { name: 'Other',        value: 5,  color: '#9e9e9e' },
]

// ── Monthly trend ─────────────────────────────────────────────────────────────
const TREND_DATA = [
  { label: 'Jan', value: 1420 },
  { label: 'Feb', value: 1560 },
  { label: 'Mar', value: 1640 },
  { label: 'Apr', value: 1820 },
  { label: 'May', value: 1970 },
  { label: 'Jun', value: 2104 },
]

export function ServiceScreen() {
  const [dateRange, setDateRange] = useState('Last 30 days')

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">

        <ReportHeader
          title="Service"
          subtitle="All service appointment outcomes and recall campaign performance across channels."
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

          {/* Row 1: weekly bookings + reminder channels */}
          <div className="grid grid-cols-2 gap-lg">

            <ChartCard title="Appointments booked vs no-shows — weekly">
              <StackedBarChart
                data={WEEKLY_DATA}
                series={WEEKLY_SERIES}
                xKey="week"
                height={300}
                grouped
                showBarLabels
              />
            </ChartCard>

            <ChartCard
              title="Reminder journey channel effectiveness"
              showActions={false}
              titleSuffix={
                <div className="group relative flex items-center">
                  <Info className="size-4 cursor-help text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  <div className="pointer-events-none absolute left-0 top-6 z-50 hidden w-72 rounded-sm border border-border bg-surface p-sm text-small leading-5 text-text-secondary shadow-dropdown group-hover:block">
                    Shows the percentage of customers confirmed per channel touchpoint
                  </div>
                </div>
              }
            >
              <HBarList items={REMINDER_CHANNELS.map(r => ({ label: r.label, pct: r.pct, color: r.color }))} />
            </ChartCard>

          </div>

          {/* Row 2: communication mode + CSI */}
          <div className="grid grid-cols-2 gap-lg">

            <ChartCard
              title="Communication mode effectiveness across channels"
              showActions={false}
              titleSuffix={
                <div className="group relative flex items-center">
                  <Info className="size-4 cursor-help text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  <div className="pointer-events-none absolute left-0 top-6 z-50 hidden w-80 rounded-sm border border-border bg-surface p-sm text-small leading-5 text-text-secondary shadow-dropdown group-hover:block">
                    Concurrent sends all channels simultaneously. Sequential waits for a non-response before trying the next channel.
                  </div>
                </div>
              }
            >
              <HBarList
                items={COMM_MODES.map(r => ({ label: r.label, pct: r.pct, color: r.color }))}
                className="flex flex-1 flex-col items-stretch justify-center gap-[80px]"
              />
            </ChartCard>

            <ChartCard title="CSI satisfaction breakdown">
              <ChartStatRow stats={[
                { value: '4.4',  label: 'Rating',  icon: 'star' },
                { value: '1.8K', label: 'Surveys' },
              ]} />
              <RatingBarChart data={CSI_DATA} height={260} />
            </ChartCard>

          </div>

          {/* Row 3: service lapse — full width */}
          <ChartCard title="Service lapse re-engagement outcomes">
            <StackedBarChart
              data={LAPSE_DATA}
              series={LAPSE_SERIES}
              xKey="week"
              height={280}
              showBarLabels
            />
          </ChartCard>

          {/* NHTSA summary */}
          <SummaryStats title="NHTSA recall campaign performance" stats={NHTSA_STATS} />

          {/* Campaign detail */}
          <ChartCard title="Campaign detail">
            <DataTable columns={CAMPAIGN_COLUMNS} data={CAMPAIGNS} />
          </ChartCard>

          {/* Service type breakdown */}
          <div className="grid grid-cols-2 gap-lg">
              <ChartCard title="Service type breakdown">
                <ChartStatRow stats={[
                  { value: '2,104', label: 'Total appointments' },
                  { value: '45%',   label: 'Maintenance'        },
                  { value: '25%',   label: 'Repair / diag'      },
                ]} />
                <DonutChart data={SERVICE_TYPE_DATA} height={260} />
              </ChartCard>
              <ChartCard title="Monthly appointment trend">
                <ChartStatRow stats={[
                  { value: '1752', label: 'Avg booking' },
                ]} />
                <TrendLineChart data={TREND_DATA} height={260} />
              </ChartCard>
          </div>

        </div>
      </div>
    </div>
  )
}
