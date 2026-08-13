import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDrawer } from '../../hooks/useDrawer'
import { Icon } from '../Icon/Icon'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import type { EstimateSavingsModalProps, EstimateSavingsValues, SavingsMode } from './EstimateSavingsModal.types'

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
]

function CurrencyField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-[104px] items-center justify-between rounded-sm border bg-surface pl-md pr-sm text-left text-body text-text-primary hover:bg-surface-l2 ${
          open ? 'border-primary' : 'border-border-input'
        }`}
      >
        {value}
        <Icon name="expand_more" size={20} className="shrink-0 text-text-icon" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[1310] mt-xs w-[104px]">
          <SelectMenu
            options={CURRENCY_OPTIONS}
            value={[value]}
            multi={false}
            searchable={false}
            onChange={(selected) => {
              if (selected[0]) onChange(selected[0])
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

export function EstimateSavingsModal({ open, values, unitLabel, onClose, onSave }: EstimateSavingsModalProps) {
  const [draft, setDraft] = useState<EstimateSavingsValues>(values)
  const { mounted, closing } = useDrawer(open, 150)

  useEffect(() => {
    if (open) setDraft(values)
  }, [open, values])

  if (!mounted) return null

  function setMode(mode: SavingsMode) {
    setDraft((prev) => ({ ...prev, mode }))
  }

  return createPortal(
    <div className="fixed inset-0 z-[1300]">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-150 ease-out ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      <div
        className={`absolute left-1/2 top-14 w-[640px] max-w-[92vw] -translate-x-1/2 rounded-lg border border-border bg-surface shadow-modal transition-all duration-150 ease-out ${
          closing ? '-translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="estimate-savings-title"
      >
        <div className="flex items-start justify-between px-2xl pt-xl">
          <div>
            <h2 id="estimate-savings-title" className="text-h3 text-text-primary">
              Estimate savings
            </h2>
            <p className="mt-xs text-small text-text-tertiary">Define how savings are calculated for your agents</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-xl px-2xl py-xl">
          <div className="flex items-center gap-2xl">
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="radio" name="savings-mode" checked={draft.mode === 'time'} onChange={() => setMode('time')} className="accent-primary" />
              <span className="text-body text-text-primary">Time saved</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input type="radio" name="savings-mode" checked={draft.mode === 'cost'} onChange={() => setMode('cost')} className="accent-primary" />
              <span className="text-body text-text-primary">Cost saved</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-lg">
            <span className="text-body text-text-primary">Time saved per {unitLabel}</span>
            <div className="flex h-9 w-[140px] items-center justify-between rounded-sm border border-border-input bg-surface pl-md pr-sm">
              <input
                type="number"
                min={0}
                value={draft.timePerUnitMins}
                onChange={(e) => setDraft((prev) => ({ ...prev, timePerUnitMins: Number(e.target.value) }))}
                className="w-full bg-transparent text-body text-text-primary outline-none"
              />
              <span className="shrink-0 text-body text-text-tertiary">Mins</span>
            </div>
          </div>

          {draft.mode === 'cost' && (
            <div className="flex items-center justify-between gap-lg">
              <div className="max-w-[360px]">
                <span className="text-body text-text-primary">Average hourly wage</span>
                <p className="mt-xs text-small text-text-tertiary">
                  Based on Glassdoor data of average salary of reputation manager in US
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-sm">
                <CurrencyField
                  value={draft.currency}
                  onChange={(currency) => setDraft((prev) => ({ ...prev, currency }))}
                />
                <input
                  type="number"
                  min={0}
                  value={draft.hourlyWage}
                  onChange={(e) => setDraft((prev) => ({ ...prev, hourlyWage: Number(e.target.value) }))}
                  className="h-9 w-[104px] rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-sm px-2xl pb-xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
