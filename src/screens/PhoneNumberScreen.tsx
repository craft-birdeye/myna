import { useEffect, useRef, useState } from 'react'
import { Icon, DataTable, HeaderSearchField, SelectMenu, TopNav, type Column } from '../components'
import emptyPhoneNumberUrl from '../assets/empty-phone-number.svg'

// --- Phone number 1 data & helpers (Abhishek's version — do not delete) ---
// interface PhoneNumberRow {
//   name: string
//   phoneNumber: string
//   connection: string
//   routingMode: string
//   assignedAgents: string
//   locations: string
//   provider: string
//   [key: string]: string
// }
// 
// const DATA: PhoneNumberRow[] = [
//   { name: 'Main reception',   phoneNumber: '(202) 555-0123', connection: 'Birdeye number',  routingMode: 'AI-first', assignedAgents: 'Front desk',              locations: 'North Austin',  provider: 'Twilio'    },
//   { name: 'Schedule line',    phoneNumber: '(303) 555-0198', connection: 'Call forwarding', routingMode: 'Overflow', assignedAgents: 'Scheduling & Frontdesk', locations: 'South Austin',  provider: 'Twilio'    },
//   { name: 'Outreach',         phoneNumber: '(404) 555-0167', connection: 'SIP trunk',       routingMode: 'Overflow', assignedAgents: 'Pre-visit',              locations: 'San Francisco', provider: 'Vonage'    },
//   { name: 'Outreach',         phoneNumber: '(505) 555-0189', connection: 'Birdeye number',  routingMode: 'AI-first', assignedAgents: '-',                      locations: '-',             provider: 'Twilio'    },
//   { name: 'Patient services', phoneNumber: '(606) 555-0145', connection: 'Call forwarding', routingMode: 'IVR',      assignedAgents: 'Front desk & Waitlist',   locations: 'South Austin',  provider: 'Bandwidth' },
//   { name: 'Insurance',        phoneNumber: '(707) 555-0132', connection: 'SIP trunk',       routingMode: 'IVR',      assignedAgents: 'Front desk',              locations: '-',             provider: 'Bandwidth' },
//   { name: 'Night coverage',   phoneNumber: '(808) 555-0156', connection: 'Birdeye number',  routingMode: 'AI-first', assignedAgents: '-',                      locations: 'All locations', provider: 'Twilio'    },
//   { name: 'Toll-free main',   phoneNumber: '(909) 555-0173', connection: 'Call forwarding', routingMode: 'Overflow', assignedAgents: 'Front desk & Pre-visit',  locations: 'All locations', provider: 'Twilio'    },
//   { name: 'Insurance verify', phoneNumber: '(212) 555-0111', connection: 'Birdeye number',  routingMode: 'IVR',      assignedAgents: 'Scheduling',             locations: 'North Austin',  provider: 'Twilio'    },
//   { name: 'Reminder line',    phoneNumber: '(415) 555-0100', connection: 'SIP trunk',       routingMode: 'AI-first', assignedAgents: '-',                      locations: '-',             provider: 'Vonage'    },
//   { name: 'Billing',          phoneNumber: '(310) 555-0192', connection: 'Call forwarding', routingMode: 'IVR',      assignedAgents: 'Front desk',              locations: 'San Francisco', provider: 'Twilio'    },
// ]
// 
// const COLUMNS: Column<PhoneNumberRow>[] = [
//   { key: 'name',           label: 'Name',            sortable: true },
//   { key: 'phoneNumber',    label: 'Phone number',    sortable: true },
//   { key: 'connection',     label: 'Connection',      sortable: true },
//   { key: 'routingMode',    label: 'Routing mode',    sortable: true },
//   { key: 'assignedAgents', label: 'Assigned agents', sortable: true },
//   { key: 'locations',      label: 'Locations',       sortable: true },
//   { key: 'provider',       label: 'Provider',        sortable: true },
// ]
// 
//
// function ImportNumberButton({ onSelect }: { onSelect: (source: 'twilio' | 'sip') => void }) {
//   const [open, setOpen] = useState(false)
//   const ref = useRef<HTMLDivElement>(null)
// 
//   useEffect(() => {
//     if (!open) return
//     function handler(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [open])
// 
//   return (
//     <div className="relative" ref={ref}>
//       <button
//         type="button"
//         onClick={() => setOpen((o) => !o)}
//         className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
//       >
//         Import number
//       </button>
//       {open && (
//         <div className="absolute right-0 top-[40px] z-50 min-w-[216px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
//           <button
//             type="button"
//             onClick={() => { onSelect('twilio'); setOpen(false) }}
//             className="block w-full px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
//           >
//             From Twilio
//           </button>
//           <button
//             type="button"
//             onClick={() => { onSelect('sip'); setOpen(false) }}
//             className="block w-full px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
//           >
//             From SIP Trunk
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }
// 
// const IMPORT_TWILIO_FIELDS = [
//   { key: 'name',       label: 'Name',               type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'phone',      label: 'Phone number',       type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'twilioSid',  label: 'Twilio account SID', type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'authToken',  label: 'Auth token',         type: 'text' as const, placeholder: 'Enter input' },
// ]
// 
// const IMPORT_SIP_FIELDS = [
//   { key: 'name',       label: 'Name',               type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'phone',      label: 'Phone number',       type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'sipServer',  label: 'SIP server address',  type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'sipPort',    label: 'SIP port',            type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'username',   label: 'Username',            type: 'text' as const, placeholder: 'Enter input' },
//   { key: 'password',   label: 'Password',            type: 'text' as const, placeholder: 'Enter input' },
// ]
// --- End phone number 1 data & helpers ---


