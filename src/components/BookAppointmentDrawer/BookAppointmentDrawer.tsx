import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import iconGoogle from '../../assets/icon-google.svg'
import iconIcal from '../../assets/icon-ical.svg'
import iconOutlook from '../../assets/icon-outlook.svg'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { DatePickerModal } from '../DatePickerModal/DatePickerModal'
import { BookAppointmentDrawerProps } from './BookAppointmentDrawer.types'
import { ChevronDown, ChevronUp, Phone } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const WIDGET_OPTIONS = [
  'All scripts appointment',
  'New patient',
  'Follow-up appointment',
  'Urgent care',
]

const LOCATION_OPTIONS = ['Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Miami, FL', 'Seattle, WA']
const APPT_TYPE_OPTIONS = ['New consultation', 'Follow up', 'Procedure', 'Annual physical', 'Urgent care']
const PROVIDER_OPTIONS = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Jones']
const BOOK_FOR_OPTIONS = ['Myself', 'Someone else']
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

type ApptKey = 'location' | 'appointmentType' | 'provider' | 'dateTime'
type PatientKey = 'bookFor' | 'firstName' | 'lastName' | 'phone' | 'email' | 'gender' | 'dob' | 'address' | 'zipcode' | 'city' | 'state'

const APPT_FIELDS: { key: ApptKey; label: string; isDatePicker?: boolean; options?: string[] }[] = [
  { key: 'location',        label: 'Location',         options: LOCATION_OPTIONS },
  { key: 'appointmentType', label: 'Appointment type', options: APPT_TYPE_OPTIONS },
  { key: 'provider',        label: 'Provider',         options: PROVIDER_OPTIONS },
  { key: 'dateTime',        label: 'Appointment time', isDatePicker: true },
]

const PATIENT_REQUIRED: PatientKey[] = ['bookFor', 'firstName', 'phone', 'email', 'dob', 'address', 'zipcode', 'city', 'state']

const APPT_DURATION_MS = 30 * 60 * 1000
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─── Calendar event helpers ────────────────────────────────────────────────────

// Parses the "MMM d, yyyy, h:mm AM/PM" label produced by DatePickerModal's datetime variant
function parseApptDateTime(label: string): Date | null {
  const match = label.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/)
  if (!match) return null
  const [, monStr, dayStr, yearStr, hourStr, minStr, ampm] = match
  const month = MONTHS_SHORT.indexOf(monStr)
  if (month === -1) return null
  let hour = parseInt(hourStr, 10) % 12
  if (ampm === 'PM') hour += 12
  return new Date(parseInt(yearStr, 10), month, parseInt(dayStr, 10), hour, parseInt(minStr, 10))
}

function toUTCStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

interface ApptEvent {
  start: Date
  end: Date
  title: string
  description: string
  location: string
}

function buildApptEvent(appt: Partial<Record<ApptKey, string>>, patient: Partial<Record<PatientKey, string>>): ApptEvent | null {
  const start = appt.dateTime ? parseApptDateTime(appt.dateTime) : null
  if (!start) return null

  const title = `${appt.appointmentType || 'Appointment'} with ${appt.provider || 'provider'}`
  const description = [
    appt.provider && `Provider: ${appt.provider}`,
    appt.appointmentType && `Appointment type: ${appt.appointmentType}`,
    (patient.firstName || patient.lastName) && `Patient: ${[patient.firstName, patient.lastName].filter(Boolean).join(' ')}`,
    patient.phone && `Phone: (+1) ${patient.phone}`,
    patient.email && `Email: ${patient.email}`,
  ].filter(Boolean).join('\n')

  return { start, end: new Date(start.getTime() + APPT_DURATION_MS), title, description, location: appt.location || '' }
}

function openGoogleCalendar(event: ApptEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUTCStamp(event.start)}/${toUTCStamp(event.end)}`,
    details: event.description,
    location: event.location,
  })
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer')
}

function openOutlookCalendar(event: ApptEvent) {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.description,
    location: event.location,
  })
  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank', 'noopener,noreferrer')
}

function downloadICSFile(event: ApptEvent) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MYNA//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${toUTCStamp(new Date())}-${Math.random().toString(36).slice(2)}@myna`,
    `DTSTAMP:${toUTCStamp(new Date())}`,
    `DTSTART:${toUTCStamp(event.start)}`,
    `DTEND:${toUTCStamp(event.end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'appointment.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-[4px]">
      <span className="text-small text-text-primary">{label}</span>
      {required && <span className="text-[12px] leading-[18px] text-[#de1b0c]">*</span>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder = 'Enter input' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-[34px] w-full rounded-md border border-border-selected bg-surface px-[12px] text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
    />
  )
}

function DropdownButton({ value, open, onClick, placeholder = 'Select' }: {
  value?: string; open: boolean; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; placeholder?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[34px] w-full items-center gap-sm rounded-md border bg-surface pl-[12px] pr-sm hover:bg-surface-l2 ${open ? 'border-primary' : 'border-border-selected'}`}
    >
      <span className={`min-w-0 flex-1 truncate text-left text-body ${value ? 'text-text-primary' : 'text-text-tertiary'}`}>
        {value || placeholder}
      </span>
      <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
    </button>
  )
}

