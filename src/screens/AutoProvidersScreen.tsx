import { useEffect, useRef, useState } from 'react'
import { DataTable, Icon, SelectMenu, Toast, TopNav, type Column, type SelectOption } from '../components'

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
interface AdvisorRow {
  initials: string
  name: string
  role: string
  bay: string
  serviceType: string
  location: string
  available: boolean
  [key: string]: string | boolean | undefined
}

const ADVISORS: AdvisorRow[] = [
  { initials: 'MJ', name: 'Mike Johnson',    role: 'Service advisor',  bay: 'Bay 1, +1 more',    serviceType: 'Oil change, +2 more',          location: 'San Francisco, CA', available: true  },
  { initials: 'SR', name: 'Sarah Rodriguez', role: 'Service advisor',  bay: 'Bay 3',              serviceType: 'Tire rotation',                location: 'San Jose, CA',      available: false },
  { initials: 'DL', name: 'David Lee',       role: 'Master technician',bay: 'Bay 1, +2 more',    serviceType: 'Engine diagnostic',            location: 'San Francisco, CA', available: false },
  { initials: 'AK', name: 'Alex Kim',        role: 'Technician',       bay: 'Bay 4',              serviceType: 'Brake inspection',             location: 'San Francisco, CA', available: true  },
  { initials: 'TW', name: 'Tom Wilson',      role: 'Service manager',  bay: 'Bay 2',              serviceType: 'Oil change, +3 more',          location: 'Oakland, CA',       available: true  },
  { initials: 'JP', name: 'Jessica Park',    role: 'Estimator',        bay: 'Bay 1',              serviceType: 'Collision estimate',           location: 'San Jose, CA',      available: false },
  { initials: 'CR', name: 'Carlos Reyes',    role: 'Technician',       bay: 'Bay 3',              serviceType: 'Transmission service',         location: 'San Francisco, CA', available: true  },
  { initials: 'NP', name: 'Nina Patel',      role: 'Service advisor',  bay: 'Bay 2, +1 more',    serviceType: 'Multi-point inspection, +1 more', location: 'Palo Alto, CA',  available: true  },
  { initials: 'BT', name: 'Brian Torres',    role: 'Master technician',bay: 'Bay 5',              serviceType: 'Engine diagnostic, +2 more',   location: 'San Francisco, CA', available: false },
]

const LOCATION_OPTIONS: SelectOption[] = [
  { value: 'sf',   label: 'San Francisco, CA' },
  { value: 'sj',   label: 'San Jose, CA' },
  { value: 'oak',  label: 'Oakland, CA' },
  { value: 'pa',   label: 'Palo Alto, CA' },
  { value: 'berk', label: 'Berkeley, CA' },
]

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'advisor',    label: 'Service advisor' },
  { value: 'technician', label: 'Technician' },
  { value: 'master',     label: 'Master technician' },
  { value: 'manager',    label: 'Service manager' },
  { value: 'estimator',  label: 'Estimator' },
  { value: 'porter',     label: 'Porter' },
]

const BAY_OPTIONS: SelectOption[] = [
  { value: 'bay1', label: 'Bay 1' },
  { value: 'bay2', label: 'Bay 2' },
  { value: 'bay3', label: 'Bay 3' },
  { value: 'bay4', label: 'Bay 4' },
  { value: 'bay5', label: 'Bay 5' },
  { value: 'bay6', label: 'Bay 6' },
]

const SERVICE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'oil',          label: 'Oil change' },
  { value: 'tire',         label: 'Tire rotation' },
  { value: 'brake',        label: 'Brake inspection' },
  { value: 'diagnostic',   label: 'Engine diagnostic' },
  { value: 'transmission', label: 'Transmission service' },
  { value: 'inspection',   label: 'Multi-point inspection' },
  { value: 'collision',    label: 'Collision estimate' },
]

const DMS_SYSTEM_OPTIONS: SelectOption[] = [
  { value: 'cdk',        label: 'CDK Global' },
  { value: 'reynolds',   label: 'Reynolds & Reynolds' },
  { value: 'dealersocket', label: 'DealerSocket' },
  { value: 'tekion',     label: 'Tekion' },
  { value: 'automate',   label: 'Auto/Mate' },
]

