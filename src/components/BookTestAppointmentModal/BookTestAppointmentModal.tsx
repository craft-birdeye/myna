import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import type { SelectOption } from '../SelectMenu/SelectMenu.types'
import type { BookTestAppointmentModalProps, BookTestAppointmentValues } from './BookTestAppointmentModal.types'
import { ChevronDown, Info, X } from 'lucide-react'

const APPOINTMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Routine checkup', label: 'Routine checkup' },
  { value: 'Tooth cleanup', label: 'Tooth cleanup' },
  { value: 'Root canal', label: 'Root canal' },
  { value: 'New patient visit', label: 'New patient visit' },
  { value: 'Follow-up', label: 'Follow-up' },
  { value: 'Tooth extraction', label: 'Tooth extraction' },
  { value: 'Crown placement', label: 'Crown placement' },
  { value: 'Orthodontic consultation', label: 'Orthodontic consultation' },
]

const DATE_TIME_OPTIONS: SelectOption[] = [
  { value: 'Jun 9, 2026 · 9:00 AM', label: 'Jun 9, 2026 · 9:00 AM' },
  { value: 'Jun 9, 2026 · 10:30 AM', label: 'Jun 9, 2026 · 10:30 AM' },
  { value: 'Jun 9, 2026 · 1:00 PM', label: 'Jun 9, 2026 · 1:00 PM' },
  { value: 'Jun 10, 2026 · 9:00 AM', label: 'Jun 10, 2026 · 9:00 AM' },
  { value: 'Jun 10, 2026 · 2:30 PM', label: 'Jun 10, 2026 · 2:30 PM' },
  { value: 'Jun 11, 2026 · 11:00 AM', label: 'Jun 11, 2026 · 11:00 AM' },
  { value: 'Jun 12, 2026 · 3:30 PM', label: 'Jun 12, 2026 · 3:30 PM' },
  { value: 'Jun 16, 2026 · 9:00 AM', label: 'Jun 16, 2026 · 9:00 AM' },
]

const EMPTY_VALUES: BookTestAppointmentValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  appointmentType: '',
  dateTime: '',
}

const INPUT_CLASS =
  'h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none'

function FormField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-body text-text-primary">{label}</span>
      {children}
    </label>
  )
}

function SelectField({
  value,
  placeholder,
  options,
  open,
  onOpenChange,
  onChange,
}: {
  value: string
  placeholder: string
  options: SelectOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onOpenChange])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={`flex h-[34px] w-full items-center justify-between rounded-md border bg-surface pl-md pr-sm text-left text-body hover:bg-surface-l2 ${
          open ? 'border-primary' : 'border-border-input'
        }`}
      >
        <span className={value ? 'text-text-primary' : 'text-text-secondary'}>
          {value || placeholder}
        </span>
        <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[210] mt-xs w-full">
          <SelectMenu
            options={options}
            value={value ? [value] : []}
            multi={false}
            searchable={false}
            onChange={(selected) => {
              onChange(selected[0] ?? '')
              onOpenChange(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

export function BookTestAppointmentModal({
  open,
  onClose,
  onBookAndRun,
  initialValues = null,
}: BookTestAppointmentModalProps) {
  const [values, setValues] = useState<BookTestAppointmentValues>(EMPTY_VALUES)
  const [typeOpen, setTypeOpen] = useState(false)
  const [dateTimeOpen, setDateTimeOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setTypeOpen(false)
      setDateTimeOpen(false)
      return
    }
    setValues(initialValues ?? EMPTY_VALUES)
  }, [open, initialValues])

  if (!open) return null

  const canSubmit =
    values.firstName.trim() !== '' &&
    values.lastName.trim() !== '' &&
    values.phone.trim() !== '' &&
    values.appointmentType !== '' &&
    values.dateTime !== ''

  function update<K extends keyof BookTestAppointmentValues>(key: K, value: BookTestAppointmentValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-[640px] max-w-[92vw] rounded-xl bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-2xl py-lg">
          <h2 className="text-h3 text-text-primary">Book your test appointment</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <X className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        <div className="mx-2xl mt-xl flex gap-sm rounded-sm border border-border bg-surface-l2 px-md py-sm">
          <Info className="size-5 mt-px shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
          <p className="text-small text-text-secondary">
            A test appointment will be created for this preview. No actual appointment will be booked with a real provider.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-lg px-2xl py-xl">
          <FormField label="First name">
            <input
              type="text"
              value={values.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              placeholder="Enter"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Last name">
            <input
              type="text"
              value={values.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              placeholder="Enter"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Phone number">
            <input
              type="tel"
              value={values.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Enter"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Enter"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Appointment type">
            <SelectField
              value={values.appointmentType}
              placeholder="Select"
              options={APPOINTMENT_TYPE_OPTIONS}
              open={typeOpen}
              onOpenChange={setTypeOpen}
              onChange={(value) => update('appointmentType', value)}
            />
          </FormField>
          <FormField label="Date and time">
            <SelectField
              value={values.dateTime}
              placeholder="Select"
              options={DATE_TIME_OPTIONS}
              open={dateTimeOpen}
              onOpenChange={setDateTimeOpen}
              onChange={(value) => update('dateTime', value)}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-sm border-t border-border px-2xl py-lg">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onBookAndRun(values)}
            className={`flex h-[34px] items-center rounded-md px-lg text-body transition-colors ${
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Book and run test
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
