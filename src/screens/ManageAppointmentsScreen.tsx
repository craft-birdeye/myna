import { useMemo, useState } from 'react'
import {
  ALL_STATUS_IDS,
  Chip,
  CustomizeColumnsDrawer,
  DataTable,
  DateChange,
  FilterPanel,
  HeaderSearchField,
  Icon,
  MessageDrawer,
  QuickSendModal,
  StatusFilterDropdown,
  Toast,
  ViewActivityDrawer,
  WeekCalendar,
  DayCalendar,
  Tabs,
  TopNav,
  QuickViewDrawer,
  PatientCell,
  BookAppointmentDrawer,
  type AppointmentTimescale,
  type AppointmentView,
  type ChipVariant,
  type Column,
  type ColumnOption,
  type FilterField,
  type PatientDetail,
  type QuickViewAppointment,
  type RecordDetailScreenProps,
} from '../components'

export interface Appointment {
  name: string
  location: string
  status: string
  staff: string
  apptType: string
  insuranceStatus: string
  dateTime: string
  opCode: string
  phone: string
  email: string
  [key: string]: string
}

export interface AppointmentDetailArgs {
  detail: PatientDetail
  row: Appointment
  fromTabLabel?: string
}

interface CalendarAppointmentEvent {
  name: string
  phone: string
  email: string
  provider: string
  apptType: string
  insuranceStatus: string
  start: string
  end: string
  checks: string[]
}

function calendarEventToAppointment(evt: CalendarAppointmentEvent): Appointment {
  return {
    name: evt.name,
    location: '',
    status: evt.checks.includes('Appointment confirmed') ? 'Confirmed' : 'Unconfirmed',
    staff: evt.provider,
    apptType: evt.apptType,
    insuranceStatus: evt.insuranceStatus,
    dateTime: `${evt.start} - ${evt.end}`,
    opCode: '',
    phone: evt.phone,
    email: evt.email,
  }
}

function toAppointmentDetailArgs(row: Appointment, fromTabLabel?: string): AppointmentDetailArgs {
  return {
    detail: {
      patient: row.name,
      status: row.status,
      phone: row.phone,
      email: row.email,
      appointmentType: row.apptType,
      appointmentTime: row.dateTime,
      location: row.location,
    },
    row,
    fromTabLabel,
  }
}

