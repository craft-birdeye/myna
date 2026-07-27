import { useMemo, useState } from 'react'
import {
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  Icon,
  IntakeFormPreviewDrawer,
  MetricTiles,
  PatientCell,
  Tabs,
  TopNav,
  type Column,
  type ColumnOption,
  type FilterField,
  type IntakePreviewPatient,
  type Tab,
} from '../components'

type IntakeStatus = 'Overdue' | 'Not started' | 'In progress' | 'Completed'
type SentVia = 'chat' | 'email'

interface IntakeRow {
  patient: string
  location: string
  appointmentDate: string
  formType: string
  sentVia: SentVia
  sentOn: string
  status: IntakeStatus
  preview: IntakePreviewPatient
  [key: string]: string | SentVia | IntakeStatus | IntakePreviewPatient
}

const NOAH_HAYES_PREVIEW: IntakePreviewPatient = {
  name: 'Noah Hayes',
  initials: 'NH',
  aiSummary: [
    'Intake form completed on May 21, 2026.',
    'All sections filled in: basic details, insurance, consent, medical history, and social history.',
  ],
  basicDetails: {
    age: '26 years',
    gender: 'Female',
    phone: '+1 (555) 123-4567',
    email: 'noah.hayes@gmail.com',
    emergencyContact: 'Alice Johanson',
    emergencyRelationship: 'Wife',
    emergencyPhone: '+1 (555) 123-4567',
    emergencyEmail: 'alice.johanson@gmail.com',
  },
}

function makePreview(name: string): IntakePreviewPatient {
  const parts = name.split(' ')
  const initials = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  return {
    ...NOAH_HAYES_PREVIEW,
    name,
    initials,
    basicDetails: {
      ...NOAH_HAYES_PREVIEW.basicDetails,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
    },
  }
}

const INTAKE_ROWS: IntakeRow[] = [
  { patient: 'John Smith',           location: 'North Austin', appointmentDate: 'May 27', formType: 'New patient',  sentVia: 'chat',  sentOn: 'Apr 27', status: 'Overdue',     preview: makePreview('John Smith') },
  { patient: 'Alice Johnson',        location: 'South Austin', appointmentDate: 'May 27', formType: 'Follow-up',    sentVia: 'chat',  sentOn: 'Apr 27', status: 'Overdue',     preview: makePreview('Alice Johnson') },
  { patient: 'Robert Williams',      location: 'San Francisco', appointmentDate: 'May 27', formType: 'Referral',     sentVia: 'chat',  sentOn: 'May 18', status: 'Overdue',     preview: makePreview('Robert Williams') },
  { patient: 'Mary Brown',           location: 'Phoenix, AZ', appointmentDate: 'May 27', formType: 'New patient',  sentVia: 'email', sentOn: 'May 18', status: 'Overdue',     preview: makePreview('Mary Brown') },
  { patient: 'Michael Davis',        location: 'Denver, CO', appointmentDate: 'May 27', formType: 'New patient',  sentVia: 'chat',  sentOn: 'May 18', status: 'Overdue',     preview: makePreview('Michael Davis') },
  { patient: 'Jennifer Wilson',      location: 'Seattle, WA', appointmentDate: 'May 27', formType: 'Referral',     sentVia: 'email', sentOn: 'May 18', status: 'Not started', preview: makePreview('Jennifer Wilson') },
  { patient: 'David Garcia',         location: 'North Austin', appointmentDate: 'May 27', formType: 'New patient',  sentVia: 'chat',  sentOn: 'May 18', status: 'Not started', preview: makePreview('David Garcia') },
  { patient: 'Linda Rodriguez',      location: 'South Austin', appointmentDate: 'May 27', formType: 'Referral',     sentVia: 'email', sentOn: 'May 18', status: 'Not started', preview: makePreview('Linda Rodriguez') },
  { patient: 'Christopher Martinez', location: 'San Francisco', appointmentDate: 'May 27', formType: 'New patient',  sentVia: 'chat',  sentOn: 'May 20', status: 'Not started', preview: makePreview('Christopher Martinez') },
  { patient: 'James Anderson',       location: 'Phoenix, AZ', appointmentDate: 'May 29', formType: 'New patient',  sentVia: 'email', sentOn: 'May 20', status: 'In progress', preview: makePreview('James Anderson') },
  { patient: 'Sarah Lee',            location: 'Denver, CO', appointmentDate: 'May 30', formType: 'Referral',     sentVia: 'chat',  sentOn: 'May 21', status: 'In progress', preview: makePreview('Sarah Lee') },
  { patient: 'Emily Thompson',       location: 'Seattle, WA', appointmentDate: 'May 28', formType: 'Follow-up',    sentVia: 'chat',  sentOn: 'May 19', status: 'In progress', preview: makePreview('Emily Thompson') },
  { patient: 'Daniel White',         location: 'North Austin', appointmentDate: 'May 31', formType: 'Follow-up',    sentVia: 'email', sentOn: 'May 20', status: 'In progress', preview: makePreview('Daniel White') },
  { patient: 'Noah Hayes',           location: 'South Austin', appointmentDate: 'Jun 02', formType: 'New patient',  sentVia: 'email', sentOn: 'May 21', status: 'Completed',   preview: NOAH_HAYES_PREVIEW },
  { patient: 'Laura Jackson',        location: 'San Francisco', appointmentDate: 'Jun 01', formType: 'Referral',     sentVia: 'chat',  sentOn: 'May 20', status: 'Completed',   preview: makePreview('Laura Jackson') },
  { patient: 'Kevin Moore',          location: 'Phoenix, AZ', appointmentDate: 'Jun 03', formType: 'New patient',  sentVia: 'email', sentOn: 'May 22', status: 'Completed',   preview: makePreview('Kevin Moore') },
  { patient: 'Amy Chen',             location: 'Denver, CO', appointmentDate: 'Jun 04', formType: 'Follow-up',    sentVia: 'chat',  sentOn: 'May 22', status: 'Completed',   preview: makePreview('Amy Chen') },
]

