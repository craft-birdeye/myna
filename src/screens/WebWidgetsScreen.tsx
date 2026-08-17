import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { DataTable, HeaderSearchField, Link, TopNav } from '../components'

interface WebWidgetRow {
  name: string
  status: 'Active' | 'Not installed' | 'Disabled'
  installedWebsite: string
  aiAgent: string
}

const DATA: WebWidgetRow[] = [
  { name: 'ChatBot Plus',        status: 'Active',        installedWebsite: 'lumenhealth.com',    aiAgent: 'Appointment Booking Agent' },
  { name: 'HelpDesk Genie',      status: 'Active',        installedWebsite: 'kareo.com',          aiAgent: 'Appointment Reminder Agent' },
  { name: 'QueryMaster',         status: 'Not installed', installedWebsite: 'drchrono.com',       aiAgent: 'Waitlist Agent' },
  { name: 'SupportBot AI',       status: 'Active',        installedWebsite: 'athenahealth.com',   aiAgent: '-' },
  { name: 'Virtual Assistant',   status: 'Not installed', installedWebsite: 'eclinicalworks.com', aiAgent: 'Appointment Booking Agent' },
  { name: 'ConvoCraft',          status: 'Active',        installedWebsite: 'nextgen.com',        aiAgent: '-' },
  { name: 'ChatFlow Assistant',  status: 'Disabled',      installedWebsite: 'cerner.com',         aiAgent: 'Waitlist Agent' },
  { name: 'SmartResponse',       status: 'Active',        installedWebsite: 'allscripts.com',     aiAgent: 'Appointment Reminder Agent' },
  { name: 'Customer Connect',    status: 'Active',        installedWebsite: 'meditech.com',       aiAgent: '-' },
  { name: 'Engage',              status: 'Disabled',      installedWebsite: 'epic.com',           aiAgent: 'Appointment Reminder Agent' },
  { name: 'Instant Help',        status: 'Active',        installedWebsite: 'mckesson.com',       aiAgent: '-' },
  { name: 'ChatBuddy',           status: 'Disabled',      installedWebsite: 'optum.com',          aiAgent: 'Appointment Booking Agent' },
  { name: 'QuerySquad',          status: 'Active',        installedWebsite: 'unitedhealth.com',   aiAgent: '-' },
  { name: 'ResponseBot',         status: 'Active',        installedWebsite: 'humana.com',         aiAgent: 'Appointment Reminder Agent' },
  { name: 'EngageBot',           status: 'Not installed', installedWebsite: 'cigna.com',          aiAgent: 'Waitlist Agent' },
]

function StatusChip({ status }: { status: WebWidgetRow['status'] }) {
  const styles: Record<WebWidgetRow['status'], string> = {
    Active:          'bg-[#e8f5e9] text-[#2e7d32]',
    'Not installed': 'bg-surface-l2 text-text-secondary',
    Disabled:        'bg-surface-l2 text-text-secondary',
  }
  return (
    <span className={`inline-flex items-center rounded-sm px-sm py-[2px] text-small ${styles[status]}`}>
      {status}
    </span>
  )
}

const COLUMNS = [
  { key: 'name' as const,            label: 'Widget name',      sortable: true },
  { key: 'status' as const,          label: 'Status',           sortable: true, render: (v: unknown) => <StatusChip status={v as WebWidgetRow['status']} /> },
  { key: 'installedWebsite' as const, label: 'Installed website', sortable: true },
  { key: 'aiAgent' as const,         label: 'AI agent',         sortable: true },
]

interface WebWidgetsScreenProps {
  onBack: () => void
}

export function WebWidgetsScreen({ onBack }: WebWidgetsScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? DATA.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.installedWebsite.toLowerCase().includes(search.toLowerCase()) ||
          r.aiAgent.toLowerCase().includes(search.toLowerCase()),
      )
    : DATA

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-xs bg-surface px-2xl pt-lg pb-0">
        <Link as="button" onClick={onBack} className="text-body">
          Settings
        </Link>
        <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
        <Link as="button" onClick={onBack} className="text-body">
          Widgets
        </Link>
        <ChevronRight className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
        <span className="text-body text-text-primary">Web widgets</span>
      </div>

      {/* Header bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">{DATA.length} Web widgets</h1>

        <div className="flex items-center gap-sm">
          <HeaderSearchField open={searchOpen} value={search} onOpenChange={setSearchOpen} onChange={setSearch} placeholder="Search widgets…" />
          <button
            type="button"
            className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Create widget
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-lg">
        <DataTable
          columns={COLUMNS}
          data={filtered as unknown as Record<string, unknown>[]}
          rowAction={{ icon: 'edit', label: 'Edit widget', onClick: () => {} }}
          rowMenuItems={[
            { label: 'Duplicate',             onClick: () => {} },
            { label: 'Copy Chatbot AI code',  onClick: () => {} },
            { label: 'Email Chatbot AI code', onClick: () => {} },
            { label: 'Disable',               onClick: () => {} },
            { label: 'Delete',                onClick: () => {}, variant: 'danger' },
          ]}
        />
      </div>
    </div>
  )
}
