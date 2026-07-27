import { useState } from 'react'
import {
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  Heatmap,
  ReportHeader,
  SankeyChart,
  StackedBarChart,
  SummaryStats,
  TopNav,
  type Column,
  type SankeyLink,
  type SankeyNode,
} from '../components'

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 12 months', 'Custom']

// ── Summary KPIs ────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { id: 'responses',  value: '450',  label: 'Responses',          delta: '20%',   trend: 'down' as const },
  { id: 'bookings',   value: '7.9K', label: 'Total bookings',     delta: '36.6%', trend: 'up'   as const },
  { id: 'reschedule', value: '450',  label: 'Rescheduled',        delta: '5%',    trend: 'down' as const },
  { id: 'cancelled',  value: '25',   label: 'Cancelled',          delta: '20%',   trend: 'up'   as const },
  { id: 'verified',   value: '200',  label: 'Insurances verified', delta: '10%',   trend: 'down' as const },
]

// ── Appointments funnel (Sankey) ────────────────────────────────────────────
// Node indices: 0 Website | 1 Voice | 2 Text | 3 Email
//               4 Agent-driven | 5 Human-driven
//               6 Confirmed | 7 Booking | 8 Reschedule | 9 No-show | 10 Cancel
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Website' }, { name: 'Voice' }, { name: 'Text' }, { name: 'Email' },
  { name: 'Agent-driven' }, { name: 'Human-driven' },
  { name: 'Confirmed' }, { name: 'Booking' }, { name: 'Reschedule' },
  { name: 'No-show' }, { name: 'Cancel' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  { source: 0, target: 4, value: 20 }, { source: 0, target: 5, value: 8  },
  { source: 1, target: 4, value: 21 }, { source: 1, target: 5, value: 8  },
  { source: 2, target: 4, value: 18 }, { source: 2, target: 5, value: 4  },
  { source: 3, target: 4, value: 8  }, { source: 3, target: 5, value: 2  },
  { source: 4, target: 6, value: 42 }, { source: 4, target: 7, value: 7  },
  { source: 4, target: 8, value: 9  }, { source: 4, target: 9, value: 7  },
  { source: 4, target: 10, value: 2 },
  { source: 5, target: 6, value: 14 }, { source: 5, target: 7, value: 3  },
  { source: 5, target: 8, value: 2  }, { source: 5, target: 9, value: 2  },
  { source: 5, target: 10, value: 1 },
]

// ── Appointments over time ──────────────────────────────────────────────────
const OVERTIME_DATA = [
  { month: 'Dec 2023', completed: 254, rescheduled: 80,  noShow: 60,  cancelled: 60  },
  { month: 'Jan 2024', completed: 234, rescheduled: 90,  noShow: 50,  cancelled: 50  },
  { month: 'Feb',      completed: 412, rescheduled: 100, noShow: 70,  cancelled: 70  },
  { month: 'Mar',      completed: 399, rescheduled: 110, noShow: 80,  cancelled: 80  },
  { month: 'Apr',      completed: 198, rescheduled: 60,  noShow: 40,  cancelled: 40  },
  { month: 'May',      completed: 378, rescheduled: 95,  noShow: 65,  cancelled: 65  },
]
const OVERTIME_SERIES = [
  { key: 'completed',   label: 'Completed',   color: '#4cae3d' },
  { key: 'rescheduled', label: 'Rescheduled', color: '#f59e0b' },
  { key: 'noShow',      label: 'No-show',     color: '#f97316' },
  { key: 'cancelled',   label: 'Cancelled',   color: '#ef4444' },
]

// ── Appointment confirmation ──────────────────────────────────────────────────────
const NO_SHOW_DATA = [
  { month: 'Dec', prevented: 454 },
  { month: 'Jan', prevented: 146 },
  { month: 'Feb', prevented: 218 },
  { month: 'Mar', prevented: 178 },
  { month: 'Apr', prevented: 261 },
  { month: 'May', prevented: 591 },
]
const NO_SHOW_SERIES = [{ key: 'prevented', label: 'Prevented', color: '#1976d2' }]

// ── Insurances verified ─────────────────────────────────────────────────────
const INSURANCE_DATA = [
  { month: 'Dec', verified: 454 },
  { month: 'Jan', verified: 155 },
  { month: 'Feb', verified: 228 },
  { month: 'Mar', verified: 178 },
  { month: 'Apr', verified: 261 },
  { month: 'May', verified: 597 },
]
const INSURANCE_SERIES = [{ key: 'verified', label: 'Verified', color: '#1976d2' }]

