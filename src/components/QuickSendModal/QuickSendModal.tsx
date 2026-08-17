import { useEffect, useState } from 'react'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { QuickSendModalProps } from './QuickSendModal.types'
import { ChevronDown, Info, X } from 'lucide-react'

const TYPE_OPTIONS = [
  'Review request',
  'Appointment reminder',
  'Insurance verification',
  'Prescription refill',
]

const LOCATION_OPTIONS = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
]

type OpenField = 'type' | 'location' | null

export function QuickSendModal({ open, patient, email = '', onClose, onSend }: QuickSendModalProps) {
  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [emailVal, setEmailVal] = useState('')
  const [location, setLocation] = useState('')
  const [openField, setOpenField] = useState<OpenField>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (open) {
      setType('')
      setName(patient)
      setEmailVal(email)
      setLocation('')
      setOpenField(null)
    }
  }, [open, patient, email])

  function openMenu(field: OpenField, e: React.MouseEvent<HTMLButtonElement>) {
    if (openField === field) { setOpenField(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpenField(field)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="absolute left-1/2 top-[60px] w-[590px] -translate-x-1/2 rounded-xl bg-surface shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-2xl pb-lg pt-2xl">
          <span className="text-h3 text-text-primary">Quick send</span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <X className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-md px-2xl pb-lg">
          {/* Type field */}
          <div className="flex flex-col gap-xs">
            <label className="text-small text-text-primary">Type</label>
            <button
              type="button"
              onClick={(e) => openMenu('type', e)}
              className={`flex h-[34px] w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm hover:bg-surface-l2 ${
                openField === 'type' ? 'border-primary' : 'border-border-input'
              }`}
            >
              <span className={`min-w-0 flex-1 truncate text-left text-body ${type ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {type || 'Select request type'}
              </span>
              <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          {/* Conditional fields — shown only when type is selected */}
          {type && (
            <>
              {/* Name */}
              <div className="flex flex-col gap-xs">
                <label className="text-small text-text-primary">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-xs">
                <label className="text-small text-text-primary">Email</label>
                <input
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  className="h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
                />
              </div>

              {/* Location */}
              <div className="flex flex-col gap-xs">
                <label className="text-small text-text-primary">Location</label>
                <button
                  type="button"
                  onClick={(e) => openMenu('location', e)}
                  className={`flex h-[34px] w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm hover:bg-surface-l2 ${
                    openField === 'location' ? 'border-primary' : 'border-border-input'
                  }`}
                >
                  <span className={`min-w-0 flex-1 truncate text-left text-body ${location ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {location || 'Select location'}
                  </span>
                  <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>

              {/* Info banner */}
              <div className="flex items-center gap-sm rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-md py-sm">
                <Info className="size-4 shrink-0 text-[#3b82f6]" strokeWidth={1.6} absoluteStrokeWidth />
                <span className="text-small text-text-primary">The last templates are preselected. Change if needed.</span>
              </div>

              {/* More toggle */}
              <button type="button" className="flex w-fit items-center gap-xs text-body text-text-action">
                More
                <ChevronDown className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </>
          )}
        </div>

        {/* Footer */}
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
            disabled={!type}
            onClick={() => { onClose(); onSend?.() }}
            className={`flex h-[34px] items-center rounded-md px-lg text-body transition-colors ${
              type
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Send
          </button>
        </div>
      </div>

      {/* Dropdown menus — above modal */}
      {openField && anchor && (
        <>
          <div className="fixed inset-0 z-[125]" onClick={() => setOpenField(null)} />
          <div className="fixed z-[130]" style={{ top: anchor.top, left: anchor.left, width: anchor.width }}>
            {openField === 'type' && (
              <SelectMenu
                options={TYPE_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={type ? [type] : []}
                onChange={(val) => { setType(val[0] ?? ''); setOpenField(null) }}
              />
            )}
            {openField === 'location' && (
              <SelectMenu
                options={LOCATION_OPTIONS.map((o) => ({ value: o, label: o }))}
                value={location ? [location] : []}
                onChange={(val) => { setLocation(val[0] ?? ''); setOpenField(null) }}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
