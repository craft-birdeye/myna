import { Check, HelpCircle, CheckCircle2, AlertCircle, MinusCircle, type LucideIcon } from 'lucide-react'
import {
  ALL_STATUS_IDS,
  STATUS_FILTER_OPTIONS,
  StatusFilterDropdownProps,
} from './StatusFilterDropdown.types'

const STATUS_ICON_MAP: Record<string, LucideIcon> = {
  help: HelpCircle,
  check_circle: CheckCircle2,
  error: AlertCircle,
  do_not_disturb_on: MinusCircle,
}

function StatusCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Check className="size-4 text-white" strokeWidth={1.6} absoluteStrokeWidth />}
    </span>
  )
}

export function StatusFilterDropdown({ value, onChange, onApply }: StatusFilterDropdownProps) {
  const selected = new Set(value)

  function toggle(id: string) {
    if (id === 'all') {
      onChange(ALL_STATUS_IDS)
      return
    }
    if (selected.has(id)) {
      onChange(value.filter((s) => s !== id && s !== 'all'))
    } else {
      onChange([...value.filter((s) => s !== 'all'), id])
    }
  }

  return (
    <div className="w-[256px] rounded-sm bg-surface shadow-dropdown">
      <div className="px-lg pb-sm pt-md">
        <span className="text-small text-text-tertiary">Status</span>
      </div>

      <div className="flex flex-col gap-xs px-lg pb-xs">
        {STATUS_FILTER_OPTIONS.map((item) => {
          const checked = selected.has(item.id)
          const StatusIcon = item.icon ? STATUS_ICON_MAP[item.icon] : undefined
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className="flex w-full items-center gap-sm rounded-sm py-sm pr-sm text-left hover:bg-surface-hover"
            >
              <StatusCheckbox checked={checked} />
              {StatusIcon && (
                <StatusIcon
                  className={`size-5 shrink-0 ${item.iconClassName ?? ''}`}
                  strokeWidth={1.6}
                  absoluteStrokeWidth
                />
              )}
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">{item.label}</span>
            </button>
          )
        })}
      </div>

      <span className="h-px w-full bg-border" />

      <div className="flex justify-end p-xl">
        <button
          type="button"
          onClick={onApply}
          className="rounded-md bg-primary px-lg py-[7px] text-body text-white transition-colors hover:bg-primary-hover"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