const DMS_ADVISOR_OPTIONS: Record<string, SelectOption[]> = {
  cdk: [
    { value: 'cdk-001', label: 'CDK-001 – Mike Johnson (Advisor)' },
    { value: 'cdk-002', label: 'CDK-002 – Sarah Rodriguez (Advisor)' },
    { value: 'cdk-003', label: 'CDK-003 – David Lee (Technician)' },
    { value: 'cdk-004', label: 'CDK-004 – Alex Kim (Technician)' },
  ],
  reynolds: [
    { value: 'rr-001', label: 'RR-001 – Mike Johnson' },
    { value: 'rr-002', label: 'RR-002 – Sarah Rodriguez' },
    { value: 'rr-003', label: 'RR-003 – David Lee' },
  ],
  dealersocket: [
    { value: 'ds-001', label: 'DS-001 – Mike Johnson' },
    { value: 'ds-002', label: 'DS-002 – Alex Kim' },
  ],
  tekion: [
    { value: 'tek-001', label: 'TEK-001 – Mike Johnson' },
    { value: 'tek-002', label: 'TEK-002 – Tom Wilson' },
  ],
  automate: [
    { value: 'am-001', label: 'AM-001 – Mike Johnson' },
  ],
}

// ── DropdownField ─────────────────────────────────────────────────────────────
interface DropdownFieldProps {
  label: string
  required?: boolean
  infoIcon?: boolean
  options: SelectOption[]
  value: string[]
  multi?: boolean
  placeholder?: string
  onChange: (v: string[]) => void
}
function DropdownField({ label, required, infoIcon, options, value, multi = false, placeholder = 'Select', onChange }: DropdownFieldProps) {
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
function EditDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('Mike')
  const [lastName, setLastName] = useState('Johnson')
  const [bookable, setBookable] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)

  const [location,    setLocation]    = useState(['sf'])
  const [role,        setRole]        = useState(['advisor'])
  const [bays,        setBays]        = useState(['bay1', 'bay2'])
  const [serviceTypes, setServiceTypes] = useState(['oil', 'tire', 'brake'])
  const [dmsSystem,   setDmsSystem]   = useState(['cdk'])
  const [dmsAdvisor,  setDmsAdvisor]  = useState(['cdk-001'])

  function handleDmsSystemChange(v: string[]) {
    setDmsSystem(v)
    setDmsAdvisor([])
  }

  const dmsAdvisorOptions = DMS_ADVISOR_OPTIONS[dmsSystem[0]] ?? []
  const selectedAdvisorLabel = dmsAdvisorOptions.find(o => o.value === dmsAdvisor[0])?.label

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
            <span className="text-h3 text-text-primary">Edit</span>
          </div>
          <button type="button" className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
            Save
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">First name <span className="text-danger">*</span></label>
              <input className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-secondary">Last name <span className="text-danger">*</span></label>
              <input className="h-9 rounded-sm border border-border px-md text-body text-text-primary focus:border-primary focus:outline-none" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <DropdownField label="Location" required options={LOCATION_OPTIONS} value={location} onChange={setLocation} />
          <DropdownField label="Role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
          <DropdownField label="Service bay" options={BAY_OPTIONS} value={bays} multi onChange={setBays} placeholder="Select bays" />
          <DropdownField label="Service type" infoIcon options={SERVICE_TYPE_OPTIONS} value={serviceTypes} multi onChange={setServiceTypes} placeholder="Select service types" />

          <div className="flex items-center justify-between gap-md">
            <div className="flex flex-col gap-xs">
              <span className="text-body text-text-primary">Bookable by customers</span>
              <span className="text-small text-text-secondary">This advisor will be visible to the booking agent and customers</span>
            </div>
            <Toggle value={bookable} onChange={setBookable} />
          </div>

          <div className="rounded-sm border border-border">
            <button type="button" className="flex w-full items-center justify-between px-md py-sm" onClick={() => setDmsExpanded(v => !v)}>
              <span className="text-body text-text-primary">DMS mapping</span>
              <Icon name={dmsExpanded ? 'expand_less' : 'expand_more'} size={18} className="text-text-icon" />
            </button>
            {dmsExpanded && (
              <div className="flex flex-col gap-md border-t border-border p-md">
                <div className="grid grid-cols-2 gap-md">
                  <DropdownField label="DMS system" options={DMS_SYSTEM_OPTIONS} value={dmsSystem} onChange={handleDmsSystemChange} />
                  <DropdownField
                    label={`Advisor in ${DMS_SYSTEM_OPTIONS.find(o => o.value === dmsSystem[0])?.label ?? 'DMS'}`}
                    options={dmsAdvisorOptions}
                    value={dmsAdvisor}
                    onChange={setDmsAdvisor}
                    placeholder="Select advisor"
                  />
                </div>
                {selectedAdvisorLabel && (
                  <div className="flex items-center gap-sm rounded-sm border border-blue-200 bg-blue-50 px-md py-sm">
                    <Icon name="info" size={16} className="text-blue-500" />
                    <span className="text-small text-blue-700">Mapped to {selectedAdvisorLabel}</span>
                  </div>
                )}
                <p className="text-small text-text-secondary">Maps this advisor to their record in your dealer management system.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── AutoProvidersScreen ───────────────────────────────────────────────────────
export function AutoProvidersScreen() {
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [availableMap, setAvailableMap] = useState<Record<number, boolean>>(
    Object.fromEntries(ADVISORS.map((a, i) => [i, a.available]))
  )
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [locationOpen,   setLocationOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sortedAdvisors = [...ADVISORS].sort((a, b) => {
    const aAvail = availableMap[ADVISORS.indexOf(a)] ?? a.available
    const bAvail = availableMap[ADVISORS.indexOf(b)] ?? b.available
    return (bAvail ? 1 : 0) - (aAvail ? 1 : 0)
  })

  const q = searchQuery.trim().toLowerCase()
  const visibleAdvisors = q
    ? sortedAdvisors.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q),
      )
    : sortedAdvisors

  const COLUMNS: Column<AdvisorRow>[] = [
    {
      key: 'name', label: 'Advisor / technician', width: 240, sortable: true,
      render: (_v, row) => (
        <div className="flex items-center gap-sm">
          <div className="flex size-8 items-center justify-center rounded-full bg-surface-selected text-small text-text-secondary">
            {row.initials as string}
          </div>
          <span className="text-body text-text-primary">{row.name as string}</span>
        </div>
      ),
    },
    { key: 'role',        label: 'Role',         width: 160, sortable: true },
    {
      key: 'bay', label: 'Service bay', width: 160, sortable: true,
      render: (_v, row) => {
        const parts = (row.bay as string).split(', ')
        return <span>{parts[0]}{parts[1] && <span className="text-text-tertiary">, {parts[1]}</span>}</span>
      },
    },
    {
      key: 'serviceType', label: 'Service type', width: 220, sortable: true,
      render: (_v, row) => {
        const parts = (row.serviceType as string).split(', ')
        return <span>{parts[0]}{parts[1] && <span className="text-text-tertiary">, {parts[1]}</span>}</span>
      },
    },
    { key: 'location',    label: 'Location',     width: 180, sortable: true },
    {
      key: 'available', label: 'Available', width: 100, sortable: true,
      render: (_v, row) => {
        const idx = ADVISORS.indexOf(row as AdvisorRow)
        return <Toggle value={availableMap[idx] ?? false} onChange={v => setAvailableMap(m => ({ ...m, [idx]: v }))} />
      },
    },
  ]

  const rowMenuItems = [
    { label: 'Edit',               onClick: () => setEditDrawerOpen(true) },
    { label: 'Setup availability', onClick: () => {}, icon: 'open_in_new' as const },
  ]

  return (
    <div className="flex h-full flex-col">
      <Toast message="Syncing from DMS — your data will be updated in a few minutes." visible={toastVisible} onClose={() => setToastVisible(false)} />
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <span className="text-h3 text-text-primary">{sortedAdvisors.length} Providers</span>
            <span className="text-small text-text-secondary">Manage your service advisors and technicians here</span>
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
                  {locationFilter.length === 0 ? 'All locations' : (LOCATION_OPTIONS.find(o => o.value === locationFilter[0])?.label ?? 'All locations')}
                </span>
                <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
              </button>
              {locationOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setLocationOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+4px)] z-[60] w-full">
                    <SelectMenu options={LOCATION_OPTIONS} value={locationFilter} onChange={v => { setLocationFilter(v); setLocationOpen(false) }} />
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToastVisible(true)}
              className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              <Icon name="refresh" size={18} />
              Sync from DMS
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-md px-2xl py-md pb-2xl">
          {!bannerDismissed && (
            <div className="flex items-start gap-sm rounded-sm border border-primary/30 bg-primary/5 px-md py-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
              <p className="flex-1 text-small text-text-primary">
                Update display names, map service bays, set bookable status, and assign service types. To add or remove an advisor, do it in your DMS and click Sync.
              </p>
              <button type="button" onClick={() => setBannerDismissed(true)} className="shrink-0 text-text-icon hover:text-text-primary">
                <Icon name="close" size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <DataTable columns={COLUMNS} data={visibleAdvisors} rowMenuItems={rowMenuItems} rowClassName={() => ''} />
          </div>
        </div>
      </div>

      <EditDrawer open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} />
    </div>
  )
}