// ─── Phone number 2 ──────────────────────────────────────────────────────────

interface PhoneNumber2Row {
  name: string
  phoneNumber: string
  e164Format: string
  terminationUri: string
  transport: string
  sipUsername: string
  sipPassword: string
  connection: string
  routingMode: string
  assignedAgents: string
  provider: string
  status: string
  [key: string]: string
}


const DEFAULT_ROWS: PhoneNumber2Row[] = []

const COLUMNS2: Column<PhoneNumber2Row>[] = [
  { key: 'name',        label: 'Name',         sortable: true },
  { key: 'phoneNumber', label: 'Phone number', sortable: true },
  {
    key: 'assignedAgents', label: 'Assigned agent', sortable: true,
    render: (val) => {
      const agent = String(val ?? '').trim()
      if (!agent || agent === '—') return <span className="text-text-tertiary">—</span>
      return <span>{agent}</span>
    },
  },
]


// Mirrors AGENT_NAMES in App.tsx — kept local here to avoid a circular import
// (App.tsx renders PhoneNumber2Screen).
const AGENT_OPTIONS = [
  { value: 'Front desk agent',      label: 'Front desk agent'      },
  { value: 'Reminder agent',        label: 'Reminder agent'        },
  { value: 'Outreach agent',        label: 'Outreach agent'        },
  { value: 'Waitlist agent',        label: 'Waitlist agent'        },
  { value: 'Pre-visit agent',       label: 'Pre-visit agent'       },
  { value: 'Recall agent',          label: 'Recall agent'          },
  { value: 'Revenue agent',         label: 'Revenue agent'         },
  { value: 'Treatment plan agent',  label: 'Treatment plan agent'  },
]


function applySipFormat(raw: string, transport: string): string {
  // Strip any existing sip:/sips: prefix and ;transport=* suffix to get the bare host
  const host = raw
    .replace(/^sips?:\/?\/?/i, '')
    .replace(/;transport=\w+$/i, '')
    .trim()
  if (!host) return ''
  if (transport === 'TLS') return `sips:${host}`
  if (transport === 'TCP') return `sip:${host};transport=tcp`
  return `sip:${host}` // UDP — no transport param needed
}