const SUMMARY_METRICS = [
  { id: 'all',         value: 17, label: 'All' },
  { id: 'overdue',     value: 5,  label: 'Overdue' },
  { id: 'not-started', value: 4,  label: 'Not started' },
  { id: 'in-progress', value: 4,  label: 'In progress' },
  { id: 'completed',   value: 4,  label: 'Completed' },
]

const TABS: Tab[] = [
  { id: 'overdue',     label: 'Overdue' },
  { id: 'not-started', label: 'Not started' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed',   label: 'Completed' },
  { id: 'all',         label: 'All' },
]

const TAB_STATUS: Record<string, IntakeStatus | null> = {
  overdue:     'Overdue',
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed:   'Completed',
  all:         null,
}

const SENT_VIA_ICON: Record<SentVia, string> = {
  chat:  'sms',
  email: 'mail',
}

const COLUMN_DEFS: Array<Column<IntakeRow> & { locked?: boolean }> = [
  {
    key: 'patient',
    label: 'Patient',
    width: 220,
    sortable: true,
    locked: true,
    render: (_v, row) => <PatientCell name={row.patient} location={row.location} />,
  },
  { key: 'appointmentDate', label: 'Appointment time', width: 180, sortable: true },
  { key: 'formType',        label: 'Form type',        width: 160, sortable: true },
  {
    key: 'sentVia',
    label: 'Sent via',
    width: 120,
    sortable: true,
    render: (v) => <Icon name={SENT_VIA_ICON[v as SentVia]} size={20} className="text-text-icon" />,
  },
  { key: 'sentOn', label: 'Sent on', width: 140, sortable: true },
]

const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'form-type', label: 'Form type', options: opts('New patient', 'Follow-up', 'Referral') },
  { id: 'sent-via',  label: 'Sent via',  options: opts('Chat', 'Email') },
  { id: 'status',    label: 'Status',    options: opts('Overdue', 'Not started', 'In progress', 'Completed') },
]

export function ManageIntakeScreen() {
  const [activeTab, setActiveTab] = useState('overdue')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [previewPatient, setPreviewPatient] = useState<IntakePreviewPatient | null>(null)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_ORDER)

  const tableData = useMemo(() => {
    const statusFilter = TAB_STATUS[activeTab]
    const byTab = INTAKE_ROWS.filter((row) => !statusFilter || row.status === statusFilter)
    const q = searchQuery.trim().toLowerCase()
    if (!q) return byTab
    return byTab.filter(
      (row) => row.patient.toLowerCase().includes(q) || row.formType.toLowerCase().includes(q),
    )
  }, [activeTab, searchQuery])

  const columns = useMemo<Column<IntakeRow>[]>(
    () => order.filter((k) => visible.includes(k)).map((k) => DEF_BY_KEY.get(k)!).filter(Boolean),
    [order, visible],
  )

  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <div className="flex items-center gap-xs">
              <h1 className="text-h3 text-text-primary">Manage intake</h1>
            </div>
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

          <div className="px-2xl pt-lg">
            <MetricTiles metrics={SUMMARY_METRICS} />
          </div>

          <div className="px-2xl">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="flex flex-1 flex-col px-lg py-lg">
            <DataTable
              columns={columns}
              data={tableData}
              rowAction={{
                icon: 'sms',
                label: 'Message',
                onClick: () => {},
              }}
              rowMenuItems={[
                { label: 'Quick send', onClick: () => {} },
                { label: 'Quick view', onClick: (row) => setPreviewPatient(row.preview) },
                { label: 'View activity', onClick: () => {} },
                { label: 'View form', onClick: () => {} },
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
          setVisible(DEFAULT_ORDER)
        }}
      />

      <IntakeFormPreviewDrawer
        open={previewPatient !== null}
        patient={previewPatient}
        onClose={() => setPreviewPatient(null)}
      />
    </div>
  )
}