export function buildAppointmentDetailProps(args: AppointmentDetailArgs): RecordDetailScreenProps {
  const { row } = args
  return {
    name: row.name,
    accordions: [
      {
        title: 'Appointment details',
        defaultOpen: true,
        fields: [
          { label: 'Provider', value: row.staff },
          { label: 'Appointment type', value: row.apptType },
          { label: 'Operation code', value: row.opCode },
          { label: 'Date & time', value: row.dateTime },
          { label: 'Insurance status', value: row.insuranceStatus },
          { label: 'Location', value: row.location },
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
      { value: row.staff, label: 'Provider' },
      { value: row.status, label: 'Status' },
      { value: row.insuranceStatus, label: 'Insurance status' },
    ],
    activities: [
      {
        id: '1',
        type: 'booked',
        title: `${row.name} booked an appointment for '${row.apptType}'`,
        subtitle: `Scheduled: ${row.dateTime}`,
        date: row.dateTime,
      },
      {
        id: '2',
        type: 'check',
        title: 'Insurance verification',
        subtitle: `Status: ${row.insuranceStatus}`,
        date: row.dateTime,
      },
    ],
  }
}

const APPOINTMENTS: Appointment[] = [
  // Unconfirmed — 5
  { name: 'Megan Harris',   location: 'Mountain View', status: 'Unconfirmed', staff: 'Lopez',     apptType: 'Follow Up',       insuranceStatus: 'Pending',     dateTime: 'Sep 28, 2024 03:25 AM', opCode: 'FLLWUP',  phone: '(650) 555-0144', email: 'm.harris@email.com'    },
  { name: 'Chris Evans',    location: 'Palo Alto',     status: 'Unconfirmed', staff: 'Wilson',    apptType: 'Procedure',       insuranceStatus: 'Denied',      dateTime: 'Oct 08, 2024 02:00 PM', opCode: 'TIRRTN',  phone: '(415) 555-0132', email: 'c.evans@email.com'     },
  { name: 'Linda Thomas',   location: 'San Jose',      status: 'Unconfirmed', staff: 'Carter',    apptType: 'New Consult',     insuranceStatus: 'In Progress', dateTime: 'Oct 19, 2024 11:15 AM', opCode: 'NCNSLT',  phone: '(650) 555-0177', email: 'l.thomas@email.com'    },
  { name: 'Patricia Clark', location: 'Sunnyvale',     status: 'Unconfirmed', staff: 'Adams',     apptType: 'Annual Physical', insuranceStatus: 'Verified',    dateTime: 'Nov 14, 2024 08:45 AM', opCode: 'OILCHG',  phone: '(415) 555-0199', email: 'p.clark@email.com'     },
  { name: 'William Harris', location: 'Mountain View', status: 'Unconfirmed', staff: 'Baker',     apptType: 'Urgent Care',     insuranceStatus: 'Pending',     dateTime: 'Nov 15, 2024 10:45 AM', opCode: 'DIAG',    phone: '(408) 555-0166', email: 'w.harris@email.com'    },
  // Cancelled — 5
  { name: 'Michael Wilson', location: 'Palo Alto',     status: 'Cancelled',   staff: 'Jones',     apptType: 'Urgent Care',     insuranceStatus: 'Verified',    dateTime: 'Feb 20, 2024 02:00 PM', opCode: 'BRKREP',  phone: '(408) 555-0188', email: 'm.wilson@email.com'    },
  { name: 'James Thomas',   location: 'San Jose',      status: 'Cancelled',   staff: 'Davis',     apptType: 'New Consult',     insuranceStatus: 'Pending',     dateTime: 'Jun 23, 2024 01:00 PM', opCode: 'ENGDIAG', phone: '(408) 555-0166', email: 'j.thomas@email.com'    },
  { name: 'Laura Jackson',  location: 'Sunnyvale',     status: 'Cancelled',   staff: 'Martinez',  apptType: 'Annual Physical', insuranceStatus: 'In Progress', dateTime: 'Jul 30, 2024 06:40 AM', opCode: 'OILCHG',  phone: '(415) 555-0199', email: 'l.jackson@email.com'   },
  { name: 'Daniel White',   location: 'Mountain View', status: 'Cancelled',   staff: 'Hernandez', apptType: 'Procedure',       insuranceStatus: 'Denied',      dateTime: 'Aug 15, 2024 09:55 PM', opCode: 'BATTREP', phone: '(669) 555-0101', email: 'd.white@email.com'     },
  { name: 'Kevin Moore',    location: 'Palo Alto',     status: 'Cancelled',   staff: 'Edwards',   apptType: 'Follow Up',       insuranceStatus: 'Verified',    dateTime: 'Oct 14, 2024 11:10 AM', opCode: 'ACREPR',  phone: '(408) 555-0188', email: 'k.moore@email.com'     },
  // No-show — 4
  { name: 'David Martinez', location: 'San Jose',      status: 'No-show',     staff: 'Rodriguez', apptType: 'Follow Up',       insuranceStatus: 'Denied',      dateTime: 'Apr 18, 2024 04:50 AM', opCode: 'FLLWUP',  phone: '(669) 555-0123', email: 'd.martinez@email.com'  },
  { name: 'Sarah Anderson', location: 'Sunnyvale',     status: 'No-show',     staff: 'Miller',    apptType: 'New Consult',     insuranceStatus: 'Pending',     dateTime: 'May 07, 2024 10:05 PM', opCode: 'INSPREP', phone: '(650) 555-0177', email: 's.anderson@email.com'  },
  { name: 'Jessica Taylor', location: 'Mountain View', status: 'No-show',     staff: 'Garcia',    apptType: 'Procedure',       insuranceStatus: 'In Progress', dateTime: 'Mar 11, 2024 12:30 PM', opCode: 'TIRRTN',  phone: '(415) 555-0155', email: 'jess.t@email.com'      },
  { name: 'Robert Brown',   location: 'Palo Alto',     status: 'No-show',     staff: 'Williams',  apptType: 'Annual Physical', insuranceStatus: 'Verified',    dateTime: 'Dec 01, 2023 11:45 AM', opCode: 'TRNSMSN', phone: '(408) 555-0117', email: 'r.brown@email.com'     },
]

const TAB_STATUS_MAP: Record<string, string> = {
  unconfirmed:   'Unconfirmed',
  cancellations: 'Cancelled',
  'no-shows':    'No-show',
}

function parseDateTime(dateTime: string): number {
  const t = new Date(dateTime).getTime()
  return Number.isNaN(t) ? 0 : t
}

const STATUS_CHIP: Record<string, ChipVariant> = {
  'Unconfirmed': 'warning',
  'Cancelled':   'danger',
  'No-show':     'danger',
  'Confirmed':   'success',
  'Rescheduled': 'neutral',
}

const STATUS_COLUMN: Column<Appointment> = {
  key: 'status',
  label: 'Appointment status',
  sortable: true,
  render: (val) => (
    <Chip label={String(val)} variant={STATUS_CHIP[String(val)] ?? 'neutral'} />
  ),
}

const TABS = [
  { id: 'unconfirmed',   label: 'Unconfirmed',   count: 5  },
  { id: 'cancellations', label: 'Cancelled',     count: 5  },
  { id: 'no-shows',      label: 'No-shows',      count: 4  },
  { id: 'all',           label: 'All',           count: 14 },
]

interface ColumnDef extends Column<Appointment> {
  locked?: boolean
}

// Automotive columns
const AUTO_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name',            label: 'Name',             sortable: true, locked: true, render: (_val, row) => <PatientCell name={row.name as string} location={row.location as string} /> },
  { key: 'staff',           label: 'Staff',            sortable: true },
  { key: 'apptType',        label: 'Appointment type', sortable: true },
  { key: 'opCode',          label: 'Operation code',   sortable: true },
  { key: 'insuranceStatus', label: 'Insurance status', sortable: true },
  { key: 'dateTime',        label: 'Appointment time', sortable: true },
  { key: 'phone',           label: 'Phone',            sortable: true },
  { key: 'email',           label: 'Email',            sortable: true },
]
const AUTO_DEFAULT_VISIBLE = ['name', 'staff', 'apptType', 'opCode', 'insuranceStatus', 'dateTime']

// Healthcare / Dental columns (no opCode; Patient + Provider labels)
const HC_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name',            label: 'Patient',          sortable: true, locked: true, render: (_val, row) => <PatientCell name={row.name as string} location={row.location as string} /> },
  { key: 'staff',           label: 'Provider',         sortable: true },
  { key: 'apptType',        label: 'Appointment type', sortable: true },
  { key: 'insuranceStatus', label: 'Insurance status', sortable: true },
  { key: 'dateTime',        label: 'Appointment time', sortable: true },
  { key: 'phone',           label: 'Phone',            sortable: true },
  { key: 'email',           label: 'Email',            sortable: true },
]
const HC_DEFAULT_VISIBLE = ['name', 'staff', 'apptType', 'insuranceStatus', 'dateTime']

