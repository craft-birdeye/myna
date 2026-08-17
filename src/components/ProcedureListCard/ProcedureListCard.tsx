import { useState, useRef, useEffect } from 'react'
import { Check, MoreVertical } from 'lucide-react'
import { Link } from '../Link/Link'

function ProcedureBookIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19.7996 6.30078H14.3996C13.9339 6.30078 13.4745 6.40922 13.058 6.6175C12.6414 6.82578 12.279 7.12819 11.9996 7.50078C11.7202 7.12819 11.3578 6.82578 10.9412 6.6175C10.5247 6.40922 10.0653 6.30078 9.59961 6.30078H4.19961C4.04048 6.30078 3.88787 6.364 3.77535 6.47652C3.66282 6.58904 3.59961 6.74165 3.59961 6.90078V17.7008C3.59961 17.8599 3.66282 18.0125 3.77535 18.125C3.88787 18.2376 4.04048 18.3008 4.19961 18.3008H9.59961C10.077 18.3008 10.5348 18.4904 10.8724 18.828C11.21 19.1656 11.3996 19.6234 11.3996 20.1008C11.3996 20.2599 11.4628 20.4125 11.5753 20.525C11.6879 20.6376 11.8405 20.7008 11.9996 20.7008C12.1587 20.7008 12.3114 20.6376 12.4239 20.525C12.5364 20.4125 12.5996 20.2599 12.5996 20.1008C12.5996 19.6234 12.7893 19.1656 13.1268 18.828C13.4644 18.4904 13.9222 18.3008 14.3996 18.3008H19.7996C19.9587 18.3008 20.1114 18.2376 20.2239 18.125C20.3364 18.0125 20.3996 17.8599 20.3996 17.7008V6.90078C20.3996 6.74165 20.3364 6.58904 20.2239 6.47652C20.1114 6.364 19.9587 6.30078 19.7996 6.30078ZM9.59961 17.1008H4.79961V7.50078H9.59961C10.077 7.50078 10.5348 7.69042 10.8724 8.02799C11.21 8.36555 11.3996 8.82339 11.3996 9.30078V17.7008C10.8808 17.3104 10.2489 17.0997 9.59961 17.1008ZM19.1996 17.1008H14.3996C13.7503 17.0997 13.1184 17.3104 12.5996 17.7008V9.30078C12.5996 8.82339 12.7893 8.36555 13.1268 8.02799C13.4644 7.69042 13.9222 7.50078 14.3996 7.50078H19.1996V17.1008Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
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

function ThreeDotMenu({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={menuRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex size-6 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-selected"
      >
        <MoreVertical className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-xs min-w-[140px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          {onEdit && (
            <button
              type="button"
              className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
              onClick={() => { setOpen(false); onEdit() }}
            >
              Edit
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
              onClick={() => { setOpen(false); onDuplicate() }}
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
              onClick={() => { setOpen(false); onDelete() }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export interface ProcedureListCardProps {
  title: string
  description?: string
  /** Show a checkbox on the left; toggles selected state */
  selectable?: boolean
  selected?: boolean
  onToggle?: () => void
  /** "View" text link shown on hover (picker mode) */
  onView?: () => void
  /** Delete icon shown on hover (legacy — use onRemove in the three-dot menu via onDelete) */
  onRemove?: () => void
  /** Three-dot menu actions */
  onEdit?: () => void
  onDuplicate?: () => void
  onClick?: () => void
}

export function ProcedureListCard({
  title,
  description,
  selectable = false,
  selected = false,
  onToggle,
  onView,
  onRemove,
  onEdit,
  onDuplicate,
  onClick,
}: ProcedureListCardProps) {
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    onToggle?.()
    onClick?.()
  }

  const showMenu = !!(onEdit || onDuplicate || onRemove)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex cursor-pointer items-center gap-md rounded-sm border px-lg py-md transition-colors ${
        selectable && selected
          ? 'border-primary bg-surface'
          : hovered
            ? 'border-border-selected bg-surface-hover'
            : 'border-border-selected bg-surface'
      }`}
    >
      {/* Checkbox (picker mode) */}
      {selectable && <Checkbox checked={selected} />}

      {/* Book icon avatar */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-selected">
        <ProcedureBookIcon size={20} className="text-text-secondary" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-body text-text-primary">{title}</p>
        {description && (
          <p className="mt-[2px] line-clamp-2 text-small text-text-secondary">{description}</p>
        )}
      </div>

      {/* View link (picker mode) */}
      {hovered && onView && (
        <Link
          as="button"
          onClick={(e) => { e.stopPropagation(); onView() }}
          className="shrink-0 text-body"
        >
          View
        </Link>
      )}

      {/* Three-dot menu — always visible when actions are provided */}
      {showMenu && (
        <ThreeDotMenu
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onRemove}
        />
      )}
    </div>
  )
}
