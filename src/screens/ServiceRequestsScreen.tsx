import { useMemo, useState } from 'react'
import {
  // Chip,
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  FormDrawer,
  Icon,
  // MetricTiles,
  Tabs,
  TopNav,
  // type ChipVariant,
  type Column,
  type ColumnOption,
  type FilterField,
  type FormField,
  type RecordDetailScreenProps,
  // type Metric,
} from '../components'

export interface ServiceRequest {
  customer: string
  vehicle: string
  serviceType: string
  advisor: string
  status: string
  dateTime: string
  priority: string
  insuranceStatus: string
  opCode: string
  phone: string
  email: string
  [key: string]: string
}

// const METRICS: Metric[] = [
//   { id: 'new',            value: 9,  label: 'New'            },
//   { id: 'scheduled',      value: 7,  label: 'Scheduled'      },
//   { id: 'in-service',     value: 5,  label: 'In service'     },
//   { id: 'awaiting-parts', value: 3,  label: 'Awaiting parts' },
//   { id: 'completed',      value: 11, label: 'Completed'      },
// ]

const TABS = [
  { id: 'confirmed',     label: 'Confirmed',     count: 12 },
  { id: 'cancellations', label: 'Cancellations', count: 5  },
  { id: 'no-shows',      label: 'No-shows',      count: 3  },
]

const TAB_STATUS_MAP: Record<string, string> = {
  confirmed:     'Confirmed',
  cancellations: 'Cancellations',
  'no-shows':    'No-shows',
}

// const STATUS_VARIANT: Record<string, ChipVariant> = {
//   New:              'neutral',
//   Scheduled:        'warning',
//   'In service':     'success',
//   'Awaiting parts': 'danger',
//   Completed:        'success',
// }

