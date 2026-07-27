import { Icon } from '../Icon/Icon'
import { HeaderSearchFieldProps } from './HeaderSearchField.types'

export function HeaderSearchField({ open, value, onOpenChange, onChange, placeholder = 'Search' }: HeaderSearchFieldProps) {
  return (
    <div
      className={`flex h-9 shrink-0 items-center gap-sm rounded-sm border border-border-selected bg-surface transition-all ${
        open ? 'w-56 px-md' : 'w-9 justify-center'
      }`}
    >
      <button
        type="button"
        aria-label="Search"
        onClick={() => {
          if (open) return
          onOpenChange(true)
        }}
        className="flex shrink-0 items-center justify-center text-text-icon"
      >
        <Icon name="search" size={20} />
      </button>
      {open && (
        <>
          <input
            autoFocus
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onOpenChange(false)
              onChange('')
            }}
            className="flex shrink-0 items-center justify-center text-text-icon hover:text-text-primary"
          >
            <Icon name="close" size={18} />
          </button>
        </>
      )}
    </div>
  )
}
