import { useEffect, useMemo, useRef, useState } from 'react'
import { CustomizeColumnsDrawer, DataTable, FilterPanel, Icon, SelectMenu, Toast, TopNav, type Column, type FilterField, type SelectOption } from '../components'

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
type Department = 'Service' | 'Sales' | 'Parts' | 'Body shop'

interface ServiceTypeRow {
  name: string
  description: string
  department: Department
  duration: string
  advisors: string
  dmsMapping: string
  recognitionHints: string
  recognitionExtra?: string
  dropOff?: boolean
  walkIn?: boolean
  loaner?: boolean
  active: boolean
  [key: string]: string | boolean | undefined | Department
}

const SERVICE_TYPES: ServiceTypeRow[] = [
  { name: 'Oil change (conventional)', description: 'Conventional oil + filter',              department: 'Service',   duration: '30 min',  advisors: 'All',                dmsMapping: 'LOFS',  recognitionHints: '"oil change"',    active: true,  walkIn: true  },
  { name: 'Oil change (synthetic)',     description: 'Full-synthetic oil + filter',            department: 'Service',   duration: '45 min',  advisors: 'All',                dmsMapping: 'LOFS',  recognitionHints: '"synthetic"',     active: true,  walkIn: true  },
  { name: 'Tire rotation',             description: 'Rotate all four tires to even out wear', department: 'Service',   duration: '30 min',  advisors: 'David Lee, +1 more', dmsMapping: 'TIROT', recognitionHints: '"tire rotation"', active: true,  walkIn: true  },
  { name: 'Brake service',             description: 'Inspect pads, rotors, and fluid',        department: 'Service',   duration: '60 min',  advisors: 'Alex Kim',           dmsMapping: 'BRKSP', recognitionHints: '"brakes"',        active: true,  dropOff: true },
  { name: 'Diagnostic / check engine', description: 'OBD-II scan and fault code analysis',    department: 'Service',   duration: '60 min',  advisors: 'David Lee, +1 more', dmsMapping: 'DIAG',  recognitionHints: '"check engine"',  active: true,  dropOff: true },
  { name: 'Multi-point inspection',    description: '30-point vehicle health check',          department: 'Service',   duration: '45 min',  advisors: 'All',                dmsMapping: 'MPI',   recognitionHints: '"inspection"',    active: true  },
  { name: 'Wheel alignment',           description: 'Two- or four-wheel alignment to spec',   department: 'Service',   duration: '60 min',  advisors: 'All',                dmsMapping: 'ALIGN', recognitionHints: '"alignment"',     active: true  },
  { name: 'Recall service',            description: 'Manufacturer-issued recall repair',      department: 'Service',   duration: '120 min', advisors: 'David Lee, +2 more', dmsMapping: 'RCALL', recognitionHints: '"recall"',        active: true,  dropOff: true, loaner: true },
  { name: 'Scheduled maintenance',     description: 'Factory-scheduled service interval',     department: 'Service',   duration: '90 min',  advisors: 'All',                dmsMapping: 'SCHED', recognitionHints: '"maintenance"',   active: true,  dropOff: true, loaner: true },
  { name: 'Test drive',                description: 'New or pre-owned vehicle test drive',    department: 'Sales',     duration: '45 min',  advisors: 'Tom Wilson, +1 more',dmsMapping: 'TDRV',  recognitionHints: '"test drive"',    active: true  },
  { name: 'Sales consultation',        description: 'New purchase or lease consultation',     department: 'Sales',     duration: '60 min',  advisors: 'Tom Wilson, +1 more',dmsMapping: 'SCON',  recognitionHints: '"buy"',           active: true  },
  { name: 'Trade-in appraisal',        description: 'Vehicle trade-in evaluation',            department: 'Sales',     duration: '30 min',  advisors: 'Tom Wilson, +1 more',dmsMapping: 'TRADE', recognitionHints: '"trade in"',      active: true  },
  { name: 'F&I appointment',           description: 'Finance & insurance review session',     department: 'Sales',     duration: '60 min',  advisors: 'Brian Torres',       dmsMapping: 'FANDI', recognitionHints: '"financing"',     active: true  },
  { name: 'Parts pickup',              description: 'Pre-ordered parts pickup at counter',    department: 'Parts',     duration: '15 min',  advisors: 'Parts staff',        dmsMapping: 'PTPK',  recognitionHints: '"parts"',         active: true  },
  { name: 'Body shop estimate',        description: 'Damage assessment and repair estimate',  department: 'Body shop', duration: '30 min',  advisors: 'Jessica Park',       dmsMapping: 'EST',   recognitionHints: '"estimate"',      active: true  },
]

