import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Info, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Icon, SelectMenu, Toast, TopNav } from '../components'
import type { SelectOption } from '../components'

// ── Toggle ─────────────────────────────────────────────────────────────────────
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
  appointmentType: string
  operatory: string
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
  allProviders?: boolean
  allLocations?: boolean
}

type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
]

// ── Dropdown data ──────────────────────────────────────────────────────────────
const LOCATION_OPTIONS: SelectOption[] = [
  { value: 'atlanta',   label: 'Atlanta, GA'   },
  { value: 'dallas',    label: 'Dallas, TX'    },
  { value: 'chicago',   label: 'Chicago, IL'   },
  { value: 'miami',     label: 'Miami, FL'     },
  { value: 'houston',   label: 'Houston, TX'   },
  { value: 'phoenix',   label: 'Phoenix, AZ'   },
  { value: 'charlotte', label: 'Charlotte, NC' },
  { value: 'denver',    label: 'Denver, CO'    },
]

const PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'chen',   label: 'Dr. Sarah Chen' },
  { value: 'rivera', label: 'Dr. Marcus Rivera' },
  { value: 'torres', label: 'Amy Torres' },
  { value: 'kim',    label: 'Dr. James Kim' },
]

const APPT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'npe',       label: 'New patient exam' },
  { value: 'emergency', label: 'Emergency visit' },
  { value: 'cleaning',  label: 'Routine cleaning' },
  { value: 'invisalign',label: 'Invisalign consultation' },
  { value: 'followup',  label: 'Follow-up visit' },
  { value: 'filling',   label: 'Tooth filling' },
]

const OPERATORY_OPTIONS: SelectOption[] = [
  { value: 'op1', label: 'Operatory 1' },
  { value: 'op2', label: 'Operatory 2' },
  { value: 'op3', label: 'Operatory 3' },
  { value: 'op4', label: 'Operatory 4' },
  { value: 'op5', label: 'Operatory 5' },
]

const TIME_OPTIONS: SelectOption[] = [
  '07:00 AM','07:30 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM',
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM',
  '01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM','06:00 PM',
].map(t => ({ value: t, label: t }))

const INITIAL_SCHEDULE: Record<DayKey, DaySchedule> = {
  sun: { enabled: false, windows: [] },
  mon: { enabled: false, windows: [] },
  tue: {
    enabled: true,
    windows: [
      { id: 'w1', startTime: '09:00 AM', endTime: '10:00 AM', appointmentType: 'Emergency visit',  operatory: 'Operatory 1', note: '' },
      { id: 'w2', startTime: '02:00 PM', endTime: '05:00 PM', appointmentType: 'New Patient Exam', operatory: 'Operatory 2', note: '' },
    ],
  },
  wed: {
    enabled: true,
    windows: [
      { id: 'w3', startTime: '09:00 AM', endTime: '10:00 AM', appointmentType: 'Emergency visit',  operatory: 'Operatory 1', note: '' },
      { id: 'w4', startTime: '02:00 PM', endTime: '05:00 PM', appointmentType: 'New Patient Exam', operatory: 'Operatory 2', note: '' },
    ],
  },
  thu: {
    enabled: true,
    windows: [
      { id: 'w5', startTime: '09:00 AM', endTime: '10:00 AM', appointmentType: 'Emergency visit',  operatory: 'Operatory 1', note: '' },
      { id: 'w6', startTime: '02:00 PM', endTime: '05:00 PM', appointmentType: 'New Patient Exam', operatory: 'Operatory 2', note: '' },
    ],
  },
  fri: {
    enabled: true,
    windows: [
      { id: 'w7', startTime: '09:00 AM', endTime: '10:00 AM', appointmentType: 'Emergency visit',  operatory: 'Operatory 1', note: '' },
      { id: 'w8', startTime: '02:00 PM', endTime: '05:00 PM', appointmentType: 'New Patient Exam', operatory: 'Operatory 2', note: '' },
    ],
  },
  sat: { enabled: false, windows: [] },
}