function applyPhoneFormat(raw: string, format: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11) // max 11 digits (country + 10)
  if (format === '+E.164') return digits ? `+${digits}` : ''
  if (format === 'National') {
    const d = digits.slice(0, 10) // national = 10 digits
    if (d.length === 0) return ''
    if (d.length <= 3) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  // E.164: digits only
  return digits
}

const TRANSPORT_OPTIONS = [
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' },
  { value: 'TLS', label: 'TLS' },
]

const E164_FORMAT_OPTIONS = [
  { value: 'E.164',    label: 'E.164'    },
  { value: '+E.164',   label: '+E.164'   },
  { value: 'National', label: 'National' },
]

interface ImportState {
  name: string
  phoneNumber: string
  e164Format: string
  terminationUri: string
  transport: string
  sipUsername: string
  sipPassword: string
  agent: string[]
}

const EMPTY_IMPORT: ImportState = {
  name: '',
  phoneNumber: '', e164Format: 'E.164', terminationUri: '', transport: 'TCP', sipUsername: '', sipPassword: '',
  agent: [],
}

// ── Prefix-dropdown-inside-input (e.g. format selector + phone number) ──────────
interface PrefixDropdownInputProps {
  prefixOptions: { value: string; label: string }[]
  prefixValue: string
  onPrefixChange: (v: string) => void
  inputPlaceholder?: string
  inputValue: string
  inputType?: string
  onInputChange: (v: string) => void
}
function PrefixDropdownInput({
  prefixOptions, prefixValue, onPrefixChange,
  inputPlaceholder, inputValue, inputType = 'text', onInputChange,
}: PrefixDropdownInputProps) {
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

  const displayLabel = prefixOptions.find(o => o.value === prefixValue)?.label ?? prefixValue

  return (
    <div ref={ref} className="relative">
      <div className={`flex h-9 items-center rounded-sm border transition-colors focus-within:border-primary ${open ? 'border-primary' : 'border-border'}`}>
        {/* Prefix dropdown trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex shrink-0 items-center gap-xs px-md text-body text-text-primary hover:bg-surface-hover rounded-l-sm h-full"
        >
          {displayLabel}
          <Icon name={open ? 'expand_less' : 'expand_more'} size={16} className="text-text-icon" />
        </button>
        {/* Divider */}
        <span className="h-5 w-px shrink-0 bg-border" />
        {/* Text input */}
        <input
          type={inputType}
          placeholder={inputPlaceholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="h-full flex-1 rounded-r-sm bg-transparent px-md text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />
      </div>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-[60] min-w-[220px]">
          <SelectMenu
            options={prefixOptions}
            value={[prefixValue]}
            onChange={(v) => { onPrefixChange(v[0] ?? prefixValue); setOpen(false) }}
          />
        </div>
      )}
    </div>
  )
}


