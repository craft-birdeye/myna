import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { AgentsIntroVideoModalProps } from './AgentsIntroVideoModal.types'

/**
 * First-visit in-product video placeholder for the Overview page.
 * Visual chrome mirrors a standard video player (title overlay + bottom controls);
 * no real media yet — swap the body for an embed when the agents intro video is ready.
 */
export function AgentsIntroVideoModal({
  open,
  onClose,
  title = 'Introduction to AI agents',
}: AgentsIntroVideoModalProps) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 p-2xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-[880px] overflow-hidden rounded-md bg-tooltip shadow-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agents-intro-video-title"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-md top-md z-20 flex size-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <Icon name="close" size={20} />
        </button>

        {/* Player frame — 16:9 placeholder until the real agents intro video is wired in */}
        <div className="relative aspect-video w-full bg-text-primary">
          <p
            id="agents-intro-video-title"
            className="absolute left-lg top-lg z-10 m-0 max-w-[80%] text-h3 text-white"
          >
            {title}
          </p>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/20 text-white">
              <Icon name="play_arrow" size={40} fill />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex h-10 items-center gap-md bg-black/70 px-md text-white">
            <Icon name="play_arrow" size={22} fill />
            <Icon name="volume_up" size={20} />
            <span className="text-small text-white">0:00 / 0:00</span>
            <span className="ml-auto flex items-center">
              <Icon name="fullscreen" size={20} />
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
