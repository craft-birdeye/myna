import { useState } from 'react'
import { Icon, Link, BookingTemplateSelectField, TopNav } from '../components'
import { useBookingTemplateStore } from '../data/BookingTemplateStoreContext'

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

interface AppointmentWidgetEditorScreenProps {
  widget: WidgetRow
  onBack: () => void
  onOpenBookingTemplates?: (templateId: string) => void
}

export function AppointmentWidgetEditorScreen({ widget, onBack, onOpenBookingTemplates }: AppointmentWidgetEditorScreenProps) {
  const { templates } = useBookingTemplateStore()
  const [activeTab, setActiveTab] = useState<TabId>('configuration')

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

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav initials="S" />

      <div className="flex-1 overflow-y-auto bg-surface">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-surface px-2xl py-xl">
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
          <div className="mx-auto flex max-w-[720px] flex-col gap-2xl px-2xl pb-2xl pt-lg">
            {/* Widget-only settings */}
            <section className="rounded-md border border-border bg-surface-l2 p-xl">
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Widget-only settings</h2>
              <p className="mt-xs text-small text-text-tertiary">
                Appearance, booking URL, and embed settings belong to this widget.
              </p>
            </section>

            {/* Widget title and description */}
            <section className="rounded-md border border-border p-2xl">
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Widget title and description</h2>
              <p className="mt-xs text-small text-text-tertiary">Text patients see on the booking widget.</p>

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
            </section>

            {/* Booking template */}
            <section className="rounded-md border border-border p-2xl">
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Booking template</h2>
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
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
