import { useEffect, useRef, useState } from 'react'
import { SelectMenu, Toast, TopNav } from '../components'
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Info, Minus, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { SelectOption } from '../components'

// ── Toggle (exact copy from AvailabilityScreen) ────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-surface-selected'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-1'}`} />
    </button>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface TimeWindow {
  id: string
  startTime: string
  endTime: string
  serviceType: string
  bay: string
  note: string
}

interface DaySchedule {
  enabled: boolean
  windows: TimeWindow[]
}

interface TimeOffEntry {
  id: string
  date: string
  label: string
  allAdvisors?: boolean
  allLocations?: boolean
}

type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'sun', label: 'Sun' }, { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' }, { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
]

// ── Dropdown data ──────────────────────────────────────────────────────────────
const DEPT_OPTIONS: SelectOption[] = [
  { value: 'service',  label: 'Service department' },
  { value: 'sales',    label: 'Sales department'   },
  { value: 'parts',    label: 'Parts department'   },
  { value: 'bodyshop', label: 'Body shop'          },
]

const SERVICE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all',        label: 'All service types'       },
  { value: 'oil',        label: 'Oil change'              },
  { value: 'tire',       label: 'Tire rotation'           },
  { value: 'brake',      label: 'Brake inspection'        },
  { value: 'diagnostic', label: 'Engine diagnostic'       },
  { value: 'inspection', label: 'Multi-point inspection'  },
]

const BAY_OPTIONS: SelectOption[] = [
  { value: 'bay1', label: 'Bay 1' }, { value: 'bay2', label: 'Bay 2' },
  { value: 'bay3', label: 'Bay 3' }, { value: 'bay4', label: 'Bay 4' },
  { value: 'bay5', label: 'Bay 5' },
]

const TIME_OPTIONS: SelectOption[] = [
  '07:00 AM','07:30 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
  '01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM',
].map(t => ({ value: t, label: t }))

// ── Seed schedules ─────────────────────────────────────────────────────────────
const SEED_SCHEDULE: Record<DayKey, DaySchedule> = {
  sun: { enabled: false, windows: [] },
  mon: { enabled: false, windows: [] },
  tue: { enabled: true,  windows: [
    { id: 'w1', startTime: '08:00 AM', endTime: '12:00 PM', serviceType: 'Oil change',   bay: 'Bay 1', note: '' },
    { id: 'w2', startTime: '01:00 PM', endTime: '05:00 PM', serviceType: 'Brake inspection', bay: 'Bay 2', note: '' },
  ]},
  wed: { enabled: true,  windows: [
    { id: 'w3', startTime: '08:00 AM', endTime: '12:00 PM', serviceType: 'Oil change',   bay: 'Bay 1', note: '' },
    { id: 'w4', startTime: '01:00 PM', endTime: '05:00 PM', serviceType: 'Engine diagnostic', bay: 'Bay 3', note: '' },
  ]},
  thu: { enabled: true,  windows: [
    { id: 'w5', startTime: '08:00 AM', endTime: '12:00 PM', serviceType: 'Tire rotation', bay: 'Bay 2', note: '' },
    { id: 'w6', startTime: '01:00 PM', endTime: '05:00 PM', serviceType: 'Oil change',   bay: 'Bay 1', note: '' },
  ]},
  fri: { enabled: true,  windows: [
    { id: 'w7', startTime: '08:00 AM', endTime: '12:00 PM', serviceType: 'Multi-point inspection', bay: 'Bay 1', note: '' },
    { id: 'w8', startTime: '01:00 PM', endTime: '04:00 PM', serviceType: 'Engine diagnostic',      bay: 'Bay 3', note: '' },
  ]},
  sat: { enabled: true,  windows: [
    { id: 'w9', startTime: '08:00 AM', endTime: '12:00 PM', serviceType: 'Oil change', bay: 'Bay 1', note: '' },
  ]},
}

const SEED_TIME_OFFS: TimeOffEntry[] = [
  { id: 't1', date: 'Jun 10, 2026',               label: 'Mike Johnson — training day' },
  { id: 't2', date: 'Jun 20, 2026 – Jun 22, 2026', label: 'Mike Johnson — vacation' },
  { id: 't3', date: 'Jul 4, 2026',                label: 'Independence Day — dealership closed', allAdvisors: true, allLocations: true },
]

