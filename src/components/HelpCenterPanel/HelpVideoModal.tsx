import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'

export interface HelpVideoModalProps {
  open: boolean
  title: string
  onClose: () => void
}

/**
 * Help video player dialog — Aero DS shell (20% scrim + blur, rounded-md surface,
 * Heading 3 title, icon/primary tokens). Placeholder stage until real media is wired.
 */
export function HelpVideoModal({ open, title, onClose }: HelpVideoModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-2xl">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-video-modal-title"
        className="relative w-full max-w-[720px] overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start gap-lg px-2xl pb-md pt-2xl">
          <h2
            id="help-video-modal-title"
            className="m-0 min-w-0 flex-1 truncate text-h3 text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="px-2xl pb-2xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-surface-icon">
            <button
              type="button"
              aria-label={`Play ${title}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-surface shadow-dropdown">
                <Icon
                  name="play_arrow"
                  size={32}
                  fill
                  className="translate-x-px text-primary"
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
