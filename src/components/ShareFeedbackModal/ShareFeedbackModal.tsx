import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import naveenAvatar from '../../assets/help-center/naveen-avatar.jpg'
import type { ShareFeedbackModalProps } from './ShareFeedbackModal.types'

const HELP_MAX_CHARS = 500
const HELP_MAX_FILES = 5

interface Attachment {
  id: number
  file: File
  url: string
  kind: 'image' | 'video' | 'other'
}

function attachmentKind(file: File): Attachment['kind'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'other'
}

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
  onOpenProductResearchSettings,
}: ShareFeedbackModalProps) {
  const [details, setDetails] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [canReplyToFeedback, setCanReplyToFeedback] = useState(false)
  const [wantsProductResearch, setWantsProductResearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextAttachmentId = useRef(0)
  const attachmentsRef = useRef<Attachment[]>([])
  attachmentsRef.current = attachments

  useEffect(() => {
    if (open) {
      setDetails(initialDetails)
      setCanReplyToFeedback(false)
      setWantsProductResearch(false)
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.url))
        return []
      })
    } else {
      setDetails('')
      setCanReplyToFeedback(false)
      setWantsProductResearch(false)
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.url))
        return []
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialDetails])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.url))
    }
  }, [])

  if (!open) return null

  if (variant === 'help') {
    const trimmed = details.trim()
    const canSubmit = trimmed.length > 0 && trimmed.length <= HELP_MAX_CHARS

    function addFiles(list: FileList | null) {
      if (!list?.length) return
      // Snapshot into a plain array: `list` is the input's live FileList, and the
      // caller resets `e.target.value` right after calling this, which clears that
      // live list before this state updater actually runs.
      const incoming = Array.from(list)
      setAttachments((prev) => {
        const next = [...prev]
        for (const file of incoming) {
          if (next.length >= HELP_MAX_FILES) break
          next.push({
            id: nextAttachmentId.current++,
            file,
            url: URL.createObjectURL(file),
            kind: attachmentKind(file),
          })
        }
        return next
      })
    }

    function removeAttachment(id: number) {
      setAttachments((prev) => {
        const found = prev.find((a) => a.id === id)
        if (found) URL.revokeObjectURL(found.url)
        return prev.filter((a) => a.id !== id)
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
          className="relative w-full max-w-[520px] rounded-md bg-surface p-2xl shadow-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-lg top-lg flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>

          <div className="flex items-start gap-md pr-2xl">
            <img
              src={naveenAvatar}
              alt="Naveen, CEO of Birdeye"
              className="size-11 shrink-0 rounded-full border border-border object-cover"
            />
            <div className="min-w-0 pt-xs">
              <h2 id="share-feedback-title" className="m-0 text-body text-text-primary">
                Hi there! I&apos;m Naveen, CEO of Birdeye
              </h2>
              <p className="m-0 mt-xs text-small text-text-secondary">
                I&apos;d love to hear your thoughts and feedback.
              </p>
            </div>
          </div>

          <div className="mt-xl flex flex-col rounded-md border border-border-input bg-surface">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, HELP_MAX_CHARS))}
              placeholder="What do you think about the agent builder? Are you stuck somewhere?"
              rows={4}
              className="w-full resize-none rounded-md bg-transparent px-md pb-md pt-md text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />

            {attachments.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-sm px-md pb-md p-0">
                {attachments.map((a) => (
                  <li key={a.id} title={a.file.name} className="relative size-16 shrink-0">
                    <div className="relative size-full overflow-hidden rounded-sm border border-border bg-surface-icon">
                      {a.kind === 'image' ? (
                        <img src={a.url} alt={a.file.name} className="size-full object-cover" />
                      ) : a.kind === 'video' ? (
                        <>
                          <video src={a.url} muted className="size-full object-cover" />
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                            <Icon name="play_circle" size={24} fill className="text-white" />
                          </span>
                        </>
                      ) : (
                        <span className="flex size-full items-center justify-center">
                          <Icon name="draft" size={22} className="text-text-icon" />
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${a.file.name}`}
                        onClick={() => removeAttachment(a.id)}
                        className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-black text-white hover:bg-black/80"
                      >
                        <Icon name="close" size={11} weight={700} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex items-center px-md pb-sm">
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
                aria-label="Attach files"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="attach_file" size={18} />
              </button>
            </div>
          </div>

          <div className="mt-xl flex flex-col gap-md">
            <span className="text-xs uppercase tracking-wide text-text-tertiary">
              Birdeye opt-in options
            </span>

            <div className="flex items-start gap-sm">
              <input
                id="share-feedback-can-reply"
                type="checkbox"
                checked={canReplyToFeedback}
                onChange={(e) => setCanReplyToFeedback(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border"
              />
              <label
                htmlFor="share-feedback-can-reply"
                className="cursor-pointer text-body text-text-secondary"
              >
                Yes, Birdeye teams can reply to my feedback and follow up if they need more details.
                Without this, I won&apos;t hear back.
              </label>
            </div>

            <div className="flex items-start gap-sm">
              <input
                id="share-feedback-product-research"
                type="checkbox"
                checked={wantsProductResearch}
                onChange={(e) => setWantsProductResearch(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border"
              />
              <label htmlFor="share-feedback-product-research" className="cursor-pointer text-body text-text-secondary">
                I&apos;d like to participate in product research.{' '}
                <button
                  type="button"
                  onClick={() => onOpenProductResearchSettings?.()}
                  className="text-text-action hover:underline"
                >
                  Learn more
                </button>
              </label>
            </div>
          </div>

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
                onSubmit(trimmed, {
                  canReplyToFeedback,
                  wantsProductResearch,
                  attachments: attachments.map((a) => a.file),
                })
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