const INITIAL_TIME_OFFS: TimeOffEntry[] = [
  { id: 't1', date: 'Jun 10, 2026', label: 'Dr. Sarah Chen unavailable' },
  { id: 't2', date: 'Jun 15, 2026 – Jun 19, 2026', label: 'Dr. Sarah Chen — vacation' },
  { id: 't3', date: 'Jul 4, 2026', label: 'Independence Day — clinic closed', allProviders: true, allLocations: true },
]

// ── DropdownField (SelectMenu wrapper) ────────────────────────────────────────
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
  const triggerLabel = value.length === 0
    ? (placeholder ?? 'Select')
    : value.length > 1
    ? `${selectedLabels[0]}, +${value.length - 1} more`
    : selectedLabels[0]

  return (
    <div className="relative flex flex-col gap-sm" ref={ref}>
      {label && (
        <label className="text-small text-text-secondary">
          {label}{required && <span className="ml-xs text-danger">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-[34px] w-full items-center justify-between rounded-md border border-border bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-hover focus:outline-none"
      >
        <span className={value.length === 0 ? 'text-text-tertiary' : ''}>{triggerLabel}</span>
        <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute top-full z-[60] mt-xs w-full">
          <SelectMenu
            options={options}
            value={value}
            multi={multi}
            searchable={searchable}
            onChange={v => { onChange(v); if (!multi) setOpen(false) }}
            onApply={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Location single-select dropdown (header bar) ──────────────────────────────
function LocationDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

  const selectedLabel = LOCATION_OPTIONS.find(o => o.value === value)?.label ?? 'Select location'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-l2 focus:outline-none"
      >
        <Icon name="place" size={16} className="shrink-0 text-text-icon" />
        <span>{selectedLabel}</span>
        <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[60] mt-xs w-[220px]">
          <SelectMenu
            options={LOCATION_OPTIONS}
            value={[value]}
            multi={false}
            searchable
            onChange={vals => { if (vals[0]) { onChange(vals[0]); setOpen(false) } }}
          />
        </div>
      )}
    </div>
  )
}

// ── Availability source custom dropdown ────────────────────────────────────────
const SOURCE_OPTIONS = [
  {
    id: 'birdeye' as const,
    title: 'Manage in Birdeye',
    description: 'Define provider booking windows here. Best for Dentrix, Open Dental, and Eaglesoft',
  },
  {
    id: 'pms' as const,
    title: 'Sync from PMS',
    description: 'Read availability directly from your PMS in real time. Best for Denticon and Dentrix Ascend',
  },
]

interface SourceDropdownProps {
  value: 'birdeye' | 'pms'
  onChange: (v: 'birdeye' | 'pms') => void
}
function SourceDropdown({ value, onChange }: SourceDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = SOURCE_OPTIONS.find(o => o.id === value)!

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
        onClick={() => setOpen(v => !v)}
        className="flex h-[34px] w-full items-center justify-between rounded-md border border-border bg-surface pl-md pr-sm text-body text-text-primary hover:bg-surface-hover focus:outline-none"
      >
        <span>{selected.title}</span>
        <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute top-full z-[60] mt-xs w-full min-w-[400px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          {SOURCE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`flex w-full items-start justify-between px-md py-sm text-left hover:bg-surface-hover ${opt.id === value ? 'bg-surface-hover' : ''}`}
            >
              <div className="flex flex-col gap-xs">
                <span className="text-body text-text-primary">{opt.title}</span>
                <span className="text-small text-text-secondary">{opt.description}</span>
              </div>
              {opt.id === value && <Check className="size-5 mt-0.5 shrink-0 text-primary" strokeWidth={1.6} absoluteStrokeWidth />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}
function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-[72px] z-[201] w-[520px] -translate-x-1/2 rounded-xl bg-surface shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-2xl pt-xl pb-md">
          <span className="text-body text-text-primary">{title}</span>
          <button type="button" onClick={onCancel} className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
            <X className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
        {/* Body */}
        <p className="px-2xl pb-xl text-body text-text-secondary">{message}</p>
        {/* Footer */}
        <div className="flex justify-end gap-sm px-2xl pb-xl">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </>
  )
}

// ── Add Window Drawer ──────────────────────────────────────────────────────────
interface AddWindowDrawerProps {
  open: boolean
  dayLabel: string
  onClose: () => void
  onSave: (win: Omit<TimeWindow, 'id'>) => void
}
function AddWindowDrawer({ open, dayLabel, onClose, onSave }: AddWindowDrawerProps) {
  const [recurrence, setRecurrence] = useState<'weekly' | 'specific'>('weekly')
  const [startTime, setStartTime] = useState(['09:00 AM'])
  const [endTime, setEndTime] = useState(['10:00 AM'])
  const [appointmentType, setAppointmentType] = useState<string[]>([])
  const [operatory, setOperatory] = useState<string[]>([])
  const [note, setNote] = useState('')

  if (!open) return null

  function handleSave() {
    const apptLabel = APPT_TYPE_OPTIONS.find(o => o.value === appointmentType[0])?.label ?? appointmentType[0] ?? ''
    const opLabel   = OPERATORY_OPTIONS.find(o => o.value === operatory[0])?.label ?? operatory[0] ?? ''
    onSave({ startTime: startTime[0], endTime: endTime[0], appointmentType: apptLabel, operatory: opLabel, note })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-[600px] flex-col overflow-y-auto rounded-2xl bg-surface shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-xl">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-[34px] items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
              <ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <h2 className="text-[16px] text-text-primary">Add window</h2>
          </div>
          <button type="button" onClick={handleSave} className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Save
          </button>
        </div>

        <div className="flex flex-col gap-2xl p-2xl">
          {/* When does this apply */}
          <div>
            <p className="mb-md text-body text-text-secondary">When does this apply?</p>
            <div className="grid grid-cols-2 gap-md">
              {([
                { id: 'weekly' as const,   title: 'Every week',      sub: `Repeats every ${dayLabel}` },
                { id: 'specific' as const, title: 'A specific date', sub: 'One-off availability' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecurrence(opt.id)}
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

          {/* Time row */}
          <div className="grid grid-cols-2 gap-lg">
            <DropdownField label="Start time" required options={TIME_OPTIONS} value={startTime} onChange={setStartTime} />
            <DropdownField label="End time"   required options={TIME_OPTIONS} value={endTime}   onChange={setEndTime} />
          </div>

          {/* Appointment type */}
          <DropdownField
            label="Appointment type"
            required
            options={APPT_TYPE_OPTIONS}
            value={appointmentType}
            multi
            searchable
            placeholder="Select appointment types"
            onChange={setAppointmentType}
          />

          {/* Operatory */}
          <DropdownField
            label="Operatory"
            options={OPERATORY_OPTIONS}
            value={operatory}
            placeholder="Select operatory"
            onChange={setOperatory}
          />

          {/* Note */}
          <div className="flex flex-col gap-sm">
            <label className="text-body text-text-primary">Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="eg. Emergency slots only"
              className="h-[34px] rounded-md border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add Time Off Drawer ────────────────────────────────────────────────────────
interface AddTimeOffDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (entry: Omit<TimeOffEntry, 'id'>) => void
}
function AddTimeOffDrawer({ open, onClose, onSave }: AddTimeOffDrawerProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [label, setLabel] = useState('')
  const [provider, setProvider] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState(false)
  const [allLocations, setAllLocations] = useState(false)

  if (!open) return null

  function handleSave() {
    const date = dateTo ? `${dateFrom} – ${dateTo}` : dateFrom
    onSave({ date, label, allProviders: allProviders || undefined, allLocations: allLocations || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-[600px] flex-col overflow-y-auto rounded-2xl bg-surface shadow-modal">
        <div className="flex items-center justify-between px-2xl py-xl">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-[34px] items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
              <ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <h2 className="text-[16px] text-text-primary">Add time off</h2>
          </div>
          <button type="button" onClick={handleSave} className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Save
          </button>
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

          <DropdownField
            label="Provider"
            options={PROVIDER_OPTIONS}
            value={provider}
            multi
            searchable
            placeholder="All providers"
            onChange={setProvider}
          />

          <div className="flex flex-col gap-sm">
            <label className="text-body text-text-primary">Label <span className="text-danger">*</span></label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="eg. Independence Day — clinic closed" className="h-[34px] rounded-md border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none" />
          </div>

          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="checkbox" checked={allProviders} onChange={e => setAllProviders(e.target.checked)} className="rounded border-border" />
              <span className="text-body text-text-primary">Apply to all providers</span>
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

// ── Main Screen ────────────────────────────────────────────────────────────────
export function AvailabilityScreen() {
  const [location, setLocation] = useState('atlanta')
  const [provider, setProvider] = useState(['chen'])
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(INITIAL_SCHEDULE)
  const [timeOffs, setTimeOffs] = useState<TimeOffEntry[]>(INITIAL_TIME_OFFS)
  const [addWindowDay, setAddWindowDay] = useState<DayKey | null>(null)
  const [showTimeOffDrawer, setShowTimeOffDrawer] = useState(false)
  const [availabilitySource, setAvailabilitySource] = useState<'birdeye' | 'pms'>('birdeye')

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'window'; day: DayKey; winId: string } | { type: 'timeoff'; id: string } | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    setToastVisible(true)
  }

  function handleSourceChange(val: 'birdeye' | 'pms') {
    setAvailabilitySource(val)
    if (val === 'pms') {
      showToast('Fetching data from the PMS. This may take some time.')
    }
  }

  function handleAddWindow(win: Omit<TimeWindow, 'id'>) {
    if (!addWindowDay) return
    const id = `w-${Date.now()}`
    setSchedule(prev => ({
      ...prev,
      [addWindowDay]: { ...prev[addWindowDay], windows: [...prev[addWindowDay].windows, { ...win, id }] },
    }))
  }

  function requestDeleteWindow(day: DayKey, winId: string) {
    setConfirmDelete({ type: 'window', day, winId })
  }

  function requestDeleteTimeOff(id: string) {
    setConfirmDelete({ type: 'timeoff', id })
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'window') {
      const { day, winId } = confirmDelete
      setSchedule(prev => ({
        ...prev,
        [day]: { ...prev[day], windows: prev[day].windows.filter(w => w.id !== winId) },
      }))
      showToast('Your window has been deleted.')
    } else {
      setTimeOffs(prev => prev.filter(t => t.id !== confirmDelete.id))
      showToast('Your time off entry has been deleted.')
    }
    setConfirmDelete(null)
  }

  function handleToggleDay(day: DayKey, val: boolean) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: val } }))
  }

  function handleAddTimeOff(entry: Omit<TimeOffEntry, 'id'>) {
    setTimeOffs(prev => [...prev, { ...entry, id: `t-${Date.now()}` }])
  }

  const activeDayLabel = addWindowDay ? DAY_LABELS.find(d => d.key === addWindowDay)?.label ?? '' : ''

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        {/* Page header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-lg">
          <span className="text-h3 text-text-primary">Availability</span>
          <div className="flex items-center gap-sm">
            <LocationDropdown value={location} onChange={setLocation} />
            <button type="button" className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
              Save
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2xl p-2xl">
          {/* Availability source row */}
          <div className="grid grid-cols-2 gap-lg rounded-sm border border-border p-lg">
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">
                Availability source <span className="text-danger">*</span>
              </label>
              <SourceDropdown value={availabilitySource} onChange={handleSourceChange} />
            </div>
            {availabilitySource === 'birdeye' && (
              <div className="flex flex-col gap-xs">
                <label className="text-small text-text-secondary">
                  Select provider <span className="text-danger">*</span>
                </label>
                <DropdownField
                  label=""
                  options={PROVIDER_OPTIONS}
                  value={provider}
                  onChange={setProvider}
                />
              </div>
            )}
          </div>

          {availabilitySource === 'pms' ? (
            /* PMS syncing state */
            <div className="flex items-center gap-sm rounded-sm border border-blue-200 bg-blue-50 px-lg py-md">
              <Info className="size-5 shrink-0 text-blue-500" strokeWidth={1.6} absoluteStrokeWidth />
              <p className="text-body text-blue-700">Fetching data from the PMS. This may take some time.</p>
            </div>
          ) : (
            <>
              {/* Manage availability section */}
              <div>
                <h2 className="text-[16px] text-text-primary">Manage availability</h2>
                <p className="mt-xs text-small text-text-secondary">
                  Define each provider's availability and appointment types. These are not actual appointments — they are the rules the booking agent uses to find and offer open slots.
                </p>
              </div>

              {/* Day rows */}
              <div className="flex flex-col divide-y divide-border rounded-sm border border-border">
                {DAY_LABELS.map(({ key, label }) => {
                  const day = schedule[key]
                  return (
                    <div key={key} className="flex items-center gap-lg px-lg py-md">
                      <span className="w-8 shrink-0 text-body text-text-primary">{label}</span>

                      {day.enabled ? (
                        <div className="flex flex-1 flex-wrap items-start gap-sm">
                          {day.windows.map(win => (
                            <div
                              key={win.id}
                              className="group relative flex min-w-[160px] flex-col gap-xs rounded-sm border-l-[3px] border-primary bg-primary/5 px-sm py-xs"
                            >
                              <button
                                type="button"
                                onClick={() => requestDeleteWindow(key, win.id)}
                                className="absolute right-1 top-1 hidden size-5 items-center justify-center rounded text-text-tertiary hover:text-danger group-hover:flex"
                              >
                                <X className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                              </button>
                              <span className="text-small text-primary">{win.startTime} - {win.endTime}</span>
                              <span className="text-xs text-text-secondary">{win.operatory}</span>
                              <span className="inline-flex w-fit items-center rounded-sm border border-border bg-surface px-sm py-0.5 text-xs text-text-secondary">
                                {win.appointmentType}
                              </span>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setAddWindowDay(key)}
                            className="flex h-8 items-center gap-xs rounded-sm border border-dashed border-border px-sm text-body text-text-secondary hover:border-primary hover:text-primary"
                          >
                            <Plus className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                            Add window
                          </button>
                        </div>
                      ) : (
                        <span className="flex-1 text-body text-text-tertiary">Day off</span>
                      )}

                      <div className="shrink-0">
                        <Toggle value={day.enabled} onChange={val => handleToggleDay(key, val)} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time off and closures */}
              <div className="flex flex-col gap-lg">
                <div className="flex items-start justify-between gap-lg">
                  <div>
                    <h2 className="text-[16px] text-text-primary">Time off and closures</h2>
                    <p className="mt-xs text-small text-text-secondary">
                      Block full days when the clinic is closed or a provider is unavailable. The agent won't offer slots on these dates, overriding the weekly booking windows.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTimeOffDrawer(true)}
                    className="flex h-[34px] shrink-0 items-center gap-xs rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                  >
                    <Plus className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                    Add time off
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-border rounded-sm border border-border">
                  {timeOffs.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between px-lg py-md">
                      <div className="flex flex-col gap-xs">
                        <span className="text-body text-text-primary">{entry.date}</span>
                        <span className="text-small text-text-secondary">{entry.label}</span>
                      </div>
                      <div className="flex items-center gap-sm">
                        {entry.allProviders && (
                          <span className="rounded-sm bg-chip-warning-bg px-sm py-0.5 text-xs text-chip-warning-text">All providers</span>
                        )}
                        {entry.allLocations && (
                          <span className="rounded-sm bg-chip-warning-bg px-sm py-0.5 text-xs text-chip-warning-text">All locations</span>
                        )}
                        <button type="button" className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover">
                          <Pencil className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDeleteTimeOff(entry.id)}
                          className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover hover:text-danger"
                        >
                          <Trash2 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Drawers */}
      <AddWindowDrawer
        open={addWindowDay !== null}
        dayLabel={activeDayLabel}
        onClose={() => setAddWindowDay(null)}
        onSave={handleAddWindow}
      />
      <AddTimeOffDrawer
        open={showTimeOffDrawer}
        onClose={() => setShowTimeOffDrawer(false)}
        onSave={handleAddTimeOff}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this item?"
        message="This action cannot be undone. The window or time-off entry will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
