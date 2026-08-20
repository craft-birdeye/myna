import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { ConfirmDeleteModalProps } from './ConfirmDeleteModal.types'

/** Generic centered "delete?" confirmation — shell copied from `ShareFeedbackModal`. */
export function ConfirmDeleteModal({
  open,
  title = 'Delete this item?',
  description = 'This action cannot be undone.',
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="relative w-[440px] max-w-[92vw] rounded-md bg-surface p-xl shadow-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-text-primary">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="mt-lg text-body text-text-secondary">{description}</p>

        <div className="mt-xl flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-9 items-center rounded-sm bg-chip-danger-text px-lg text-body text-white transition-colors hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
