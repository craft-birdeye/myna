import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { DateRangeSelectorProps } from './DateRangeSelector.types'

// Panel styling (colors, fonts, checkmark) comes from SelectMenu — the shared single/multi-select
// dropdown — so every select-style dropdown in the app stays visually consistent by construction.
export function DateRangeSelector({ value, options, onChange }: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        {value}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[110] mt-xs min-w-[200px]">
            <SelectMenu
              options={options.map((opt) => ({ value: opt, label: opt }))}
              value={[value]}
              searchable={false}
              onChange={([next]) => {
                onChange(next)
                setOpen(false)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
