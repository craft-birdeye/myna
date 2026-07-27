import React, { useState } from 'react'
import {
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  DonutChart,
  FilterPanel,
  Icon,
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
  { id: 'outreach', value: '5.5K',  label: 'Outreach sent slots', delta: '40%',  trend: 'down' as const },
  { id: 'filled',   value: '7.9K',  label: 'Slots filled',  delta: '36.6%',trend: 'up'   as const },
  { id: 'fillRate', value: '23.7%', label: 'Fill rate',     delta: '20%',  trend: 'up'   as const },
  { id: 'avgTime',  value: '2.5 hrs',label: 'Avg fill time', delta: '20%', trend: 'down' as const },
]

// 0=Voice, 1=Text                        (channel)
// 2=Confirmed, 3=Pending               (outcome)
// 4=1-4hrs, 5=<1hr, 6=>24hr, 7=4-24hr (time to confirm)
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Voice (72.5%)' }, { name: 'Text (27.5%)' },
  { name: 'Confirmed (62.8%)' }, { name: 'Pending (37.2%)' },
  { name: '1-4hrs (31.3%)' }, { name: '<1hr (41.7%)' }, { name: '>24hr (9.9%)' }, { name: '4-24hr (17.2%)' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  // channel → outcome
  { source: 0, target: 2, value: 45 }, { source: 0, target: 3, value: 26 },
  { source: 1, target: 2, value: 18 }, { source: 1, target: 3, value: 11 },
  // outcome → time to confirm
  { source: 2, target: 4, value: 20 }, { source: 2, target: 5, value: 26 }, { source: 2, target: 6, value: 6  }, { source: 2, target: 7, value: 11 },
]
// outcome overrides — channels inherit categorical defaults
const FUNNEL_NODE_COLORS: Record<number, string> = { 0: '#1976d2', 1: '#7c3aed', 2: '#4cae3d', 3: '#f59e0b' }

const FILL_TIME_DATA = [
  { bucket: '<1 hr',   slotsFilled: 494 },
  { bucket: '1-4 hrs', slotsFilled: 198 },
  { bucket: '4-24 hrs',slotsFilled: 298 },
  { bucket: '>24 hrs', slotsFilled: 298 },
]
const FILL_TIME_SERIES = [{ key: 'slotsFilled', label: 'Slots filled', color: '#1976d2' }]

const APPT_TYPE_DONUT = [
  { name: 'Cleaning',   value: 35, color: '#3f51b5' },
  { name: 'Exam',       value: 25, color: '#9c27b0' },
  { name: 'X-ray',      value: 13, color: '#4cae3d' },
  { name: 'Extraction', value: 9,  color: '#f59e0b' },
  { name: 'Others',     value: 17, color: '#e91e63' },
]

function deltaSpan(delta: string) {
  const isPos = delta.startsWith('+')
  return <span className={`text-xs ${isPos ? 'text-chip-success-text' : 'text-chip-danger-text'}`}>{delta}</span>
}

interface ChannelRow {
  channel: string
  outreachSent: number
  responded: number
  responseRate: string
  responseDelta: string
  slotsFilled: number
  fillRate: string
  fillDelta: string
  [key: string]: string | number
}
const CHANNEL_DATA: ChannelRow[] = [
  { channel: 'Voice', outreachSent: 986, responded: 562, responseRate: '57.0%', responseDelta: '+4%', slotsFilled: 312, fillRate: '31.6%', fillDelta: '+4%' },
  { channel: 'Text',  outreachSent: 612, responded: 298, responseRate: '48.7%', responseDelta: '-2%', slotsFilled: 164, fillRate: '26.8%', fillDelta: '-2%' },
]
const CHANNEL_COLUMNS: Column<ChannelRow>[] = [
  { key: 'channel',      label: 'Channel',       width: 140, sortable: true },
  { key: 'outreachSent', label: 'Outreach sent', width: 160, sortable: true },
  { key: 'responded',    label: 'Responded',     width: 140, sortable: true },
  {
    key: 'responseRate', label: 'Response rate', width: 160, sortable: true,
    render: (_v, row) => (
      <span>{row.responseRate} {deltaSpan(row.responseDelta as string)}</span>
    ),
  },
  { key: 'slotsFilled',  label: 'Slots filled',  width: 140, sortable: true },
  {
    key: 'fillRate', label: 'Fill rate', width: 140, sortable: true,
    render: (_v, row) => (
      <span>{row.fillRate} {deltaSpan(row.fillDelta as string)}</span>
    ),
  },
]

