import { useEffect, useMemo, useRef, useState } from 'react'
import { Chip, CustomizeColumnsDrawer, DataTable, FilterPanel, FormDrawer, HeaderSearchField, Icon, MessageDrawer, PatientCell, QuickSendModal, QuickViewDrawer, Tabs, Toast, TopNav, ViewActivityDrawer, type ChipVariant, type Column, type ColumnOption, type FilterField, type PatientDetail, type QuickViewWaitlist, type RecordDetailScreenProps } from '../components'

type WaitlistStatus = 'Waitlisted' | 'Slot offered' | 'Slot filled'
type OutreachChannel = 'chat' | 'call' | 'text'
type Priority = 'High' | 'Medium' | 'Low' | 'low'

export interface WaitlistRow {
  patient: string
  location: string
  outreach: OutreachChannel
  waitingSince: string
  priority: Priority
  apptType: string
  status: WaitlistStatus
  [key: string]: string
}

export interface WaitlistDetailArgs {
  detail: PatientDetail
  row: WaitlistRow
  fromTabLabel?: string
}

function toWaitlistDetailArgs(row: WaitlistRow, fromTabLabel?: string): WaitlistDetailArgs {
  return {
    detail: {
      patient: row.patient,
      status: row.status,
      location: row.location,
      appointmentType: row.apptType,
    },
    row,
    fromTabLabel,
  }
}

export function buildWaitlistDetailProps(args: WaitlistDetailArgs): RecordDetailScreenProps {
  const { row } = args
  return {
    name: row.patient,
    accordions: [
      {
        title: 'Waitlist details',
        defaultOpen: true,
        fields: [
          { label: 'Location', value: row.location },
          { label: 'Outreach channel', value: row.outreach },
          { label: 'Waiting since', value: row.waitingSince },
          { label: 'Priority', value: row.priority },
          { label: 'Appointment type', value: row.apptType },
        ],
      },
    ],
    metrics: [
      { value: row.waitingSince, label: 'Waiting since' },
      { value: row.priority, label: 'Priority' },
      { value: row.apptType, label: 'Appointment type' },
      { value: row.status, label: 'Status' },
    ],
    activities: [
      {
        id: '1',
        type: 'booked',
        title: `${row.patient} added to the waitlist for '${row.apptType}'`,
        subtitle: `Waiting since ${row.waitingSince} · Priority: ${row.priority}`,
        date: row.waitingSince,
      },
    ],
  }
}

