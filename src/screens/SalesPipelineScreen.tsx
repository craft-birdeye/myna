import { useMemo, useState } from 'react'
import {
  // Chip,
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  FormDrawer,
  Icon,
  // MetricTiles,
  SetupAppointmentDrawer,
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

export interface Lead {
  name: string
  channel: string
  apptType: string
  lookingFor: string
  status: string
  dateTime: string
  opCode: string
  staff: string
  phone: string
  email: string
  [key: string]: string
}

// const METRICS: Metric[] = [
//   { id: 'prospects',   value: 13, label: 'Prospects'   },
//   { id: 'test-drive',  value: 6,  label: 'Test drive'  },
//   { id: 'in-process',  value: 4,  label: 'In process'  },
//   { id: 'won',         value: 4,  label: 'Won'         },
//   { id: 'dropped-off', value: 8,  label: 'Dropped off' },
// ]

const TABS = [
  { id: 'confirmed',     label: 'Confirmed',     count: 8 },
  { id: 'cancellations', label: 'Cancellations', count: 5 },
  { id: 'no-shows',      label: 'No-shows',      count: 4 },
]

const TAB_STATUS_MAP: Record<string, string> = {
  confirmed:     'Confirmed',
  cancellations: 'Cancellations',
  'no-shows':    'No-shows',
}

// const STATUS_VARIANT: Record<string, ChipVariant> = {
//   'Test drive pending':   'success',
//   'Test drive completed': 'success',
//   'Test drive':           'success',
//   Prospect:               'warning',
//   'Dropped off':          'neutral',
//   Won:                    'success',
// }

const CHANNEL_ICON: Record<string, string> = { sms: 'sms', call: 'call', mail: 'mail' }

export interface LeadDetailArgs {
  row: Lead
  fromTabLabel?: string
}

export function buildLeadDetailProps({ row }: LeadDetailArgs): RecordDetailScreenProps {
  return {
    name: row.name,
    accordions: [
      {
        title: 'Prospect details',
        defaultOpen: true,
        fields: [
          { label: 'Outreach channel', value: row.channel },
          { label: 'Appointment type', value: row.apptType },
          { label: 'Looking for', value: row.lookingFor },
          { label: 'Operation code', value: row.opCode },
          { label: 'Staff', value: row.staff },
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
      { value: row.lookingFor, label: 'Looking for' },
      { value: row.staff, label: 'Staff' },
      { value: row.status, label: 'Status' },
    ],
    activities: [
      {
        id: '1',
        type: 'booked',
        title: `${row.name} booked an appointment for '${row.apptType}'`,
        subtitle: `Looking for ${row.lookingFor}`,
        date: row.dateTime,
      },
    ],
  }
}

const LEADS: Lead[] = [
  // Confirmed — 8 (sorted Jun 11 → future)
  { name: 'Michael Smith',   channel: 'sms',  apptType: 'Sale - Test drive', lookingFor: 'Toyota RAV4',       status: 'Confirmed',     dateTime: 'Jun 11, 2026 08:00 AM', opCode: 'TSTDRVE', staff: 'Carter',   phone: '(415) 555-0132', email: 'm.smith@email.com'     },
  { name: 'Alex Turner',     channel: 'call', apptType: 'Sale - Prospect',   lookingFor: 'Ford F-Series',     status: 'Confirmed',     dateTime: 'Jun 11, 2026 08:15 AM', opCode: 'SALE',    staff: 'Johnson',  phone: '(415) 555-0144', email: 'a.turner@email.com'    },
  { name: 'David Brown',     channel: 'sms',  apptType: 'Sale - Prospect',   lookingFor: 'Honda CR-V',        status: 'Confirmed',     dateTime: 'Jun 11, 2026 09:00 AM', opCode: 'SALE',    staff: 'Carter',   phone: '(408) 555-0117', email: 'd.brown@email.com'     },
  { name: 'Emily Davis',     channel: 'mail', apptType: 'Sale - Parts',      lookingFor: 'Toyota RAV4',       status: 'Confirmed',     dateTime: 'Jun 11, 2026 09:30 AM', opCode: 'PRTSALE', staff: 'Thompson', phone: '(650) 555-0144', email: 'e.davis@email.com'     },
  { name: 'Ryan Chen',       channel: 'sms',  apptType: 'Sale - Parts',      lookingFor: 'Chevrolet Equinox', status: 'Confirmed',     dateTime: 'Jun 11, 2026 09:45 AM', opCode: 'PRTSALE', staff: 'Johnson',  phone: '(408) 555-0177', email: 'r.chen@email.com'      },
  { name: 'Diana Park',      channel: 'call', apptType: 'Sale - Test drive', lookingFor: 'Honda CR-V',        status: 'Confirmed',     dateTime: 'Jun 11, 2026 10:00 AM', opCode: 'TSTDRVE', staff: 'Williams', phone: '(415) 555-0188', email: 'd.park@email.com'      },
  { name: 'Linda White',     channel: 'mail', apptType: 'Sale - Test drive', lookingFor: 'Honda CR-V',        status: 'Confirmed',     dateTime: 'Jun 12, 2026 10:30 AM', opCode: 'TSTDRVE', staff: 'Carter',   phone: '(650) 555-0177', email: 'l.white@email.com'     },
  { name: 'Patricia Clark',  channel: 'sms',  apptType: 'Sale - Prospect',   lookingFor: 'Ford F-Series',     status: 'Confirmed',     dateTime: 'Jun 12, 2026 11:15 AM', opCode: 'SALE',    staff: 'Johnson',  phone: '(415) 555-0199', email: 'p.clark@email.com'     },
  // Cancellations — 5
  { name: 'Olivia Scott',    channel: 'mail', apptType: 'Sale - Prospect',   lookingFor: 'Toyota RAV4',       status: 'Cancellations', dateTime: 'Jun 11, 2026 09:15 AM', opCode: 'SALE',    staff: 'Adams',    phone: '(650) 555-0133', email: 'o.scott@email.com'     },
  { name: 'James Rodriguez', channel: 'call', apptType: 'Sale - Parts',      lookingFor: 'Chevrolet Equinox', status: 'Cancellations', dateTime: 'Jun 11, 2026 10:15 AM', opCode: 'PRTSALE', staff: 'Adams',    phone: '(669) 555-0123', email: 'j.rodriguez@email.com' },
  { name: 'Brandon Lee',     channel: 'sms',  apptType: 'Sale - Parts',      lookingFor: 'Toyota RAV4',       status: 'Cancellations', dateTime: 'Jun 12, 2026 11:30 AM', opCode: 'PRTSALE', staff: 'Adams',    phone: '(408) 555-0111', email: 'b.lee@email.com'       },
  { name: 'Kevin Moore',     channel: 'mail', apptType: 'Sale - Test drive', lookingFor: 'Toyota RAV4',       status: 'Cancellations', dateTime: 'Jun 12, 2026 12:00 PM', opCode: 'TSTDRVE', staff: 'Carter',   phone: '(408) 555-0117', email: 'k.moore@email.com'     },
  { name: 'Chris Evans',     channel: 'call', apptType: 'Sale - Prospect',   lookingFor: 'Honda Civic',       status: 'Cancellations', dateTime: 'Jun 13, 2026 02:00 PM', opCode: 'SALE',    staff: 'Williams', phone: '(669) 555-0101', email: 'c.evans@email.com'     },
  // No-shows — 4
  { name: 'Marcus Reid',     channel: 'sms',  apptType: 'Sale - Test drive', lookingFor: 'Honda CR-V',        status: 'No-shows',      dateTime: 'Jun 11, 2026 08:45 AM', opCode: 'TSTDRVE', staff: 'Williams', phone: '(408) 555-0155', email: 'm.reid@email.com'      },
  { name: 'Amy Chen',        channel: 'mail', apptType: 'Sale - Parts',      lookingFor: 'Honda CR-V',        status: 'No-shows',      dateTime: 'Jun 11, 2026 10:45 AM', opCode: 'PRTSALE', staff: 'Thompson', phone: '(415) 555-0190', email: 'a.chen@email.com'      },
  { name: 'Tom Wilson',      channel: 'call', apptType: 'Sale - Test drive', lookingFor: 'Chevrolet Equinox', status: 'No-shows',      dateTime: 'Jun 12, 2026 11:00 AM', opCode: 'TSTDRVE', staff: 'Williams', phone: '(669) 555-0123', email: 't.wilson@email.com'    },
  { name: 'Samantha Fox',    channel: 'call', apptType: 'Sale - Prospect',   lookingFor: 'Ford F-Series',     status: 'No-shows',      dateTime: 'Jun 12, 2026 12:30 PM', opCode: 'SALE',    staff: 'Thompson', phone: '(415) 555-0166', email: 's.fox@email.com'       },
]

interface ColumnDef extends Column<Lead> {
  locked?: boolean
}

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'name',       label: 'Name',             width: 220, sortable: true, locked: true },
  { key: 'apptType',   label: 'Appointment type', width: 160, sortable: true },
  { key: 'opCode',     label: 'Operation code',   width: 150, sortable: true },
  { key: 'staff',      label: 'Staff',            width: 130, sortable: true },
  { key: 'lookingFor', label: 'Looking for',      width: 200, sortable: true },
  {
    key: 'channel',
    label: 'Outreach channel',
    width: 150,
    sortable: true,
    render: (value) => (
      <Icon name={CHANNEL_ICON[String(value)] ?? 'sms'} size={20} className="text-text-icon" />
    ),
  },
  { key: 'dateTime',   label: 'Appointment time', width: 200, sortable: true },
  { key: 'phone',      label: 'Phone',            width: 160, sortable: true },
  { key: 'email',      label: 'Email',            width: 210, sortable: true },
]

const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
const DEFAULT_VISIBLE = ['name', 'lookingFor', 'channel', 'apptType', 'opCode', 'staff', 'dateTime']
const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const ADD_PROSPECT_FIELDS: FormField[] = [
  { key: 'name', label: 'Prospect name', type: 'text', placeholder: 'Enter input' },
  { key: 'phone', label: 'Phone number', type: 'text', placeholder: 'Enter input' },
  { key: 'apptType', label: 'Appointment type', type: 'select', placeholder: 'Select', options: ['Test drive', 'Service', 'Sales consultation', 'Trade-in appraisal'] },
  { key: 'provider', label: 'Provider', type: 'select', placeholder: 'Select', options: ['Auto-assign', 'Smith', 'Johnson', 'Williams', 'Brown'] },
  { key: 'location', label: 'Location', type: 'select', placeholder: 'Select', options: ['Mountain View', 'Palo Alto', 'San Jose', 'Sunnyvale'] },
  { key: 'slot', label: 'Slot preference', type: 'select', placeholder: 'Select', options: ['Morning', 'Afternoon', 'Evening', 'Any'] },
  { key: 'priority', label: 'Priority', type: 'select', placeholder: 'Select', options: ['High', 'Medium', 'Low'] },
]

const FILTER_FIELDS: FilterField[] = [
  { id: 'groups', label: 'Groups', options: opts('All dealerships', 'Northeast', 'Southeast', 'Midwest', 'West') },
  { id: 'location', label: 'Location', options: opts('Mountain View', 'Palo Alto', 'San Jose', 'Sunnyvale') },
  { id: 'channel', label: 'Outreach channel', options: opts('Chat', 'Call', 'Text') },
  { id: 'appt-type', label: 'Appointment type', options: opts('Service', 'Sale', 'Sale - First visit', 'Sale - Test drive', 'Sale - Trade-in', 'Sale - Parts') },
  { id: 'status', label: 'Status', options: opts('Prospect', 'Test drive pending', 'Test drive completed', 'Dropped off', 'Won') },
  { id: 'looking-for', label: 'Looking for', options: opts('Toyota RAV4', 'Ford F-Series', 'Honda CR-V', 'Chevrolet Equinox') },
]

export function SalesPipelineScreen({ onViewDetail }: { onViewDetail?: (args: LeadDetailArgs) => void } = {}) {
  const [activeTab, setActiveTab] = useState('confirmed')
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [appointmentFor, setAppointmentFor] = useState<string | null>(null)
  const [addProspectOpen, setAddProspectOpen] = useState(false)

  const columns = useMemo<Column<Lead>[]>(
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
    const byTab = LEADS.filter((l) => l.status === TAB_STATUS_MAP[activeTab])
    const q = searchQuery.trim().toLowerCase()
    if (!q) return byTab
    return byTab.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.lookingFor.toLowerCase().includes(q) ||
        l.staff.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q),
    )
  }, [activeTab, searchQuery])

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <h1 className="text-h3 text-text-primary">Sales pipeline</h1>
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
                onClick={() => setAddProspectOpen(true)}
                className="flex h-9 items-center rounded-sm bg-primary px-lg text-body font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Add prospect
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
                icon: 'calendar_add_on',
                label: 'Setup appointment',
                onClick: (row) => setAppointmentFor(row.name),
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

      <SetupAppointmentDrawer
        open={appointmentFor !== null}
        subject={appointmentFor ?? undefined}
        onClose={() => setAppointmentFor(null)}
        onOfferSlot={() => setAppointmentFor(null)}
      />

      <FormDrawer
        open={addProspectOpen}
        title="Add prospects"
        fields={ADD_PROSPECT_FIELDS}
        submitLabel="Add"
        requiredKeys={['name', 'phone']}
        onClose={() => setAddProspectOpen(false)}
        onSubmit={() => setAddProspectOpen(false)}
      />
    </div>
  )
}
