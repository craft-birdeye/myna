import { useState } from 'react'
import birdeyeLogoUrl from '../assets/birdeye-logo.svg'
import { BookingTemplateSelectField, Icon, Link, SimpleSelect, TopNav } from '../components'
import { useBookingTemplateStore } from '../data/BookingTemplateStoreContext'

const PREVIEW_TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
]
/** Aug 2026 grid — Aug 1 falls on a Saturday, so 6 leading blanks. */
const PREVIEW_CALENDAR_CELLS: Array<number | null> = [
  ...Array.from({ length: 6 }, () => null),
  ...Array.from({ length: 31 }, (_, i) => i + 1),
  ...Array.from({ length: 5 }, () => null),
]

interface WidgetRow {
  name: string
  location: string
  createdBy: string
  createdOn: string
}

const TABS = [
  { id: 'install', label: 'Install' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'preferences', label: 'Preferences' },
] as const
type TabId = (typeof TABS)[number]['id']

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center text-body text-text-tertiary">
      Nothing to configure in {label.toLowerCase()} yet.
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-border-strong'}`}
    >
      <span className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[20px]' : 'translate-x-[2px]'} self-center`} />
    </button>
  )
}

const SLOT_UNIT_OPTIONS = [
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
]
const ADVANCE_UNIT_OPTIONS = [
  { value: 'hours', label: 'hours' },
  { value: 'day', label: 'day' },
  { value: 'days', label: 'days' },
]
const COUNT_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))

/** Small inline "12 ▾ months ▾" pair used by Booking preferences. */
function InlinePreferenceRow({
  label,
  suffix,
  count,
  onCountChange,
  unit,
  onUnitChange,
  unitOptions,
}: {
  label: string
  suffix?: string
  count: string
  onCountChange: (v: string) => void
  unit: string
  onUnitChange: (v: string) => void
  unitOptions: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-sm text-body text-text-primary">
      <span>{label}</span>
      <SimpleSelect value={count} options={COUNT_OPTIONS} onChange={onCountChange} className="w-[72px]" />
      <SimpleSelect value={unit} options={unitOptions} onChange={onUnitChange} className="w-[110px]" />
      {suffix && <span>{suffix}</span>}
    </div>
  )
}

interface AppointmentWidgetEditorScreenProps {
  widget: WidgetRow
  onBack: () => void
  onOpenBookingTemplates?: (templateId: string) => void
}

