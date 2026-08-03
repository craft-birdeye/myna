import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import type { AttachMenuOption, AttachMenuPopoverProps } from './AttachMenuPopover.types'

const OPTIONS: { id: AttachMenuOption; label: string; icon: string }[] = [
  { id: 'upload-image', label: 'Upload image', icon: 'computer' },
  { id: 'media-library', label: 'Media library', icon: 'perm_media' },
  { id: 'files', label: 'Files', icon: 'draft' },
]

// Plus-button trigger + anchored menu for the "Build your agent" composer:
// upload an image from disk, or pick from the media library / files pickers.
export function AttachMenuPopover({ onSelect, disabled = false, className = '' }: AttachMenuPopoverProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(option: AttachMenuOption) {
    setOpen(false)
    onSelect(option)
  }

  return (
    <div ref={wrapperRef} className={`relative flex ${className}`}>
      <button
        type="button"
        aria-label="Add"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 ${
          open ? 'bg-surface-hover text-text-primary' : ''
        }`}
      >
        <Icon name="add" size={20} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-sm w-[220px] rounded-lg border border-border bg-surface py-xs shadow-dropdown">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => pick(opt.id)}
              className="flex w-full items-center gap-md px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
            >
              <Icon name={opt.icon} size={18} className="shrink-0 text-[#303030]" />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