interface WaitlistLocationRow {
  location: string
  outreachSent: number
  slotsFilled: number
  fillRate: string
  fillDelta: string
  avgFillTime: string
  [key: string]: string | number
}
const WAITLIST_LOCATION_DATA: WaitlistLocationRow[] = [
  { location: 'Atlanta, GA', outreachSent: 60,  slotsFilled: 100, fillRate: '20%', fillDelta: '+2%', avgFillTime: '2.5 hrs' },
  { location: 'Dallas, TX',  outreachSent: 23,  slotsFilled: 90,  fillRate: '20%', fillDelta: '+2%', avgFillTime: '3.5 hrs' },
  { location: 'Chicago, IL', outreachSent: 18,  slotsFilled: 80,  fillRate: '20%', fillDelta: '-5%', avgFillTime: '2.5 hrs' },
  { location: 'Miami, FL',   outreachSent: 2,   slotsFilled: 70,  fillRate: '20%', fillDelta: '+2%', avgFillTime: '2.5 hrs' },
  { location: 'Phoenix, AZ', outreachSent: 9,   slotsFilled: 60,  fillRate: '20%', fillDelta: '+2%', avgFillTime: '4.5 hrs' },
  { location: 'Austin, TX',  outreachSent: 11,  slotsFilled: 50,  fillRate: '20%', fillDelta: '-5%', avgFillTime: '2.5 hrs' },
  { location: 'Denver, CO',  outreachSent: 13,  slotsFilled: 40,  fillRate: '20%', fillDelta: '+2%', avgFillTime: '5 hrs'   },
  { location: 'Seattle, WA', outreachSent: 15,  slotsFilled: 30,  fillRate: '20%', fillDelta: '+2%', avgFillTime: '2.5 hrs' },
]
const WAITLIST_LOCATION_COLUMNS: Column<WaitlistLocationRow>[] = [
  { key: 'location',    label: 'Location',     width: 200, sortable: true },
  { key: 'outreachSent',label: 'Outreach sent slots',width: 180, sortable: true },
  { key: 'slotsFilled', label: 'Slots filled', width: 180, sortable: true },
  {
    key: 'fillRate', label: 'Fill rate', width: 160, sortable: true,
    render: (_v, row) => (
      <span>{row.fillRate} {deltaSpan(row.fillDelta as string)}</span>
    ),
  },
  { key: 'avgFillTime', label: 'Avg fill time', width: 160, sortable: true },
]

export function HCWaitlistFilledScreen({ isDental = false }: { isDental?: boolean }) {
  const [dateRange, setDateRange] = useState('Last 3 months')
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Waitlist filled"
          subtitle="Cancellation recovery and slot fill outcomes across your locations"
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
                className={`flex size-9 items-center justify-center rounded-sm text-text-icon ${filterOpen ? 'bg-surface-selected' : 'border border-border-selected bg-surface hover:bg-surface-l2'}`}
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          }
        />

        <div className="flex flex-col gap-lg p-2xl">

          <SummaryStats stats={SUMMARY_STATS} />

          <HCCard title="Waitlist funnel" tooltip="Traces waitlist reminders from the channel they were sent on, through the response outcome, to how long it took to confirm.">
            <SankeyChart
              nodes={FUNNEL_NODES}
              links={FUNNEL_LINKS}
              height={400}
              nodeColors={FUNNEL_NODE_COLORS}
              terminalNodes={[3]}
              columnHeaders={['Waitlist reminders sent by channel', 'Outcome', 'Time to confirm']}
            />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Time-to-fill distribution" tooltip="Shows how long it took to fill each slot after the last reminder was sent. Each conversation is counted once.">
              <StackedBarChart
                data={FILL_TIME_DATA}
                series={FILL_TIME_SERIES}
                xKey="bucket"
                height={280}
                showBarLabels
              />
            </HCCard>

            <HCCard title="Fills by appointment type" tooltip="Breaks down filled slots by appointment type, counting each appointment once.">
              <ChartStatRow stats={[
                { value: '134', label: 'Cleaning'   },
                { value: '98',  label: 'Exam'        },
                { value: '67',  label: 'X-ray'       },
                { value: '52',  label: 'Extraction'  },
                { value: '36',  label: 'Others'      },
              ]} />
              <DonutChart
                data={APPT_TYPE_DONUT}
                centerValue="387"
                centerLabel="Total fills"
              />
            </HCCard>
          </div>

          <HCCard title="Outreach channel performance" tooltip="Shows performance metrics per outreach channel, using the most recent channel for each unique appointment.">
            <DataTable columns={CHANNEL_COLUMNS} data={CHANNEL_DATA} scrollOnHover={isDental} />
          </HCCard>

          <HCCard title="Waitlist by location" tooltip="Breaks down waitlist outreach and fill outcomes by location, aggregated over the selected date range.">
            <DataTable columns={WAITLIST_LOCATION_COLUMNS} data={WAITLIST_LOCATION_DATA} scrollOnHover={isDental} />
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