// ── LocationConfig ─────────────────────────────────────────────────────────────
interface LocationConfig {
  source: 'birdeye' | 'dms'
  department: string[]
  schedule: Record<DayKey, DaySchedule>
  constraints: { leadTime: string; horizon: string; bufferBefore: string; bufferAfter: string; slotHold: string; walkInReserve: string }
  timeOffs: TimeOffEntry[]
}

const DEFAULT_CONFIG: LocationConfig = {
  source: 'birdeye',
  department: ['service'],
  schedule: SEED_SCHEDULE,
  constraints: { leadTime: '2', horizon: '90', bufferBefore: '0', bufferAfter: '15', slotHold: '10', walkInReserve: '20' },
  timeOffs: SEED_TIME_OFFS,
}

const LOCATIONS = [
  { id: '1001', name: 'Cityview Motors — Main',    address: '123 Auto Drive, Austin TX' },
  { id: '1002', name: 'Cityview Motors — West',    address: '890 West Blvd, Austin TX' },
  { id: '1004', name: 'Cityview Collision Center', address: '44 Body Shop Rd, Austin TX' },
  { id: '1006', name: 'North Austin Chevrolet',    address: '500 N Lamar Blvd, Austin TX' },
  { id: '1007', name: 'Round Rock Ford',           address: '101 Dell Way, Round Rock TX' },
]

