import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DateRangePickerPanel } from '../DateRangePickerPanel/DateRangePickerPanel'
import { DateRangeSelectorProps } from './DateRangeSelector.types'

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[110] mt-xs">
            <DateRangePickerPanel
              value={value}
              onApply={(nextValue) => {
                onChange(nextValue)
                setOpen(false)
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}