// Extra advisors shown in tooltip on hover
// Extra recognition hints shown in tooltip on hover
const HINT_EXTRAS: Record<string, string[]> = {
  'Oil change (conventional)': ['lube service', 'lof'],
  'Oil change (synthetic)':    ['synthetic oil', 'full synthetic'],
  'Brake service':             ['brake pad', 'brake repair'],
  'Diagnostic / check engine': ['check engine light', 'fault codes'],
  'Scheduled maintenance':     ['30k service', '60k service'],
  'Sales consultation':        ['lease', 'new car'],
  'F&I appointment':           ['finance', 'insurance'],
  'Parts pickup':              ['order pickup', 'parts counter'],
  'Body shop estimate':        ['collision estimate', 'damage quote'],
}

// ── Dropdown data ─────────────────────────────────────────────────────────────
const ST_LOCATION_OPTIONS: SelectOption[] = [
  { value: 'sf',   label: 'San Francisco, CA' },
  { value: 'sj',   label: 'San Jose, CA' },
  { value: 'oak',  label: 'Oakland, CA' },
  { value: 'pa',   label: 'Palo Alto, CA' },
  { value: 'berk', label: 'Berkeley, CA' },
]

const ST_DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'service',   label: 'Service'   },
  { value: 'sales',     label: 'Sales'     },
  { value: 'parts',     label: 'Parts'     },
  { value: 'bodyshop',  label: 'Body shop' },
]

const ST_DURATION_OPTIONS: SelectOption[] = [
  { value: '15',  label: '15 min' },
  { value: '30',  label: '30 min' },
  { value: '45',  label: '45 min' },
  { value: '60',  label: '60 min' },
  { value: '90',  label: '90 min' },
  { value: '120', label: '2 hr'   },
]

const ST_ADVISOR_OPTIONS: SelectOption[] = [
  { value: 'all',    label: 'All advisors' },
  { value: 'mike',   label: 'Mike Johnson' },
  { value: 'sarah',  label: 'Sarah Rodriguez' },
  { value: 'david',  label: 'David Lee' },
  { value: 'alex',   label: 'Alex Kim' },
  { value: 'tom',    label: 'Tom Wilson' },
]

const ST_BAY_OPTIONS: SelectOption[] = [
  { value: 'none',      label: 'None'          },
  { value: 'alignment', label: 'Alignment rack' },
  { value: 'paint',     label: 'Paint booth'    },
  { value: 'express',   label: 'Express lane'   },
  { value: 'lift',      label: 'Lift bay'       },
]

const ST_MAPPING_TYPE_OPTIONS: SelectOption[] = [
  { value: 'none',      label: 'None'                 },
  { value: 'appt-type', label: 'DMS appointment type' },
  { value: 'labor-op',  label: 'Labor op code'        },
]

const ST_DMS_CODE_OPTIONS: SelectOption[] = [
  { value: 'lofs',   label: 'LOFS – Lube, oil & filter service' },
  { value: 'tirot',  label: 'TIROT – Tire rotation'             },
  { value: 'brksp',  label: 'BRKSP – Brake inspection'          },
  { value: 'diag',   label: 'DIAG – Vehicle diagnostic'         },
  { value: 'sched',  label: 'SCHED – Scheduled maintenance'     },
  { value: 'mpi',    label: 'MPI – Multi-point inspection'      },
  { value: 'align',  label: 'ALIGN – Wheel alignment'           },
  { value: 'rcall',  label: 'RCALL – Recall service'            },
  { value: 'batt',   label: 'BATT – Battery service'            },
  { value: 'tdrv',   label: 'TDRV – Test drive'                 },
  { value: 'trade',  label: 'TRADE – Trade-in appraisal'        },
  { value: 'est',    label: 'EST – Body shop estimate'          },
]

