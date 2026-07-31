import { Icon } from '../Icon/Icon'
import { TopNavProps } from './TopNav.types'

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover"
    >
      {children}
    </button>
  )
}

export function TopNav({ title, avatarUrl, initials = 'S', onAdd, onHelp, onMenu }: TopNavProps) {
  return (
    <header className="flex h-14 items-center gap-xs border-b border-border bg-surface px-2xl">
      {title && (
        <span className="flex-1 text-h3 text-text-primary">{title}</span>
      )}
      {!title && <span className="flex-1" />}
      <IconButton label="Create new" onClick={onAdd}>
        <Icon name="add_circle" size={20} fill className="text-text-action" />
      </IconButton>

      <IconButton label="Help" onClick={onHelp}>
        <Icon name="help" size={20} className="text-text-icon" />
      </IconButton>

      <span className="flex size-7 items-center justify-center">
        <span className="block size-5 overflow-hidden rounded-full">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-surface-selected text-[10px] font-medium text-text-secondary">
              {initials}
            </span>
          )}
        </span>
      </span>

      <IconButton label="Menu" onClick={onMenu}>
        <Icon name="menu" size={20} className="text-text-icon" />
      </IconButton>
    </header>
  )
}