const REQUESTS: ServiceRequest[] = [
  // Confirmed — 12 (sorted Jun 11 → future)
  { customer: 'John Carter',     vehicle: 'Toyota RAV4 2021',        serviceType: 'Oil change',           advisor: 'Smith',     status: 'Confirmed',     dateTime: 'Jun 11, 2026 08:00 AM', priority: 'Medium', insuranceStatus: 'Verified',    opCode: 'OILCHG',  phone: '(415) 555-0132', email: 'j.carter@email.com'    },
  { customer: 'Brandon Lee',     vehicle: 'Ford Escape 2021',        serviceType: 'Engine diagnostics',   advisor: 'Edwards',   status: 'Confirmed',     dateTime: 'Jun 11, 2026 08:15 AM', priority: 'High',   insuranceStatus: 'Verified',    opCode: 'ENGDIAG', phone: '(408) 555-0111', email: 'b.lee@email.com'       },
  { customer: 'Diana Park',      vehicle: 'Subaru Forester 2022',    serviceType: 'Battery replacement',  advisor: 'Harris',    status: 'Confirmed',     dateTime: 'Jun 11, 2026 09:00 AM', priority: 'Low',    insuranceStatus: 'Verified',    opCode: 'BATTREP', phone: '(415) 555-0188', email: 'd.park@email.com'      },
  { customer: 'Emily Davis',     vehicle: 'Chevrolet Equinox 2022',  serviceType: 'Tire rotation',        advisor: 'Brown',     status: 'Confirmed',     dateTime: 'Jun 11, 2026 09:30 AM', priority: 'Medium', insuranceStatus: 'In Progress', opCode: 'TIRRTN',  phone: '(650) 555-0144', email: 'e.davis@email.com'     },
  { customer: 'Marcus Reid',     vehicle: 'Toyota Camry 2020',       serviceType: 'AC repair',            advisor: 'Martinez',  status: 'Confirmed',     dateTime: 'Jun 11, 2026 10:00 AM', priority: 'Medium', insuranceStatus: 'In Progress', opCode: 'ACREPR',  phone: '(408) 555-0155', email: 'm.reid@email.com'      },
  { customer: 'Jessica Taylor',  vehicle: 'Honda Civic 2021',        serviceType: 'Diagnostics',          advisor: 'Garcia',    status: 'Confirmed',     dateTime: 'Jun 11, 2026 10:30 AM', priority: 'Low',    insuranceStatus: 'Unverified',  opCode: 'DIAG',    phone: '(415) 555-0155', email: 'j.taylor@email.com'    },
  { customer: 'Sarah Anderson',  vehicle: 'Nissan Altima 2019',      serviceType: 'Recall service',       advisor: 'Miller',    status: 'Confirmed',     dateTime: 'Jun 11, 2026 11:30 AM', priority: 'High',   insuranceStatus: 'Verified',    opCode: 'RCLLSRV', phone: '(650) 555-0177', email: 's.anderson@email.com'  },
  { customer: 'Linda White',     vehicle: 'Honda Pilot 2020',        serviceType: 'Transmission service', advisor: 'Jones',     status: 'Confirmed',     dateTime: 'Jun 12, 2026 11:00 AM', priority: 'High',   insuranceStatus: 'Verified',    opCode: 'TRNSMSN', phone: '(415) 555-0199', email: 'l.white@email.com'     },
  { customer: 'Ryan Chen',       vehicle: 'Chevrolet Malibu 2019',   serviceType: 'Inspection prep',      advisor: 'Thompson',  status: 'Confirmed',     dateTime: 'Jun 12, 2026 12:00 PM', priority: 'Low',    insuranceStatus: 'Unverified',  opCode: 'INSPREP', phone: '(408) 555-0177', email: 'r.chen@email.com'      },
  { customer: 'Patricia Clark',  vehicle: 'Jeep Grand Cherokee 2021',serviceType: 'Brake repair',         advisor: 'Baker',     status: 'Confirmed',     dateTime: 'Jun 12, 2026 01:00 PM', priority: 'High',   insuranceStatus: 'Verified',    opCode: 'BRKREP',  phone: '(415) 555-0199', email: 'p.clark@email.com'     },
  { customer: 'Alex Turner',     vehicle: 'Ford F-150 2022',         serviceType: 'Oil change',           advisor: 'Smith',     status: 'Confirmed',     dateTime: 'Jun 12, 2026 01:30 PM', priority: 'Low',    insuranceStatus: 'Verified',    opCode: 'OILCHG',  phone: '(415) 555-0144', email: 'a.turner@email.com'    },
  { customer: 'Olivia Scott',    vehicle: 'Nissan Rogue 2020',       serviceType: 'Wheel alignment',      advisor: 'Williams',  status: 'Confirmed',     dateTime: 'Jun 13, 2026 02:30 PM', priority: 'Medium', insuranceStatus: 'In Progress', opCode: 'WHLALGN', phone: '(650) 555-0133', email: 'o.scott@email.com'     },
  // Cancellations — 5
  { customer: 'Grace Kim',       vehicle: 'Subaru Outback 2021',     serviceType: 'AC repair',            advisor: 'Martinez',  status: 'Cancellations', dateTime: 'Jun 11, 2026 10:15 AM', priority: 'Medium', insuranceStatus: 'In Progress', opCode: 'ACREPR',  phone: '(415) 555-0199', email: 'g.kim@email.com'       },
  { customer: 'Kevin Moore',     vehicle: 'Nissan Sentra 2019',      serviceType: 'Battery replacement',  advisor: 'Harris',    status: 'Cancellations', dateTime: 'Jun 12, 2026 01:00 PM', priority: 'Low',    insuranceStatus: 'In Progress', opCode: 'BATTREP', phone: '(408) 555-0188', email: 'k.moore@email.com'     },
  { customer: 'Amy Chen',        vehicle: 'Honda CR-V 2019',         serviceType: 'Transmission service', advisor: 'Baker',     status: 'Cancellations', dateTime: 'Jun 12, 2026 01:30 PM', priority: 'Low',    insuranceStatus: 'Unverified',  opCode: 'TRNSMSN', phone: '(415) 555-0190', email: 'a.chen@email.com'      },
  { customer: 'Tom Wilson',      vehicle: 'Ford Mustang 2021',       serviceType: 'Diagnostics',          advisor: 'Carter',    status: 'Cancellations', dateTime: 'Jun 12, 2026 02:00 PM', priority: 'Medium', insuranceStatus: 'Verified',    opCode: 'DIAG',    phone: '(669) 555-0101', email: 't.wilson@email.com'    },
  { customer: 'Nathan Lee',      vehicle: 'Toyota RAV4 2020',        serviceType: 'Tire rotation',        advisor: 'Adams',     status: 'Cancellations', dateTime: 'Jun 13, 2026 12:00 PM', priority: 'High',   insuranceStatus: 'Verified',    opCode: 'TIRRTN',  phone: '(408) 555-0117', email: 'n.lee@email.com'       },
  // No-shows — 3
  { customer: 'Michael Wilson',  vehicle: 'Chevrolet Malibu 2020',   serviceType: 'Brake repair',         advisor: 'Edwards',   status: 'No-shows',      dateTime: 'Jun 11, 2026 08:45 AM', priority: 'Low',    insuranceStatus: 'Verified',    opCode: 'BRKREP',  phone: '(408) 555-0166', email: 'm.wilson@email.com'    },
  { customer: 'James Rodriguez', vehicle: 'Toyota Corolla 2022',     serviceType: 'Engine diagnostics',   advisor: 'Wilson',    status: 'No-shows',      dateTime: 'Jun 12, 2026 10:45 AM', priority: 'High',   insuranceStatus: 'Unverified',  opCode: 'ENGDIAG', phone: '(408) 555-0188', email: 'j.rodriguez@email.com' },
  { customer: 'Nathan Lee',      vehicle: 'Ford Explorer 2020',      serviceType: 'Recall service',       advisor: 'Rodriguez', status: 'No-shows',      dateTime: 'Jun 13, 2026 11:00 AM', priority: 'Medium', insuranceStatus: 'Verified',    opCode: 'RCLLSRV', phone: '(669) 555-0123', email: 'n.lee2@email.com'      },
]

