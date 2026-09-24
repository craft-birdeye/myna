import { Check } from 'lucide-react'

export interface ChecklistDropdownPanelProps {
  options: string[]
  value: string
  onSelect: (option: string) => void
  align?: 'left' | 'right'
  className?: string
}

export function ChecklistDropdownPanel({
  options,
  value,
  onSelect,
  align = 'left',
  className = '',
}: ChecklistDropdownPanelProps) {
  return (
    <div
      className={`absolute top-full z-50 mt-xs min-w-[196px] rounded-lg bg-surface p-sm shadow-dropdown ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`flex w-full items-center justify-between rounded-md px-md py-sm text-left text-body text-text-primary transition-colors ${
              selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'
            }`}
          >
            <span>{option}</span>
            {selected && <Check className="size-4 shrink-0 text-text-primary" strokeWidth={2} absoluteStrokeWidth />}
          </button>
        )
      })}
    </div>
  )
}