// Shared helpers — resolved at render time based on product
const COLUMN_DEFS_BY_PRODUCT: Record<string, ColumnDef[]> = {
  automotive: AUTO_COLUMN_DEFS,
  healthcare:  HC_COLUMN_DEFS,
  dental:      HC_COLUMN_DEFS,
}
const DEFAULT_VISIBLE_BY_PRODUCT: Record<string, string[]> = {
  automotive: AUTO_DEFAULT_VISIBLE,
  healthcare:  HC_DEFAULT_VISIBLE,
  dental:      HC_DEFAULT_VISIBLE,
}

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'groups',               label: 'Groups',               options: opts('Group A', 'Group B', 'Group C') },
  { id: 'location',             label: 'Location',             options: opts('Main Campus', 'North Clinic', 'South Clinic', 'East Branch') },
  { id: 'city',                 label: 'City',                 options: opts('Austin', 'Dallas', 'Houston', 'San Antonio') },
  { id: 'state',                label: 'State',                options: opts('Texas', 'California', 'Florida', 'New York') },
  { id: 'social-manager',       label: 'Social manager',       options: opts('Alice', 'Bob', 'Carol', 'David') },
  { id: 'region-manager',       label: 'Region manager',       options: opts('Region 1', 'Region 2', 'Region 3') },
  { id: 'content-manager',      label: 'Content manager',      options: opts('Manager A', 'Manager B', 'Manager C') },
  { id: 'conversation-status',  label: 'Conversation status',  options: opts('Open', 'Closed', 'Pending', 'Resolved') },
  { id: 'provider',             label: 'Provider',             options: opts('Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Jones') },
  { id: 'appointment-type',     label: 'Appointment type',     options: opts('Procedure', 'New Consult', 'Follow Up', 'Annual Physical', 'Urgent Care') },
  { id: 'insurance-status',     label: 'Insurance status',     options: opts('Verified', 'In Progress', 'Denied', 'Pending') },
  { id: 'appointment-status',   label: 'Appointment status',   options: opts('Unconfirmed', 'Cancellations', 'No-shows') },
]

const BASE_DATE = new Date(2026, 4, 25)

