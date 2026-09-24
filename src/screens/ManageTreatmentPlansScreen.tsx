import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chip, CustomizeColumnsDrawer, FilterPanel, InfoTooltip, Tabs, TopNav, type ChipVariant, type ColumnOption, type FilterField } from '../components'
import { ArrowLeft, Check, ChevronDown, ChevronUp, Columns3, ListFilter, MoreVertical, Search, X } from 'lucide-react'

type ProcedureStatus = 'Diagnosed' | 'Accepted' | 'Rejected' | 'Completed'

interface Procedure {
  id: string
  patientId: string
  patientName: string
  patientInitials: string
  planId: string
  procedureLine: string
  diagnosed: string
  office: string
  status: ProcedureStatus
  code: string
  description: string
  tooth: string
  surface: string
  billType: string
  isScheduled: boolean
  isCompleted: boolean
  lastSynced: string
  provider: string
  totalFee: number
  patientEstimate: number
  insuranceEstimate: number
}

const PROCEDURES: Procedure[] = [
  { id: 'p1',  patientId: 'mc', patientName: 'Mila Carter',  patientInitials: 'MC', planId: 'PL-7781', procedureLine: 'TP-2310', diagnosed: '2026-06-22', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D2930', description: 'Prefab SS crown – primary tooth',  tooth: '#I',  surface: 'O',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 06:12', provider: 'Dr. Marsh', totalFee: 214,  patientEstimate: 214,  insuranceEstimate: 0    },
  { id: 'p2',  patientId: 'mc', patientName: 'Mila Carter',  patientInitials: 'MC', planId: 'PL-7781', procedureLine: 'TP-2311', diagnosed: '2026-06-22', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D3220', description: 'Therapeutic pulpotomy',           tooth: '#I',  surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 06:12', provider: 'Dr. Marsh', totalFee: 128,  patientEstimate: 128,  insuranceEstimate: 0    },
  { id: 'p3',  patientId: 'mc', patientName: 'Mila Carter',  patientInitials: 'MC', planId: 'PL-7781', procedureLine: 'TP-2312', diagnosed: '2026-06-22', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D2392', description: 'Resin – 2 surfaces, posterior',   tooth: '#14', surface: 'OL', billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 06:12', provider: 'Dr. Marsh', totalFee: 175,  patientEstimate: 175,  insuranceEstimate: 0    },
  { id: 'p4',  patientId: 'mc', patientName: 'Mila Carter',  patientInitials: 'MC', planId: 'PL-7781', procedureLine: 'TP-2313', diagnosed: '2026-06-22', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D9230', description: 'Nitrous oxide sedation',          tooth: '–',   surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 06:12', provider: 'Dr. Marsh', totalFee: 72,   patientEstimate: 72,   insuranceEstimate: 0    },
  { id: 'p5',  patientId: 'mr', patientName: 'Marcus Reed',  patientInitials: 'MR', planId: 'PL-7204', procedureLine: 'TP-1980', diagnosed: '2026-06-18', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D2740', description: 'Crown – porcelain/ceramic',       tooth: '#14', surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: false, lastSynced: '2026-06-29 14:30', provider: 'Dr. Lin',   totalFee: 1280, patientEstimate: 512,  insuranceEstimate: 768  },
  { id: 'p6',  patientId: 'mr', patientName: 'Marcus Reed',  patientInitials: 'MR', planId: 'PL-7204', procedureLine: 'TP-1981', diagnosed: '2026-05-02', office: 'Cedar Park Dental',       status: 'Accepted',  code: 'D4341', description: 'Scaling & root planing /quad',    tooth: 'UR',  surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: false, lastSynced: '2026-06-28 09:00', provider: 'Dr. Lin',   totalFee: 295,  patientEstimate: 118,  insuranceEstimate: 177  },
  { id: 'p7',  patientId: 'ps', patientName: 'Priya Shah',   patientInitials: 'PS', planId: 'PL-6711', procedureLine: 'TP-1650', diagnosed: '2026-06-21', office: 'Riverside Family Dental', status: 'Diagnosed', code: 'D7140', description: 'Extraction – erupted tooth',      tooth: '#30', surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 08:45', provider: 'Dr. Marsh', totalFee: 340,  patientEstimate: 340,  insuranceEstimate: 0    },
  { id: 'p8',  patientId: 'ps', patientName: 'Priya Shah',   patientInitials: 'PS', planId: 'PL-6711', procedureLine: 'TP-1651', diagnosed: '2026-06-21', office: 'Riverside Family Dental', status: 'Diagnosed', code: 'D2950', description: 'Core buildup + pins',             tooth: '#30', surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 08:45', provider: 'Dr. Marsh', totalFee: 320,  patientEstimate: 320,  insuranceEstimate: 0    },
  { id: 'p9',  patientId: 'ps', patientName: 'Priya Shah',   patientInitials: 'PS', planId: 'PL-6711', procedureLine: 'TP-1652', diagnosed: '2026-06-21', office: 'Riverside Family Dental', status: 'Diagnosed', code: 'D2740', description: 'Crown – porcelain/ceramic',       tooth: '#30', surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-30 08:45', provider: 'Dr. Marsh', totalFee: 1280, patientEstimate: 1280, insuranceEstimate: 0    },
  { id: 'p10', patientId: 'db', patientName: 'Devon Brooks', patientInitials: 'DB', planId: 'PL-6390', procedureLine: 'TP-1420', diagnosed: '2026-04-29', office: 'Lakeview Dental',         status: 'Accepted',  code: 'D6010', description: 'Implant – endosteal',             tooth: '#19', surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: false, lastSynced: '2026-06-27 11:20', provider: 'Dr. Field', totalFee: 3250, patientEstimate: 1300, insuranceEstimate: 1950 },
  { id: 'p11', patientId: 'db', patientName: 'Devon Brooks', patientInitials: 'DB', planId: 'PL-6390', procedureLine: 'TP-1421', diagnosed: '2026-04-29', office: 'Lakeview Dental',         status: 'Accepted',  code: 'D6065', description: 'Implant abutment – prefab',        tooth: '#19', surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: false, lastSynced: '2026-06-27 11:20', provider: 'Dr. Field', totalFee: 735,  patientEstimate: 294,  insuranceEstimate: 441  },
  { id: 'p12', patientId: 'at', patientName: 'Aiden Torres', patientInitials: 'AT', planId: 'PL-5982', procedureLine: 'TP-1100', diagnosed: '2026-06-10', office: 'Cedar Park Dental',       status: 'Rejected',  code: 'D4210', description: 'Gingivectomy – 4+ teeth /quad',  tooth: 'UR',  surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-25 16:00', provider: 'Dr. Lin',   totalFee: 600,  patientEstimate: 600,  insuranceEstimate: 0    },
  { id: 'p13', patientId: 'at', patientName: 'Aiden Torres', patientInitials: 'AT', planId: 'PL-5982', procedureLine: 'TP-1101', diagnosed: '2026-06-10', office: 'Cedar Park Dental',       status: 'Rejected',  code: 'D4341', description: 'Scaling & root planing /quad',    tooth: 'LR',  surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-25 16:00', provider: 'Dr. Lin',   totalFee: 295,  patientEstimate: 295,  insuranceEstimate: 0    },
  { id: 'p14', patientId: 'at', patientName: 'Aiden Torres', patientInitials: 'AT', planId: 'PL-5982', procedureLine: 'TP-1102', diagnosed: '2026-06-10', office: 'Cedar Park Dental',       status: 'Diagnosed', code: 'D9310', description: 'Consultation – specialist',       tooth: '–',   surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-25 16:00', provider: 'Dr. Lin',   totalFee: 85,   patientEstimate: 85,   insuranceEstimate: 0    },
  { id: 'p15', patientId: 'sn', patientName: 'Sofia Nguyen', patientInitials: 'SN', planId: 'PL-5540', procedureLine: 'TP-0880', diagnosed: '2026-05-17', office: 'Riverside Family Dental', status: 'Completed', code: 'D1110', description: 'Adult prophylaxis',               tooth: '–',   surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: true,  lastSynced: '2026-06-20 10:05', provider: 'Dr. Marsh', totalFee: 94,   patientEstimate: 38,   insuranceEstimate: 56   },
  { id: 'p16', patientId: 'sn', patientName: 'Sofia Nguyen', patientInitials: 'SN', planId: 'PL-5540', procedureLine: 'TP-0881', diagnosed: '2026-05-17', office: 'Riverside Family Dental', status: 'Completed', code: 'D0274', description: 'Bitewing X-rays – 4 images',      tooth: '–',   surface: '-',  billType: 'IN', isScheduled: true,  isCompleted: true,  lastSynced: '2026-06-20 10:05', provider: 'Dr. Marsh', totalFee: 62,   patientEstimate: 25,   insuranceEstimate: 37   },
  { id: 'p17', patientId: 'jp', patientName: 'James Park',   patientInitials: 'JP', planId: 'PL-5103', procedureLine: 'TP-0640', diagnosed: '2026-06-05', office: 'Lakeview Dental',         status: 'Accepted',  code: 'D2160', description: 'Amalgam – 3+ surfaces, primary',  tooth: '#T',  surface: 'MOD',billType: 'DD', isScheduled: true,  isCompleted: false, lastSynced: '2026-06-22 13:40', provider: 'Dr. Field', totalFee: 132,  patientEstimate: 132,  insuranceEstimate: 0    },
  { id: 'p18', patientId: 'jp', patientName: 'James Park',   patientInitials: 'JP', planId: 'PL-5103', procedureLine: 'TP-0641', diagnosed: '2026-06-05', office: 'Lakeview Dental',         status: 'Completed', code: 'D2150', description: 'Amalgam – 2 surfaces, primary',   tooth: '#K',  surface: 'MO', billType: 'DD', isScheduled: true,  isCompleted: true,  lastSynced: '2026-06-22 13:40', provider: 'Dr. Field', totalFee: 84,   patientEstimate: 84,   insuranceEstimate: 0    },
  { id: 'p19', patientId: 'jp', patientName: 'James Park',   patientInitials: 'JP', planId: 'PL-5103', procedureLine: 'TP-0642', diagnosed: '2026-06-05', office: 'Lakeview Dental',         status: 'Diagnosed', code: 'D9230', description: 'Nitrous oxide sedation',          tooth: '–',   surface: '-',  billType: 'DD', isScheduled: false, isCompleted: false, lastSynced: '2026-06-22 13:40', provider: 'Dr. Field', totalFee: 72,   patientEstimate: 72,   insuranceEstimate: 0    },
]

type PatientGroup = {
  patientId: string
  patientName: string
  patientInitials: string
  planId: string
  procedures: Procedure[]
}

const STATUS_CHIP: Record<ProcedureStatus, ChipVariant> = {
  Diagnosed: 'warning',
  Accepted:  'success',
  Rejected:  'danger',
  Completed: 'neutral',
}

function ColDivider({ colKey, onMouseDown }: { colKey: string; onMouseDown: (key: string, e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={e => onMouseDown(colKey, e)}
      className="group/rz absolute right-0 top-0 z-10 flex h-full w-[11px] translate-x-1/2 cursor-col-resize items-center justify-center"
    >
      <span className="w-px h-5 bg-border-selected transition-all group-hover/rz:h-full group-hover/rz:w-[2px] group-hover/rz:bg-primary" />
    </span>
  )
}

const FILTER_FIELDS: FilterField[] = [
  { id: 'office',    label: 'Office',    options: [{ value: 'cedar-park', label: 'Cedar Park Dental' }, { value: 'riverside', label: 'Riverside Family Dental' }, { value: 'lakeview', label: 'Lakeview Dental' }] },
  { id: 'provider',  label: 'Provider',  options: [{ value: 'marsh', label: 'Dr. Marsh' }, { value: 'lin', label: 'Dr. Lin' }, { value: 'field', label: 'Dr. Field' }] },
  { id: 'status',    label: 'Status',    options: [{ value: 'diagnosed', label: 'Diagnosed' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }, { value: 'completed', label: 'Completed' }] },
  { id: 'procedure', label: 'Procedure', multi: true, options: [
    { value: 'D0120', label: 'D0120 — Periodic oral evaluation' },
    { value: 'D0150', label: 'D0150 — Comprehensive oral evaluation' },
    { value: 'D0210', label: 'D0210 — Complete series of radiographic images' },
    { value: 'D0274', label: 'D0274 — Bitewing radiographic images (4)' },
    { value: 'D1110', label: 'D1110 — Prophylaxis, adult' },
    { value: 'D1120', label: 'D1120 — Prophylaxis, child' },
    { value: 'D1206', label: 'D1206 — Topical fluoride varnish' },
    { value: 'D2140', label: 'D2140 — Amalgam restoration, 1 surface, primary' },
    { value: 'D2160', label: 'D2160 — Amalgam restoration, 3 surfaces, primary' },
    { value: 'D2391', label: 'D2391 — Resin-based composite, 1 surface, primary' },
    { value: 'D2740', label: 'D2740 — Crown, porcelain/ceramic substrate' },
    { value: 'D3310', label: 'D3310 — Endodontic therapy, anterior tooth' },
    { value: 'D3330', label: 'D3330 — Endodontic therapy, molar tooth' },
    { value: 'D4341', label: 'D4341 — Periodontal scaling, per quadrant' },
    { value: 'D4355', label: 'D4355 — Full mouth debridement' },
    { value: 'D5213', label: 'D5213 — Maxillary partial denture, cast metal' },
    { value: 'D6010', label: 'D6010 — Surgical placement of implant body' },
    { value: 'D7140', label: 'D7140 — Extraction, erupted tooth' },
    { value: 'D7210', label: 'D7210 — Surgical extraction of erupted tooth' },
    { value: 'D9310', label: 'D9310 — Consultation, diagnostic service' },
  ]},
]

const ALL_COLUMN_OPTIONS: ColumnOption[] = [
  { key: 'diagnosed', label: 'Diagnosed',  locked: false },
  { key: 'office',    label: 'Office',     locked: false },
  { key: 'status',    label: 'Status',     locked: true  },
  { key: 'procedure', label: 'Procedure',  locked: true  },
  { key: 'provider',  label: 'Provider',   locked: false },
  { key: 'fee',       label: 'Fee',        locked: false },
]

const TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'diagnosed', label: 'Diagnosed' },
  { id: 'accepted',  label: 'Accepted'  },
  { id: 'rejected',  label: 'Rejected'  },
  { id: 'completed', label: 'Completed' },
]

const DEFAULT_COL_WIDTHS: Record<string, number> = {
  chevron:   40,
  patient:   260,
  diagnosed: 130,
  office:    200,
  status:    130,
  procedure: 280,
  provider:  130,
  fee:       110,
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
}

function formatFee(n: number) {
  return n === 0 ? '$0' : `$${n.toLocaleString()}`
}

function groupByPatient(procedures: Procedure[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>()
  for (const p of procedures) {
    if (!map.has(p.patientId)) {
      map.set(p.patientId, { patientId: p.patientId, patientName: p.patientName, patientInitials: p.patientInitials, planId: p.planId, procedures: [] })
    }
    map.get(p.patientId)!.procedures.push(p)
  }
  return Array.from(map.values())
}

// Single field: label above, value below — matches contact detail style
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-small text-text-tertiary">{label}</span>
      <div className="text-body text-text-primary">{children}</div>
    </div>
  )
}

// Procedure detail drawer — flat two-column grid, no card border
function ProcedureDrawer({ proc, onClose }: { proc: Procedure | null; onClose: () => void }) {
  useEffect(() => {
    if (!proc) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [proc, onClose])

  if (!proc) return null

  const toothSurface = `${proc.tooth}${proc.surface !== '-' ? ' · ' + proc.surface : ''}`

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[201] flex w-[650px] flex-col overflow-hidden rounded-l-2xl bg-surface shadow-modal">

        {/* Header */}
        <div className="flex items-center gap-md border-b border-border px-2xl py-lg">
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <ArrowLeft className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <span className="text-h3 text-text-primary">Procedure details</span>
        </div>

        <div className="flex flex-1 flex-col overflow-auto px-2xl py-lg">

          {/* Two-column flat grid — no card border */}
          <div className="grid grid-cols-2 gap-x-xl gap-y-lg">

            {/* Patient + Procedure side by side at top */}
            <DetailField label="Patient">
              {proc.patientName}
            </DetailField>

            <DetailField label="Procedure">
              <div className="flex items-start gap-xs">
                <span>{proc.code} — {proc.description}</span>
                <InfoTooltip text={`ADA procedure code · tooth ${proc.tooth}`} variant="brief" />
              </div>
            </DetailField>
            <DetailField label="Status">
              <Chip label={proc.status} variant={STATUS_CHIP[proc.status]} />
            </DetailField>

            <DetailField label="Diagnosed">
              {formatDate(proc.diagnosed)}
            </DetailField>

            <DetailField label="Treatment plan">
              {proc.planId}
            </DetailField>

            <DetailField label="Procedure line">
              {proc.procedureLine}
            </DetailField>

            <DetailField label="Tooth / surface">
              {toothSurface}
            </DetailField>

            <DetailField label="Bill type">
              {proc.billType}
            </DetailField>

            <DetailField label="Office">
              {proc.office}
            </DetailField>

            <DetailField label="Provider">
              {proc.provider}
            </DetailField>

            <DetailField label="Is scheduled">
              <span className={`flex items-center gap-xs ${proc.isScheduled ? 'text-chip-success-text' : 'text-text-tertiary'}`}>
                {proc.isScheduled ? <Check className="size-4" strokeWidth={1.6} absoluteStrokeWidth /> : <X className="size-4" strokeWidth={1.6} absoluteStrokeWidth />}
                {proc.isScheduled ? 'Yes' : 'No'}
              </span>
            </DetailField>

            <DetailField label="Is completed">
              <span className={`flex items-center gap-xs ${proc.isCompleted ? 'text-chip-success-text' : 'text-text-tertiary'}`}>
                {proc.isCompleted ? <Check className="size-4" strokeWidth={1.6} absoluteStrokeWidth /> : <X className="size-4" strokeWidth={1.6} absoluteStrokeWidth />}
                {proc.isCompleted ? 'Yes' : 'No'}
              </span>
            </DetailField>

            <DetailField label="Patient estimate">
              {formatFee(proc.patientEstimate)}
            </DetailField>

            <DetailField label="Insurance estimate">
              {formatFee(proc.insuranceEstimate)}
            </DetailField>

            <DetailField label="Total fee">
              {formatFee(proc.totalFee)}
            </DetailField>

            <DetailField label="Last synced">
              <span className="text-text-secondary">{proc.lastSynced}</span>
            </DetailField>
          </div>

        </div>
      </div>
    </>
  )
}

export function ManageTreatmentPlansScreen() {
  const [activeTab, setActiveTab]         = useState('all')
  const [filterOpen, setFilterOpen]       = useState(false)
  const [columnsOpen, setColumnsOpen]     = useState(false)
  const [visibleKeys, setVisibleKeys]     = useState<string[]>(['diagnosed', 'office', 'status', 'procedure', 'provider', 'fee'])
  // Multiple accordions open simultaneously; default first two open
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PROCEDURES.map(p => p.patientId)))
  const [rowMenu, setRowMenu]             = useState<{ procId: string; top: number; left: number } | null>(null)
  const [detailProc, setDetailProc]       = useState<Procedure | null>(null)
  const [search, setSearch]               = useState('')
  const [searchOpen, setSearchOpen]       = useState(false)
  const [colWidths, setColWidths]         = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null)

  function toggleGroup(id: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startResize = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = { key, startX: e.clientX, startW: colWidths[key] ?? 120 }
    document.body.style.cursor = 'col-resize'
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const dx = ev.clientX - resizingRef.current.startX
      setColWidths(prev => ({ ...prev, [resizingRef.current!.key]: Math.max(60, resizingRef.current!.startW + dx) }))
    }
    const onUp = () => {
      resizingRef.current = null
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [colWidths])

  // Close row menu on outside click
  useEffect(() => {
    if (!rowMenu) return
    const handler = () => setRowMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [rowMenu])

  const filtered = useMemo(() => {
    let procs = PROCEDURES
    if (activeTab !== 'all') {
      const s = activeTab.charAt(0).toUpperCase() + activeTab.slice(1) as ProcedureStatus
      procs = procs.filter(p => p.status === s)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      procs = procs.filter(p =>
        p.patientName.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.planId.toLowerCase().includes(q)
      )
    }
    return procs
  }, [activeTab, search])

  const groups = useMemo(() => groupByPatient(filtered), [filtered])

  // Re-open all groups whenever the tab (and thus group set) changes
  useEffect(() => {
    setExpandedGroups(new Set(groups.map(g => g.patientId)))
  }, [activeTab])

  const showDiagnosed = visibleKeys.includes('diagnosed')
  const showOffice    = visibleKeys.includes('office')
  const showStatus    = visibleKeys.includes('status')
  const showProcedure = visibleKeys.includes('procedure')
  const showProvider  = visibleKeys.includes('provider')
  const showFee       = visibleKeys.includes('fee')

  const w = (key: string) => colWidths[key] ?? DEFAULT_COL_WIDTHS[key] ?? 120

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">

          {/* Page header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <div className="flex items-center gap-sm">
              <h1 className="text-h3 text-text-primary">Manage treatment plans</h1>
              <InfoTooltip text="Every planned procedure is one row — targeted by code/tooth, not just the latest plan." />
            </div>
            <div className="flex items-center gap-sm">
              {/* Search — icon toggles input, same pattern as ProceduresScreen */}
              {searchOpen && (
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search patients, codes…"
                  className="h-9 w-56 rounded-md border border-border-selected bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
                />
              )}
              <button
                type="button"
                aria-label="Search"
                onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearch('') }}
                className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Search className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button type="button" onClick={() => setColumnsOpen(true)} className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <Columns3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
<button type="button" onClick={() => setFilterOpen(true)} className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-2xl">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Table */}
          <div className="flex-1 px-2xl py-lg">
            {groups.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-body text-text-tertiary">No treatment plans found.</div>
            ) : (
              <div className="overflow-x-auto rounded-sm border border-border">
                <table className="border-collapse text-body" style={{ minWidth: '100%', width: 'max-content' }}>
                  <thead>
                    <tr className="border-b border-border bg-surface text-left text-small text-text-secondary">
                      <th style={{ width: w('chevron'), minWidth: w('chevron') }} className="relative px-md py-sm font-normal" />
                      <th style={{ width: w('patient'), minWidth: w('patient') }} className="relative px-md py-sm font-normal">
                        Patient
                        <ColDivider colKey="patient" onMouseDown={startResize} />
                      </th>
                      {showDiagnosed && (
                        <th style={{ width: w('diagnosed'), minWidth: w('diagnosed') }} className="relative px-md py-sm font-normal">
                          Diagnosed
                          <ColDivider colKey="diagnosed" onMouseDown={startResize} />
                        </th>
                      )}
                      {showOffice && (
                        <th style={{ width: w('office'), minWidth: w('office') }} className="relative px-md py-sm font-normal">
                          Office
                          <ColDivider colKey="office" onMouseDown={startResize} />
                        </th>
                      )}
                      {showStatus && (
                        <th style={{ width: w('status'), minWidth: w('status') }} className="relative px-md py-sm font-normal">
                          Status
                          <ColDivider colKey="status" onMouseDown={startResize} />
                        </th>
                      )}
                      {showProcedure && (
                        <th style={{ width: w('procedure'), minWidth: w('procedure') }} className="relative px-md py-sm font-normal">
                          Procedure
                          <ColDivider colKey="procedure" onMouseDown={startResize} />
                        </th>
                      )}
                      {showProvider && (
                        <th style={{ width: w('provider'), minWidth: w('provider') }} className="relative px-md py-sm font-normal">
                          Provider
                          <ColDivider colKey="provider" onMouseDown={startResize} />
                        </th>
                      )}
                      {showFee && (
                        <th style={{ width: w('fee'), minWidth: w('fee') }} className="relative px-md py-sm font-normal text-right">
                          Fee
                          <ColDivider colKey="fee" onMouseDown={startResize} />
                        </th>
                      )}
                      {/* Actions col */}
                      <th className="w-12 px-md py-sm font-normal" />
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(group => {
                      const isOpen = expandedGroups.has(group.patientId)
                      return (
                        <React.Fragment key={group.patientId}>
                          {/* Accordion header row */}
                          <tr
                            className="cursor-pointer border-b border-border bg-surface hover:bg-surface-hover"
                            onClick={() => toggleGroup(group.patientId)}
                          >
                            <td className="px-md py-sm align-top pt-[14px]">
                              {isOpen ? <ChevronUp className="size-4 text-text-secondary" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronDown className="size-4 text-text-secondary" strokeWidth={1.6} absoluteStrokeWidth />}
                            </td>
                            <td className="px-md py-sm">
                              <div className="flex items-center gap-sm">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">{group.patientInitials}</div>
                                <div>
                                  <div className="text-body text-text-primary">{group.patientName}</div>
                                  <div className="text-small text-text-tertiary">{group.procedures.length} procedure{group.procedures.length !== 1 ? 's' : ''} · {group.planId}</div>
                                </div>
                              </div>
                            </td>
                            {showDiagnosed && <td className="px-md py-sm" />}
                            {showOffice    && <td className="px-md py-sm" />}
                            {showStatus    && <td className="px-md py-sm" />}
                            {showProcedure && <td className="px-md py-sm" />}
                            {showProvider  && <td className="px-md py-sm" />}
                            {showFee && (
                              <td className="px-md py-sm text-right text-small text-text-primary">
                                {formatFee(group.procedures.reduce((s, p) => s + p.totalFee, 0))}
                              </td>
                            )}
                            <td className="px-md py-sm" />
                          </tr>

                          {/* Procedure rows */}
                          {isOpen && group.procedures.map(proc => {
                            const menuOpen = rowMenu?.procId === proc.id
                            return (
                              <tr
                                key={proc.id}
                                className={`group/row border-b border-border bg-surface-l2 ${menuOpen ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                              >
                                <td className="px-md py-sm" />
                                <td className="px-md py-sm" />
                                {showDiagnosed && <td className="px-md py-sm text-small text-text-secondary">{formatDate(proc.diagnosed)}</td>}
                                {showOffice    && <td className="px-md py-sm text-small text-text-secondary">{proc.office}</td>}
                                {showStatus    && <td className="px-md py-sm"><Chip label={proc.status} variant={STATUS_CHIP[proc.status]} /></td>}
                                {showProcedure && (
                                  <td className="px-md py-sm">
                                    <div className="text-small text-text-primary">{proc.code} — {proc.description}</div>
                                    <div className="text-xs text-text-tertiary">Tooth {proc.tooth}</div>
                                  </td>
                                )}
                                {showProvider  && <td className="px-md py-sm text-small text-text-secondary">{proc.provider}</td>}
                                {showFee       && <td className="px-md py-sm text-right text-small text-text-primary">{formatFee(proc.totalFee)}</td>}

                                {/* Three-dots menu column */}
                                <td className="relative px-md py-sm">
                                  <div className={`absolute right-sm top-1/2 z-20 -translate-y-1/2 items-center ${menuOpen ? 'flex' : 'hidden group-hover/row:flex'}`}>
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation()
                                        const r = e.currentTarget.getBoundingClientRect()
                                        setRowMenu(menuOpen ? null : { procId: proc.id, top: r.bottom + 4, left: r.right - 168 })
                                      }}
                                      className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                                    >
                                      <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>

      {/* Three-dots dropdown menu — fixed so it's never clipped */}
      {rowMenu && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setRowMenu(null)} />
          <div
            className="fixed z-[110] min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: rowMenu.top, left: rowMenu.left }}
          >
            <button
              type="button"
              onClick={() => {
                const proc = PROCEDURES.find(p => p.id === rowMenu.procId) ?? null
                setDetailProc(proc)
                setRowMenu(null)
              }}
              className="flex w-full items-center px-md py-md text-left text-body text-text-primary hover:bg-surface-hover"
            >
              View details
            </button>
          </div>
        </>
      )}

      <CustomizeColumnsDrawer
        open={columnsOpen}
        options={ALL_COLUMN_OPTIONS}
        visibleKeys={visibleKeys}
        onClose={() => setColumnsOpen(false)}
        onSave={setVisibleKeys}
        onRestoreDefault={() => setVisibleKeys(['diagnosed', 'office', 'status', 'procedure', 'provider', 'fee'])}
      />

      <ProcedureDrawer proc={detailProc} onClose={() => setDetailProc(null)} />
    </div>
  )
}
