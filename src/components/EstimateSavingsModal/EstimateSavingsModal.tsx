import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { EstimateSavingsModalProps, SavingsMode } from './EstimateSavingsModal.types'

const TIME_UNIT_OPTIONS = [
  { value: 'Mins', label: 'Mins' },
  { value: 'Hours', label: 'Hours' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
]

function InlineSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-sm border border-border-input bg-surface px-sm text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[100px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RadioOption({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-sm">
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-primary' : 'border-border-selected'
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="text-body text-text-primary">{label}</span>
    </button>
  )
}

export function EstimateSavingsModal({ open, onClose, onSave, initialValues }: EstimateSavingsModalProps) {
  const [mode, setMode] = useState<SavingsMode>(initialValues.mode)
  const [minutesPerResolution, setMinutesPerResolution] = useState(initialValues.minutesPerResolution)
  const [minutesUnit, setMinutesUnit] = useState('Mins')
  const [wageCurrency, setWageCurrency] = useState(initialValues.wageCurrency)
  const [hourlyWage, setHourlyWage] = useState(initialValues.hourlyWage)

  useEffect(() => {
    if (!open) return
    setMode(initialValues.mode)
    setMinutesPerResolution(initialValues.minutesPerResolution)
    setWageCurrency(initialValues.wageCurrency)
    setHourlyWage(initialValues.hourlyWage)
  }, [open, initialValues])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-[560px] max-w-[92vw] rounded-md bg-surface p-xl shadow-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="estimate-savings-title"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="estimate-savings-title" className="text-h3 text-text-primary">
              Estimate savings
            </h2>
            <p className="mt-xs text-body text-text-secondary">Define how savings are calculated for your agents</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="mt-xl flex items-center gap-xl">
          <RadioOption checked={mode === 'time'} onClick={() => setMode('time')} label="Time saved" />
          <RadioOption checked={mode === 'cost'} onClick={() => setMode('cost')} label="Cost saved" />
        </div>

        <div className="mt-xl flex items-center justify-between gap-lg">
          <span className="text-body text-text-primary">Time saved per conversation resolution</span>
          <div className="flex items-center gap-sm">
            <input
              type="number"
              min={0}
              value={minutesPerResolution}
              onChange={(e) => setMinutesPerResolution(Number(e.target.value))}
              className="h-9 w-16 rounded-sm border border-border-input px-sm text-body text-text-primary outline-none focus:border-primary"
            />
            <InlineSelect value={minutesUnit} options={TIME_UNIT_OPTIONS} onChange={setMinutesUnit} />
          </div>
        </div>

        {mode === 'cost' && (
          <div className="mt-xl flex items-start justify-between gap-lg">
            <div>
              <span className="text-body text-text-primary">Average hourly wage</span>
              <p className="mt-xs max-w-[300px] text-small text-text-secondary">
                Based on Glassdoor data of average salary of a front desk coordinator in US
              </p>
            </div>
            <div className="flex items-center gap-sm">
              <InlineSelect value={wageCurrency} options={CURRENCY_OPTIONS} onChange={setWageCurrency} />
              <input
                type="number"
                min={0}
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Number(e.target.value))}
                className="h-9 w-20 rounded-sm border border-border-input px-sm text-body text-text-primary outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        <div className="mt-2xl flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ mode, minutesPerResolution, wageCurrency, hourlyWage })}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white hover:bg-primary-hover"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
