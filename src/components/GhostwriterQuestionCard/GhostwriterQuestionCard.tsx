/**
 * The one way the Ghostwriter asks for something.
 *
 * An inline card that sits in the conversation where the question was asked — not a modal.
 * A modal is the wrong shape here: it covers the reasoning the question came out of, and it
 * implies the thread is blocked when most of these are optional.
 *
 * Handles both kinds of ask in one component, so the two never drift apart:
 *   - numbered options (pick one), and
 *   - a free-text row (type your own), which doubles as the "write something else" escape
 *     under a list of options.
 *
 * Chrome is Birdeye's: `rounded-sm`, `border-border`, `surface-hover` rows, spacing tokens,
 * regular weight only (§6.6) — hierarchy comes from colour and size, not boldness.
 */
import { useState } from 'react'
import { Chip } from '../Chip/Chip'
import { Icon } from '../Icon/Icon'
import type { GhostwriterQuestionCardProps } from './GhostwriterQuestionCard.types'

export function GhostwriterQuestionCard({
  question,
  hint,
  options,
  freeText,
  index,
  total,
  onPrev,
  onNext,
  onPick,
  onSubmitText,
  onSkip,
  skipLabel = 'Skip',
  onClose,
  className = '',
  dividers = true,
}: GhostwriterQuestionCardProps) {
  const [text, setText] = useState('')
  const typed = text.trim().length > 0
  const showPager = typeof index === 'number' && typeof total === 'number' && total > 1

  const submitText = () => {
    if (!typed) return
    onSubmitText?.(text.trim())
    setText('')
  }

  return (
    <div
      className={`agent-build-fade ml-3xl mt-sm flex max-w-full flex-col overflow-hidden rounded-sm border border-border bg-surface ${className}`}
    >
      {/* Question + pager + dismiss */}
      <div className="flex items-start gap-md px-lg py-md">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-body text-text-primary">{question}</p>
          {hint && <p className="m-0 mt-xs text-small text-text-tertiary">{hint}</p>}
        </div>

        {showPager && (
          <div className="flex shrink-0 items-center gap-xs">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              aria-label="Previous question"
              className="flex size-6 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-tertiary disabled:hover:bg-transparent"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <span className="whitespace-nowrap text-small text-text-tertiary">
              {index} of {total}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              aria-label="Next question"
              className="flex size-6 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-tertiary disabled:hover:bg-transparent"
            >
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
        )}

        {(onClose || onSkip) && (
          <button
            type="button"
            onClick={onClose ?? onSkip}
            aria-label="Dismiss question"
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {/* Numbered options */}
      {options?.map((option, i) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onPick?.(option.label)}
          className={`flex w-full items-start gap-md px-lg py-md text-left transition-colors hover:bg-surface-hover ${
            dividers ? 'border-t border-border' : ''
          } ${i === (options?.length ?? 0) - 1 && !freeText ? '!pb-lg' : ''}`}
        >
          <span className="mt-[1px] flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-small text-text-secondary">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-xs">
            <span className="flex flex-wrap items-center gap-sm">
              <span className="text-body text-text-primary">{option.label}</span>
              {option.recommended && <Chip label="Recommended" variant="info" />}
            </span>
            {option.description && (
              <span className="text-small text-text-secondary">{option.description}</span>
            )}
          </span>
        </button>
      ))}

      {/* Free text — the only answer when there are no options, the escape when there are.
          The trailing button is Skip until something is typed, then the real submit. */}
      {freeText && (
        <div className={`flex items-center gap-md px-lg py-sm !pb-md ${dividers ? 'border-t border-border' : ''}`}>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon" aria-hidden>
            <Icon name="edit" size={14} />
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText()
            }}
            placeholder={freeText.placeholder}
            aria-label={question}
            className="min-w-0 flex-1 border-0 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          {typed ? (
            <button
              type="button"
              onClick={submitText}
              className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              {freeText.submitLabel}
            </button>
          ) : (
            onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="flex h-9 shrink-0 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
              >
                {skipLabel}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
