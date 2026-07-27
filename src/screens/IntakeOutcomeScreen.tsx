import {
  ChartCard,
  DonutChart,
  Icon,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  chartColors as c,
  type BarSeries,
  type SummaryStat,
} from '../components'
import { DataTable } from '../components/DataTable/DataTable'
import type { Column } from '../components/DataTable/DataTable.types'

const SUMMARY: SummaryStat[] = [
  { id: 'sent',       value: '1.4K',  label: 'Intake forms sent',    delta: '36.6%', trend: 'up'   },
  { id: 'completed',  value: '750',   label: 'Intakes completed',     delta: '18%',   trend: 'up'   },
  { id: 'rate',       value: '52.4%', label: 'Completion rate',       delta: '4.2%',  trend: 'up'   },
  { id: 'avgtime',    value: '8.5 m', label: 'Avg completion time',   delta: '20%',   trend: 'down' },
  { id: 'notattempt', value: '120',   label: 'Not attempted',         delta: '20%',   trend: 'up'   },
]

// Intake funnel — 4-layer Sankey
// Nodes: 0=Agent-driven, 1=Human-driven, 2=New patient, 3=Returning patient,
//        4=Text/SMS, 5=Email, 6=Portal, 7=In-office, 8=Completed, 9=Drop-off, 10=Pending
const sankeyNodes = [
  { name: 'Agent-driven' },
  { name: 'Human-driven' },
  { name: 'New patient' },
  { name: 'Returning patient' },
  { name: 'Text / SMS' },
  { name: 'Email' },
  { name: 'Portal' },
  { name: 'In-office' },
  { name: 'Completed' },
  { name: 'Drop-off' },
  { name: 'Pending' },
]
const sankeyLinks = [
  // intake type → patient type
  { source: 0, target: 2, value: 42 },
  { source: 0, target: 3, value: 32 },
  { source: 1, target: 2, value: 15 },
  { source: 1, target: 3, value: 11 },
  // patient type → channel
  { source: 2, target: 4, value: 24 },
  { source: 2, target: 5, value: 19 },
  { source: 2, target: 6, value:  9 },
  { source: 2, target: 7, value:  5 },
  { source: 3, target: 4, value: 18 },
  { source: 3, target: 5, value: 15 },
  { source: 3, target: 6, value:  7 },
  { source: 3, target: 7, value:  3 },
  // channel → outcome
  { source: 4, target: 8, value: 22 },
  { source: 4, target: 9, value: 15 },
  { source: 4, target: 10, value: 6 },
  { source: 5, target: 8, value: 18 },
  { source: 5, target: 9, value: 12 },
  { source: 5, target: 10, value: 5 },
  { source: 6, target: 8, value:  8 },
  { source: 6, target: 9, value:  5 },
  { source: 6, target: 10, value: 2 },
  { source: 7, target: 8, value:  4 },
  { source: 7, target: 9, value:  3 },
  { source: 7, target: 10, value: 1 },
]

// Intake over time — stacked bar
const INTAKE_SERIES: BarSeries[] = [
  { key: 'completed',    label: 'Completed',     color: c.resolved   },
  { key: 'attempted',    label: 'Attempted',     color: c.escalated  },
  { key: 'notAttempted', label: 'Not attempted', color: c.unresolved },
]
const intakeOverTime = [
  { month: 'Dec 2023', completed: 250, attempted: 110, notAttempted:  74 },
  { month: 'Jan 2024', completed: 120, attempted:  70, notAttempted:  44 },
  { month: 'Feb',      completed: 230, attempted: 110, notAttempted:  72 },
  { month: 'Mar',      completed: 210, attempted: 120, notAttempted:  68 },
  { month: 'Apr',      completed: 105, attempted:  58, notAttempted:  35 },
  { month: 'May',      completed: 200, attempted: 110, notAttempted:  68 },
]

// Completion by patient type (donut)
const patientTypeDonut = [
  { name: 'New patient',       value: 57, color: '#1976d2' },
  { name: 'Returning patient', value: 43, color: '#00bcd4' },
]

// Completion by channel (donut)
const channelDonut = [
  { name: 'SMS',   value: 43, color: c.channel.sms   },
  { name: 'Email', value: 33, color: c.channel.email },
  { name: 'Call',  value: 24, color: c.channel.call  },
]

// Intakes by location table
type LocationRow = {
  location:       string
  completed:      number
  attempted:      number
  completionRate: string
  rateDelta:      number
  avgTime:        string
}

