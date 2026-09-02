import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Mail, MapPin, Phone, User } from 'lucide-react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { WIZARD_LOCATIONS } from '../../data/wizardLocations'
import { AddEmployeeDrawerProps, AddEmployeeValues } from './AddEmployeeDrawer.types'

const EMPTY_VALUES: AddEmployeeValues = { firstName: '', lastName: '', email: '', phone: '', location: '' }

export function AddEmployeeDrawer({ open, onClose, onAdd }: AddEmployeeDrawerProps) {
  const [values, setValues] = useState<AddEmployeeValues>(EMPTY_VALUES)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValues(EMPTY_VALUES)
      setPhotoUrl(null)
    }
  }, [open])

  const canSubmit = values.email.trim().length > 0

  function set<K extends keyof AddEmployeeValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPhotoUrl(URL.createObjectURL(file))
  }

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[600px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
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
            <h2 className="text-h3 text-text-primary">Add employee</h2>
          </div>
          <div className="flex items-center gap-sm">
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
              onClick={() => onAdd(values)}
              className={`rounded-sm px-lg py-[7px] text-body transition-colors ${
                canSubmit
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-2xl pb-2xl">
          <div className="rounded-md bg-surface-muted p-2xl">
            {/* Upload profile photo */}
            <div className="flex items-center gap-md">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-text-secondary text-body text-white"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  '?'
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-body text-text-action hover:underline"
              >
                Upload profile photo
              </button>
            </div>

            {/* Fields */}
            <div className="mt-lg grid grid-cols-2 gap-lg">
              <div className="flex h-11 items-center gap-sm rounded-sm border border-border-input bg-surface px-md focus-within:border-primary">
                <User className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <input
                  value={values.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="First name"
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                />
                {values.firstName.trim() && (
                  <Check className="size-5 shrink-0 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                )}
              </div>
              <div className="flex h-11 items-center gap-sm rounded-sm border border-border-input bg-surface px-md focus-within:border-primary">
                <User className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <input
                  value={values.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Last name"
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                />
                {values.lastName.trim() && (
                  <Check className="size-5 shrink-0 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                )}
              </div>
              <div className="flex h-11 items-center gap-sm rounded-sm border border-border-input bg-surface px-md focus-within:border-primary">
                <Mail className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <input
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="Email *"
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                />
                {values.email.trim() && (
                  <Check className="size-5 shrink-0 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                )}
              </div>
              <div className="flex h-11 items-center gap-sm rounded-sm border border-border-input bg-surface px-md focus-within:border-primary">
                <Phone className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <input
                  value={values.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="Phone number"
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                />
                {values.phone.trim() && (
                  <Check className="size-5 shrink-0 text-chip-success-text" strokeWidth={1.6} absoluteStrokeWidth />
                )}
              </div>
              <div className="relative col-span-2 flex h-11 items-center gap-sm rounded-sm border border-border-input bg-surface px-md focus-within:border-primary">
                <MapPin className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <select
                  value={values.location}
                  onChange={(e) => set('location', e.target.value)}
                  className="min-w-0 flex-1 appearance-none bg-transparent pr-2xl text-body text-text-primary outline-none"
                >
                  <option value="" disabled hidden>
                    Select location
                  </option>
                  {WIZARD_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-md top-1/2 size-4 -translate-y-1/2 text-text-icon"
                  strokeWidth={1.6}
                  absoluteStrokeWidth
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
