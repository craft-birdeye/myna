import { useEffect, useRef, useState } from 'react'
import { DataTable, HeaderSearchField, Icon, InfoTooltip, SelectMenu, Toast, TopNav, type Column, type SelectOption } from '../components'

// ── Toggle ───────────────────────────────────────────────────────────────────
interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
}
function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-surface-selected'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-1'}`}
      />
    </button>
  )
}

// ── Provider data ─────────────────────────────────────────────────────────────
interface ProviderRow {
  initials: string
  name: string
  role: string
  operatory: string
  appointmentType: string
  location: string
  available: boolean
  dimmed?: boolean
  [key: string]: string | boolean | undefined
}

const PROVIDERS: ProviderRow[] = [
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'General Dentist',   operatory: 'Operatory 1, +1 more', appointmentType: 'New patient exam, +2 more',       location: 'San Francisco, CA', available: true  },
  { initials: 'MR', name: 'Dr. Marcus Rivera', role: 'Orthodontist',       operatory: 'Operatory 3',          appointmentType: 'Invisalign Consultation',         location: 'San Fran...',       available: false },
  { initials: 'AT', name: 'Amy Torres',         role: 'Dental Hygienist',   operatory: 'Operatory 1, +2 more', appointmentType: 'Routine Cleaning',                location: 'San Fran...',       available: false },
  { initials: 'JK', name: 'Dr. James Kim',      role: 'Oral Surgeon',       operatory: 'Operatory 3',          appointmentType: 'New patient exam',                location: 'San Francisco, CA', available: true  },
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'eclinicalworks.com', operatory: 'Operatory 3',          appointmentType: 'Invisalign Consultation',         location: 'San Francisco, CA', available: false },
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'nextgen.com',        operatory: 'Operatory 3',          appointmentType: 'New patient exam, +2 more',       location: 'San Francisco, CA', available: true  },
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'cerner.com',         operatory: 'Operatory 3',          appointmentType: 'Routine Cleaning',                location: 'San Francisco, CA', available: true  },
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'allscripts.com',     operatory: 'Operatory 3',          appointmentType: 'New patient exam',                location: 'San Francisco, CA', available: false },
  { initials: 'SC', name: 'Dr. Sarah Chen',    role: 'meditech.com',       operatory: 'Operatory 3',          appointmentType: 'Invisalign Consultation',         location: 'San Francisco, CA', available: true  },
]

// ── Dropdown data ─────────────────────────────────────────────────────────────
const LOCATION_OPTIONS: SelectOption[] = [
  { value: 'sf', label: 'San Francisco, CA' },
  { value: 'sj', label: 'San Jose, CA' },
  { value: 'oak', label: 'Oakland, CA' },
  { value: 'pa', label: 'Palo Alto, CA' },
  { value: 'berk', label: 'Berkeley, CA' },
]

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'general', label: 'General dentist' },
  { value: 'ortho', label: 'Orthodontist' },
  { value: 'hygienist', label: 'Dental hygienist' },
  { value: 'surgeon', label: 'Oral surgeon' },
  { value: 'perio', label: 'Periodontist' },
  { value: 'endo', label: 'Endodontist' },
]

const OPERATORY_OPTIONS: SelectOption[] = [
  { value: 'op1', label: 'Operatory 1' },
  { value: 'op2', label: 'Operatory 2' },
  { value: 'op3', label: 'Operatory 3' },
  { value: 'op4', label: 'Operatory 4' },
  { value: 'op5', label: 'Operatory 5' },
]

const APPT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'npe', label: 'New patient exam' },
  { value: 'cleaning', label: 'Routine cleaning' },
  { value: 'emergency', label: 'Emergency visit' },
  { value: 'invisalign', label: 'Invisalign consultation' },
  { value: 'filling', label: 'Tooth filling' },
  { value: 'whitening', label: 'Whitening treatment' },
]

const PMS_SYSTEM_OPTIONS: SelectOption[] = [
  { value: 'dentrix', label: 'Dentrix' },
  { value: 'eaglesoft', label: 'Eaglesoft' },
  { value: 'opendental', label: 'Open Dental' },
  { value: 'curve', label: 'Curve Dental' },
  { value: 'carestream', label: 'Carestream' },
]

const PMS_PROVIDER_OPTIONS: Record<string, SelectOption[]> = {
  dentrix: [
    { value: 'dtx-001', label: 'DTX-001 – Dr. Sarah Chen (General)' },
    { value: 'dtx-002', label: 'DTX-002 – Dr. Marcus Rivera (Ortho)' },
    { value: 'dtx-003', label: 'DTX-003 – Amy Torres (Hygienist)' },
    { value: 'dtx-004', label: 'DTX-004 – Dr. James Kim (Oral Surgery)' },
  ],
  eaglesoft: [
    { value: 'es-001', label: 'ES-001 – Dr. Sarah Chen' },
    { value: 'es-002', label: 'ES-002 – Dr. Marcus Rivera' },
    { value: 'es-003', label: 'ES-003 – Amy Torres' },
  ],
  opendental: [
    { value: 'od-001', label: 'OD-001 – Dr. Sarah Chen' },
    { value: 'od-002', label: 'OD-002 – Dr. Marcus Rivera' },
  ],
  curve: [
    { value: 'cv-001', label: 'CV-001 – Dr. Sarah Chen' },
    { value: 'cv-002', label: 'CV-002 – Dr. James Kim' },
  ],
  carestream: [
    { value: 'cs-001', label: 'CS-001 – Dr. Sarah Chen' },
  ],
}

// ── DropdownField ─────────────────────────────────────────────────────────────
interface DropdownFieldProps {
  label: string
  required?: boolean
  infoIcon?: boolean
  tooltip?: string
  options: SelectOption[]
  value: string[]
  multi?: boolean
  placeholder?: string
  disabled?: boolean
  onChange: (v: string[]) => void
}
function DropdownField({ label, required, infoIcon, tooltip, options, value, multi = false, placeholder = 'Select', disabled = false, onChange }: DropdownFieldProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const displayLabel = value.length === 0
    ? placeholder
    : value.length === 1
      ? (options.find(o => o.value === value[0])?.label ?? placeholder)
      : `${value.length} selected`

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center gap-xs">
        <label className="text-small text-text-secondary">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
        {infoIcon && tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`flex h-9 w-full items-center justify-between rounded-sm border px-md text-body transition-colors ${
            disabled
              ? 'cursor-not-allowed border-border bg-surface-subtle text-text-tertiary'
              : open
              ? 'border-primary text-text-primary hover:bg-surface-hover'
              : 'border-border text-text-primary hover:bg-surface-hover'
          }`}
        >
          <span className={value.length === 0 ? 'text-text-tertiary' : ''}>{displayLabel}</span>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} className="shrink-0 text-text-icon" />
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-[60] w-full">
            <SelectMenu
              options={options}
              value={value}
              multi={multi}
              onChange={(v) => { onChange(v); if (!multi) setOpen(false) }}
              onApply={() => setOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────
interface EditDrawerProps {
  open: boolean
  onClose: () => void
}
function EditDrawer({ open, onClose }: EditDrawerProps) {
  const [firstName, setFirstName] = useState('Sarah')
  const [lastName, setLastName] = useState('Chen')
  const [bookable, setBookable] = useState(true)
  const [pmsExpanded, setPmsExpanded] = useState(true)

  const [location, setLocation]       = useState(['sf'])
  const [role, setRole]               = useState(['general'])
  const [operatories, setOperatories] = useState(['op1', 'op2'])
  const [apptTypes, setApptTypes]     = useState(['npe', 'cleaning', 'invisalign'])
  const [pmsSystem, setPmsSystem]     = useState(['dentrix'])
  const [pmsProvider, setPmsProvider] = useState(['dtx-001'])

  // Reset provider selection when PMS system changes
  function handlePmsSystemChange(v: string[]) {
    setPmsSystem(v)
    setPmsProvider([])
  }

  const pmsProviderOptions = PMS_PROVIDER_OPTIONS[pmsSystem[0]] ?? []
  const selectedProviderLabel = pmsProviderOptions.find(o => o.value === pmsProvider[0])?.label

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[650px] flex-col bg-surface shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-lg">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
              <Icon name="arrow_back" size={18} />
            </button>
            <span className="text-h3 text-text-primary">Edit</span>
          </div>
          <button type="button" className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">
          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">First name <span className="text-danger">*</span></label>
              <input
                className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">Last name <span className="text-danger">*</span></label>
              <input
                className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>

          <DropdownField label="Location" required options={LOCATION_OPTIONS} value={location} onChange={setLocation} />
          <DropdownField label="Role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
          <DropdownField label="Operatory" options={OPERATORY_OPTIONS} value={operatories} multi onChange={setOperatories} placeholder="Select operatories" />
          <DropdownField label="Appointment type" infoIcon tooltip="The appointment types this provider can be booked for. Patients only see this provider as an option when booking one of these types." options={APPT_TYPE_OPTIONS} value={apptTypes} multi onChange={setApptTypes} placeholder="Select appointment types" />

          {/* Bookable */}
          <div className="flex items-center justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <span className="text-body text-text-primary">Bookable by patients</span>
              <span className="text-small text-text-secondary">This provider will be visible to the booking agent and patients</span>
            </div>
            <Toggle value={bookable} onChange={setBookable} />
          </div>

          {/* PMS Mapping accordion */}
          <div className="rounded-sm border border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-md py-sm"
              onClick={() => setPmsExpanded(v => !v)}
            >
              <span className="text-body text-text-primary">PMS mapping</span>
              <Icon name={pmsExpanded ? 'expand_less' : 'expand_more'} size={18} className="text-text-icon" />
            </button>
            {pmsExpanded && (
              <div className="flex flex-col gap-md border-t border-border p-md">
                <div className="grid grid-cols-2 gap-md">
                  <DropdownField
                    label="PMS system"
                    options={PMS_SYSTEM_OPTIONS}
                    value={pmsSystem}
                    onChange={handlePmsSystemChange}
                  />
                  <DropdownField
                    label={`Provider in ${PMS_SYSTEM_OPTIONS.find(o => o.value === pmsSystem[0])?.label ?? 'PMS'}`}
                    options={pmsProviderOptions}
                    value={pmsProvider}
                    onChange={setPmsProvider}
                    placeholder="Select provider"
                  />
                </div>
                {selectedProviderLabel && (
                  <div className="flex items-center gap-sm rounded-sm border border-blue-200 bg-blue-50 px-md py-sm">
                    <Icon name="info" size={16} className="text-blue-500" />
                    <span className="text-small text-blue-700">Mapped to {selectedProviderLabel}</span>
                  </div>
                )}
                <p className="text-small text-text-secondary">Maps this provider to their record in your practice management software.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── ProvidersScreen ───────────────────────────────────────────────────────────
export function ProvidersScreen() {
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [availableMap, setAvailableMap] = useState<Record<number, boolean>>(
    Object.fromEntries(PROVIDERS.map((p, i) => [i, p.available]))
  )
  const [selectedLocation, setSelectedLocation] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sort: available rows first
  const sortedProviders = [...PROVIDERS].sort((a, b) => {
    const aAvail = availableMap[PROVIDERS.indexOf(a)] ?? a.available
    const bAvail = availableMap[PROVIDERS.indexOf(b)] ?? b.available
    return (bAvail ? 1 : 0) - (aAvail ? 1 : 0)
  })

  const q = searchQuery.trim().toLowerCase()
  const visibleProviders = q
    ? sortedProviders.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q),
      )
    : sortedProviders

  const COLUMNS: Column<ProviderRow>[] = [
    {
      key: 'name', label: 'Provider', width: 220, sortable: true,
      render: (_v, row) => (
        <div className="flex items-center gap-sm">
          <div className="flex size-8 items-center justify-center rounded-full bg-surface-selected text-small text-text-secondary">
            {row.initials as string}
          </div>
          <span className="text-body text-text-primary">{row.name as string}</span>
        </div>
      ),
    },
    { key: 'role', label: 'Role', width: 160, sortable: true },
    {
      key: 'operatory', label: 'Operatory', width: 180, sortable: true,
      render: (_v, row) => {
        const parts = (row.operatory as string).split(', ')
        return (
          <span>
            {parts[0]}
            {parts[1] && <span className="text-text-tertiary">, {parts[1]}</span>}
          </span>
        )
      },
    },
    {
      key: 'appointmentType', label: 'Appointment type', width: 220, sortable: true,
      render: (_v, row) => {
        const parts = (row.appointmentType as string).split(', ')
        return (
          <span>
            {parts[0]}
            {parts[1] && <span className="text-text-tertiary">, {parts[1]}</span>}
          </span>
        )
      },
    },
    { key: 'location', label: 'Location', width: 180, sortable: true },
    {
      key: 'available', label: 'Available', width: 100, sortable: true,
      render: (_v, row) => {
        const idx = PROVIDERS.indexOf(row as ProviderRow)
        return (
          <Toggle
            value={availableMap[idx] ?? false}
            onChange={v => setAvailableMap(m => ({ ...m, [idx]: v }))}
          />
        )
      },
    },
  ]

  const rowMenuItems = [
    { label: 'Edit',               onClick: () => setEditDrawerOpen(true) },
    { label: 'Setup availability', onClick: () => {}, icon: 'open_in_new' as const },
  ]

  return (
    <div className="flex h-full flex-col">
      <Toast
        message="Syncing from PMS — your data will be updated in a few minutes."
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        {/* Page header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <span className="text-h3 text-text-primary">9 Providers</span>
            <span className="text-small text-text-secondary">Manage your business providers here</span>
          </div>
          <div className="flex items-center gap-sm">
            <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
            <div className="w-48 [&>div>div:first-child]:hidden">
              <DropdownField
                label=""
                options={LOCATION_OPTIONS}
                value={selectedLocation}
                placeholder="All locations"
                onChange={setSelectedLocation}
              />
            </div>
            <button
              type="button"
              onClick={() => setToastVisible(true)}
              className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              <Icon name="refresh" size={18} />
              Sync from PMS
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-md px-2xl pb-2xl">
          {/* Banner */}
          {!bannerDismissed && (
            <div className="flex items-start gap-sm rounded-sm border border-primary/30 bg-primary/5 px-md py-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
              <p className="flex-1 text-small text-text-primary">
                Update the display name, map operatories, set bookable status, and assign appointment types. To add or remove a provider, do it in your PMS and click Sync.
              </p>
              <button type="button" onClick={() => setBannerDismissed(true)} className="shrink-0 text-text-icon hover:text-text-primary">
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <DataTable
              columns={COLUMNS}
              data={visibleProviders}
              rowMenuItems={rowMenuItems}
              rowClassName={() => ''}
            />
          </div>
        </div>
      </div>

      <EditDrawer open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} />
    </div>
  )
}