const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA',  completed: 100, attempted: 60, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
  { location: 'Dallas, TX',   completed:  90, attempted: 23, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
  { location: 'Chicago, IL',  completed:  80, attempted: 18, completionRate: '20%', rateDelta: -5, avgTime: '8.2 min' },
  { location: 'Miami, FL',    completed:  70, attempted:  2, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
  { location: 'Phoenix, AZ',  completed:  60, attempted:  9, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
  { location: 'Austin, TX',   completed:  50, attempted: 11, completionRate: '20%', rateDelta: -5, avgTime: '8.2 min' },
  { location: 'Denver, CO',   completed:  40, attempted: 13, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
  { location: 'Seattle, WA',  completed:  30, attempted: 15, completionRate: '20%', rateDelta:  2, avgTime: '8.2 min' },
]

const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',       label: 'Location',        sortable: true, width: 220 },
  { key: 'completed',      label: 'Completed',       sortable: true, width: 140 },
  { key: 'attempted',      label: 'Attempted',       sortable: true, width: 140 },
  {
    key: 'completionRate',
    label: 'Completion rate',
    sortable: true,
    width: 180,
    render: (_value, row) => (
      <span className="flex items-center gap-xs">
        <span>{row.completionRate}</span>
        <span
          className={`inline-flex items-center text-small ${
            row.rateDelta >= 0 ? 'text-chip-success-text' : 'text-chip-danger-text'
          }`}
        >
          <Icon name={row.rateDelta >= 0 ? 'arrow_upward' : 'arrow_downward'} size={11} />
          {Math.abs(row.rateDelta)}%
        </span>
      </span>
    ),
  },
  { key: 'avgTime', label: 'Avg time', sortable: true, width: 140 },
]

interface MiniKpi {
  value: string
  label: string
  delta?: string
  trend?: 'up' | 'down'
}

function MiniKpis({ items }: { items: MiniKpi[] }) {
  return (
    <div className="mb-md flex flex-wrap gap-x-2xl gap-y-md">
      {items.map((k) => (
        <div key={k.label}>
          <div className="flex items-center gap-xs">
            <span className="text-[16px] leading-5 text-text-primary">{k.value}</span>
            {k.delta && (
              <span
                className={`inline-flex items-center text-small ${
                  k.trend === 'down' ? 'text-chip-danger-text' : 'text-chip-success-text'
                }`}
              >
                <Icon name={k.trend === 'down' ? 'arrow_downward' : 'arrow_upward'} size={12} />
                {k.delta}
              </span>
            )}
          </div>
          <span className="text-small text-text-secondary">{k.label}</span>
        </div>
      ))}
    </div>
  )
}

// Column header labels for the Sankey funnel
function FunnelHeaders() {
  const labels = ['Intake forms sent', 'Patient type', 'Channel', 'Outcome']
  return (
    <div className="mb-sm flex justify-between px-[60px] pr-[90px]">
      {labels.map((l) => (
        <span key={l} className="text-small text-text-secondary">{l}</span>
      ))}
    </div>
  )
}

export function IntakeOutcomeScreen() {
  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      {/* page header */}
      <div className="flex h-16 shrink-0 items-center justify-between bg-surface px-2xl">
        <div>
          <h1 className="text-h3 text-text-primary">Intakes completed</h1>
          <p className="text-small text-text-secondary">
            Patient intake form completion rates and drop-off analysis driven by the pre-visit agent
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
        >
          <Icon name="calendar_today" size={18} className="text-text-icon" />
          Last 3 months
          <Icon name="expand_more" size={20} className="text-text-icon" />
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex flex-1 flex-col gap-lg overflow-auto bg-surface px-2xl pb-2xl pt-md">
        <SummaryStats stats={SUMMARY} />

        <ChartCard title="Intake funnel">
          <FunnelHeaders />
          <SankeyChart nodes={sankeyNodes} links={sankeyLinks} height={260} />
        </ChartCard>

        <ChartCard title="Intake over time">
          <StackedBarChart data={intakeOverTime} series={INTAKE_SERIES} xKey="month" height={300} />
        </ChartCard>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
          <ChartCard title="Completion by patient type">
            <MiniKpis
              items={[
                { value: '428', label: 'New patient',       delta: '1.3%', trend: 'up' },
                { value: '326', label: 'Returning patient', delta: '1.3%', trend: 'up' },
              ]}
            />
            <DonutChart data={patientTypeDonut} centerValue="754" centerLabel="Total completions" />
          </ChartCard>

          <ChartCard title="Completion by channel">
            <MiniKpis
              items={[
                { value: '4.4K', label: 'Forms sent' },
                { value: '2.4K', label: 'SMS',   delta: '1.3%', trend: 'up' },
                { value: '1.4K', label: 'Email', delta: '1.3%', trend: 'up' },
                { value: '974',  label: 'Call' },
              ]}
            />
            <DonutChart data={channelDonut} centerValue="6.8k" centerLabel="Forms sent" />
          </ChartCard>
        </div>

        <ChartCard title="Intakes by location" showActions={false}>
          <DataTable<LocationRow>
            columns={LOCATION_COLUMNS}
            data={LOCATION_DATA}
          />
        </ChartCard>
      </div>
    </div>
  )
}