const ALL_ROWS: WaitlistRow[] = [
  // Waitlisted — 13
  { patient: 'Michael Smith',      location: 'Main Campus',  outreach: 'chat', waitingSince: '4 days',       priority: 'High',   apptType: 'Procedure',       status: 'Waitlisted'   },
  { patient: 'Jessica Williams',   location: 'North Clinic', outreach: 'call', waitingSince: '5 days',       priority: 'Medium', apptType: 'New consult',     status: 'Waitlisted'   },
  { patient: 'David Brown',        location: 'South Clinic', outreach: 'chat', waitingSince: '6 days',       priority: 'Low',    apptType: 'Follow-up',       status: 'Waitlisted'   },
  { patient: 'Emily Davis',        location: 'East Branch',  outreach: 'call', waitingSince: '7 days',       priority: 'High',   apptType: 'Annual physical', status: 'Waitlisted'   },
  { patient: 'Christopher Garcia', location: 'Main Campus',  outreach: 'chat', waitingSince: '8 days',       priority: 'Medium', apptType: 'Urgent care',     status: 'Waitlisted'   },
  { patient: 'Sarah Martinez',     location: 'North Clinic', outreach: 'call', waitingSince: '9 days',       priority: 'Low',    apptType: 'Procedure',       status: 'Waitlisted'   },
  { patient: 'James Rodriguez',    location: 'South Clinic', outreach: 'call', waitingSince: '10 days',      priority: 'High',   apptType: 'New consult',     status: 'Waitlisted'   },
  { patient: 'Linda White',        location: 'East Branch',  outreach: 'call', waitingSince: '11 days',      priority: 'Medium', apptType: 'Follow-up',       status: 'Waitlisted'   },
  { patient: 'William Harris',     location: 'Main Campus',  outreach: 'call', waitingSince: '12 days',      priority: 'Low',    apptType: 'Annual physical', status: 'Waitlisted'   },
  { patient: 'Patricia Clark',     location: 'North Clinic', outreach: 'chat', waitingSince: '13 days',      priority: 'High',   apptType: 'Urgent care',     status: 'Waitlisted'   },
  { patient: 'Daniel Lewis',       location: 'South Clinic', outreach: 'chat', waitingSince: '14 days ago',  priority: 'Medium', apptType: 'Procedure',       status: 'Waitlisted'   },
  { patient: 'Sophia Walker',      location: 'East Branch',  outreach: 'chat', waitingSince: '15 days ago',  priority: 'Low',    apptType: 'New consult',     status: 'Waitlisted'   },
  { patient: 'Marcus Reed',        location: 'Main Campus',  outreach: 'call', waitingSince: '16 days ago',  priority: 'High',   apptType: 'Follow-up',       status: 'Waitlisted'   },
  // Slot offered — 6
  { patient: 'Ethan Hall',         location: 'North Clinic', outreach: 'text', waitingSince: '3 days',       priority: 'High',   apptType: 'Follow-up',       status: 'Slot offered' },
  { patient: 'Olivia Allen',       location: 'South Clinic', outreach: 'call', waitingSince: '5 days',       priority: 'Medium', apptType: 'Procedure',       status: 'Slot offered' },
  { patient: 'Noah Young',         location: 'East Branch',  outreach: 'chat', waitingSince: '7 days',       priority: 'Low',    apptType: 'Annual physical', status: 'Slot offered' },
  { patient: 'Ava King',           location: 'Main Campus',  outreach: 'text', waitingSince: '2 days',       priority: 'High',   apptType: 'Urgent care',     status: 'Slot offered' },
  { patient: 'Liam Scott',         location: 'North Clinic', outreach: 'call', waitingSince: '6 days',       priority: 'Medium', apptType: 'New consult',     status: 'Slot offered' },
  { patient: 'Chloe Turner',       location: 'South Clinic', outreach: 'chat', waitingSince: '4 days',       priority: 'Low',    apptType: 'Procedure',       status: 'Slot offered' },
  // Slot filled — 4
  { patient: 'Emma Green',         location: 'East Branch',  outreach: 'chat', waitingSince: '10 days ago',  priority: 'Low',    apptType: 'Procedure',       status: 'Slot filled'  },
  { patient: 'Mason Baker',        location: 'Main Campus',  outreach: 'text', waitingSince: '12 days ago',  priority: 'High',   apptType: 'Follow-up',       status: 'Slot filled'  },
  { patient: 'Isabella Adams',     location: 'North Clinic', outreach: 'chat', waitingSince: '16 days ago',  priority: 'Medium', apptType: 'Annual physical', status: 'Slot filled'  },
  { patient: 'Lucas Mitchell',     location: 'South Clinic', outreach: 'call', waitingSince: '18 days ago',  priority: 'Low',    apptType: 'New consult',     status: 'Slot filled'  },
]

const TAB_FILTER: Record<string, WaitlistStatus | null> = {
  waitlisted:     'Waitlisted',
  'slot-offered': 'Slot offered',
  'slot-filled':  'Slot filled',
  all:            null,
}

const STATUS_VARIANT: Record<WaitlistStatus, ChipVariant> = {
  'Waitlisted':    'warning',
  'Slot offered':  'neutral',
  'Slot filled':   'success',
}

const OUTREACH_ICON: Record<OutreachChannel, string> = {
  chat: 'sms',
  call: 'phone',
  text: 'sms',
}

const STATUS_COLUMN: Column<WaitlistRow> = {
  key: 'status',
  label: 'Status',
  sortable: true,
  render: (v) => <Chip label={String(v)} variant={STATUS_VARIANT[v as WaitlistStatus] ?? 'neutral'} />,
}

interface ColumnDef extends Column<WaitlistRow> {
  locked?: boolean
}

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'patient', label: 'Patient', sortable: true, locked: true, render: (_val, row) => <PatientCell name={row.patient as string} location={row.location as string} /> },
  {
    key: 'outreach',
    label: 'Outreach channel',
    sortable: false,
    render: (v) => <Icon name={OUTREACH_ICON[v as OutreachChannel]} size={20} className="text-text-icon" />,
  },
  { key: 'waitingSince', label: 'Waiting since',    sortable: true },
  { key: 'priority',     label: 'Priority',         sortable: true },
  { key: 'apptType',     label: 'Appointment type', sortable: true },
]

const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
const DEFAULT_VISIBLE = DEFAULT_ORDER
const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