function DropdownField({ label, options, value, multi = false, placeholder = 'Select', disabled = false, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string[]
  multi?: boolean; placeholder?: string; disabled?: boolean; onChange: (v: string[]) => void
}) {
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
      <label className={`text-small ${disabled ? 'text-text-tertiary' : 'text-text-secondary'}`}>{label}</label>
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

function ImportDrawer({ open, initialRow, onClose, onSave }: { open: boolean; initialRow?: PhoneNumber2Row; onClose: () => void; onSave: (row: PhoneNumber2Row) => void }) {
  const isEdit = !!initialRow

  const [form, setForm] = useState<ImportState>(EMPTY_IMPORT)
  const [verified, setVerified]   = useState(false)
  const [verifying, setVerifying] = useState(false)


  useEffect(() => {
    if (!open) {
      setForm(EMPTY_IMPORT)
      setVerified(false)
      setVerifying(false)
    } else if (initialRow) {
      setForm({
        name:           initialRow.name,
        phoneNumber:    initialRow.phoneNumber,
        e164Format:     initialRow.e164Format     || 'E.164',
        terminationUri: initialRow.terminationUri || '',
        transport:      initialRow.transport      || 'TCP',
        sipUsername:    initialRow.sipUsername     || '',
        sipPassword:    initialRow.sipPassword     || '',
        agent:          initialRow.assignedAgents && initialRow.assignedAgents !== '—' ? [initialRow.assignedAgents] : [],
      })
      setVerified(true)
    }
  }, [open, initialRow])

  function handleVerify() {
    setVerifying(true)
    setTimeout(() => { setVerifying(false); setVerified(true) }, 1500)
  }

  if (!open) return null

  const canVerify = form.name.trim() !== '' && form.phoneNumber.trim() !== '' && form.terminationUri.trim() !== ''
  const canSave   = verified && form.agent.length > 0

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[80] flex h-full w-[650px] flex-col bg-surface shadow-modal">

        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-lg">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
              <Icon name="arrow_back" size={18} />
            </button>
            <span className="text-h3 text-text-primary">{isEdit ? 'Edit number' : 'Integrate using SIP trunking'}</span>
          </div>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onSave({
                name:           form.name,
                phoneNumber:    form.phoneNumber,
                e164Format:     form.e164Format,
                terminationUri: form.terminationUri,
                transport:      form.transport,
                sipUsername:    form.sipUsername,
                sipPassword:    form.sipPassword,
                connection:     'SIP trunk',
                routingMode:    '—',
                assignedAgents: form.agent[0] ?? '—',
                provider:       'Twilio',
                status:         'Active',
              })
              onClose()
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              !canSave ? 'cursor-not-allowed bg-surface-selected text-text-tertiary' : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">

          <p className="text-body text-text-secondary">Connect to your number via SIP trunking</p>

          {/* Name */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Name <span className="text-chip-danger-text">*</span></label>
            <input
              type="text"
              placeholder="e.g. Main reception"
              value={form.name}
              onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setVerified(false) }}
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Phone number with inline format selector */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Phone number <span className="text-chip-danger-text">*</span></label>
            <PrefixDropdownInput
              prefixOptions={E164_FORMAT_OPTIONS}
              prefixValue={form.e164Format}
              onPrefixChange={(v) => {
                const reformatted = applyPhoneFormat(form.phoneNumber, v)
                setForm((f) => ({ ...f, e164Format: v, phoneNumber: reformatted }))
                setVerified(false)
              }}
              inputPlaceholder={form.e164Format === 'National' ? '(415) 555-2671' : form.e164Format === '+E.164' ? '+14155552671' : '14155552671'}
              inputValue={form.phoneNumber}
              onInputChange={(v) => {
                setForm((f) => ({ ...f, phoneNumber: applyPhoneFormat(v, f.e164Format) }))
                setVerified(false)
              }}
            />
          </div>

          {/* Termination URI with inline transport selector */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Termination URI <span className="text-chip-danger-text">*</span></label>
            <PrefixDropdownInput
              prefixOptions={TRANSPORT_OPTIONS}
              prefixValue={form.transport}
              onPrefixChange={(v) => {
                const reformatted = applySipFormat(form.terminationUri, v)
                setForm((f) => ({ ...f, transport: v, terminationUri: reformatted }))
                setVerified(false)
              }}
              inputPlaceholder={
                form.transport === 'TLS' ? 'sips:example.pstn.twilio.com'
                : form.transport === 'TCP' ? 'sip:example.pstn.twilio.com;transport=tcp'
                : 'sip:example.pstn.twilio.com'
              }
              inputValue={form.terminationUri}
              onInputChange={(v) => {
                setForm((f) => ({ ...f, terminationUri: applySipFormat(v, f.transport) }))
                setVerified(false)
              }}
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={form.sipUsername}
              onChange={(e) => setForm((f) => ({ ...f, sipUsername: e.target.value }))}
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={form.sipPassword}
              onChange={(e) => setForm((f) => ({ ...f, sipPassword: e.target.value }))}
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Verify */}
          <div className="flex items-center gap-sm">
            <button
              type="button"
              disabled={!canVerify || verifying || verified}
              onClick={handleVerify}
              className={`flex h-9 items-center gap-sm rounded-sm border px-lg text-body transition-colors ${
                verified
                  ? 'cursor-default border-border bg-surface text-text-primary'
                  : !canVerify || verifying
                  ? 'cursor-not-allowed border-border bg-surface text-text-tertiary'
                  : 'border-border bg-surface text-text-primary hover:bg-surface-hover'
              }`}
            >
              {verifying ? (
                <><span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />Verifying…</>
              ) : verified ? (
                <><Icon name="check_circle" size={16} fill className="text-chip-success-text" />Verified</>
              ) : 'Verify'}
            </button>
            {!verified && !verifying && (
              <span className={`text-small ${canVerify ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                {canVerify
                  ? 'Ready to verify your SIP connection'
                  : <><span className="text-chip-danger-text">*</span>Fill in all fields above to verify</>}
              </span>
            )}
          </div>

          {/* Agent — visible only after verify */}
          {verified && (
            <>
              <p className="mt-[16px] text-body text-text-secondary">
                Assign to an agent to start routing calls.
              </p>
              <DropdownField
                label="Agent"
                options={AGENT_OPTIONS}
                value={form.agent}
                placeholder="Select agent"
                onChange={(v: string[]) => setForm((f) => ({ ...f, agent: v.slice(-1) }))}
              />
            </>
          )}

        </div>
      </div>
    </>
  )
}


// ── Call Forwarding modal data ────────────────────────────────────────────────
const CF_ALL_DATA = [
  { location: 'North Austin',       business: '(512) 555-0101', receptionist: '(512) 900-0001' },
  { location: 'South Austin',       business: '(512) 555-0102', receptionist: '(512) 900-0002' },
  { location: 'San Francisco',      business: '(415) 555-0103', receptionist: '(415) 900-0003' },
  { location: 'Palo Alto',          business: '(650) 555-0104', receptionist: '(650) 900-0004' },
  { location: 'Oakland',            business: '(510) 555-0105', receptionist: '(510) 900-0005' },
  { location: 'Berkeley',           business: '(510) 555-0106', receptionist: '(510) 900-0006' },
  { location: 'San Jose',           business: '(408) 555-0107', receptionist: '(408) 900-0007' },
  { location: 'Fremont',            business: '(510) 555-0108', receptionist: '(510) 900-0008' },
  { location: 'Santa Clara',        business: '(408) 555-0109', receptionist: '(408) 900-0009' },
  { location: 'Sunnyvale',          business: '(408) 555-0110', receptionist: '(408) 900-0010' },
  { location: 'Mountain View',      business: '(650) 555-0111', receptionist: '(650) 900-0011' },
  { location: 'Cupertino',          business: '(408) 555-0112', receptionist: '(408) 900-0012' },
  { location: 'Redwood City',       business: '(650) 555-0113', receptionist: '(650) 900-0013' },
  { location: 'Menlo Park',         business: '(650) 555-0114', receptionist: '(650) 900-0014' },
  { location: 'Walnut Creek',       business: '(925) 555-0115', receptionist: '(925) 900-0015' },
  { location: 'Concord',            business: '(925) 555-0116', receptionist: '(925) 900-0016' },
  { location: 'Richmond',           business: '(510) 555-0117', receptionist: '(510) 900-0017' },
  { location: 'Hayward',            business: '(510) 555-0118', receptionist: '(510) 900-0018' },
  { location: 'San Mateo',          business: '(650) 555-0119', receptionist: '(650) 900-0019' },
  { location: 'Daly City',          business: '(415) 555-0120', receptionist: '(415) 900-0020' },
  { location: 'South San Francisco',business: '(650) 555-0121', receptionist: '(650) 900-0021' },
  { location: 'San Rafael',         business: '(415) 555-0122', receptionist: '(415) 900-0022' },
  { location: 'Novato',             business: '(415) 555-0123', receptionist: '(415) 900-0023' },
  { location: 'Petaluma',           business: '(707) 555-0124', receptionist: '(707) 900-0024' },
  { location: 'Santa Rosa',         business: '(707) 555-0125', receptionist: '(707) 900-0025' },
]


function CallForwardingDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('')

  useEffect(() => { if (!open) setSearch('') }, [open])

  if (!open) return null

  const filtered = CF_ALL_DATA.filter((r) =>
    r.location.toLowerCase().includes(search.toLowerCase()) ||
    r.business.includes(search) ||
    r.receptionist.includes(search)
  )

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[80] flex h-full w-[650px] flex-col bg-surface shadow-modal">

        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-lg">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
              <Icon name="arrow_back" size={18} />
            </button>
            <span className="text-h3 text-text-primary">Call forwarding</span>
          </div>
          <button type="button" title="Download list (XLS)" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
            <Icon name="download" size={20} />
          </button>
        </div>

        {/* Description + search */}
        <div className="shrink-0 flex flex-col gap-lg px-2xl pb-lg pt-2xl">
          <p className="text-body text-text-secondary">
            For instructions on how to forward unanswered calls from your landline number to the receptionist number, consult your phone system setup or{' '}
            <a href="#" className="text-text-action">learn more</a>
          </p>
          <div className="flex h-9 items-center gap-sm rounded-sm border border-border px-md focus-within:border-primary">
            <Icon name="search" size={16} className="shrink-0 text-text-icon" />
            <input
              type="text"
              placeholder="Search by location or number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-text-icon hover:text-text-primary">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border">
                <th className="px-2xl pb-sm text-small text-text-secondary font-normal">Location</th>
                <th className="px-2xl pb-sm text-small text-text-secondary font-normal">Business number</th>
                <th className="px-2xl pb-sm text-small text-text-secondary font-normal">Receptionist number</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-2xl py-lg text-center text-body text-text-tertiary">No results for "{search}"</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-2xl py-md text-body text-text-primary">{row.location}</td>
                  <td className="px-2xl py-md text-body text-text-primary">{row.business}</td>
                  <td className="px-2xl py-md text-body text-text-primary">{row.receptionist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}

// ── Add a phone number — SIP trunking vs. call forwarding ─────────────────────
function AddPhoneNumberButton({ onSelect }: { onSelect: (mode: 'sip' | 'forwarding') => void }) {
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
        Add number
      </button>
      {open && (
        <div className="absolute right-0 top-[40px] z-50 min-w-[240px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          <button
            type="button"
            onClick={() => { onSelect('sip'); setOpen(false) }}
            className="block w-full px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
          >
            Integrate using SIP trunking
          </button>
          <button
            type="button"
            onClick={() => { onSelect('forwarding'); setOpen(false) }}
            className="block w-full px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
          >
            Setup call forwarding
          </button>
        </div>
      )}
    </div>
  )
}

interface CallForwardingSetupState {
  name: string
  phoneNumber: string
  agent: string[]
}

const EMPTY_CALL_FORWARDING_SETUP: CallForwardingSetupState = { name: '', phoneNumber: '', agent: [] }

function SetupCallForwardingDrawer({ open, initialRow, onClose, onSave }: { open: boolean; initialRow?: PhoneNumber2Row; onClose: () => void; onSave: (row: PhoneNumber2Row) => void }) {
  const isEdit = !!initialRow
  const [form, setForm] = useState<CallForwardingSetupState>(EMPTY_CALL_FORWARDING_SETUP)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_CALL_FORWARDING_SETUP)
    } else if (initialRow) {
      setForm({
        name:        initialRow.name,
        phoneNumber: initialRow.phoneNumber,
        agent:       initialRow.assignedAgents && initialRow.assignedAgents !== '—' ? [initialRow.assignedAgents] : [],
      })
    }
  }, [open, initialRow])

  if (!open) return null

  const canSave = form.name.trim() !== '' && form.phoneNumber.trim() !== '' && form.agent.length > 0

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[80] flex h-full w-[650px] flex-col bg-surface shadow-modal">

        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-lg">
          <div className="flex items-center gap-sm">
            <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
              <Icon name="arrow_back" size={18} />
            </button>
            <span className="text-h3 text-text-primary">{isEdit ? 'Edit number' : 'Setup call forwarding'}</span>
          </div>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onSave({
                name:           form.name,
                phoneNumber:    form.phoneNumber,
                e164Format:     'E.164',
                terminationUri: '',
                transport:      '',
                sipUsername:    '',
                sipPassword:    '',
                connection:     'Call forwarding',
                routingMode:    '—',
                assignedAgents: form.agent[0] ?? '—',
                provider:       '—',
                status:         'Active',
              })
              onClose()
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              !canSave ? 'cursor-not-allowed bg-surface-selected text-text-tertiary' : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-auto p-2xl">

          {/* Name */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Name <span className="text-chip-danger-text">*</span></label>
            <input
              type="text"
              placeholder="e.g. Main reception"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Phone number */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-secondary">Phone number <span className="text-chip-danger-text">*</span></label>
            <input
              type="text"
              placeholder="(415) 555-2671"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: applyPhoneFormat(e.target.value, 'National') }))}
              className="h-9 rounded-sm border border-border px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Agent */}
          <p className="mt-[16px] text-body text-text-secondary">
            Assign to an agent to start routing calls.
          </p>
          <DropdownField
            label="Agent"
            options={AGENT_OPTIONS}
            value={form.agent}
            placeholder="Select agent"
            onChange={(v: string[]) => setForm((f) => ({ ...f, agent: v.slice(-1) }))}
          />

        </div>
      </div>
    </>
  )
}

export function PhoneNumber2Screen() {
  const [rows, setRows] = useState<PhoneNumber2Row[]>(DEFAULT_ROWS)
  const [addMode, setAddMode] = useState<'sip' | 'forwarding' | null>(null)
  const [editRow, setEditRow] = useState<PhoneNumber2Row | null>(null)
  const [callForwardingOpen, setCallForwardingOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const q = searchQuery.trim().toLowerCase()
  const visibleRows = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.phoneNumber.toLowerCase().includes(q))
    : rows


  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-xl">
          <h1 className="text-h3 text-text-primary">Phone number</h1>
          {rows.length > 0 && (
            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
              <button
                type="button"
                onClick={() => setCallForwardingOpen(true)}
                className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
              >
                Call forwarding
              </button>
              <AddPhoneNumberButton onSelect={setAddMode} />
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-3xl">
              <img src={emptyPhoneNumberUrl} alt="" className="w-[200px]" />
              <div className="mt-lg flex flex-col items-center gap-sm text-center">
                <span className="text-h3 text-text-primary">Add phone number</span>
                <span className="max-w-[420px] text-body text-text-tertiary">
                  Add phone numbers to start routing calls across your locations.
                </span>
              </div>
              <div className="mt-2xl">
                <AddPhoneNumberButton onSelect={setAddMode} />
              </div>
            </div>
          ) : (
            <div className="px-lg">
              <DataTable
                columns={COLUMNS2}
                data={visibleRows}
                rowMenuItems={[
                  { label: 'Edit',   onClick: (row) => setEditRow(row) },
                  { label: 'Delete', onClick: (row) => setRows((prev) => prev.filter((r) => r !== row)) },
                ]}
              />
            </div>
          )}
        </div>

      </div>

      {/* Call forwarding modal */}
      <CallForwardingDrawer open={callForwardingOpen} onClose={() => setCallForwardingOpen(false)} />

      {/* SIP trunking / Edit drawer */}
      <ImportDrawer
        open={addMode === 'sip' || (editRow !== null && editRow.connection !== 'Call forwarding')}
        initialRow={editRow ?? undefined}
        onClose={() => { setAddMode(null); setEditRow(null) }}
        onSave={(row) => {
          if (editRow) {
            setRows((prev) => prev.map((r) => r === editRow ? row : r))
          } else {
            setRows((prev) => [...prev, row])
          }
          setEditRow(null)
          setAddMode(null)
        }}
      />

      {/* Setup call forwarding drawer */}
      <SetupCallForwardingDrawer
        open={addMode === 'forwarding' || editRow?.connection === 'Call forwarding'}
        initialRow={editRow?.connection === 'Call forwarding' ? editRow : undefined}
        onClose={() => { setAddMode(null); setEditRow(null) }}
        onSave={(row) => {
          if (editRow) {
            setRows((prev) => prev.map((r) => r === editRow ? row : r))
          } else {
            setRows((prev) => [...prev, row])
          }
          setEditRow(null)
          setAddMode(null)
        }}
      />
    </div>
  )
}

// =============================================================================
// PHONE NUMBER 1 — Abhishek's version (commented out, do not delete)
// Removed from the UI. PhoneNumber2Screen is now the primary entry point.
// To restore: uncomment lines below and update the route in App.tsx.
// =============================================================================
// export function PhoneNumberScreen() {
//   const [editRow, setEditRow] = useState<PhoneNumberRow | null>(null)
//   const [testCallRow, setTestCallRow] = useState<PhoneNumberRow | null>(null)
//   const [importSource, setImportSource] = useState<'twilio' | 'sip' | null>(null)
// 
//   return (
//     <div className="flex h-full flex-col">
//       <TopNav initials="S" />
// 
//       <div className="flex flex-1 flex-col overflow-auto">
//           {/* Header */}
//           <div className="flex items-center justify-between px-2xl py-xl">
//             <h1 className="text-h3 text-text-primary">Phone number</h1>
//             <div className="flex items-center gap-sm">
//               <button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
//                 <Icon name="search" size={20} />
//               </button>
//               <ImportNumberButton onSelect={setImportSource} />
//               <button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
//                 <Icon name="view_column" size={20} />
//               </button>
//               <button type="button" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
//                 <Icon name="filter_list" size={20} />
//               </button>
//             </div>
//           </div>
// 
//           {/* Table */}
//           <div className="px-lg py-lg">
//             <DataTable
//               columns={COLUMNS}
//               data={DATA}
//               rowActions={[
//                 { icon: 'phone_in_talk', label: 'Test call', onClick: (row) => setTestCallRow(row) },
//                 { icon: 'edit',          label: 'Edit',      onClick: (row) => setEditRow(row) },
//               ]}
//             />
//           </div>
// 
//           <TestCallModal
//             open={testCallRow !== null}
//             phoneNumber={testCallRow?.phoneNumber ?? ''}
//             onClose={() => setTestCallRow(null)}
//           />
// 
//           <FormDrawer
//             open={editRow !== null}
//             title="Edit"
//             fields={EDIT_FIELDS}
//             submitLabel="Save"
//             initialValues={editRow ? {
//               name: editRow.name,
//               phoneNumber: editRow.phoneNumber,
//               connection: editRow.connection,
//               provider: editRow.provider,
//               numberType: 'Local',
//               numberId: 'phnum_29944',
//               purchasedOn: 'Apr 07, 2026',
//               routingMode: editRow.routingMode,
//               assignedAgents: editRow.assignedAgents,
//               locations: editRow.locations,
//             } : undefined}
//             onClose={() => setEditRow(null)}
//             onSubmit={() => setEditRow(null)}
//           />
// 
//           <FormDrawer
//             open={importSource === 'twilio'}
//             title="Import from Twilio"
//             fields={IMPORT_TWILIO_FIELDS}
//             submitLabel="Import"
//             requiredKeys={['name', 'phone', 'twilioSid', 'authToken']}
//             onClose={() => setImportSource(null)}
//             onSubmit={() => setImportSource(null)}
//           />
// 
//           <FormDrawer
//             open={importSource === 'sip'}
//             title="Import from SIP trunk"
//             fields={IMPORT_SIP_FIELDS}
//             submitLabel="Import"
//             requiredKeys={['name', 'phone', 'sipServer', 'sipPort', 'username', 'password']}
//             onClose={() => setImportSource(null)}
//             onSubmit={() => setImportSource(null)}
//           />
//       </div>
//     </div>
//   )
// }
// =============================================================================

