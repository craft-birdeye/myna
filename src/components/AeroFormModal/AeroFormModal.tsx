import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { AeroFormModalProps } from './AeroFormModal.types'

/**
 * Aero DS form dialog — top-fixed (not viewport-centred), 20% scrim + blur,
 * rounded-md surface panel, Cancel + primary footer. Shared by workflow
 * Add input / Add output field modals.
 */
export function AeroFormModal({
  title,
  onClose,
  onPrimary,
  primaryLabel = 'Add',
  primaryDisabled = false,
  cancelLabel = 'Cancel',
  widthClassName = 'w-[650px]',
  zIndex = 2100,
  panelClassName = '',
  fitContent = false,
  subtitle,
  learnMoreHref,
  learnMoreLabel = 'Learn more',
  children,
}: AeroFormModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center bg-black/20 backdrop-blur-sm pt-[72px]"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aero-form-modal-title"
        className={`relative flex max-h-[calc(100vh-96px)] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-md bg-surface shadow-modal ${widthClassName} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-lg px-2xl pb-md pt-2xl">
          <div className="min-w-0 flex-1">
            <h2 id="aero-form-modal-title" className="text-h3 text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-xs text-small text-text-secondary">
                {subtitle}
                {learnMoreHref && (
                  <>
                    {' '}
                    <a
                      href={learnMoreHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-action no-underline hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {learnMoreLabel}
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div
          className={
            fitContent
              ? 'shrink-0 overflow-visible px-2xl'
              : 'min-h-0 flex-1 overflow-y-auto px-2xl'
          }
        >
          {children}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-md px-2xl pb-2xl pt-md">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={onPrimary}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              primaryDisabled
                ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
