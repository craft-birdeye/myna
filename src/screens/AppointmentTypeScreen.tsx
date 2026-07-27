import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable, HeaderSearchField, Icon, InfoTooltip, SelectMenu, Toast, TopNav, type Column, type SelectOption } from '../components'

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps { value: boolean; onChange: (v: boolean) => void }
function Toggle({ value, onChange }: ToggleProps) {
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

// ── Data ──────────────────────────────────────────────────────────────────────
interface ApptTypeRow {
  name: string
  description: string
  duration: string
  providers: string
  pmsMapping: string
  recognitionHints: string
  recognitionExtra?: string
  active: boolean
  dimmed?: boolean
  [key: string]: string | boolean | undefined
}

const APPT_TYPES: ApptTypeRow[] = [
  { name: 'New Patient Exam',         description: 'Comprehensive initial exam + X-rays',       duration: '60 min', providers: 'Dr. Sarah Chen, +1 more', pmsMapping: 'D0210', recognitionHints: '"new patient"', recognitionExtra: '+1 more', active: true  },
  { name: 'Routine Cleaning',         description: 'Prophylaxis + polishing',                   duration: '45 min', providers: 'All',                     pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: true  },
  { name: 'Emergency Visit',          description: 'Urgent pain or dental injury',              duration: '30 min', providers: 'Dr. Marcus Rivera',       pmsMapping: 'D0210', recognitionHints: '"emergency"',    recognitionExtra: '+1 more', active: true  },
  { name: 'Invisalign Consultation',  description: 'Orthodontic assessment + treatment plan',  duration: '60 min', providers: 'Dr. Sarah Chen, +1 more', pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: true  },
  { name: 'Tooth Filling',            description: 'Composite or amalgam restoration',          duration: '45 min', providers: 'Dr. Marcus Rivera',       pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: true  },
  { name: 'Whitening Treatment',      description: 'In-office bleaching session',               duration: '60 min', providers: 'Dr. Sarah Chen, +1 more', pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: false },
  { name: 'Invisalign Consultation',  description: 'Orthodontic assessment + treatment plan',  duration: '45 min', providers: 'All',                     pmsMapping: 'D0210', recognitionHints: '"emergency"',    recognitionExtra: '+1 more', active: true  },
  { name: 'Emergency Visit',          description: 'Urgent pain or dental injury',              duration: '60 min', providers: 'Dr. Marcus Rivera',       pmsMapping: 'D0210', recognitionHints: '"new patient"',  recognitionExtra: '+1 more', active: true  },
  { name: 'Routine Cleaning',         description: 'Prophylaxis + polishing',                   duration: '45 min', providers: 'All',                     pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: true  },
  { name: 'New Patient Exam',         description: 'Comprehensive initial exam + X-rays',       duration: '60 min', providers: 'Dr. Marcus Rivera',       pmsMapping: 'D0210', recognitionHints: '"emergency"',    recognitionExtra: '+1 more', active: true  },
  { name: 'Tooth Filling',            description: 'Composite or amalgam restoration',          duration: '45 min', providers: 'All',                     pmsMapping: 'D0210', recognitionHints: '"filling"',                              active: true  },
]

// ── Dropdown data ─────────────────────────────────────────────────────────────
const AT_LOCATION_OPTIONS: SelectOption[] = [
  { value: 'sf',   label: 'San Francisco, CA' },
  { value: 'sj',   label: 'San Jose, CA' },
  { value: 'oak',  label: 'Oakland, CA' },
  { value: 'pa',   label: 'Palo Alto, CA' },
  { value: 'berk', label: 'Berkeley, CA' },
]

const AT_DURATION_OPTIONS: SelectOption[] = [
  { value: '15',  label: '15 min' },
  { value: '30',  label: '30 min' },
  { value: '45',  label: '45 min' },
  { value: '60',  label: '60 min' },
  { value: '90',  label: '90 min' },
  { value: '120', label: '2 hr' },
]

const AT_PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'all',     label: 'All providers' },
  { value: 'chen',    label: 'Dr. Sarah Chen' },
  { value: 'rivera',  label: 'Dr. Marcus Rivera' },
  { value: 'torres',  label: 'Amy Torres' },
  { value: 'kim',     label: 'Dr. James Kim' },
]

