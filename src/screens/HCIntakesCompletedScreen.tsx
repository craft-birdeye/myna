import React, { useState } from 'react'
import {
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  DonutChart,
  FilterPanel,
  ReportHeader,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  type Column,
  type FilterField,
  type SankeyLink,
  type SankeyNode,
} from '../components'
import { ListFilter } from 'lucide-react'

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'region',          label: 'Region',              options: opts('Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Pacific Northwest') },
  { id: 'division',        label: 'Division',            options: opts('Division A', 'Division B', 'Division C', 'Division D', 'Division E') },
  { id: 'city',            label: 'City',                options: opts('Austin', 'San Francisco', 'Phoenix', 'Denver', 'Seattle', 'Dallas', 'Houston', 'Chicago') },
  { id: 'zip',             label: 'Zip',                 options: opts('78701', '78702', '94102', '85001', '80201', '98101', '75201', '60601') },
  { id: 'outcome',         label: 'Outcome',             options: opts('Answered', 'Bookings', 'Rescheduling', 'Cancellation') },
  { id: 'content-manager', label: 'Content manager',     options: opts('Kelsy Hiltz', 'Marcus Webb', 'Priya Nair', 'Sofia Mendez', 'Derek Okafor') },
  { id: 'social-manager',  label: 'Social manager',      options: opts('Tasha Winters', 'Omar Farouk', 'Brianna Cole', 'Nathan Cruz', 'Linda Hargrove') },
  { id: 'area-code',       label: 'Area code',           options: opts('512', '415', '602', '303', '206', '214', '713', '312') },
  { id: 'region-manager',  label: 'Region manager',      options: opts('James Whitfield', 'Ray Castellano', 'Ana Reyes', 'David Park', 'Michelle Torres') },
  { id: 'room-custom',     label: 'Room custom',         options: opts('Exam Room 1', 'Exam Room 2', 'Consultation A', 'Consultation B', 'Waiting Bay') },
  { id: 'new-alpha-beta',  label: 'New alpha beta test', options: opts('Alpha Group', 'Beta Group', 'Control Group', 'Pilot A', 'Pilot B') },
  { id: 'custom-test',     label: 'Custom test',         options: opts('Test Group A', 'Test Group B', 'Cohort 1', 'Cohort 2', 'Cohort 3') },
  { id: 'location',              label: 'Location',                        options: opts('North Austin', 'South Austin', 'San Francisco', 'Phoenix, AZ', 'Denver, CO', 'Seattle, WA') },
  { id: 'conversation-status',   label: 'Conversation status',             options: opts('Open', 'Closed', 'Pending', 'Escalated', 'Unread') },
  { id: 'assigned-to',           label: 'Assigned to',                     options: opts('Front desk AI', 'Kelsy Hiltz', 'USA - Sales', 'Marcus Webb', 'Ana Reyes', 'Unassigned') },
  { id: 'time-period',           label: 'Time period',                     options: opts('Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months') },
  { id: 'last-incoming-channel', label: 'Last incoming message (Channel)', options: opts('Voice', 'Text', 'Chat') },
]

// Healthcare chart card — uses the tune icon for the left action button
function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const SUMMARY_STATS = [
  { id: 'sent',        value: '1.4K',  label: 'Outreach sent',        delta: '36.6%', trend: 'up'   as const },
  { id: 'completed',   value: '750',   label: 'Intakes completed',    delta: '18%',   trend: 'up'   as const },
  { id: 'rate',        value: '52.4%', label: 'Completion rate',      delta: '4.2%',  trend: 'up'   as const },
  { id: 'avgTime',     value: '8.5 m', label: 'Avg completion time',  delta: '20%',   trend: 'down' as const },
]

// 0=Voice, 1=Text                        (channel)
// 2=New patient, 3=Returning patient   (patient type)
// 4=Completed, 5=In-progress, 6=Pending (outcome)
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Voice (55.0%)' }, { name: 'Text (45.0%)' },
  { name: 'New patient (57.4%)' }, { name: 'Returning patient (42.6%)' },
  { name: 'Completed (52.4%)' }, { name: 'In-progress (13.4%)' }, { name: 'Pending (34.2%)' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  // channel → patient type
  { source: 0, target: 2, value: 33 }, { source: 0, target: 3, value: 24 },
  { source: 1, target: 2, value: 24 }, { source: 1, target: 3, value: 17 },
  // patient type → outcome
  { source: 2, target: 4, value: 30 }, { source: 2, target: 5, value: 8  }, { source: 2, target: 6, value: 18 },
  { source: 3, target: 4, value: 21 }, { source: 3, target: 5, value: 6  }, { source: 3, target: 6, value: 15 },
]
// outcome overrides only — channels and patient type inherit categorical defaults
const FUNNEL_NODE_COLORS: Record<number, string> = { 5: '#f5a623', 6: '#de1b0c' }

const INTAKE_OVERTIME_DATA = [
  { month: 'Dec 2023', completed: 280, attempted: 80, notAttempted: 74 },
  { month: 'Jan 2024', completed: 140, attempted: 50, notAttempted: 44 },
  { month: 'Feb',      completed: 290, attempted: 70, notAttempted: 52 },
  { month: 'Mar',      completed: 270, attempted: 70, notAttempted: 58 },
  { month: 'Apr',      completed: 120, attempted: 38, notAttempted: 40 },
  { month: 'May',      completed: 248, attempted: 80, notAttempted: 50 },
]
const INTAKE_OVERTIME_SERIES = [
  { key: 'completed',   label: 'Completed',   color: '#4cae3d' },
  { key: 'attempted',   label: 'In progress', color: '#f59e0b' },
  { key: 'notAttempted',label: 'Pending',     color: '#ef4444' },
]