export function AppointmentWidgetEditorScreen({ widget, onBack, onOpenBookingTemplates }: AppointmentWidgetEditorScreenProps) {
  const { templates } = useBookingTemplateStore()
  const [activeTab, setActiveTab] = useState<TabId>('configuration')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.id === 'general-intake')?.id ?? templates[0]?.id ?? '',
  )

  const [bookingHeader, setBookingHeader] = useState('Schedule a visit')
  const [bookingDescription, setBookingDescription] = useState(
    'Please schedule a visit below and one of our team members will reach out to you shortly.',
  )
  const [confirmationHeader, setConfirmationHeader] = useState('Thank you for your booking')
  const [confirmationDescription, setConfirmationDescription] = useState(
    "We'll send you an appointment confirmation via text and email shortly.",
  )
  const [customerInfoHeader, setCustomerInfoHeader] = useState('Customer information')
  const [allowUnintegratedProviders, setAllowUnintegratedProviders] = useState(false)

  const [slotsAheadCount, setSlotsAheadCount] = useState('12')
  const [slotsAheadUnit, setSlotsAheadUnit] = useState('months')
  const [minAdvanceCount, setMinAdvanceCount] = useState('1')
  const [minAdvanceUnit, setMinAdvanceUnit] = useState('day')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav initials="S" />

      <div className="flex-1 overflow-y-auto bg-surface">
        {/* Breadcrumb */}
        <div className="flex items-center gap-xs px-2xl pt-lg pb-0">
          <Link as="button" onClick={onBack} className="text-body">Settings</Link>
          <Icon name="chevron_right" size={16} className="text-text-tertiary" />
          <Link as="button" onClick={onBack} className="text-body">Widgets</Link>
          <Icon name="chevron_right" size={16} className="text-text-tertiary" />
          <Link as="button" onClick={onBack} className="text-body">Appointments</Link>
          <Icon name="chevron_right" size={16} className="text-text-tertiary" />
          <span className="text-body text-text-primary">{widget.name}</span>
        </div>

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-surface px-2xl pb-md pt-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-sm">
              <h1 className="truncate text-h3 text-text-primary">{widget.name}</h1>
              <Icon name="edit" size={16} className="shrink-0 text-text-icon" />
            </div>
            <Link as="button" onClick={() => {}} className="text-body">
              {widget.location}
            </Link>
          </div>
          <div className="flex items-center gap-sm">
            <button type="button" aria-label="Widget settings" className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
              <Icon name="settings" size={20} />
            </button>
            <button type="button" onClick={onBack} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">
              Cancel
            </button>
            <button type="button" onClick={onBack} className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover">
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2xl border-b border-border px-2xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 py-md text-body transition-colors ${
                activeTab === tab.id ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'configuration' ? (
          <PlaceholderTab label={TABS.find((t) => t.id === activeTab)?.label ?? ''} />
        ) : (
          <div className="px-2xl pb-2xl pt-lg">
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Widget settings</h2>
            <p className="mt-xs text-small text-text-tertiary">Customize the information you want to display on the widget.</p>

            <div className="mt-lg grid grid-cols-1 gap-2xl lg:grid-cols-2">
              {/* Left column — settings */}
              <div className="divide-y divide-border rounded-md border border-border">
                {/* Widget title and description */}
                <div className="p-2xl">
                  <h3 className="text-body text-text-primary">Widget title and description</h3>
                  <div className="mt-lg flex flex-col gap-lg">
                    <div>
                      <label className="mb-xs block text-small text-text-secondary">
                        Booking page header <span className="text-chip-danger-text">*</span>
                      </label>
                      <input
                        value={bookingHeader}
                        onChange={(e) => setBookingHeader(e.target.value)}
                        className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-xs block text-small text-text-secondary">
                        Booking page description <span className="text-chip-danger-text">*</span>
                      </label>
                      <textarea
                        value={bookingDescription}
                        onChange={(e) => setBookingDescription(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-xs block text-small text-text-secondary">
                        Confirmation page header <span className="text-chip-danger-text">*</span>
                      </label>
                      <input
                        value={confirmationHeader}
                        onChange={(e) => setConfirmationHeader(e.target.value)}
                        className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-xs block text-small text-text-secondary">
                        Confirmation page description <span className="text-chip-danger-text">*</span>
                      </label>
                      <textarea
                        value={confirmationDescription}
                        onChange={(e) => setConfirmationDescription(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-xs block text-small text-text-secondary">
                        Customer information header <span className="text-chip-danger-text">*</span>
                      </label>
                      <input
                        value={customerInfoHeader}
                        onChange={(e) => setCustomerInfoHeader(e.target.value)}
                        className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Booking template */}
                <div className="p-2xl">
                  <h3 className="text-body text-text-primary">Booking template</h3>
                  <p className="mt-xs text-small text-text-tertiary">
                    Form fields, appointment types, and providers patients see when they book.
                  </p>
                  <div className="mt-lg">
                    <BookingTemplateSelectField
                      label=""
                      value={templateId}
                      onChange={setTemplateId}
                      templates={templates}
                      onEditTemplate={onOpenBookingTemplates}
                    />
                  </div>
                </div>

                {/* Unintegrated locations toggle */}
                <div className="flex items-center justify-between gap-lg p-2xl">
                  <span className="text-body text-text-primary">Allow customers to choose service providers at unintegrated locations</span>
                  <Toggle on={allowUnintegratedProviders} onChange={() => setAllowUnintegratedProviders((v) => !v)} />
                </div>

                {/* Booking preferences */}
                <div className="p-2xl">
                  <h3 className="text-body text-text-primary">Booking preferences</h3>
                  <div className="mt-lg flex flex-col gap-md">
                    <InlinePreferenceRow
                      label="Show appointment slots up to"
                      suffix="in to the future"
                      count={slotsAheadCount}
                      onCountChange={setSlotsAheadCount}
                      unit={slotsAheadUnit}
                      onUnitChange={setSlotsAheadUnit}
                      unitOptions={SLOT_UNIT_OPTIONS}
                    />
                    <InlinePreferenceRow
                      label="Minimum time to book in advance is"
                      count={minAdvanceCount}
                      onCountChange={setMinAdvanceCount}
                      unit={minAdvanceUnit}
                      onUnitChange={setMinAdvanceUnit}
                      unitOptions={ADVANCE_UNIT_OPTIONS}
                    />
                  </div>
                </div>
              </div>

              {/* Right column — preview */}
              <div className="rounded-md bg-surface-l2 p-2xl">
                <div className="lg:sticky lg:top-[140px]">
                  <div className="mb-md flex items-center justify-between">
                    <h3 className="text-body text-text-primary">Preview</h3>
                    <div className="flex items-center gap-xs">
                      <button
                        type="button"
                        aria-label="Desktop preview"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`flex size-7 items-center justify-center rounded-sm ${previewDevice === 'desktop' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
                      >
                        <Icon name="computer" size={18} />
                      </button>
                      <button
                        type="button"
                        aria-label="Mobile preview"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`flex size-7 items-center justify-center rounded-sm ${previewDevice === 'mobile' ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'}`}
                      >
                        <Icon name="smartphone" size={18} />
                      </button>
                      <button type="button" aria-label="Expand preview" className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                        <Icon name="open_in_full" size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={`mx-auto rounded-md border border-border bg-surface p-lg transition-all ${previewDevice === 'mobile' ? 'max-w-[280px]' : 'max-w-full'}`}>
                    {/* Brand header */}
                    <div className="flex items-center justify-between gap-md">
                      <div className="flex min-w-0 items-center gap-sm">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <Icon name="storefront" size={16} />
                        </span>
                        <span className="truncate text-body text-text-primary">{widget.location}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-xs">
                        <span className="flex items-center gap-xs rounded-sm border border-border px-sm py-xs text-small text-text-secondary">
                          <Icon name="call" size={14} className="text-text-icon" />
                          Call
                        </span>
                        <span className="flex items-center gap-xs rounded-sm border border-border px-sm py-xs text-small text-text-secondary">
                          <Icon name="mail" size={14} className="text-text-icon" />
                          Email
                        </span>
                      </div>
                    </div>

                    {/* Booking fields + calendar */}
                    <div className={`mt-lg grid grid-cols-1 gap-lg ${previewDevice === 'mobile' ? '' : 'sm:grid-cols-2'}`}>
                      <div className="flex flex-col gap-sm">
                        <h4 className="text-body text-text-primary">{bookingHeader || 'Schedule a visit'}</h4>
                        <p className="text-small text-text-secondary">{bookingDescription}</p>
                        <div className="mt-xs flex flex-col gap-sm">
                          {['Select location', 'Appointment type', 'Provider'].map((placeholder) => (
                            <div
                              key={placeholder}
                              className="flex h-9 items-center justify-between rounded-sm border border-border-input px-md text-small text-text-tertiary"
                            >
                              {placeholder}
                              <Icon name="expand_more" size={16} className="text-text-icon" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-small text-text-primary">
                          <button type="button" className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                            <Icon name="chevron_left" size={16} />
                          </button>
                          <span>Aug 2026</span>
                          <div className="flex items-center gap-xs">
                            <span className="text-text-action">Today</span>
                            <button type="button" className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                              <Icon name="chevron_right" size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-sm grid grid-cols-7 gap-[2px] text-center text-small text-text-tertiary">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <span key={i}>{d}</span>
                          ))}
                          {PREVIEW_CALENDAR_CELLS.map((day, i) => (
                            <span
                              key={i}
                              className={`rounded-sm py-xs ${day === 15 ? 'bg-primary text-white' : day ? 'text-text-secondary' : ''}`}
                            >
                              {day ?? ''}
                            </span>
                          ))}
                        </div>
                        <div className="mt-md grid grid-cols-2 gap-xs">
                          {PREVIEW_TIME_SLOTS.map((slot) => (
                            <span
                              key={slot}
                              className="rounded-sm border border-border-input py-xs text-center text-small text-text-action"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-lg flex h-9 items-center justify-center rounded-sm bg-surface-selected text-body text-text-tertiary">
                      Next
                    </div>
                    <div className="mt-sm flex items-center justify-center gap-xs text-small text-text-tertiary">
                      <span>Powered by</span>
                      <img src={birdeyeLogoUrl} alt="" className="size-4 shrink-0" />
                      <span>Birdeye</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