interface ColumnDef extends Column<ServiceRequest> {
  locked?: boolean
}

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'customer',        label: 'Customer',         width: 220, sortable: true, locked: true },
  { key: 'serviceType',     label: 'Appointment type', width: 160, sortable: true },
  { key: 'opCode',          label: 'Operation code',   width: 140, sortable: true },
  { key: 'vehicle',         label: 'Vehicle',          width: 190, sortable: true },
  { key: 'advisor',         label: 'Staff',            width: 160, sortable: true },
  { key: 'insuranceStatus', label: 'Insurance status', width: 160, sortable: true },
  { key: 'dateTime',        label: 'Appointment time', width: 200, sortable: true },
  { key: 'priority',        label: 'Priority',         width: 110, sortable: true },
  { key: 'phone',           label: 'Phone',            width: 160, sortable: true },
  { key: 'email',           label: 'Email',            width: 210, sortable: true },
]

const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
const DEFAULT_VISIBLE = ['customer', 'vehicle', 'serviceType', 'opCode', 'advisor', 'insuranceStatus', 'dateTime']
const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

export interface ServiceRequestDetailArgs {
  row: ServiceRequest
  fromTabLabel?: string
}

export function buildServiceRequestDetailProps({ row }: ServiceRequestDetailArgs): RecordDetailScreenProps {
  return {
    name: row.customer,
    accordions: [
      {
        title: 'Service details',
        defaultOpen: true,
        fields: [
          { label: 'Vehicle', value: row.vehicle },
          { label: 'Service type', value: row.serviceType },
          { label: 'Operation code', value: row.opCode },
          { label: 'Advisor', value: row.advisor },
          { label: 'Insurance status', value: row.insuranceStatus },
          { label: 'Priority', value: row.priority },
          { label: 'Date & time', value: row.dateTime },
        ],
      },
      {
        title: 'Contact information',
        fields: [
          { label: 'Phone', value: row.phone },
          { label: 'Email', value: row.email },
        ],
      },
    ],
    metrics: [
      { value: row.dateTime, label: 'Date & time' },
      { value: row.vehicle, label: 'Vehicle' },
      { value: row.priority, label: 'Priority' },
      { value: row.status, label: 'Status' },
    ],
    activities: [
      {
        id: '1',
        type: 'booked',
        title: `${row.customer} scheduled '${row.serviceType}'`,
        subtitle: `Vehicle: ${row.vehicle}`,
        date: row.dateTime,
      },
    ],
  }
}

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const SERVICE_TYPES = ['Oil change', 'Brake repair', 'Tire rotation', 'Diagnostics', 'Recall service', 'Battery replacement', 'AC repair', 'Transmission service']
const ADVISORS = ['Auto-assign', 'Smith', 'Johnson', 'Williams', 'Brown', 'Garcia']
const DATES = ['Today', 'Tomorrow', 'Jun 06, 2026', 'Jun 07, 2026', 'Jun 09, 2026']
const TIMES = ['08:30 AM', '09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM']

