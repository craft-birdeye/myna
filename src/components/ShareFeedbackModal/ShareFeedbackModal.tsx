import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { ShareFeedbackModalProps } from './ShareFeedbackModal.types'

export function ShareFeedbackModal({ open, onClose, onSubmit }: ShareFeedbackModalProps) {
  const [details, setDetails] = useState('')
  const canSubmit = details.trim().length > 0

  useEffect(() => {
    if (!open) setDetails('')
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-[480px] max-w-[92vw] rounded-md bg-surface p-xl shadow-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-feedback-title"
      >
        <div className="flex items-center justify-between">
          <h2 id="share-feedback-title" className="text-h3 text-text-primary">
            Share feedback
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <p className="mt-lg text-body text-text-secondary">
          What went wrong? Please share your feedback so our team can investigate this.
        </p>

        <label className="mt-xl flex flex-col gap-xs">
          <span className="text-small text-text-primary">
            Add details <span className="text-chip-danger-text">*</span>
          </span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Enter"
            rows={5}
            className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
          />
        </label>

        <div className="mt-xl flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return
              onSubmit(details.trim())
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Submit feedback
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