// ── DropdownField (exact copy from AvailabilityScreen) ────────────────────────
interface DropdownFieldProps {
  label: string
  required?: boolean
  options: SelectOption[]
  value: string[]
  multi?: boolean
  searchable?: boolean
  placeholder?: string
  onChange: (v: string[]) => void
}
function DropdownField({ label, required, options, value, multi, searchable, placeholder, onChange }: DropdownFieldProps) {
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
  const selectedLabels = value.map(v => options.find(o => o.value === v)?.label ?? v)
  const triggerLabel = value.length === 0 ? (placeholder ?? 'Select') : value.length > 1 ? `${selectedLabels[0]}, +${value.length - 1} more` : selectedLabels[0]
  return (
    <div className="relative flex flex-col gap-sm" ref={ref}>
      {label && (
        <label className="text-small text-text-secondary">
          {label}{required && <span className="ml-xs text-danger">*</span>}
        </label>
      )}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex h-[34px] w-full items-center justify-between rounded-md border border-border bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-hover focus:outline-none"
      >
        <span className={value.length === 0 ? 'text-text-tertiary' : ''}>{triggerLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute top-full z-[60] mt-xs w-full">
          <SelectMenu options={options} value={value} multi={multi} searchable={searchable}
            onChange={v => { onChange(v); if (!multi) setOpen(false) }} onApply={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

// ── Source dropdown ────────────────────────────────────────────────────────────
const SOURCE_OPTIONS = [
  { id: 'birdeye' as const, title: 'Manage in Birdeye', description: 'Define department booking windows here. Best for CDK Drive, Reynolds & Reynolds, and DealerTrack.' },
  { id: 'dms'     as const, title: 'Sync from DMS',     description: 'Read availability directly from your DMS in real time. Best for Tekion.' },
]

// ── ConfirmDialog (exact copy from AvailabilityScreen) ────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-[72px] z-[201] w-[520px] -translate-x-1/2 rounded-xl bg-surface shadow-modal">
        <div className="flex items-center justify-between px-2xl pt-xl pb-md">
          <span className="text-body text-text-primary">{title}</span>
          <button type="button" onClick={onCancel} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"><X className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></button>
        </div>
        <p className="px-2xl pb-xl text-body text-text-secondary">{message}</p>
        <div className="flex justify-end gap-sm px-2xl pb-xl">
          <button type="button" onClick={onCancel} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">No, keep it</button>
          <button type="button" onClick={onConfirm} className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">Yes, delete</button>
        </div>
      </div>
    </>
  )
}

// ── AddWindowDrawer (AvailabilityScreen pattern, automotive terms) ────────────
function AddWindowDrawer({ open, dayLabel, onClose, onSave }: {
  open: boolean; dayLabel: string; onClose: () => void; onSave: (win: Omit<TimeWindow, 'id'>) => void
}) {
  const [recurrence,   setRecurrence]   = useState<'weekly' | 'specific'>('weekly')
  const [startTime,    setStartTime]    = useState(['08:00 AM'])
  const [endTime,      setEndTime]      = useState(['12:00 PM'])
  const [serviceType,  setServiceType]  = useState<string[]>([])
  const [bay,          setBay]          = useState<string[]>([])
  const [note,         setNote]         = useState('')
  if (!open) return null
  function handleSave() {
    const svcLabel = SERVICE_TYPE_OPTIONS.find(o => o.value === serviceType[0])?.label ?? serviceType[0] ?? ''
    const bayLabel = BAY_OPTIONS.find(o => o.value === bay[0])?.label ?? bay[0] ?? ''
    onSave({ startTime: startTime[0], endTime: endTime[0], serviceType: svcLabel, bay: bayLabel, note })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-[600px] flex-col overflow-y-auto rounded-2xl bg-surface shadow-modal">
        <div className="flex items-center justify-between px-2xl py-xl">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-[34px] items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"><ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
            <h2 className="text-[18px] text-text-primary">Add window</h2>
          </div>
          <button type="button" onClick={handleSave} className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">Save</button>
        </div>
        <div className="flex flex-col gap-2xl p-2xl">
          <div>
            <p className="mb-md text-body text-text-secondary">When does this apply?</p>
            <div className="grid grid-cols-2 gap-md">
              {([
                { id: 'weekly'   as const, title: 'Every week',      sub: `Repeats every ${dayLabel}` },
                { id: 'specific' as const, title: 'A specific date', sub: 'One-off availability' },
              ]).map(opt => (
                <button key={opt.id} type="button" onClick={() => setRecurrence(opt.id)}
                  className={`flex items-start gap-sm rounded-md border p-md text-left transition-colors ${recurrence === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-hover'}`}
                >
                  <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${recurrence === opt.id ? 'border-primary' : 'border-border-selected'}`}>
                    {recurrence === opt.id && <div className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-body text-text-primary">{opt.title}</p>
                    <p className="text-small text-text-secondary">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-lg">
            <DropdownField label="Start time" required options={TIME_OPTIONS} value={startTime} onChange={setStartTime} />
            <DropdownField label="End time"   required options={TIME_OPTIONS} value={endTime}   onChange={setEndTime} />
          </div>
          <DropdownField label="Service type" required options={SERVICE_TYPE_OPTIONS} value={serviceType} multi searchable placeholder="Select service types" onChange={setServiceType} />
          <DropdownField label="Service bay" options={BAY_OPTIONS} value={bay} placeholder="Select bay" onChange={setBay} />
          <div className="flex flex-col gap-sm">
            <label className="text-body text-text-primary">Note</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="eg. Express lane only"
              className="h-[34px] rounded-md border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AddTimeOffDrawer (exact copy from AvailabilityScreen, automotive terms) ───
function AddTimeOffDrawer({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (entry: Omit<TimeOffEntry, 'id'>) => void
}) {
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [label,        setLabel]        = useState('')
  const [advisor,      setAdvisor]      = useState<string[]>([])
  const [allAdvisors,  setAllAdvisors]  = useState(false)
  const [allLocations, setAllLocations] = useState(false)
  if (!open) return null
  function handleSave() {
    const date = dateTo ? `${dateFrom} – ${dateTo}` : dateFrom
    onSave({ date, label, allAdvisors: allAdvisors || undefined, allLocations: allLocations || undefined })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-[600px] flex-col overflow-y-auto rounded-2xl bg-surface shadow-modal">
        <div className="flex items-center justify-between px-2xl py-xl">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-[34px] items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"><ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth /></button>
            <h2 className="text-[18px] text-text-primary">Add time off</h2>
          </div>
          <button type="button" onClick={handleSave} className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">Save</button>
        </div>
        <div className="flex flex-col gap-2xl p-2xl">
          <div className="grid grid-cols-2 gap-lg">
            <div className="flex flex-col gap-sm">
              <label className="text-body text-text-primary">From <span className="text-danger">*</span></label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-[34px] rounded-md border border-border bg-surface pl-md pr-xl text-body text-text-primary focus:border-primary focus:outline-none" />
            </div>
            <div className="flex flex-col gap-sm">
              <label className="text-body text-text-primary">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-[34px] rounded-md border border-border bg-surface pl-md pr-xl text-body text-text-primary focus:border-primary focus:outline-none" />
            </div>
          </div>
          <DropdownField label="Advisor" options={DEPT_OPTIONS} value={advisor} multi searchable placeholder="All advisors" onChange={setAdvisor} />
          <div className="flex flex-col gap-sm">
            <label className="text-body text-text-primary">Label <span className="text-danger">*</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="eg. Independence Day — dealership closed"
              className="h-[34px] rounded-md border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none" />
          </div>
          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="checkbox" checked={allAdvisors} onChange={e => setAllAdvisors(e.target.checked)} className="rounded border-border" />
              <span className="text-body text-text-primary">Apply to all advisors</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="checkbox" checked={allLocations} onChange={e => setAllLocations(e.target.checked)} className="rounded border-border" />
              <span className="text-body text-text-primary">Apply to all locations</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Copy to locations modal ────────────────────────────────────────────────────
function CopyToModal({ sourceId, sourceName, onApply, onClose }: {
  sourceId: string; sourceName: string; onApply: (ids: string[]) => void; onClose: () => void
}) {
  const others = LOCATIONS.filter(l => l.id !== sourceId)
  const [selected, setSelected] = useState<string[]>([])
  const allSel = selected.length === others.length
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-[88px] z-[201] w-[520px] -translate-x-1/2 rounded-xl bg-surface shadow-modal">
        <div className="flex items-center justify-between px-2xl pt-xl pb-sm">
          <span className="text-body text-text-primary">Copy settings to other locations</span>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"><X className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></button>
        </div>
        <p className="px-2xl pb-lg text-small text-text-secondary">Each location gets an independent copy of <strong className="font-normal text-text-primary">{sourceName}</strong>'s settings.</p>
        <div className="mx-2xl mb-sm">
          <label className="flex cursor-pointer items-center gap-sm">
            <input type="checkbox" checked={allSel} onChange={() => setSelected(allSel ? [] : others.map(l => l.id))} className="rounded border-border" />
            <span className="text-small text-text-secondary">Select all</span>
          </label>
        </div>
        <div className="mx-2xl mb-lg flex flex-col divide-y divide-border overflow-hidden rounded-sm border border-border">
          {others.map(loc => (
            <label key={loc.id} className="flex cursor-pointer items-center gap-md px-lg py-md hover:bg-surface-hover">
              <input type="checkbox" checked={selected.includes(loc.id)} onChange={() => setSelected(p => p.includes(loc.id) ? p.filter(x => x !== loc.id) : [...p, loc.id])} className="rounded border-border" />
              <div><p className="text-body text-text-primary">{loc.name}</p><p className="text-small text-text-tertiary">{loc.address}</p></div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between px-2xl pb-xl">
          <button type="button" onClick={onClose} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">Cancel</button>
          <button type="button" disabled={selected.length === 0} onClick={() => { onApply(selected); onClose() }}
            className={`flex h-[34px] items-center rounded-md px-lg text-body text-white transition-colors ${selected.length > 0 ? 'bg-primary hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'}`}
          >Copy to {selected.length > 0 ? `${selected.length} location${selected.length > 1 ? 's' : ''}` : 'selected'}</button>
        </div>
      </div>
    </>
  )
}

// ── Location accordion ─────────────────────────────────────────────────────────
function LocationAccordion({ location, config, expanded, onToggle, onCopyTo }: {
  location: typeof LOCATIONS[0]
  config: LocationConfig | null
  expanded: boolean
  onToggle: () => void
  onCopyTo: () => void
}) {
  const initial = config ?? DEFAULT_CONFIG
  const [source,      setSource]      = useState<'birdeye' | 'dms'>(initial.source)
  const [schedule,    setSchedule]    = useState<Record<DayKey, DaySchedule>>(initial.schedule)
  const [constraints, setConstraints] = useState(initial.constraints)
  const [timeOffs,    setTimeOffs]    = useState<TimeOffEntry[]>(initial.timeOffs)
  const [_dirty,      setDirty]       = useState(false)

  const [addWindowDay,      setAddWindowDay]      = useState<DayKey | null>(null)
  const [showTimeOffDrawer, setShowTimeOffDrawer] = useState(false)
  const [confirmDelete,     setConfirmDelete]     = useState<{ type: 'window'; day: DayKey; winId: string } | { type: 'timeoff'; id: string } | null>(null)

  function handleAddWindow(win: Omit<TimeWindow, 'id'>) {
    if (!addWindowDay) return
    const id = `w-${Date.now()}`
    setSchedule(prev => ({ ...prev, [addWindowDay]: { ...prev[addWindowDay], windows: [...prev[addWindowDay].windows, { ...win, id }] } }))
    setDirty(true)
  }

  function handleToggleDay(day: DayKey, val: boolean) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: val } }))
    setDirty(true)
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'window') {
      const { day, winId } = confirmDelete
      setSchedule(prev => ({ ...prev, [day]: { ...prev[day], windows: prev[day].windows.filter(w => w.id !== winId) } }))
    } else {
      setTimeOffs(prev => prev.filter(t => t.id !== confirmDelete.id))
    }
    setDirty(true)
    setConfirmDelete(null)
  }

  const CONSTRAINT_FIELDS: { key: keyof typeof constraints; label: string; unit: string; info: string }[] = [
    { key: 'leadTime',      label: 'Min lead time',   unit: 'hours', info: 'Earliest a customer can book' },
    { key: 'horizon',       label: 'Booking horizon', unit: 'days',  info: 'How far out customers can book' },
    { key: 'bufferBefore',  label: 'Buffer before',   unit: 'min',   info: 'Prep time before each appointment' },
    { key: 'bufferAfter',   label: 'Buffer after',    unit: 'min',   info: 'Wrap-up time after each appointment' },
    { key: 'slotHold',      label: 'Slot hold',       unit: 'min',   info: 'Time slot is reserved during checkout' },
    { key: 'walkInReserve', label: 'Walk-in reserve', unit: '%',     info: 'Capacity held for walk-ins' },
  ]

  const activeDayLabel = addWindowDay ? DAY_LABELS.find(d => d.key === addWindowDay)?.label ?? '' : ''

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Accordion header */}
      <div className="flex w-full items-center px-2xl py-lg hover:bg-surface-hover">
        <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-sm text-left">
          {expanded ? <ChevronDown className="size-4 shrink-0 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronRight className="size-4 shrink-0 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />}
          <div className="flex flex-col">
            <span className="text-body text-text-primary">{location.name}</span>
            <span className="text-small text-text-tertiary">{location.address}</span>
          </div>
        </button>
        {expanded && (
          <button type="button" onClick={e => { e.stopPropagation(); onCopyTo() }}
            className="flex h-[34px] shrink-0 items-center gap-xs rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            <Copy className="size-4" strokeWidth={1.6} absoluteStrokeWidth />Copy to locations
          </button>
        )}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border">
          <div className="flex flex-col gap-xl px-2xl py-2xl">

            {/* Availability source */}
            <div className="flex flex-col gap-sm">
              <div className="flex flex-col gap-[2px]">
                <h2 className="text-[14px] text-text-primary">Availability source</h2>
              </div>
              <div className="grid grid-cols-2 gap-md">
                {SOURCE_OPTIONS.map(opt => (
                  <button key={opt.id} type="button" onClick={() => { setSource(opt.id); setDirty(true) }}
                    className={`flex items-start gap-sm rounded-md border p-lg text-left transition-colors ${source === opt.id ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface-hover'}`}
                  >
                    <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${source === opt.id ? 'border-primary' : 'border-border-selected'}`}>
                      {source === opt.id && <div className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="text-body text-text-primary">{opt.title}</p>
                      <p className="mt-xs text-small text-text-secondary">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {source === 'dms' ? (
              <div className="flex items-center gap-sm rounded-sm border border-blue-200 bg-blue-50 px-lg py-md">
                <Info className="size-4 shrink-0 text-blue-500" strokeWidth={1.6} absoluteStrokeWidth />
                <p className="text-body text-blue-700">Fetching data from the DMS. This may take some time.</p>
              </div>
            ) : (
              <>
                {/* Manage availability */}
                <div className="flex flex-col gap-sm">
                  <div className="flex flex-col gap-[2px]">
                    <h2 className="text-[14px] text-text-primary">Manage availability</h2>
                    <p className="text-small text-text-secondary">
                      Define department booking windows and service types. These are not actual appointments — they are the rules the booking agent uses to find and offer open slots.
                    </p>
                  </div>
                <div className="flex flex-col divide-y divide-border rounded-sm border border-border">
                  {DAY_LABELS.map(({ key, label }) => {
                    const day = schedule[key]
                    return (
                      <div key={key} className="flex items-center gap-lg px-lg py-md">
                        <span className="w-8 shrink-0 text-body text-text-primary">{label}</span>
                        {!day.enabled && <span className="w-14 shrink-0 text-body text-text-tertiary">Day off</span>}
                        {day.enabled  && <span className="w-14 shrink-0" />}
                        <div className="flex flex-1 flex-wrap items-start gap-sm">
                          {day.windows.map(win => (
                            <div key={win.id}
                              className="group relative flex min-w-[160px] flex-col gap-xs rounded-sm border-l-[3px] border-primary bg-primary/5 px-sm py-xs"
                            >
                              <button type="button" onClick={() => setConfirmDelete({ type: 'window', day: key, winId: win.id })}
                                className="absolute right-1 top-1 hidden size-5 items-center justify-center rounded text-text-tertiary hover:text-danger group-hover:flex"
                              ><X className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></button>
                              <span className="text-small text-primary">{win.startTime} - {win.endTime}</span>
                              <span className="text-xs text-text-secondary">{win.bay}</span>
                              <span className="inline-flex w-fit items-center rounded-sm border border-border bg-surface px-sm py-0.5 text-xs text-text-secondary">{win.serviceType}</span>
                            </div>
                          ))}
                          <button type="button" onClick={() => setAddWindowDay(key)}
                            className="flex h-8 items-center gap-xs rounded-sm border border-dashed border-border px-sm text-body text-text-secondary hover:border-primary hover:text-primary"
                          ><Plus className="size-4" strokeWidth={1.6} absoluteStrokeWidth />Add window</button>
                        </div>
                        <div className="shrink-0">
                          <Toggle value={day.enabled} onChange={val => handleToggleDay(key, val)} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                </div>{/* end manage availability section */}

                {/* Booking constraints */}
                <div className="flex flex-col gap-sm">
                  <div className="flex flex-col gap-[2px]">
                    <h2 className="text-[14px] text-text-primary">Booking constraints</h2>
                    <p className="text-small text-text-secondary">Rules that govern when and how far in advance customers can book. Applied per department.</p>
                  </div>
                  <div className="rounded-sm border border-border">
                    <div className="grid grid-cols-2">
                      {CONSTRAINT_FIELDS.map((f) => (
                        <div key={f.key} className="flex flex-col gap-xs px-lg py-lg">
                          <div className="flex items-center gap-xs">
                            <label className="text-small text-text-secondary">{f.label}</label>
                            <span title={f.info}><Info className="size-4 cursor-help text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth /></span>
                          </div>
                          <div className="flex h-[34px] items-center overflow-hidden rounded-md border border-border focus-within:border-primary">
                            <input type="number" min="0" value={constraints[f.key]}
                              onChange={e => { setConstraints(p => ({ ...p, [f.key]: e.target.value })); setDirty(true) }}
                              className="h-full flex-1 px-md text-body text-text-primary outline-none"
                            />
                            <span className="flex h-full min-w-[52px] items-center justify-center border-l border-border bg-surface-subtle px-sm text-small text-text-secondary">{f.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>{/* end booking constraints section */}

                {/* Time off and closures */}
                <div className="flex flex-col gap-sm">
                  <div className="flex items-start justify-between gap-lg">
                    <div className="flex flex-col gap-[2px]">
                      <h2 className="text-[14px] text-text-primary">Time off and closures</h2>
                      <p className="text-small text-text-secondary">
                        Block full days when the dealership is closed or an advisor is unavailable. The agent won't offer slots on these dates, overriding the weekly booking windows.
                      </p>
                    </div>
                    <button type="button" onClick={() => setShowTimeOffDrawer(true)}
                      className="flex h-[34px] shrink-0 items-center gap-xs rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                    >
                      <Plus className="size-4" strokeWidth={1.6} absoluteStrokeWidth />Add time off
                    </button>
                  </div>
                  <div className="flex flex-col divide-y divide-border rounded-sm border border-border">
                    {timeOffs.length === 0 && (
                      <div className="flex items-center justify-center py-2xl text-body text-text-tertiary">No time off or closures added yet</div>
                    )}
                    {timeOffs.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between px-lg py-md">
                        <div className="flex flex-col gap-xs">
                          <span className="text-body text-text-primary">{entry.date}</span>
                          <span className="text-small text-text-secondary">{entry.label}</span>
                        </div>
                        <div className="flex items-center gap-sm">
                          {entry.allAdvisors  && <span className="rounded-sm bg-chip-warning-bg px-sm py-0.5 text-xs text-chip-warning-text">All advisors</span>}
                          {entry.allLocations && <span className="rounded-sm bg-chip-warning-bg px-sm py-0.5 text-xs text-chip-warning-text">All locations</span>}
                          <button type="button" className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"><Pencil className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></button>
                          <button type="button" onClick={() => setConfirmDelete({ type: 'timeoff', id: entry.id })}
                            className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover hover:text-danger"
                          ><Trash2 className="size-4" strokeWidth={1.6} absoluteStrokeWidth /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>{/* end time off section */}
              </>
            )}
          </div>
        </div>
      )}

      {/* Drawers */}
      <AddWindowDrawer open={addWindowDay !== null} dayLabel={activeDayLabel} onClose={() => setAddWindowDay(null)} onSave={handleAddWindow} />
      <AddTimeOffDrawer open={showTimeOffDrawer} onClose={() => setShowTimeOffDrawer(false)} onSave={entry => { setTimeOffs(p => [...p, { ...entry, id: `t-${Date.now()}` }]); setDirty(true) }} />
      <ConfirmDialog open={confirmDelete !== null} title="Delete this item?" message="This action cannot be undone. The window or time-off entry will be permanently removed." onConfirm={handleConfirmDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}

// ── AutoAvailabilityScreen ─────────────────────────────────────────────────────
export function AutoAvailabilityScreen() {
  const [expandedId, setExpandedId] = useState<string>('1001')
  const [configs,    setConfigs]    = useState<Record<string, LocationConfig>>({ '1001': DEFAULT_CONFIG })
  const [copyFromId, setCopyFromId] = useState<string | null>(null)
  const [toastMsg,   setToastMsg]   = useState('')
  const [toastVis,   setToastVis]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function showToast(msg: string) {
    setToastMsg(msg); setToastVis(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToastVis(false), 3200)
  }

  function handleCopyApply(ids: string[]) {
    if (!copyFromId) return
    const src = configs[copyFromId]; if (!src) return
    const copies: Record<string, LocationConfig> = {}
    ids.forEach(id => { copies[id] = { ...src } })
    setConfigs(p => ({ ...p, ...copies }))
    showToast(`Settings copied to ${ids.length} location${ids.length > 1 ? 's' : ''}.`)
    setCopyFromId(null)
  }


  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <Toast message={toastMsg} visible={toastVis} onClose={() => setToastVis(false)} />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        {/* Page header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-lg">
          <span className="text-h3 text-text-primary">Availability</span>
          <div className="flex items-center gap-sm">
            <button type="button" onClick={() => showToast('All availability settings saved.')}
              className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >Save</button>
          </div>
        </div>

        {/* Accordion */}
        <div className="mx-2xl mb-2xl rounded-sm border border-border">
          {LOCATIONS.map(loc => (
            <LocationAccordion
              key={loc.id}
              location={loc}
              config={configs[loc.id] ?? null}
              expanded={expandedId === loc.id}
              onToggle={() => setExpandedId(p => p === loc.id ? '' : loc.id)}
              onCopyTo={() => setCopyFromId(loc.id)}
            />
          ))}
        </div>
      </div>

      {copyFromId && (
        <CopyToModal sourceId={copyFromId} sourceName={LOCATIONS.find(l => l.id === copyFromId)?.name ?? ''} onApply={handleCopyApply} onClose={() => setCopyFromId(null)} />
      )}
    </div>
  )
}