const AT_MAPPING_TYPE_OPTIONS: SelectOption[] = [
  { value: 'none',  label: 'None' },
  { value: 'appt',  label: 'Appointment type' },
  { value: 'proc',  label: 'Procedure code' },
]

const AT_PMS_APPT_OPTIONS: SelectOption[] = [
  { value: 'd0120', label: 'D0120 – Periodic oral evaluation' },
  { value: 'd0150', label: 'D0150 – Comprehensive oral evaluation' },
  { value: 'd0210', label: 'D0210 – Periapical radiographic image' },
  { value: 'd0220', label: 'D0220 – Bitewing radiographic image' },
  { value: 'd1110', label: 'D1110 – Prophylaxis, adult' },
  { value: 'd1120', label: 'D1120 – Prophylaxis, child' },
  { value: 'd2140', label: 'D2140 – Amalgam restoration, 1 surface' },
  { value: 'd2391', label: 'D2391 – Composite resin, 1 surface' },
  { value: 'd9310', label: 'D9310 – Consultation, diagnostic service' },
]

// ── DropdownField ─────────────────────────────────────────────────────────────
interface ATDropdownFieldProps {
  label: string
  required?: boolean
  infoIcon?: boolean
  tooltip?: string
  options: SelectOption[]
  value: string[]
  multi?: boolean
  searchable?: boolean
  placeholder?: string
  onChange: (v: string[]) => void
}
function ATDropdownField({ label, required, infoIcon, tooltip, options, value, multi = false, searchable, placeholder = 'Select', onChange }: ATDropdownFieldProps) {
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
          onClick={() => setOpen(o => !o)}
          className={`flex h-9 w-full items-center justify-between rounded-sm border px-md text-body text-text-primary transition-colors hover:bg-surface-hover ${open ? 'border-primary' : 'border-border'}`}
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
              searchable={searchable}
              onChange={(v) => { onChange(v); if (!multi) setOpen(false) }}
              onApply={() => setOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  onClose: () => void
}
function ApptTypeDrawer({ open, mode, onClose }: DrawerProps) {
  const isEdit = mode === 'edit'

  const [displayName, setDisplayName] = useState(isEdit ? 'New Patient Exam' : '')
  const [description, setDescription] = useState(isEdit ? 'Comprehensive initial exam + X-rays' : '')
  const [pmsExpanded, setPmsExpanded] = useState(isEdit)
  const [tags, setTags] = useState<string[]>(isEdit ? ['new patient', 'first visit'] : [])
  const [tagInput, setTagInput] = useState('')

  const [location,    setLocation]    = useState<string[]>(isEdit ? ['sf']    : [])
  const [duration,    setDuration]    = useState<string[]>(isEdit ? ['60']    : [])
  const [providers,   setProviders]   = useState<string[]>(isEdit ? ['chen']  : [])
  const [mappingType, setMappingType] = useState<string[]>(isEdit ? ['appt']  : ['none'])
  const [pmsApptType, setPmsApptType] = useState<string[]>(isEdit ? ['d0150'] : [])

  function handleMappingTypeChange(v: string[]) {
    setMappingType(v)
    if (v[0] !== 'appt') setPmsApptType([])
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags(t => [...t, tagInput.trim()])
      setTagInput('')
    }
  }
  function removeTag(idx: number) {
    setTags(t => t.filter((_, i) => i !== idx))
  }

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
            <span className="text-h3 text-text-primary">{isEdit ? 'Edit' : 'Create new'}</span>
          </div>
          <button type="button" className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">
          <ATDropdownField label="Location" required infoIcon tooltip="The locations where this appointment type can be booked. Leave blank to make it available everywhere." options={AT_LOCATION_OPTIONS} value={location} onChange={setLocation} />

          {/* Display name */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Display name <span className="text-danger">*</span></label>
            <input
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none"
              placeholder="Enter"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Description <span className="text-danger">*</span></label>
            <textarea
              className="min-h-[80px] rounded-sm border border-border px-md py-sm text-body text-text-primary focus:border-primary focus:outline-none"
              placeholder="Enter"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <ATDropdownField label="Duration" options={AT_DURATION_OPTIONS} value={duration} onChange={setDuration} placeholder="Select duration" />
          <ATDropdownField label="Eligible providers" options={AT_PROVIDER_OPTIONS} value={providers} multi onChange={setProviders} placeholder="Select providers" />

          {/* Recognition hints */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Recognition hints <span className="text-danger">*</span></label>
            <div className="flex min-h-[36px] flex-wrap items-center gap-xs rounded-sm border border-border px-md py-xs focus-within:border-primary">
              {tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-xs rounded-full bg-surface-selected px-sm py-0.5 text-small text-text-primary">
                  {tag}
                  <button type="button" onClick={() => removeTag(i)} className="text-text-tertiary hover:text-text-primary">
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
              <input
                className="min-w-[120px] flex-1 text-body text-text-primary outline-none"
                placeholder={tags.length === 0 ? 'Type a phrase and press enter' : ''}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
            <p className="text-xs text-text-tertiary">Phrases that assist the agent in identifying this type</p>
          </div>

          {/* PMS mapping accordion */}
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
                <ATDropdownField
                  label="Mapping type"
                  options={AT_MAPPING_TYPE_OPTIONS}
                  value={mappingType}
                  onChange={handleMappingTypeChange}
                />
                {mappingType[0] === 'appt' && (
                  <ATDropdownField
                    label="PMS appointment type"
                    options={AT_PMS_APPT_OPTIONS}
                    value={pmsApptType}
                    onChange={setPmsApptType}
                    placeholder="Select PMS code"
                    searchable
                  />
                )}
                <p className="text-small text-text-secondary">Links this type to a code in your PMS. The mapped code's duration sets the maximum allowed below.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── AppointmentTypeScreen ─────────────────────────────────────────────────────
export function AppointmentTypeScreen() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMap, setActiveMap] = useState<Record<number, boolean>>(
    Object.fromEntries(APPT_TYPES.map((r, i) => [i, r.active]))
  )

  const visibleApptTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return APPT_TYPES
    return APPT_TYPES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.providers.toLowerCase().includes(q),
    )
  }, [searchQuery])

  const COLUMNS: Column<ApptTypeRow>[] = [
    {
      key: 'name', label: 'Name', width: 250, sortable: true,
      render: (_v, row) => (
        <div>
          <div className="text-body text-text-primary">{row.name as string}</div>
          <div className="text-xs text-text-tertiary">{row.description as string}</div>
        </div>
      ),
    },
    { key: 'duration',      label: 'Duration',          width: 100, sortable: true },
    { key: 'providers',     label: 'Providers',         width: 180, sortable: true },
    { key: 'pmsMapping',    label: 'PMS mapping',       width: 140, sortable: true },
    {
      key: 'recognitionHints', label: 'Recognition hints', width: 200, sortable: true,
      render: (_v, row) => (
        <span>
          {row.recognitionHints as string}
          {row.recognitionExtra && (
            <span className="text-text-tertiary">, {row.recognitionExtra as string}</span>
          )}
        </span>
      ),
    },
    {
      key: 'active', label: 'Active', width: 80, sortable: true,
      render: (_v, row) => {
        const idx = APPT_TYPES.indexOf(row as ApptTypeRow)
        return (
          <Toggle
            value={activeMap[idx] ?? false}
            onChange={v => setActiveMap(m => ({ ...m, [idx]: v }))}
          />
        )
      },
    },
  ]

  const rowMenuItems = [
    { label: 'Edit',   onClick: () => setEditDrawerOpen(true) },
    { label: 'Delete', onClick: () => {} },
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
            <span className="text-h3 text-text-primary">9 Appointment types</span>
          </div>
          <div className="flex items-center gap-sm">
            <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
            <select className="h-9 rounded-sm border border-border-selected bg-surface pl-md pr-2xl text-body text-text-primary hover:bg-surface-l2 focus:outline-none">
              <option>All locations</option>
            </select>
            <button
              type="button"
              onClick={() => setToastVisible(true)}
              className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              <Icon name="refresh" size={18} />
              Sync from PMS
            </button>
            <button
              type="button"
              onClick={() => setCreateDrawerOpen(true)}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Create new
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-2xl pb-2xl">
          <DataTable
            columns={COLUMNS}
            data={visibleApptTypes}
            rowMenuItems={rowMenuItems}
            rowClassName={() => ''}
          />
        </div>
      </div>

      <ApptTypeDrawer open={createDrawerOpen} mode="create" onClose={() => setCreateDrawerOpen(false)} />
      <ApptTypeDrawer open={editDrawerOpen}   mode="edit"   onClose={() => setEditDrawerOpen(false)}   />
    </div>
  )
}