// ── DropdownField ─────────────────────────────────────────────────────────────
interface STDropdownFieldProps {
  label: string
  required?: boolean
  infoIcon?: boolean
  options: SelectOption[]
  value: string[]
  multi?: boolean
  searchable?: boolean
  placeholder?: string
  onChange: (v: string[]) => void
}
function STDropdownField({ label, required, infoIcon, options, value, multi = false, searchable, placeholder = 'Select', onChange }: STDropdownFieldProps) {
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
        {infoIcon && <Icon name="info" size={14} className="text-text-tertiary" />}
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
function ServiceTypeDrawer({ open, mode, onClose }: { open: boolean; mode: 'create' | 'edit'; onClose: () => void }) {
  const isEdit = mode === 'edit'

  const [displayName,    setDisplayName]    = useState(isEdit ? 'Oil change (conventional)' : '')
  const [description,    setDescription]    = useState(isEdit ? 'Conventional oil + filter' : '')
  const [pmsExpanded,    setPmsExpanded]    = useState(isEdit)
  const [tags,           setTags]           = useState<string[]>(isEdit ? ['oil change', 'lube service'] : [])
  const [tagInput,       setTagInput]       = useState('')

  const [location,       setLocation]       = useState<string[]>(isEdit ? ['sf']       : [])
  const [department,     setDepartment]     = useState<string[]>(isEdit ? ['service']  : [])
  const [duration,       setDuration]       = useState<string[]>(isEdit ? ['30']       : [])
  const [advisors,       setAdvisors]       = useState<string[]>(isEdit ? ['all']      : [])
  const [bay,            setBay]            = useState<string[]>(isEdit ? ['none']     : [])
  const [mappingType,    setMappingType]    = useState<string[]>(isEdit ? ['appt-type'] : ['none'])
  const [dmsCode,        setDmsCode]        = useState<string[]>(isEdit ? ['lofs']     : [])
  const [dropOff,        setDropOff]        = useState(false)
  const [estTotalTime,   setEstTotalTime]   = useState('')
  const [walkIn,         setWalkIn]         = useState(false)
  const [loaner,         setLoaner]         = useState(false)

  function handleMappingTypeChange(v: string[]) {
    setMappingType(v)
    if (v[0] === 'none') setDmsCode([])
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags(t => [...t, tagInput.trim()])
      setTagInput('')
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[650px] flex-col bg-surface shadow-modal">
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

        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">
          <STDropdownField label="Location" required infoIcon options={ST_LOCATION_OPTIONS} value={location} onChange={setLocation} />
          <STDropdownField label="Department" required options={ST_DEPARTMENT_OPTIONS} value={department} onChange={setDepartment} placeholder="Select department" />

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Display name <span className="text-danger">*</span></label>
            <input className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none" placeholder="Enter" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Description <span className="text-danger">*</span></label>
            <textarea className="min-h-[80px] rounded-sm border border-border px-md py-sm text-body text-text-primary focus:border-primary focus:outline-none" placeholder="Enter" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <STDropdownField label="Duration" options={ST_DURATION_OPTIONS} value={duration} onChange={setDuration} placeholder="Select duration" />

          {/* Drop-off mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-text-primary">Drop-off mode</p>
              <p className="text-small text-text-secondary">Customer leaves the vehicle for the service period</p>
            </div>
            <Toggle value={dropOff} onChange={v => { setDropOff(v); if (!v) setLoaner(false) }} />
          </div>

          {dropOff && (
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">Estimated total time</label>
              <input className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none" placeholder="e.g. 3–5 hours" value={estTotalTime} onChange={e => setEstTotalTime(e.target.value)} />
              <p className="text-xs text-text-tertiary">Shown to the customer as the pickup estimate</p>
            </div>
          )}

          {/* Walk-in eligible */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-text-primary">Walk-in eligible</p>
              <p className="text-small text-text-secondary">Customers can arrive without a pre-booked appointment</p>
            </div>
            <Toggle value={walkIn} onChange={setWalkIn} />
          </div>

          {/* Loaner eligible — only shown for drop-off types */}
          {dropOff && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-text-primary">Loaner eligible</p>
                <p className="text-small text-text-secondary">Offer a loaner vehicle to the customer during service</p>
              </div>
              <Toggle value={loaner} onChange={setLoaner} />
            </div>
          )}

          <STDropdownField label="Service bay requirement" options={ST_BAY_OPTIONS} value={bay} onChange={setBay} placeholder="Select bay type" />
          <STDropdownField label="Eligible advisors" options={ST_ADVISOR_OPTIONS} value={advisors} multi onChange={setAdvisors} placeholder="Select advisors" />

          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Recognition hints <span className="text-danger">*</span></label>
            <div className="flex min-h-[36px] flex-wrap items-center gap-xs rounded-sm border border-border px-md py-xs focus-within:border-primary">
              {tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-xs rounded-full bg-surface-selected px-sm py-0.5 text-small text-text-primary">
                  {tag}
                  <button type="button" onClick={() => setTags(t => t.filter((_, j) => j !== i))} className="text-text-tertiary hover:text-text-primary">
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
            <p className="text-xs text-text-tertiary">Phrases that assist the agent in identifying this appointment type</p>
          </div>

          <div className="rounded-sm border border-border">
            <button type="button" className="flex w-full items-center justify-between px-md py-sm" onClick={() => setPmsExpanded(v => !v)}>
              <span className="text-body text-text-primary">DMS mapping</span>
              <Icon name={pmsExpanded ? 'expand_less' : 'expand_more'} size={18} className="text-text-icon" />
            </button>
            {pmsExpanded && (
              <div className="flex flex-col gap-md border-t border-border p-md">
                <STDropdownField label="Mapping type" options={ST_MAPPING_TYPE_OPTIONS} value={mappingType} onChange={handleMappingTypeChange} />
                {mappingType[0] === 'appt-type' && (
                  <STDropdownField label="DMS appointment type" options={ST_DMS_CODE_OPTIONS} value={dmsCode} onChange={setDmsCode} placeholder="Select DMS type" searchable />
                )}
                {mappingType[0] === 'labor-op' && (
                  <STDropdownField label="Labor op code" options={ST_DMS_CODE_OPTIONS} value={dmsCode} onChange={setDmsCode} placeholder="Select op code" searchable />
                )}
                <p className="text-small text-text-secondary">
                  Maps to either a DMS appointment type or a labor op code — mutually exclusive. The mapped entry's labor time is used as the advisory duration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Column definitions ────────────────────────────────────────────────────────
interface STColumnDef extends Column<ServiceTypeRow> { locked?: boolean }

const ST_COLUMN_DEFS: STColumnDef[] = [
  { key: 'name',             label: 'Name',              width: 220, sortable: true, locked: true },
  { key: 'department',       label: 'Department',        width: 110, sortable: true },
  { key: 'duration',         label: 'Duration',          width: 90,  sortable: true },
  { key: 'dmsMapping',       label: 'DMS mapping',       width: 110, sortable: true },
  { key: 'recognitionHints', label: 'Recognition hints', width: 190, sortable: true },
  { key: 'active',           label: 'Active',            width: 80,  sortable: true, locked: true },
]

const FILTER_FIELDS: FilterField[] = [
  { id: 'department', label: 'Department', options: [
    { value: 'Service',   label: 'Service'   },
    { value: 'Sales',     label: 'Sales'     },
    { value: 'Parts',     label: 'Parts'     },
    { value: 'Body shop', label: 'Body shop' },
  ], multi: true },
  { id: 'duration', label: 'Duration', options: [
    { value: '15 min',  label: '15 min'  },
    { value: '30 min',  label: '30 min'  },
    { value: '45 min',  label: '45 min'  },
    { value: '60 min',  label: '60 min'  },
    { value: '90 min',  label: '90 min'  },
    { value: '120 min', label: '120 min' },
  ], multi: true },
  { id: 'active', label: 'Active status', options: [
    { value: 'true',  label: 'Active'   },
    { value: 'false', label: 'Inactive' },
  ] },
]

const ST_DEFAULT_ORDER   = ST_COLUMN_DEFS.map(c => String(c.key))
const ST_DEFAULT_VISIBLE = ST_DEFAULT_ORDER.slice()
const ST_DEF_BY_KEY      = new Map(ST_COLUMN_DEFS.map(c => [String(c.key), c]))

// ── AutoAppointmentTypeScreen ─────────────────────────────────────────────────
export function AutoAppointmentTypeScreen() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [editDrawerOpen,   setEditDrawerOpen]   = useState(false)
  const [customizeOpen,    setCustomizeOpen]    = useState(false)
  const [toastVisible,     setToastVisible]     = useState(false)
  const [locationFilter,   setLocationFilter]   = useState<string[]>([])
  const [locationOpen,     setLocationOpen]     = useState(false)
  const [colOrder,   setColOrder]   = useState<string[]>(ST_DEFAULT_ORDER)
  const [colVisible, setColVisible] = useState<string[]>(ST_DEFAULT_VISIBLE)
  const [filterOpen,     setFilterOpen]     = useState(false)
  const [hintTooltip,    setHintTooltip]    = useState<{ hints: string[]; x: number; y: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMap, setActiveMap] = useState<Record<number, boolean>>(
    Object.fromEntries(SERVICE_TYPES.map((r, i) => [i, r.active]))
  )

  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({})
  // setFilterValues is called via FilterPanel's onSelectionChange

  const filtered = useMemo(() => {
    let rows = SERVICE_TYPES
    if (filterValues['department']?.length) rows = rows.filter(r => filterValues['department'].includes(r.department))
    if (filterValues['duration']?.length)   rows = rows.filter(r => filterValues['duration'].includes(r.duration))
    if (filterValues['active']?.length)     rows = rows.filter(r => filterValues['active'].includes(String(r.active)))
    const q = searchQuery.trim().toLowerCase()
    if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.advisors.toLowerCase().includes(q))
    return rows
  }, [filterValues, searchQuery])

  const columnOptions = useMemo(
    () => colOrder.map(k => ({ key: k, label: ST_DEF_BY_KEY.get(k)!.label, locked: ST_DEF_BY_KEY.get(k)!.locked })),
    [colOrder],
  )

  const COLUMNS = useMemo<Column<ServiceTypeRow>[]>(() =>
    colOrder
      .filter(k => colVisible.includes(k))
      .map(k => {
        const def = ST_DEF_BY_KEY.get(k)!
        if (k === 'name') return { ...def, render: (_v: unknown, row: ServiceTypeRow) => (
          <div>
            <div className="text-body text-text-primary">{row.name as string}</div>
            <div className="text-xs text-text-tertiary">{row.description as string}</div>
          </div>
        )}
        if (k === 'department') return { ...def, render: (_v: unknown, row: ServiceTypeRow) =>
          <span className="text-body text-text-primary">{row.department as string}</span>
        }
        if (k === 'recognitionHints') return { ...def, render: (_v: unknown, row: ServiceTypeRow) => {
          const extras = HINT_EXTRAS[row.name as string] ?? []
          return (
            <span className="flex items-center gap-xs">
              <span>{row.recognitionHints as string}</span>
              {extras.length > 0 && (
                <span
                  className="cursor-default text-text-tertiary hover:text-primary"
                  onMouseEnter={e => { const r = (e.target as HTMLElement).getBoundingClientRect(); setHintTooltip({ hints: extras, x: r.left, y: r.bottom + 6 }) }}
                  onMouseLeave={() => setHintTooltip(null)}
                >+{extras.length} more</span>
              )}
            </span>
          )
        }}
        if (k === 'active') return { ...def, render: (_v: unknown, row: ServiceTypeRow) => {
          const idx = SERVICE_TYPES.indexOf(row as ServiceTypeRow)
          return <Toggle value={activeMap[idx] ?? false} onChange={v => setActiveMap(m => ({ ...m, [idx]: v }))} />
        }}
        return def as Column<ServiceTypeRow>
      }),
    [colOrder, colVisible, activeMap],
  )

  const rowMenuItems = [
    { label: 'Edit',   onClick: () => setEditDrawerOpen(true) },
    { label: 'Delete', onClick: () => {} },
  ]

  return (
    <div className="flex h-full flex-col">
      <Toast message="Syncing from DMS — your data will be updated in a few minutes." visible={toastVisible} onClose={() => setToastVisible(false)} />
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden bg-surface">
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <span className="text-h3 text-text-primary">{SERVICE_TYPES.length} Appointment types</span>
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
            <div className="relative w-[200px]">
              <button
                type="button"
                onClick={() => setLocationOpen(o => !o)}
                className="flex h-9 w-full items-center justify-between rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
              >
                <span className="text-text-primary">
                  {locationFilter.length === 0 ? 'All locations' : (ST_LOCATION_OPTIONS.find(o => o.value === locationFilter[0])?.label ?? 'All locations')}
                </span>
                <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
              </button>
              {locationOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setLocationOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+4px)] z-[60] w-full">
                    <SelectMenu options={ST_LOCATION_OPTIONS} value={locationFilter} onChange={v => { setLocationFilter(v); setLocationOpen(false) }} />
                  </div>
                </>
              )}
            </div>
            <button type="button" onClick={() => setToastVisible(true)} className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2">
              <Icon name="refresh" size={18} />
              Sync from DMS
            </button>
            <button type="button" onClick={() => setCreateDrawerOpen(true)} className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
              Create new
            </button>
            <button type="button" onClick={() => setCustomizeOpen(true)} className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
              <Icon name="view_column" size={20} />
            </button>
            <button type="button" onClick={() => setFilterOpen(o => !o)} className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
              <Icon name="filter_list" size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-2xl pb-2xl pt-lg">
          <DataTable columns={COLUMNS} data={filtered} rowMenuItems={rowMenuItems} rowClassName={() => ''} />
        </div>
      </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          onClose={() => setFilterOpen(false)}
          onSaveView={() => setFilterOpen(false)}
          onSelectionChange={setFilterValues}
        />
      </div>

      {/* Hint extras tooltip — fixed to escape overflow container */}
      {hintTooltip && (
        <div
          className="pointer-events-none fixed z-[120] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
          style={{ left: hintTooltip.x, top: hintTooltip.y }}
        >
          {hintTooltip.hints.map((hint, i) => (
            <div key={i} className="px-md py-xs text-body text-text-primary">
              "{hint}"
            </div>
          ))}
        </div>
      )}

      <ServiceTypeDrawer open={createDrawerOpen} mode="create" onClose={() => setCreateDrawerOpen(false)} />
      <ServiceTypeDrawer open={editDrawerOpen}   mode="edit"   onClose={() => setEditDrawerOpen(false)}   />
      <CustomizeColumnsDrawer
        open={customizeOpen}
        options={columnOptions}
        visibleKeys={colVisible}
        onClose={() => setCustomizeOpen(false)}
        onSave={(orderedKeys, visibleKeys) => { setColOrder(orderedKeys); setColVisible(visibleKeys); setCustomizeOpen(false) }}
        onRestoreDefault={() => { setColOrder(ST_DEFAULT_ORDER); setColVisible(ST_DEFAULT_VISIBLE); setCustomizeOpen(false) }}
      />
    </div>
  )
}
