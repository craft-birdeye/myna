import { useState } from 'react'
import { Link } from '../Link/Link'
import type { ProcedureSelectCardProps } from './ProcedureSelectCard.types'
import { Check } from 'lucide-react'

function SelectCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Check className="size-4 text-white" strokeWidth={1.6} absoluteStrokeWidth />}
    </span>
  )
}

export function ProcedureSelectCard({
  title,
  description,
  selected,
  onToggle,
  onView,
}: ProcedureSelectCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative flex min-h-[148px] cursor-pointer flex-col rounded-md border p-xl transition-colors hover:bg-surface-selected ${
        selected
          ? 'border-2 border-primary bg-surface'
          : 'border border-border-selected bg-surface'
      }`}
    >
      {hovered && onView && (
        <Link
          as="button"
          onClick={(e) => {
            e.stopPropagation()
            onView()
          }}
          className="absolute right-xl top-xl text-body text-text-action hover:text-primary-hover"
        >
          View
        </Link>
      )}

      <div className="mb-md">
        <SelectCheckbox checked={selected} />
      </div>

      <h3 className="mb-xs pr-lg text-body text-text-primary">{title}</h3>
      <p className="line-clamp-3 text-body text-text-secondary">{description}</p>
    </div>
  )
}