// Header CTA — create a brand new request.
const CREATE_FIELDS: FormField[] = [
  { key: 'customer', label: 'Customer name', type: 'text', placeholder: 'Enter input' },
  { key: 'phone', label: 'Phone number', type: 'text', placeholder: 'Enter input' },
  { key: 'vehicle', label: 'Vehicle', type: 'text', placeholder: 'e.g. Toyota RAV4 2021' },
  { key: 'serviceType', label: 'Service type', type: 'select', placeholder: 'Select', options: SERVICE_TYPES },
  { key: 'priority', label: 'Priority', type: 'select', placeholder: 'Select', options: ['High', 'Medium', 'Low'] },
  { key: 'advisor', label: 'Service advisor', type: 'select', placeholder: 'Select', options: ADVISORS },
  { key: 'preferredDate', label: 'Preferred date', type: 'select', placeholder: 'Pick a date', options: DATES },
]

// Row CTA — schedule the service for an existing request.
const SCHEDULE_FIELDS: FormField[] = [
  { key: 'advisor', label: 'Service advisor', type: 'select', placeholder: 'Select advisor', options: ADVISORS },
  { key: 'serviceType', label: 'Service type', type: 'select', placeholder: 'Select service type', options: SERVICE_TYPES },
  { key: 'bay', label: 'Service bay', type: 'select', placeholder: 'Select bay', options: ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'] },
  { key: 'date', label: 'Date', type: 'select', placeholder: 'Pick a date', options: DATES },
  { key: 'time', label: 'Time', type: 'select', placeholder: 'Pick a time', options: TIMES },
]

const FILTER_FIELDS: FilterField[] = [
  { id: 'groups', label: 'Groups', options: opts('All dealerships', 'Northeast', 'Southeast', 'Midwest', 'West') },
  { id: 'location', label: 'Location', options: opts('Mountain View', 'Palo Alto', 'San Jose', 'Sunnyvale') },
  { id: 'service-type', label: 'Service type', options: opts(...SERVICE_TYPES) },
  { id: 'status', label: 'Status', options: opts('New', 'Scheduled', 'In service', 'Awaiting parts', 'Completed') },
  { id: 'advisor', label: 'Service advisor', options: opts('Smith', 'Johnson', 'Williams', 'Brown', 'Garcia') },
  { id: 'priority', label: 'Priority', options: opts('High', 'Medium', 'Low') },
  { id: 'vehicle-make', label: 'Vehicle make', options: opts('Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Jeep', 'Subaru') },
]

export function ServiceRequestsScreen({ onViewDetail }: { onViewDetail?: (args: ServiceRequestDetailArgs) => void } = {}) {
  const [activeTab, setActiveTab] = useState('confirmed')
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [scheduleFor, setScheduleFor] = useState<string | null>(null)

  const columns = useMemo<Column<ServiceRequest>[]>(
    () =>
      order
        .filter((k) => visible.includes(k))
        .map((k) => DEF_BY_KEY.get(k))
        .filter((c): c is ColumnDef => Boolean(c)),
    [order, visible],
  )

  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  const filteredData = useMemo(() => {
    const byTab = REQUESTS.filter((r) => r.status === TAB_STATUS_MAP[activeTab])
    const q = searchQuery.trim().toLowerCase()
    if (!q) return byTab
    return byTab.filter(
      (r) =>
        r.customer.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q) ||
        r.advisor.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    )
  }, [activeTab, searchQuery])

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <h1 className="text-h3 text-text-primary">Service requests</h1>
            <div className="flex items-center gap-sm">
              <div
                className={`flex h-9 shrink-0 items-center gap-sm rounded-sm border border-border-selected bg-surface transition-all ${
                  searchOpen ? 'w-56 px-md' : 'w-9 justify-center'
                }`}
              >
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    if (searchOpen) return
                    setSearchOpen(true)
                  }}
                  className="flex shrink-0 items-center justify-center text-text-icon"
                >
                  <Icon name="search" size={20} />
                </button>
                {searchOpen && (
                  <>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                      }}
                      className="flex shrink-0 items-center justify-center text-text-icon hover:text-text-primary"
                    >
                      <Icon name="close" size={18} />
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex h-9 items-center rounded-sm bg-primary px-lg text-body font-medium text-white transition-colors hover:bg-primary-hover"
              >
                New request
              </button>
              <button
                type="button"
                aria-label="Customize columns"
                onClick={() => setCustomizeOpen(true)}
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="view_column" size={20} />
              </button>
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          </div>

          {/* <div className="px-2xl pt-lg">
            <MetricTiles metrics={METRICS} />
          </div> */}

          <div className="px-2xl">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="flex flex-1 flex-col px-lg py-lg">
            <DataTable
              columns={columns}
              data={filteredData}
              rowAction={{
                icon: 'build',
                label: 'Schedule service',
                onClick: (row) => setScheduleFor(row.customer),
              }}
              rowMenuItems={[
                { label: 'Quick send', onClick: () => {} },
                { label: 'Quick view', onClick: () => {} },
                { label: 'View activity', onClick: () => {} },
                { label: 'View details', onClick: (row) => onViewDetail?.({ row, fromTabLabel: TABS.find((t) => t.id === activeTab)?.label }) },
              ]}
            />
          </div>
        </div>

        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>

      <CustomizeColumnsDrawer
        open={customizeOpen}
        options={columnOptions}
        visibleKeys={visible}
        onClose={() => setCustomizeOpen(false)}
        onSave={(orderedKeys, visibleKeys) => {
          setOrder(orderedKeys)
          setVisible(visibleKeys)
        }}
        onRestoreDefault={() => {
          setOrder(DEFAULT_ORDER)
          setVisible(DEFAULT_VISIBLE)
        }}
      />

      {/* Header CTA drawer */}
      <FormDrawer
        open={createOpen}
        title="Create service request"
        fields={CREATE_FIELDS}
        submitLabel="Create"
        requiredKeys={['customer', 'phone', 'serviceType']}
        onClose={() => setCreateOpen(false)}
        onSubmit={() => setCreateOpen(false)}
      />

      {/* Row CTA drawer */}
      <FormDrawer
        open={scheduleFor !== null}
        title="Schedule service"
        fields={SCHEDULE_FIELDS}
        submitLabel="Schedule"
        requiredKeys={['serviceType', 'date', 'time']}
        initialValues={{ advisor: 'Auto-assign' }}
        onClose={() => setScheduleFor(null)}
        onSubmit={() => setScheduleFor(null)}
      />
    </div>
  )
}
