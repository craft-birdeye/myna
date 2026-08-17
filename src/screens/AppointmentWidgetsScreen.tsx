import { useState } from 'react'
import { DataTable, HeaderSearchField, Link, TopNav } from '../components'
import { ArrowLeft, ChevronRight, Settings } from 'lucide-react'

interface ApptWidgetRow {
  name: string
  location: string
  createdBy: string
  createdOn: string
}

const DATA: ApptWidgetRow[] = [
  { name: 'Appointment Tracker',   location: 'New York, NY',      createdBy: 'Michael Smith',      createdOn: 'Jan 02, 2026' },
  { name: 'Smart Scheduler',       location: 'Los Angeles, CA',   createdBy: 'Jessica Williams',   createdOn: 'Feb 14, 2026' },
  { name: 'Booking Management',    location: 'Chicago, IL',       createdBy: 'David Brown',        createdOn: 'Mar 18, 2026' },
  { name: 'Patient Reminders',     location: 'Houston, TX',       createdBy: 'Emily Davis',        createdOn: 'Apr 22, 2026' },
  { name: 'Confirmation Alerts',   location: 'Phoenix, AZ',       createdBy: 'Christopher Garcia', createdOn: 'May 11, 2026' },
  { name: 'Reschedule Wizard',     location: 'Philadelphia, PA',  createdBy: 'Sarah Martinez',     createdOn: 'Jun 05, 2026' },
  { name: 'Waitlist Organizer',    location: 'San Antonio, TX',   createdBy: 'James Rodriguez',    createdOn: 'Jul 27, 2026' },
  { name: 'Availability Checker',  location: 'San Diego, CA',     createdBy: 'Linda White',        createdOn: 'Aug 09, 2026' },
  { name: 'Follow-up Manager',     location: 'Dallas, TX',        createdBy: 'William Harris',     createdOn: 'Sep 15, 2026' },
  { name: 'Calendar Integrator',   location: 'San Jose, CA',      createdBy: 'Patricia Clark',     createdOn: 'Oct 30, 2026' },
  { name: 'Appointment Dashboard', location: 'Austin, TX',        createdBy: 'Daniel Lewis',       createdOn: 'Nov 11, 2026' },
  { name: 'Booking Insights',      location: 'Jacksonville, FL',  createdBy: 'Sophia Walker',      createdOn: 'Dec 25, 2026' },
  { name: 'Patient Coordination',  location: 'Fort Worth, TX',    createdBy: 'Matthew Hall',       createdOn: 'Mar 01, 2026' },
  { name: 'Slot Finder',           location: 'Columbus, OH',      createdBy: 'Ashley Young',       createdOn: 'Apr 10, 2026' },
  { name: 'Check-in Assistant',    location: 'Charlotte, NC',     createdBy: 'Joshua Allen',       createdOn: 'May 28, 2026' },
]

const COLUMNS = [
  { key: 'name'       as const, label: 'Widget name', sortable: true },
  { key: 'location'   as const, label: 'Location',    sortable: true },
  { key: 'createdBy'  as const, label: 'Created by',  sortable: true },
  { key: 'createdOn'  as const, label: 'Created on',  sortable: true },
]

const TOGGLES = [
  'Allow customers to reschedule appointments',
  'Allow customers to cancel appointments',
  'Include location information and map marker',
  'Show appointment events from CRM in inbox',
  'Send appointment communications after booking, confirmation and cancellation',
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-border-strong'}`}
    >
      <span
        className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[20px]' : 'translate-x-[2px]'} self-center`}
      />
    </button>
  )
}

interface AppointmentWidgetsScreenProps {
  onBack: () => void
}

export function AppointmentWidgetsScreen({ onBack }: AppointmentWidgetsScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toggles, setToggles] = useState<boolean[]>(TOGGLES.map(() => true))

  const filtered = search.trim()
    ? DATA.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.location.toLowerCase().includes(search.toLowerCase()) ||
          r.createdBy.toLowerCase().includes(search.toLowerCase()),
      )
    : DATA

  function flipToggle(i: number) {
    setToggles((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
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
        <span className="text-body text-text-primary">Appointment widgets</span>
      </div>

      {/* Header bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">{DATA.length} Appointment widgets</h1>

        <div className="flex items-center gap-sm">
          <HeaderSearchField open={searchOpen} value={search} onOpenChange={setSearchOpen} onChange={setSearch} placeholder="Search widgets…" />
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Settings className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
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
          rowAction={{ icon: 'content_copy', label: 'Copy widget URL', onClick: () => {} }}
          rowMenuItems={[
            { label: 'Edit',      onClick: () => {} },
            { label: 'Duplicate', onClick: () => {} },
            { label: 'Delete',    onClick: () => {}, variant: 'danger' },
          ]}
        />
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <>
          <div className="absolute inset-0 z-[200] bg-black/20 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="absolute right-2 top-2 z-[210] flex h-[calc(100%-16px)] w-[650px] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-2xl py-xl">
              <div className="flex items-center gap-sm">
                <button type="button" onClick={() => setSettingsOpen(false)} className="flex items-center justify-center text-text-icon hover:text-text-primary">
                  <ArrowLeft className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
                <span className="text-h3 text-text-primary">Settings</span>
              </div>
              <div className="flex items-center gap-sm">
                <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">
                  Cancel
                </button>
                <button type="button" className="flex h-[34px] items-center rounded-md bg-surface-selected px-lg text-body text-text-tertiary cursor-not-allowed">
                  Save
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-2xl py-lg">
              <p className="mb-lg text-[14px] text-[#8F8F8F]">Notifications &amp; alerts</p>
              <div className="flex flex-col">
                {TOGGLES.map((label, i) => (
                  <div key={label} className="flex items-center justify-between gap-lg py-sm">
                    <span className="text-body text-text-primary">{label}</span>
                    <Toggle on={toggles[i]} onChange={() => flipToggle(i)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