export function ManageAppointmentsScreen({ product = 'healthcare', onViewDetail }: { product?: string; onViewDetail?: (args: AppointmentDetailArgs) => void }) {
  const COLUMN_DEFS = COLUMN_DEFS_BY_PRODUCT[product] ?? HC_COLUMN_DEFS
  const DEFAULT_VISIBLE = DEFAULT_VISIBLE_BY_PRODUCT[product] ?? HC_DEFAULT_VISIBLE
  const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
  const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

  const [date, setDate] = useState(new Date(BASE_DATE))
  const [view, setView] = useState<AppointmentView>('table')
  const [timescale, setTimescale] = useState<AppointmentTimescale>('day')
  const [activeTab, setActiveTab] = useState('unconfirmed')
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [statusAnchor, setStatusAnchor] = useState<{ top: number; left: number } | null>(null)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUS_IDS)
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>(ALL_STATUS_IDS)
  const [messagingRow, setMessagingRow] = useState<Appointment | null>(null)
  const [messagingChannel, setMessagingChannel] = useState<'message' | 'email'>('message')
  const [quickSendRow, setQuickSendRow] = useState<Appointment | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [activityRow, setActivityRow] = useState<Appointment | null>(null)
  const [quickViewRow, setQuickViewRow] = useState<QuickViewAppointment | null>(null)
  const [quickViewSourceRow, setQuickViewSourceRow] = useState<Appointment | null>(null)
  const [bookApptOpen, setBookApptOpen] = useState(false)


  const isToday = date.toDateString() === BASE_DATE.toDateString()
  const step = timescale === 'week' ? 7 : 1
  function prevStep() { setDate(d => { const n = new Date(d); n.setDate(n.getDate() - step); return n }) }
  function nextStep() { setDate(d => { const n = new Date(d); n.setDate(n.getDate() + step); return n }) }
  function goToToday() { setDate(new Date(BASE_DATE)) }

  const columns = useMemo<Column<Appointment>[]>(() => {
    const base = order
      .filter((k) => visible.includes(k))
      .map((k) => DEF_BY_KEY.get(k))
      .filter((c): c is ColumnDef => Boolean(c))
    if (activeTab === 'all') {
      return [...base, STATUS_COLUMN]
    }
    return base
  }, [order, visible, activeTab])

  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  const filteredData = useMemo(() => {
    const byTab =
      activeTab === 'all'
        ? APPOINTMENTS
        : APPOINTMENTS.filter((a) => a.status === TAB_STATUS_MAP[activeTab])
    const q = searchQuery.trim().toLowerCase()
    const matched = q
      ? byTab.filter((a) => a.name.toLowerCase().includes(q) || a.staff.toLowerCase().includes(q))
      : byTab
    return [...matched].sort((a, b) => parseDateTime(b.dateTime) - parseDateTime(a.dateTime))
  }, [activeTab, searchQuery])

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          {/* Header — changes based on table vs calendar view */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            {/* Left side */}
            {view === 'calendar' ? (
              <DateChange date={date} isToday={isToday} timescale={timescale} onPrev={prevStep} onNext={nextStep} onToday={goToToday} />
            ) : (
              <h1 className="text-h3 text-text-primary">Manage appointments</h1>
            )}

            {/* Right side controls */}
            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />

              {view === 'calendar' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (statusDropdownOpen) {
                        setStatusDropdownOpen(false)
                        setStatusAnchor(null)
                        return
                      }
                      const r = e.currentTarget.getBoundingClientRect()
                      setStatusAnchor({ top: r.bottom + 4, left: r.left })
                      setSelectedStatuses(appliedStatuses)
                      setStatusDropdownOpen(true)
                    }}
                    className={`flex h-9 items-center gap-sm rounded-sm border bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-l2 ${
                      statusDropdownOpen ? 'border-primary' : 'border-border-selected'
                    }`}
                  >
                    Status
                    <Icon name="expand_more" size={20} className="text-text-icon" />
                  </button>

                  <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-xs">
                    <button
                      type="button"
                      onClick={() => setTimescale('day')}
                      className={`rounded-sm px-sm py-xs text-body transition-colors ${timescale === 'day' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
                    >
                      Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimescale('week')}
                      className={`rounded-sm px-sm py-xs text-body transition-colors ${timescale === 'week' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
                    >
                      Week
                    </button>
                  </div>
                </>
              )}

              {/* Table / Calendar toggle */}
              <div className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
                <button
                  type="button"
                  aria-label="Table view"
                  onClick={() => setView('table')}
                  className={`flex size-6 items-center justify-center rounded-sm transition-colors ${view === 'table' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'}`}
                >
                  <Icon name="table_rows" size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Calendar view"
                  onClick={() => setView('calendar')}
                  className={`flex size-6 items-center justify-center rounded-sm transition-colors ${view === 'calendar' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'}`}
                >
                  <Icon name="calendar_month" size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setBookApptOpen(true)}
                className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                Book appointment
              </button>

              {view !== 'calendar' && (
                <button
                  type="button"
                  aria-label="Customize columns"
                  onClick={() => setCustomizeOpen(true)}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                >
                  <Icon name="view_column" size={20} />
                </button>
              )}

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

          {view === 'calendar' ? (
            <div className="flex flex-1 overflow-hidden px-2xl py-lg">
              <div className="flex flex-1 flex-col overflow-hidden rounded-sm border border-border">
                {timescale === 'day' ? (
                  <DayCalendar
                    day={date}
                    visibleColumns={visible}
                    searchQuery={searchQuery}
                    onViewDetails={(evt) => onViewDetail?.(toAppointmentDetailArgs(calendarEventToAppointment(evt)))}
                  />
                ) : (
                  <WeekCalendar
                    weekStart={date}
                    visibleColumns={visible}
                    searchQuery={searchQuery}
                    onViewDetails={(evt) => onViewDetail?.(toAppointmentDetailArgs(calendarEventToAppointment(evt)))}
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="px-2xl">
                <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              <div className="flex flex-1 flex-col px-lg py-lg">
                <DataTable
                  rowHeight={56}
                  columns={columns}
                  data={filteredData}
                  rowAction={{
                    icon: 'sms',
                    label: 'Message',
                    onClick: (row) => { setMessagingChannel('message'); setMessagingRow(row) },
                  }}
                  rowMenuItems={[
                    { label: 'Quick send',    onClick: (row) => setQuickSendRow(row) },
                    { label: 'Quick view',    onClick: (row) => { setQuickViewRow({ patient: row.name, provider: row.staff, apptType: row.apptType, dateTime: row.dateTime, status: row.status }); setQuickViewSourceRow(row) } },
                    { label: 'View activity', onClick: (row) => setActivityRow(row) },
                    { label: 'View details',  onClick: (row) => onViewDetail?.(toAppointmentDetailArgs(row, TABS.find((t) => t.id === activeTab)?.label)), icon: 'open_in_new' },
                  ]}
                />
              </div>
            </>
          )}
        </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          onClose={() => setFilterOpen(false)}
          onAdvancedFilters={() => {}}
        />
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

      <MessageDrawer
        open={messagingRow !== null}
        patient={messagingRow?.name ?? ''}
        status={messagingRow?.status}
        initialChannel={messagingChannel}
        onClose={() => setMessagingRow(null)}
      />

      <QuickSendModal
        open={quickSendRow !== null}
        patient={quickSendRow?.name ?? ''}
        email={quickSendRow?.email}
        onClose={() => setQuickSendRow(null)}
        onSend={() => setToastVisible(true)}
      />

      <ViewActivityDrawer
        open={activityRow !== null}
        patient={activityRow?.name ?? ''}
        onClose={() => setActivityRow(null)}
        onViewAllDetails={() => {
          if (!activityRow) return
          onViewDetail?.(toAppointmentDetailArgs(activityRow, TABS.find((t) => t.id === activeTab)?.label))
          setActivityRow(null)
        }}
      />

      <QuickViewDrawer
        open={quickViewRow !== null}
        appointment={quickViewRow}
        onClose={() => setQuickViewRow(null)}
        onQuickSend={() => {
          setQuickSendRow(quickViewSourceRow)
          setQuickViewRow(null)
        }}
        onMessage={() => {
          setMessagingChannel('message')
          setMessagingRow(quickViewSourceRow)
          setQuickViewRow(null)
        }}
        onEmail={() => {
          setMessagingChannel('email')
          setMessagingRow(quickViewSourceRow)
          setQuickViewRow(null)
        }}
        onViewDetails={() => {
          if (!quickViewSourceRow) return
          onViewDetail?.(toAppointmentDetailArgs(quickViewSourceRow, TABS.find((t) => t.id === activeTab)?.label))
          setQuickViewRow(null)
        }}
      />

      <BookAppointmentDrawer
        open={bookApptOpen}
        onClose={() => setBookApptOpen(false)}
      />

      <Toast
        message="Review request sent"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {statusDropdownOpen && statusAnchor && (
        <>
          <div
            className="fixed inset-0 z-[105]"
            onClick={() => {
              setStatusDropdownOpen(false)
              setStatusAnchor(null)
            }}
          />
          <div
            className="fixed z-[110]"
            style={{ top: statusAnchor.top, left: statusAnchor.left }}
          >
            <StatusFilterDropdown
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              onApply={() => {
                setAppliedStatuses(selectedStatuses)
                setStatusDropdownOpen(false)
                setStatusAnchor(null)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
