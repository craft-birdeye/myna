import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { ShareFeedbackModalProps } from './ShareFeedbackModal.types'

const HELP_MAX_CHARS = 500
const HELP_MAX_FILES = 5

/**
 * Share feedback dialog.
 * - `coaching` (default): inbox / logs thumbs-down flow.
 * - `help`: Help center modal per Figma Agent ARC `16119:14085`.
 */
export function ShareFeedbackModal({
  open,
  onClose,
  onSubmit,
  initialDetails = '',
  variant = 'coaching',
}: ShareFeedbackModalProps) {
  const [details, setDetails] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setDetails(initialDetails)
      setFiles([])
    } else {
      setDetails('')
      setFiles([])
    }
  }, [open, initialDetails])

  if (!open) return null

  if (variant === 'help') {
    const trimmed = details.trim()
    const canSubmit = trimmed.length > 0 && trimmed.length <= HELP_MAX_CHARS

    function addFiles(list: FileList | null) {
      if (!list?.length) return
      setFiles((prev) => {
        const next = [...prev]
        for (const file of Array.from(list)) {
          if (next.length >= HELP_MAX_FILES) break
          next.push(file)
        }
        return next
      })
    }

    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2xl">
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-feedback-title"
          className="relative flex w-full max-w-[520px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex shrink-0 items-start gap-lg px-2xl pb-md pt-2xl">
            <div className="min-w-0 flex-1">
              <h2
                id="share-feedback-title"
                className="m-0 text-h3 text-text-primary"
              >
                Share feedback
              </h2>
              <p className="m-0 mt-xs text-small text-text-secondary">
                Tell us about your experience and how we can make it better.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-auto px-2xl pb-lg">
            <label className="flex flex-col gap-sm">
              <span className="text-body text-text-primary">
                Your feedback <span className="text-chip-danger-text">*</span>
              </span>
              <span className="relative block">
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, HELP_MAX_CHARS))}
                  placeholder="Share your feedback, suggestions, or any issues you experienced."
                  rows={5}
                  className="h-[130px] w-full resize-none rounded-sm border border-border-input bg-surface px-md pb-2xl pt-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
                />
                <span className="pointer-events-none absolute bottom-sm right-md text-small text-text-tertiary">
                  {details.length}/{HELP_MAX_CHARS}
                </span>
              </span>
            </label>

            <div className="mt-xl">
              <p className="m-0 text-body text-text-primary">Attach files (optional)</p>
              <p className="m-0 mt-xs text-small text-text-secondary">
                Add images or videos to help us better understand your feedback.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.mp4,.mov,image/png,image/jpeg,video/mp4,video/quicktime"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addFiles(e.dataTransfer.files)
                }}
                className="mt-md flex w-full flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface px-lg py-xl text-center hover:bg-surface-hover"
              >
                <Icon name="cloud_upload" size={28} className="text-text-icon" />
                <span className="mt-md text-body text-text-primary">
                  Drag and drop files here, or{' '}
                  <span className="text-text-action">browse files</span>
                </span>
                <span className="mt-xs text-small text-text-tertiary">
                  PNG, JPG, JPEG, MP4 or MOV. Up to 5 files, 25 MB each.
                </span>
              </button>

              {files.length > 0 ? (
                <ul className="m-0 mt-md flex list-none flex-col gap-xs p-0">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-sm rounded-sm border border-border bg-surface-icon px-md py-sm"
                    >
                      <Icon name="draft" size={18} className="shrink-0 text-text-icon" />
                      <span className="min-w-0 flex-1 truncate text-small text-text-primary">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-md border-t border-border px-2xl py-lg">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return
                onSubmit(trimmed)
              }}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                canSubmit
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Submit feedback
            </button>
          </footer>
        </div>
      </div>,
      document.body,
    )
  }

  const canSubmit = details.trim().length > 0

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-2xl">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-[480px] max-w-[calc(100%-2rem)] rounded-md bg-surface p-2xl shadow-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-feedback-title"
      >
        <div className="flex items-start justify-between gap-lg">
          <h2 id="share-feedback-title" className="text-h3 text-text-primary">
            Share feedback
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <p className="mt-lg text-body text-text-secondary">
          What went wrong? Share the details and the AI will train on your feedback to improve future
          responses.
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