// ─── Accordion wrapper ────────────────────────────────────────────────────────

const Accordion = forwardRef<HTMLDivElement, {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode; topDivider?: boolean
}>(function Accordion({ title, open, onToggle, children, topDivider }, ref) {
  return (
    <div ref={ref} className={`border-b border-border last:border-b-0${topDivider ? ' border-t' : ''}`}>
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-[14px] pr-sm"
      >
        <span className="text-body text-text-primary">{title}</span>
        {open ? <ChevronUp className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth /> : <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
      </button>
      {open && (
        <div className="pb-[16px]">
          {children}
        </div>
      )}
    </div>
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export function BookAppointmentDrawer({ open, onClose }: BookAppointmentDrawerProps) {
  const [booked, setBooked] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  // Widget
  const [widget, setWidget] = useState('')
  const [widgetMenuOpen, setWidgetMenuOpen] = useState(false)
  const widgetBtnRef = useRef<HTMLButtonElement>(null)

  // Accordion open state — only one section open at a time
  const [openSection, setOpenSection] = useState<'appt' | 'patient' | null>('appt')
  const apptSectionRef = useRef<HTMLDivElement>(null)
  const patientSectionRef = useRef<HTMLDivElement>(null)

  // Appointment fields
  const [appt, setAppt] = useState<Partial<Record<ApptKey, string>>>({})
  const [openApptField, setOpenApptField] = useState<ApptKey | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [datePickerAnchor, setDatePickerAnchor] = useState<{ top: number; left: number } | null>(null)

  // Patient fields
  const [patient, setPatient] = useState<Partial<Record<PatientKey, string>>>({})
  const [openPatientField, setOpenPatientField] = useState<PatientKey | null>(null)
  const [agreed, setAgreed] = useState(false)

  // Shared anchor for SelectMenu dropdowns
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!open) {
      setBooked(false)
      setTransitioning(false)
      setWidget('')
      setWidgetMenuOpen(false)
      setOpenSection('appt')
      setAppt({})
      setOpenApptField(null)
      setDatePickerOpen(false)
      setPatient({})
      setOpenPatientField(null)
      setAgreed(false)
    }
  }, [open])

  // ── Widget menu ──
  function openWidgetMenu() {
    if (widgetMenuOpen) { setWidgetMenuOpen(false); return }
    const r = widgetBtnRef.current?.getBoundingClientRect()
    if (r) setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setWidgetMenuOpen(true)
    setOpenApptField(null)
    setOpenPatientField(null)
    setDatePickerOpen(false)
  }

  // ── Appointment field dropdowns ──
  function openApptDropdown(key: ApptKey, e: React.MouseEvent<HTMLButtonElement>) {
    const field = APPT_FIELDS.find(f => f.key === key)
    const r = e.currentTarget.getBoundingClientRect()
    if (field?.isDatePicker) {
      if (datePickerOpen) { setDatePickerOpen(false); return }
      setDatePickerAnchor({ top: r.top - 80, left: r.left })
      setDatePickerOpen(true)
      setOpenApptField(null)
      setOpenPatientField(null)
      setWidgetMenuOpen(false)
      return
    }
    if (openApptField === key) { setOpenApptField(null); return }
    setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpenApptField(key)
    setOpenPatientField(null)
    setWidgetMenuOpen(false)
    setDatePickerOpen(false)
  }

  // ── Patient field dropdowns ──
  function openPatientDropdown(key: PatientKey, e: React.MouseEvent<HTMLButtonElement>) {
    if (openPatientField === key) { setOpenPatientField(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpenPatientField(key)
    setOpenApptField(null)
    setWidgetMenuOpen(false)
    setDatePickerOpen(false)
  }

  const hasWidget = !!widget
  const apptComplete = APPT_FIELDS.every(f => !!appt[f.key])
  const patientComplete = PATIENT_REQUIRED.every(k => !!patient[k]) && agreed
  const canBook = hasWidget && apptComplete && patientComplete
  const apptEvent = buildApptEvent(appt, patient)

  // Auto-collapse a section into the next one as soon as it's fully filled out
  const wasApptComplete = useRef(false)
  useEffect(() => {
    if (apptComplete && !wasApptComplete.current && openSection === 'appt') {
      setOpenSection('patient')
    }
    wasApptComplete.current = apptComplete
  }, [apptComplete, openSection])

  // Scroll the newly opened (or reopened) section into view
  useEffect(() => {
    const sectionRef = openSection === 'appt' ? apptSectionRef : openSection === 'patient' ? patientSectionRef : null
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openSection])

  const patientDropdownOptions: Partial<Record<PatientKey, string[]>> = {
    bookFor: BOOK_FOR_OPTIONS,
    gender: GENDER_OPTIONS,
  }
  const activeApptField = APPT_FIELDS.find(f => f.key === openApptField && !f.isDatePicker)
  const activePatientField = openPatientField && patientDropdownOptions[openPatientField] ? openPatientField : null

  const goToSuccess = useCallback(() => {
    setTransitioning(true)
    setTimeout(() => {
      setBooked(true)
      setTransitioning(false)
    }, 900)
  }, [])

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Book appointment</h2>
          </div>
          {!booked && (
            <button
              type="button"
              disabled={!canBook}
              onClick={() => canBook && goToSuccess()}
              className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
                canBook
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Book
            </button>
          )}
        </div>

        {/* ── Skeleton loader ── */}
        {transitioning && (
          <div className="flex flex-1 flex-col gap-[12px] overflow-hidden px-2xl pb-2xl pt-[12px]">
            <div className="h-[266px] w-full shrink-0 animate-pulse rounded-sm bg-surface-selected" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-[6px]">
                <div className="h-[14px] w-[30%] animate-pulse rounded-sm bg-surface-selected" style={{ animationDelay: `${i * 60}ms` }} />
                <div className="h-9 w-full animate-pulse rounded-sm bg-surface-selected" style={{ animationDelay: `${i * 60}ms` }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Form view ── */}
        {!booked && !transitioning && (
          <div className="flex flex-1 flex-col overflow-y-auto px-2xl pb-2xl pt-md">
            {/* Appointment widget */}
            <div className="flex flex-col gap-xs">
              <label className="text-small text-text-primary">Appointment widget</label>
              <button
                ref={widgetBtnRef}
                type="button"
                onClick={openWidgetMenu}
                className={`flex h-[34px] w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm hover:bg-surface-l2 ${
                  widgetMenuOpen ? 'border-primary' : 'border-border-selected'
                }`}
              >
                <span className={`min-w-0 flex-1 truncate text-left text-body ${widget ? 'text-text-primary' : 'text-text-tertiary'}`}>
                  {widget || 'Select'}
                </span>
                <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>

            {/* Accordions */}
            {hasWidget && (
              <div className="mt-lg flex flex-col">
                {/* Accordion 1 — Appointment details */}
                <Accordion
                  ref={apptSectionRef}
                  title="Appointment details"
                  open={openSection === 'appt'}
                  onToggle={() => setOpenSection(s => (s === 'appt' ? null : 'appt'))}
                  topDivider
                >
                  <div className="flex flex-col gap-[12px]">
                    {APPT_FIELDS.map(field => (
                      <div key={field.key} className="flex flex-col gap-xs">
                        <FieldLabel label={field.label} required />
                        {field.isDatePicker ? (
                          <DropdownButton
                            value={appt[field.key]}
                            open={datePickerOpen}
                            onClick={e => openApptDropdown(field.key, e)}
                            placeholder="Select"
                          />
                        ) : (
                          <DropdownButton
                            value={appt[field.key]}
                            open={openApptField === field.key}
                            onClick={e => openApptDropdown(field.key, e)}
                            placeholder="Select"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Accordion>

                {/* Accordion 2 — Patient information */}
                <Accordion
                  ref={patientSectionRef}
                  title="Patient information"
                  open={openSection === 'patient'}
                  onToggle={() => setOpenSection(s => (s === 'patient' ? null : 'patient'))}
                >
                  <div className="flex flex-col gap-[12px]">
                    {/* Booking for */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Booking for" required />
                      <DropdownButton
                        value={patient.bookFor}
                        open={openPatientField === 'bookFor'}
                        onClick={e => openPatientDropdown('bookFor', e)}
                      />
                    </div>

                    {/* First name */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="First name" required />
                      <TextInput value={patient.firstName ?? ''} onChange={v => setPatient(p => ({ ...p, firstName: v }))} />
                    </div>

                    {/* Last name */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Last name" />
                      <TextInput value={patient.lastName ?? ''} onChange={v => setPatient(p => ({ ...p, lastName: v }))} />
                    </div>

                    {/* Phone number */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Phone number" required />
                      <div className="flex h-[34px] w-full items-center rounded-md border border-border-selected bg-surface focus-within:border-primary">
                        <div className="flex shrink-0 items-center gap-[4px] border-r border-border-selected px-[12px]">
                          <Phone className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                          <span className="text-body text-text-primary">+1</span>
                          <ChevronDown className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
                        </div>
                        <input
                          type="tel"
                          value={patient.phone ?? ''}
                          onChange={e => setPatient(p => ({ ...p, phone: e.target.value }))}
                          placeholder="Enter input"
                          className="min-w-0 flex-1 bg-transparent px-[12px] text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Email" required />
                      <TextInput value={patient.email ?? ''} onChange={v => setPatient(p => ({ ...p, email: v }))} />
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Gender" />
                      <DropdownButton
                        value={patient.gender}
                        open={openPatientField === 'gender'}
                        onClick={e => openPatientDropdown('gender', e)}
                      />
                    </div>

                    {/* Date of birth */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Date of birth" required />
                      <TextInput value={patient.dob ?? ''} onChange={v => setPatient(p => ({ ...p, dob: v }))} placeholder="MM/DD/YYYY" />
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Address" required />
                      <TextInput value={patient.address ?? ''} onChange={v => setPatient(p => ({ ...p, address: v }))} />
                    </div>

                    {/* Zipcode */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="Zipcode" required />
                      <TextInput value={patient.zipcode ?? ''} onChange={v => setPatient(p => ({ ...p, zipcode: v }))} />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="City" required />
                      <TextInput value={patient.city ?? ''} onChange={v => setPatient(p => ({ ...p, city: v }))} />
                    </div>

                    {/* State */}
                    <div className="flex flex-col gap-xs">
                      <FieldLabel label="State" required />
                      <TextInput value={patient.state ?? ''} onChange={v => setPatient(p => ({ ...p, state: v }))} />
                    </div>

                    {/* Consent */}
                    <label className="flex cursor-pointer items-start gap-[4px] pt-xs">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="mt-[2px] size-4 shrink-0 cursor-pointer accent-primary"
                      />
                      <span className="text-body text-text-primary">
                        I understand that I am disclosing confidential information over a secure, encrypted connection and that this information will not be sold to any third party. By booking an appointment, I agree to{' '}
                        <span className="text-text-action">Birdeye Terms of Service</span>
                        {' '}and{' '}
                        <span className="text-text-action">Privacy policy.</span>
                      </span>
                    </label>
                  </div>
                </Accordion>
              </div>
            )}
          </div>
        )}

        {/* ── Success state ── */}
        {booked && !transitioning && (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Thank you message */}
            <div className="px-2xl py-lg">
              <p className="text-[18px] leading-[28px] tracking-[-0.36px] text-text-primary">Thank you for your booking</p>
              <p className="mt-xs text-body text-text-secondary">We'll send you an appointment confirmation via text and email shortly.</p>
            </div>

            {/* Map with tooltip */}
            <div className="relative mx-2xl h-[266px] shrink-0 overflow-hidden rounded-sm border border-border-selected bg-surface-l2">
              <div className="absolute left-[calc(50%-8px)] top-[190px] flex flex-col items-center">
                <div className="flex size-4 items-center justify-center rounded-full bg-[#e53935] shadow-md ring-2 ring-white">
                  <div className="size-[6px] rounded-full bg-white" />
                </div>
                <div className="h-[14px] w-[2px] bg-[#e53935]" />
              </div>
              <div className="absolute left-[calc(50%-80px)] top-[20px] w-[300px] overflow-hidden rounded-sm bg-surface shadow-[0px_10px_24px_0px_rgba(33,33,33,0.2)]">
                <div className="border-b border-border px-[16px] py-[12px]">
                  <p className="text-body text-text-primary">{appt.location || 'Location'}</p>
                  <p className="text-small text-text-tertiary">San Francisco, CA, USA</p>
                </div>
                <div className="flex flex-col gap-[8px] px-[16px] py-[12px]">
                  <div className="flex items-center gap-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-l2 text-small text-text-primary">
                      {appt.provider ? appt.provider.split(' ').map(w => w[0]).slice(0, 2).join('') : 'DR'}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-body text-text-primary">{appt.provider || 'Provider'}</p>
                      <p className="text-small text-text-tertiary">{appt.appointmentType || 'Appointment type'}</p>
                    </div>
                  </div>
                  <div className="pl-[48px]">
                    <p className="text-body text-text-primary">{appt.dateTime || 'Appointment time'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="mx-2xl mt-lg rounded-sm bg-surface-l2 px-lg py-md">
              <p className="text-small text-text-tertiary">Contact details</p>
              <p className="mt-xs text-body text-text-primary">
                {[patient.firstName, patient.lastName].filter(Boolean).join(' ') || '—'}
              </p>
              {patient.phone && <p className="text-body text-text-primary">(+1) {patient.phone}</p>}
              {patient.email && <p className="text-body text-text-primary">{patient.email}</p>}
            </div>

            {/* Add to calendar */}
            <div className="mt-lg flex flex-col items-center gap-md px-2xl pb-2xl">
              <p className="text-body text-text-secondary">Add to your calendar?</p>
              <div className="grid w-full grid-cols-3 gap-[10px]">
                <button
                  type="button"
                  disabled={!apptEvent}
                  onClick={() => apptEvent && openGoogleCalendar(apptEvent)}
                  className="flex flex-col items-center gap-[5px] rounded-[6px] bg-surface-l2 px-[26px] py-[12px] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img src={iconGoogle} alt="Google Calendar" className="size-5" />
                  <span className="text-[12px] leading-[16px] text-text-primary">Google</span>
                </button>
                <button
                  type="button"
                  disabled={!apptEvent}
                  onClick={() => apptEvent && downloadICSFile(apptEvent)}
                  className="flex flex-col items-center gap-[5px] rounded-[6px] bg-surface-l2 px-[26px] py-[12px] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img src={iconIcal} alt="iCal" className="size-5" />
                  <span className="text-[12px] leading-[16px] text-text-primary">iCal</span>
                </button>
                <button
                  type="button"
                  disabled={!apptEvent}
                  onClick={() => apptEvent && openOutlookCalendar(apptEvent)}
                  className="flex flex-col items-center gap-[5px] rounded-[6px] bg-surface-l2 px-[26px] py-[12px] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <img src={iconOutlook} alt="Outlook" className="size-5" />
                  <span className="text-[12px] leading-[16px] text-text-primary">Outlook</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Widget dropdown */}
      {widgetMenuOpen && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setWidgetMenuOpen(false)} />
          <div className="fixed z-[110]" style={{ top: anchor.top, left: anchor.left, width: anchor.width }}>
            <SelectMenu
              options={WIDGET_OPTIONS.map(o => ({ value: o, label: o }))}
              value={widget ? [widget] : []}
              searchable={false}
              onChange={val => { setWidget(val[0] ?? ''); setWidgetMenuOpen(false) }}
            />
          </div>
        </>
      )}

      {/* Appointment field dropdowns */}
      {activeApptField && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpenApptField(null)} />
          <div className="fixed z-[110]" style={{ top: anchor.top, left: anchor.left, width: anchor.width }}>
            <SelectMenu
              options={(activeApptField.options ?? []).map(o => ({ value: o, label: o }))}
              value={appt[activeApptField.key] ? [appt[activeApptField.key]!] : []}
              onChange={val => { setAppt(a => ({ ...a, [activeApptField.key]: val[0] ?? '' })); setOpenApptField(null) }}
            />
          </div>
        </>
      )}

      {/* Patient field dropdowns */}
      {activePatientField && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpenPatientField(null)} />
          <div className="fixed z-[110]" style={{ top: anchor.top, left: anchor.left, width: anchor.width }}>
            <SelectMenu
              options={(patientDropdownOptions[activePatientField] ?? []).map(o => ({ value: o, label: o }))}
              value={patient[activePatientField] ? [patient[activePatientField]!] : []}
              searchable={false}
              onChange={val => { setPatient(p => ({ ...p, [activePatientField]: val[0] ?? '' })); setOpenPatientField(null) }}
            />
          </div>
        </>
      )}

      {/* Date & time picker */}
      <DatePickerModal
        open={datePickerOpen}
        anchor={datePickerAnchor}
        variant="datetime"
        onClose={() => setDatePickerOpen(false)}
        onApply={value => setAppt(a => ({ ...a, dateTime: value }))}
      />
    </div>
  )
}