// ── Appointments by location ────────────────────────────────────────────────
interface LocationRow {
  location: string
  totalBookings: number
  rescheduled: number
  cancelled: number
  insurancesVerified: number
  [key: string]: string | number
}
const LOCATION_DATA: LocationRow[] = [
  { location: 'Atlanta, GA',  totalBookings: 700, rescheduled: 90, cancelled: 40, insurancesVerified: 40 },
  { location: 'Dallas, TX',   totalBookings: 90,  rescheduled: 23, cancelled: 4,  insurancesVerified: 4  },
  { location: 'Chicago, IL',  totalBookings: 80,  rescheduled: 18, cancelled: 22, insurancesVerified: 22 },
  { location: 'Miami, FL',    totalBookings: 70,  rescheduled: 7,  cancelled: 4,  insurancesVerified: 4  },
  { location: 'Phoenix, AZ',  totalBookings: 60,  rescheduled: 9,  cancelled: 10, insurancesVerified: 10 },
  { location: 'Austin, TX',   totalBookings: 50,  rescheduled: 11, cancelled: 12, insurancesVerified: 12 },
  { location: 'Denver, CO',   totalBookings: 40,  rescheduled: 13, cancelled: 14, insurancesVerified: 14 },
  { location: 'Seattle, WA',  totalBookings: 30,  rescheduled: 15, cancelled: 16, insurancesVerified: 16 },
]
const LOCATION_COLUMNS: Column<LocationRow>[] = [
  { key: 'location',          label: 'Location',            width: 200, sortable: true },
  { key: 'totalBookings',     label: 'Total bookings',      width: 160, sortable: true },
  { key: 'rescheduled',       label: 'Rescheduled',         width: 160, sortable: true },
  { key: 'cancelled',         label: 'Cancelled',           width: 140, sortable: true },
  { key: 'insurancesVerified',label: 'Insurances verified', width: 180, sortable: true },
]

// ── Peak booking heatmap ────────────────────────────────────────────────────
const HEATMAP_ROWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HEATMAP_COLS = [
  '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
]
const HEATMAP_VALUES = [
  [1,0,0,0,0,0,1,2,3,4,4,3,4,5,5,4,4,3,3,4,4,3,2,1], // Sun
  [0,0,0,0,0,1,2,4,6,8,9,8,7,7,8,8,7,6,5,4,3,2,1,0], // Mon
  [0,0,0,0,0,1,2,5,7,9,10,9,8,7,8,9,8,6,5,4,3,2,1,0], // Tue
  [0,0,0,0,0,1,2,4,7,9,9,8,7,6,7,8,7,6,5,3,2,2,1,0], // Wed
  [0,0,0,0,0,1,2,5,7,8,9,8,8,7,8,8,7,6,5,4,3,2,1,0], // Thu
  [0,0,0,0,0,1,2,4,6,7,8,7,7,6,7,7,6,5,5,5,4,3,2,1], // Fri
  [1,0,0,0,0,0,1,2,3,4,5,5,6,6,5,5,4,4,3,4,4,3,2,1], // Sat
]

export function AppointmentOverviewScreen() {
  const [dateRange, setDateRange] = useState('Last 3 months')

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Appointments overview"
          subtitle="All human and agent-driven appointment outcomes across all channels and locations."
          rightSlot={
            <DateRangeSelector
              value={dateRange}
              options={DATE_RANGE_OPTIONS}
              onChange={setDateRange}
            />
          }
        />

        <div className="flex flex-col gap-lg p-2xl">

          {/* Summary KPIs */}
          <SummaryStats stats={SUMMARY_STATS} />

          {/* Appointments funnel */}
          <ChartCard title="Appointments funnel" tooltip="Traces conversations from the channel they came in on, through whether an AI or human agent handled them, to the final booking outcome.">
            <SankeyChart nodes={FUNNEL_NODES} links={FUNNEL_LINKS} height={380} />
          </ChartCard>

          {/* Appointments over time */}
          <ChartCard title="Appointments over time" tooltip="Monthly breakdown of booked, rescheduled, and cancelled appointments.">
            <StackedBarChart
              data={OVERTIME_DATA}
              series={OVERTIME_SERIES}
              xKey="month"
              height={340}
              showBarLabels
            />
          </ChartCard>

          {/* Appointment confirmation + Insurances verified */}
          <div className="grid grid-cols-2 gap-lg">
            <ChartCard title="Appointment confirmation" tooltip="Monthly view of confirmed appointments and the resulting no-show rate.">
              <ChartStatRow stats={[
                { value: '275',  label: 'Appointment confirmation' },
                { value: '9.7%', label: 'No-show rate'       },
              ]} />
              <StackedBarChart
                data={NO_SHOW_DATA}
                series={NO_SHOW_SERIES}
                xKey="month"
                height={220}
                showBarLabels
              />
            </ChartCard>

            <ChartCard title="Insurances verified" tooltip="Monthly view of unique conversations where the patient's insurance was successfully verified by the agent.">
              <ChartStatRow stats={[
                { value: '1.2K',   label: 'Total verified'    },
                { value: '94.2%',  label: 'Verification rate' },
              ]} />
              <StackedBarChart
                data={INSURANCE_DATA}
                series={INSURANCE_SERIES}
                xKey="month"
                height={220}
                showBarLabels
              />
            </ChartCard>
          </div>

          {/* Appointments by location */}
          <ChartCard title="Appointments by location" tooltip="Breaks down appointment outcomes by location, aggregated over the selected date range.">
            <DataTable columns={LOCATION_COLUMNS} data={LOCATION_DATA} />
          </ChartCard>

          {/* Peak booking times and days */}
          <ChartCard title="Peak booking times and days" tooltip="Shows booking request volume by day of week and hour, to highlight peak demand periods.">
            <Heatmap
              rowLabels={HEATMAP_ROWS}
              colLabels={HEATMAP_COLS}
              values={HEATMAP_VALUES}
            />
          </ChartCard>

        </div>
      </div>
    </div>
  )
}
