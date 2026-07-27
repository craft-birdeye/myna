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
  { id: 'last-incoming-channel', label: 'Last incoming message (Channel)', options: opts('Voice', 'Text', 'Webchat', 'Chat') },
]

// Healthcare chart card — uses the tune icon for the left action button
function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const SUMMARY_STATS = [
  { id: 'bookings',   value: '450',   label: 'Total bookings',               delta: '20%',   trend: 'down' as const },
  { id: 'confirmed',  value: '100',   label: 'Appointment confirmed',        delta: '36.6%', trend: 'up'   as const },
  { id: 'confirmRate',value: '23.7%', label: 'Appointment confirmation rate', delta: '20%',  trend: 'up'   as const },
]

// 0=Text, 1=Voice, 2=Webchat                        (channel)
// 3=Confirmed, 4=Declined & rescheduled, 5=Pending  (outcome)
// 6=<1hr, 7=1-4hrs, 8=4-24hrs, 9=>24hrs            (time to confirm)
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Text (56%)' }, { name: 'Voice (26%)' }, { name: 'Webchat (18%)' },
  { name: 'Confirmed (52.4%)' }, { name: 'Declined & rescheduled (21.8%)' }, { name: 'Pending (25.8%)' },
  { name: '<1hr (41.7%)' }, { name: '1-4hrs (31.3%)' }, { name: '4-24hrs (17.2%)' }, { name: '>24hrs (9.9%)' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  // channel → outcome
  { source: 0, target: 3, value: 30 }, { source: 0, target: 4, value: 13 }, { source: 0, target: 5, value: 14 },
  { source: 1, target: 3, value: 15 }, { source: 1, target: 4, value: 6  }, { source: 1, target: 5, value: 7  },
  { source: 2, target: 3, value: 8  }, { source: 2, target: 4, value: 3  }, { source: 2, target: 5, value: 5  },
  // outcome → time to confirm (only Confirmed connects — Declined & rescheduled and Pending do not)
  { source: 3, target: 6, value: 22 }, { source: 3, target: 7, value: 17 }, { source: 3, target: 8, value: 9  }, { source: 3, target: 9, value: 5  },
]
const FUNNEL_NODE_COLORS: Record<number, string> = {
  0: '#1976d2', 1: '#fbbf24', 2: '#9c27b0',
  3: '#4cae3d', 4: '#de1b0c', 5: '#f59e0b',
}

const CHANNEL_DONUT = [
  { name: 'Text',    value: 56.0, color: '#1976d2' },
  { name: 'Voice',   value: 26.0, color: '#fbbf24' },
  { name: 'Webchat', value: 18.0, color: '#9c27b0' },
]

const REMINDERS_DATA = [
  { month: 'Dec 2025', sent: 494, confirmed: 434 },
  { month: 'Jan 2026', sent: 494, confirmed: 434 },
  { month: 'Feb',      sent: 494, confirmed: 434 },
  { month: 'Mar',      sent: 494, confirmed: 434 },
  { month: 'Apr',      sent: 494, confirmed: 434 },
  { month: 'May',      sent: 494, confirmed: 434 },
]
const REMINDERS_SERIES = [
  { key: 'sent',      label: 'Sent',      color: '#1976d2' },
  { key: 'confirmed', label: 'Confirmed', color: '#4cae3d' },
]

interface LocationRow {
  location: string
  totalBookings: number
  noshowsPrevented: number
  cancelled: number
  confirmRate: string
  confirmDelta: string
  [key: string]: string | number
}
const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA', totalBookings: 100, noshowsPrevented: 60, cancelled: 40, confirmRate: '23.7%', confirmDelta: '+2%'  },
  { location: 'Dallas, TX',  totalBookings: 90,  noshowsPrevented: 23, cancelled: 4,  confirmRate: '23.7%', confirmDelta: '+2%'  },
  { location: 'Chicago, IL', totalBookings: 80,  noshowsPrevented: 18, cancelled: 22, confirmRate: '23.7%', confirmDelta: '-5%'  },
  { location: 'Miami, FL',   totalBookings: 70,  noshowsPrevented: 2,  cancelled: 4,  confirmRate: '23.7%', confirmDelta: '+2%'  },
  { location: 'Phoenix, AZ', totalBookings: 60,  noshowsPrevented: 9,  cancelled: 10, confirmRate: '23.7%', confirmDelta: '+2%'  },
  { location: 'Austin, TX',  totalBookings: 50,  noshowsPrevented: 11, cancelled: 12, confirmRate: '23.7%', confirmDelta: '-5%'  },
  { location: 'Denver, CO',  totalBookings: 40,  noshowsPrevented: 13, cancelled: 14, confirmRate: '23.7%', confirmDelta: '+2%'  },
  { location: 'Seattle, WA', totalBookings: 30,  noshowsPrevented: 15, cancelled: 16, confirmRate: '23.7%', confirmDelta: '+2%'  },
]
const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',         label: 'Location',                     width: 180, sortable: true },
  { key: 'totalBookings',    label: 'Total bookings',               width: 160, sortable: true },
  { key: 'noshowsPrevented', label: 'Appointment confirmed',        width: 200, sortable: true },
  {
    key: 'confirmRate', label: 'Appointment confirmation rate', width: 220, sortable: true,
    render: (_v, row) => {
      const delta = row.confirmDelta as string
      const isPos = delta.startsWith('+')
      return (
        <span className="flex items-center gap-sm">
          {row.confirmRate}
          <span className={`text-xs ${isPos ? 'text-chip-success-text' : 'text-chip-danger-text'}`}>{delta}</span>
        </span>
      )
    },
  },
]

export function HCNoShowsScreen({ isDental = false }: { isDental?: boolean }) {
  const [dateRange, setDateRange] = useState('Last 3 months')
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="No-shows prevented"
          subtitle="No-show prevention and appointment confirmation outcomes across your locations"
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

          <HCCard title="Appointment confirmation funnel" tooltip="Traces reminders from the channel they were sent on, through the confirmation outcome, to how long it took to confirm.">
            <SankeyChart
              nodes={FUNNEL_NODES}
              links={FUNNEL_LINKS}
              height={400}
              nodeColors={FUNNEL_NODE_COLORS}
              terminalNodes={[4, 5]}
              columnHeaders={['Reminders sent by channel', 'Outcome', 'Time to confirm the appointment']}
            />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Appointment confirmation by channel" tooltip="Shows the channel that sent the last reminder resulting in a confirmed appointment. Each conversation is counted once.">
              <ChartStatRow stats={[
                { value: '4.4K', label: 'Text'    },
                { value: '2.4K', label: 'Voice'   },
                { value: '1.4K', label: 'Webchat' },
              ]} />
              <DonutChart
                data={CHANNEL_DONUT}
                centerValue="6.8k"
                centerLabel="Total responses"
              />
            </HCCard>

            <HCCard title="Reminders sent vs confirmed" tooltip="Compares the total reminders sent to the number of appointments confirmed. Each appointment is counted once, regardless of how many reminders were sent.">
              <StackedBarChart
                data={REMINDERS_DATA}
                series={REMINDERS_SERIES}
                xKey="month"
                height={320}
                showBarLabels
              />
            </HCCard>
          </div>

          <HCCard title="Appointment confirmation by location" tooltip="Breaks down appointment confirmation outcomes by location, aggregated over the selected date range.">
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