const PATIENT_TYPE_DONUT = [
  { name: 'New patient',       value: 57, color: '#3f51b5' },
  { name: 'Returning patient', value: 43, color: '#4ccfb4' },
]

const CHANNEL_DONUT = [
  { name: 'Voice', value: 55.0, color: '#3f51b5' },
  { name: 'Text',  value: 45.0, color: '#f59e0b' },
]

function deltaSpan(delta: string) {
  const isPos = delta.startsWith('+')
  return <span className={`text-xs ${isPos ? 'text-chip-success-text' : 'text-chip-danger-text'}`}>{delta}</span>
}

interface LocationRow {
  location: string
  completed: number
  attempted: number
  completionRate: string
  completionDelta: string
  avgTime: string
  [key: string]: string | number
}
const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA', completed: 100, attempted: 60, completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
  { location: 'Dallas, TX',  completed: 90,  attempted: 23, completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
  { location: 'Chicago, IL', completed: 80,  attempted: 18, completionRate: '20%', completionDelta: '-5%', avgTime: '8.2 min' },
  { location: 'Miami, FL',   completed: 70,  attempted: 2,  completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
  { location: 'Phoenix, AZ', completed: 60,  attempted: 9,  completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
  { location: 'Austin, TX',  completed: 50,  attempted: 11, completionRate: '20%', completionDelta: '-5%', avgTime: '8.2 min' },
  { location: 'Denver, CO',  completed: 40,  attempted: 13, completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
  { location: 'Seattle, WA', completed: 30,  attempted: 15, completionRate: '20%', completionDelta: '+2%', avgTime: '8.2 min' },
]
const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',   label: 'Location',        width: 200, sortable: true },
  { key: 'completed',  label: 'Intake completed',  width: 160, sortable: true },
  { key: 'attempted',  label: 'Outreach sent',     width: 160, sortable: true },
  {
    key: 'completionRate', label: 'Completion rate', width: 200, sortable: true,
    render: (_v, row) => (
      <span>{row.completionRate} {deltaSpan(row.completionDelta as string)}</span>
    ),
  },
  { key: 'avgTime',    label: 'Avg completion time', width: 180, sortable: true },
]

export function HCIntakesCompletedScreen({ isDental = false }: { isDental?: boolean }) {
  const [dateRange, setDateRange] = useState('Last 3 months')
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Intakes completed"
          subtitle="Intake completion rates and outreach performance across your locations"
          rightSlot={
            <div className="flex items-center gap-sm">
              <DateRangeSelector
                value={dateRange}
                options={DATE_RANGE_OPTIONS}
                onChange={setDateRange}
              />
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className={`flex size-[34px] items-center justify-center rounded-md text-text-icon ${filterOpen ? 'bg-surface-selected' : 'border border-border-selected bg-surface hover:bg-surface-l2'}`}
              >
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          }
        />

        <div className="flex flex-col gap-lg p-2xl">

          <SummaryStats stats={SUMMARY_STATS} />

          <HCCard title="Intake funnel" tooltip="Traces intake reminders from the channel they were sent on, through patient type, to the final completion outcome.">
            <SankeyChart nodes={FUNNEL_NODES} links={FUNNEL_LINKS} height={400} nodeColors={FUNNEL_NODE_COLORS} columnHeaders={['Intake reminders sent by channel', 'Patient type', 'Outcome']} />
          </HCCard>

          <HCCard title="Intake over time" tooltip="Monthly breakdown of patient intakes by status — completed, in progress, and pending.">
            <StackedBarChart
              data={INTAKE_OVERTIME_DATA}
              series={INTAKE_OVERTIME_SERIES}
              xKey="month"
              height={280}
              showBarLabels
            />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Completion by patient type" tooltip="Breaks down completed intakes by new vs. returning patient, counting each patient once.">
              <ChartStatRow stats={[
                { value: '428', label: 'New patient'       },
                { value: '326', label: 'Returning patient' },
              ]} />
              <DonutChart
                data={PATIENT_TYPE_DONUT}
                centerValue="754"
                centerLabel="Total completions"
              />
            </HCCard>

            <HCCard title="Completion by channel" tooltip="Breaks down completed intakes by the channel the form was sent on, counting each patient once.">
              <ChartStatRow stats={[
                { value: '4.4K', label: 'Forms sent' },
                { value: '2.4K', label: 'Voice'      },
                { value: '2.0K', label: 'Text'       },
              ]} />
              <DonutChart
                data={CHANNEL_DONUT}
                centerValue="6.8k"
                centerLabel="Forms sent"
              />
            </HCCard>
          </div>

          <HCCard title="Intakes by location" tooltip="Breaks down intake completion and drop-off by location, aggregated over the selected date range.">
            <DataTable columns={LOCATION_COLUMNS} data={LOCATION_DATA} scrollOnHover={isDental} />
          </HCCard>

        </div>
      </div>
      <FilterPanel
        open={filterOpen}
        fields={FILTER_FIELDS}
        onClose={() => setFilterOpen(false)}
        onAdvancedFilters={() => {}}
      />
      </div>
    </div>
  )
}