function AddToWaitlistButton({ onSelect }: { onSelect: (mode: 'existing' | 'new') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Add to waitlist
      </button>
      {open && (
        <div className="absolute right-0 top-[40px] z-50 min-w-[216px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          {(['existing', 'new'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { onSelect(mode); setOpen(false) }}
              className="block w-full px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
            >
              {mode === 'existing' ? 'Add existing patient' : 'Add a new patient'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const OFFER_SLOT_FIELDS = [
  { key: 'provider',  label: 'Provider',         type: 'select' as const, options: ['Dr. Smith', 'Dr. Patel', 'Dr. Lee', 'Dr. Nguyen'] },
  { key: 'apptType', label: 'Appointment type',  type: 'select' as const, options: ['Procedure', 'New consult', 'Follow-up', 'Annual physical', 'Urgent care'], placeholder: 'Select appointment type' },
  { key: 'date',     label: 'Date',              type: 'select' as const, options: ['Today', 'Tomorrow', 'This week', 'Next week'], placeholder: 'Pick a date' },
  { key: 'time',     label: 'Time',              type: 'select' as const, options: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'], placeholder: 'Pick a time' },
  {
    key: 'template',
    label: 'Select template',
    type: 'template-picker' as const,
    templateOptions: [
      {
        label: 'Slot offer SMS',
        body: 'Hi [Contact first name], a slot has opened up at [Business Name]. Reply YES to confirm your appointment or call us to schedule. Text STOP to unsubscribe.',
      },
      {
        label: 'Appointment reminder',
        body: 'Hi [Contact first name], this is a reminder of your upcoming appointment at [Business Name]. Please reply CONFIRM to confirm or call us to reschedule.',
      },
      {
        label: 'Follow-up SMS',
        body: 'Hi [Contact first name], thanks for visiting [Business Name]. We wanted to follow up and see how you are doing. Please let us know if you need anything.',
        hasAttachment: true,
      },
      {
        label: 'Cancellation notice',
        body: 'Hi [Contact first name], your appointment at [Business Name] has been cancelled. Please call us or reply to this message to reschedule at your convenience.',
      },
    ],
  },
]

const ADD_EXISTING_FIELDS = [
  { key: 'patient',  label: 'Patient',          type: 'select'   as const, options: ['Michael Smith', 'Jessica Williams', 'David Brown', 'Emily Davis'], placeholder: 'Select' },
  { key: 'location', label: 'Location',         type: 'select'   as const, options: ['Main clinic', 'North branch', 'South branch'], placeholder: 'Select location' },
  { key: 'apptType', label: 'Appointment type', type: 'select'   as const, options: ['Procedure', 'New consult', 'Follow-up', 'Annual physical', 'Urgent care'], placeholder: 'Select' },
  { key: 'provider', label: 'Provider',         type: 'select'   as const, options: ['Dr. Smith', 'Dr. Patel', 'Dr. Lee', 'Dr. Nguyen'], placeholder: 'Select' },
  { key: 'priority', label: 'Priority',         type: 'select'   as const, options: ['High', 'Medium', 'Low'], placeholder: 'Select' },
  { key: 'notes',    label: 'Notes',            type: 'textarea' as const, placeholder: 'Add any relevant patient notes, availability, or reasons for urgency...', charLimit: 300 },
]

const ADD_NEW_FIELDS = [
  { key: 'name',     label: 'Patient name',     type: 'text'   as const, placeholder: 'Enter name' },
  { key: 'phone',    label: 'Phone number',     type: 'text'   as const, placeholder: 'Enter phone' },
  { key: 'dob',      label: 'Date of birth',    type: 'text'   as const, placeholder: 'MM/DD/YYYY' },
  { key: 'apptType', label: 'Appointment type', type: 'select' as const, options: ['Procedure', 'New consult', 'Follow-up', 'Annual physical', 'Urgent care'], placeholder: 'Select' },
  { key: 'provider', label: 'Provider',         type: 'select' as const, options: ['Dr. Smith', 'Dr. Patel', 'Dr. Lee', 'Dr. Nguyen'], placeholder: 'Select' },
  { key: 'location', label: 'Location',         type: 'select' as const, options: ['Main clinic', 'North branch', 'South branch'], placeholder: 'Select' },
  { key: 'slotPref', label: 'Slot preference',  type: 'select' as const, options: ['Morning', 'Afternoon', 'Evening', 'Any'], placeholder: 'Select' },
  { key: 'priority', label: 'Priority',         type: 'select' as const, options: ['High', 'Medium', 'Low'], placeholder: 'Select' },
]

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'groups',              label: 'Groups',              options: opts('Group A', 'Group B', 'Group C') },
  { id: 'location',            label: 'Location',            options: opts('Main Campus', 'North Clinic', 'South Clinic', 'East Branch') },
  { id: 'city',                label: 'City',                options: opts('Austin', 'Dallas', 'Houston', 'San Antonio') },
  { id: 'state',               label: 'State',               options: opts('Texas', 'California', 'Florida', 'New York') },
  { id: 'social-manager',      label: 'Social manager',      options: opts('Alice', 'Bob', 'Carol', 'David') },
  { id: 'region-manager',      label: 'Region manager',      options: opts('Region 1', 'Region 2', 'Region 3') },
  { id: 'content-manager',     label: 'Content manager',     options: opts('Manager A', 'Manager B', 'Manager C') },
  { id: 'conversation-status', label: 'Conversation status', options: opts('Open', 'Closed', 'Pending', 'Resolved') },
  { id: 'provider',            label: 'Provider',            options: opts('Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Jones') },
  { id: 'appointment-type',    label: 'Appointment type',    options: opts('Procedure', 'New consult', 'Follow-up', 'Annual physical', 'Urgent care') },
  { id: 'priority',            label: 'Priority',            options: opts('High', 'Medium', 'Low') },
  { id: 'outreach-channel',    label: 'Outreach channel',    options: opts('Chat', 'Call', 'Text') },
]

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
const parseDays = (s: string) => parseInt(s) || 0

export function ReviewWaitlistScreen({ onViewDetail }: { onViewDetail?: (args: WaitlistDetailArgs) => void } = {}) {
  const [rows, setRows] = useState<WaitlistRow[]>(ALL_ROWS)
  const [activeTab, setActiveTab] = useState('waitlisted')
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [offerSlotFor, setOfferSlotFor] = useState<WaitlistRow | null>(null)
  const [addMode, setAddMode] = useState<'existing' | 'new' | null>(null)
  const [quickSendRow, setQuickSendRow] = useState<WaitlistRow | null>(null)
  const [messagingRow, setMessagingRow] = useState<WaitlistRow | null>(null)
  const [messagingChannel, setMessagingChannel] = useState<'message' | 'email'>('message')
  const [activityRow, setActivityRow] = useState<WaitlistRow | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [quickViewRow, setQuickViewRow] = useState<QuickViewWaitlist | null>(null)
  const [quickViewSourceRow, setQuickViewSourceRow] = useState<WaitlistRow | null>(null)

  const counts = {
    waitlisted:     rows.filter((r) => r.status === 'Waitlisted').length,
    'slot-offered': rows.filter((r) => r.status === 'Slot offered').length,
    'slot-filled':  rows.filter((r) => r.status === 'Slot filled').length,
    all:            rows.length,
  }

  const tabs = [
    { id: 'waitlisted',   label: 'Waitlisted',  count: counts.waitlisted          },
    { id: 'slot-offered', label: 'Slot offered', count: counts['slot-offered']     },
    { id: 'slot-filled',  label: 'Slot filled',  count: counts['slot-filled']      },
    { id: 'all',          label: 'All',          count: counts.all                 },
  ]

  const columns = useMemo<Column<WaitlistRow>[]>(() => {
    const base = order
      .filter((k) => visible.includes(k))
      .map((k) => DEF_BY_KEY.get(k))
      .filter((c): c is ColumnDef => Boolean(c))
    return activeTab === 'all' ? [...base, STATUS_COLUMN] : base
  }, [order, visible, activeTab])

  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  const tableData = (() => {
    let filtered = activeTab === 'all'
      ? [...rows]
      : rows.filter((r) => r.status === TAB_FILTER[activeTab])

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter(
        (r) =>
          r.patient.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.apptType.toLowerCase().includes(q),
      )
    }

    if (activeTab === 'slot-offered') {
      filtered.sort((a, b) => parseDays(b.waitingSince) - parseDays(a.waitingSince))
    } else if (activeTab === 'slot-filled') {
      filtered.sort((a, b) => parseDays(a.waitingSince) - parseDays(b.waitingSince))
    } else {
      // 'waitlisted' and 'all' — default sort by priority (high to low)
      filtered.sort((a, b) => {
        const pDiff = (PRIORITY_ORDER[a.priority.toLowerCase()] ?? 9) - (PRIORITY_ORDER[b.priority.toLowerCase()] ?? 9)
        return pDiff !== 0 ? pDiff : parseDays(b.waitingSince) - parseDays(a.waitingSince)
      })
    }

    return filtered
  })()

  function handleOfferSlot() {
    if (!offerSlotFor) return
    setRows((prev) =>
      prev.map((r) => r.patient === offerSlotFor.patient ? { ...r, status: 'Slot offered' } : r)
    )
    setOfferSlotFor(null)
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
        {/* Page header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
          <h1 className="text-h3 text-text-primary">Review waitlist</h1>
          <div className="flex items-center gap-sm">
            <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
            <AddToWaitlistButton onSelect={setAddMode} />
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
              onClick={() => setFilterOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <Icon name="filter_list" size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-2xl">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Table */}
        <div className="flex flex-1 flex-col px-lg py-lg">
          <DataTable
            rowHeight={56}
            columns={columns}
            data={tableData}
            rowAction={{
              icon: 'calendar_add_on',
              label: 'Offer slot',
              onClick: (row) => setOfferSlotFor(row),
              visible: (row) => row.status === 'Waitlisted',
            }}
            rowMenuItems={[
              { label: 'Quick send',    onClick: (row) => setQuickSendRow(row) },
              { label: 'Quick view',    onClick: (row) => { setQuickViewRow({ patient: row.patient, provider: 'Dr. Smith', location: 'New York, NY', apptType: row.apptType, slotPreference: 'Morning', waitingSince: row.waitingSince, status: row.status }); setQuickViewSourceRow(row) } },
              { label: 'View activity', onClick: (row) => setActivityRow(row) },
              { label: 'View details',  onClick: (row) => onViewDetail?.(toWaitlistDetailArgs(row, tabs.find((t) => t.id === activeTab)?.label)), icon: 'open_in_new' },
            ]}
          />
        </div>
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

      <FormDrawer
        open={offerSlotFor !== null}
        title={offerSlotFor ? `Offer slot for ${offerSlotFor.patient}` : 'Offer slot'}
        fields={OFFER_SLOT_FIELDS}
        submitLabel="Save"
        requiredKeys={['apptType', 'date', 'time']}
        initialValues={{ provider: 'Dr. Smith', template: 'Slot offer SMS' }}
        onClose={() => setOfferSlotFor(null)}
        onSubmit={handleOfferSlot}
      />

      <FormDrawer
        open={addMode === 'existing'}
        title="Add patient to waitlist"
        fields={ADD_EXISTING_FIELDS}
        submitLabel="Add"
        requiredKeys={['patient', 'apptType', 'provider', 'priority']}
        onClose={() => setAddMode(null)}
        onSubmit={() => setAddMode(null)}
      />

      <FormDrawer
        open={addMode === 'new'}
        title="Add patient to waitlist"
        fields={ADD_NEW_FIELDS}
        submitLabel="Add"
        requiredKeys={['name', 'phone', 'apptType', 'provider', 'priority']}
        onClose={() => setAddMode(null)}
        onSubmit={() => setAddMode(null)}
      />

      <QuickSendModal
        open={quickSendRow !== null}
        patient={quickSendRow?.patient ?? ''}
        onClose={() => setQuickSendRow(null)}
        onSend={() => setToastVisible(true)}
      />

      <ViewActivityDrawer
        open={activityRow !== null}
        patient={activityRow?.patient ?? ''}
        onClose={() => setActivityRow(null)}
        onViewAllDetails={() => {
          if (!activityRow) return
          onViewDetail?.(toWaitlistDetailArgs(activityRow, tabs.find((t) => t.id === activeTab)?.label))
          setActivityRow(null)
        }}
      />

      <QuickViewDrawer
        open={quickViewRow !== null}
        waitlist={quickViewRow}
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
          onViewDetail?.(toWaitlistDetailArgs(quickViewSourceRow, tabs.find((t) => t.id === activeTab)?.label))
          setQuickViewRow(null)
        }}
      />

      <MessageDrawer
        open={messagingRow !== null}
        patient={messagingRow?.patient ?? ''}
        status={messagingRow?.status}
        initialChannel={messagingChannel}
        onClose={() => setMessagingRow(null)}
      />

      <Toast
        message="Review request sent"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}
