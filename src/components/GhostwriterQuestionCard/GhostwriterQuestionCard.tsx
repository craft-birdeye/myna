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

const OTHER_ID = '__other__'

const SHEET_CLASS =
  'agent-build-fade ml-3xl mt-sm flex max-w-full flex-col overflow-hidden rounded-sm border border-border bg-surface'

function QuestionSheetPager({
  index,
  total,
  onPrev,
  onNext,
}: {
  index: number
  total: number
  onPrev?: () => void
  onNext?: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-xs">
      <button
        type="button"
        onClick={onPrev}
        disabled={!onPrev}
        aria-label="Previous question"
        className="flex size-5 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Icon name="chevron_left" size={16} />
      </button>
      <span className="text-small text-text-tertiary">
        {index}/{total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!onNext}
        aria-label="Next question"
        className="flex size-5 items-center justify-center rounded-sm text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-secondary disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Icon name="chevron_right" size={16} />
      </button>
    </div>
  )
}

function QuestionSheetFooter({
  onSkipAll,
  onSkip,
  skipLabel,
  canNext,
  onNext,
  nextLabel,
}: {
  onSkipAll?: () => void
  onSkip?: () => void
  skipLabel: string
  canNext: boolean
  onNext: () => void
  nextLabel: string
}) {
  return (
    <div className="flex items-center gap-xs px-md py-md">
      {onSkipAll && (
        <button
          type="button"
          onClick={onSkipAll}
          className="flex h-9 items-center rounded-sm px-md text-body text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Skip all
        </button>
      )}
      <span className="flex-1" />
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="flex h-9 items-center rounded-sm px-md text-body text-text-secondary transition-colors hover:bg-surface-hover"
        >
          {skipLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
          canNext
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  )
}

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
  onSkipAll,
  skipLabel = 'Skip',
  className = '',
  dividers = true,
}: GhostwriterQuestionCardProps) {
  const [text, setText] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const typed = text.trim().length > 0
  const showPager = typeof index === 'number' && typeof total === 'number' && total > 1
  const nextLabel = typeof index === 'number' && typeof total === 'number' && index >= total ? 'Submit' : 'Next question'
  /** Options plus a text escape: the sheet in the reference, with our radius and primary. */
  const choiceWithText = !!options?.length && !!freeText
  const selected = options?.find((option) => option.id === selectedId)

  const submitText = () => {
    if (!typed) return
    onSubmitText?.(text.trim())
    setText('')
  }

  const confirmChoice = () => {
    if (selectedId === OTHER_ID) {
      if (!text.trim()) return
      onSubmitText?.(text.trim())
      setText('')
      return
    }
    if (selected) onPick?.(selected.label)
  }

  if (choiceWithText && options && freeText) {
    const otherSelected = selectedId === OTHER_ID
    const canNext = otherSelected ? text.trim().length > 0 : !!selected
    return (
      <div className={`${SHEET_CLASS} ${className}`}>
        <div className="flex items-center justify-between px-lg pt-lg">
          <span className="text-small text-text-tertiary">Questions</span>
          {showPager && typeof index === 'number' && typeof total === 'number' && (
            <QuestionSheetPager index={index} total={total} onPrev={onPrev} onNext={onNext} />
          )}
        </div>

        <div className="px-lg pb-sm pt-sm">
          <p className="m-0 text-base text-text-primary">{question}</p>
          {hint && <p className="m-0 mt-xs text-small text-text-tertiary">{hint}</p>}
        </div>

        <div className="flex flex-col gap-xs px-md">
          {options.map((option, i) => {
            const pressed = selectedId === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedId(option.id)
                  setText('')
                }}
                aria-pressed={pressed}
                className={`flex w-full items-start gap-md rounded-sm px-sm py-sm text-left transition-colors ${
                  pressed ? 'bg-surface-l2' : 'hover:bg-surface-hover'
                }`}
              >
                <span
                  className={`mt-[1px] flex size-6 shrink-0 items-center justify-center rounded-sm text-small ${
                    pressed ? 'bg-primary text-white' : 'bg-surface-l2 text-text-secondary'
                  }`}
                >
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
                {pressed && <Icon name="arrow_upward" size={16} className="mt-xs shrink-0 text-text-icon" />}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setSelectedId(OTHER_ID)}
            aria-pressed={otherSelected}
            className={`flex w-full items-center gap-md rounded-sm px-sm py-sm text-left transition-colors ${
              otherSelected ? 'bg-surface-l2' : 'hover:bg-surface-hover'
            }`}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon" aria-hidden>
              <Icon name="edit" size={14} />
            </span>
            {otherSelected ? (
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && text.trim()) confirmChoice()
                }}
                placeholder={freeText.placeholder}
                aria-label={question}
                className="min-w-0 flex-1 border-0 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
            ) : (
              <span className="text-body text-text-tertiary">{freeText.placeholder}</span>
            )}
          </button>
        </div>

        <QuestionSheetFooter
          onSkipAll={onSkipAll}
          onSkip={onSkip}
          skipLabel={skipLabel}
          canNext={canNext}
          onNext={confirmChoice}
          nextLabel={nextLabel}
        />
      </div>
    )
  }

  if (freeText && !options?.length && onSkipAll) {
    return (
      <div className={`${SHEET_CLASS} ${className}`}>
        <div className="flex items-center justify-between px-lg pt-lg">
          <span className="text-small text-text-tertiary">Questions</span>
          {showPager && typeof index === 'number' && typeof total === 'number' && (
            <QuestionSheetPager index={index} total={total} onPrev={onPrev} onNext={onNext} />
          )}
        </div>

        <div className="px-lg pb-sm pt-sm">
          <p className="m-0 text-base text-text-primary">{question}</p>
          {hint && <p className="m-0 mt-xs text-small text-text-tertiary">{hint}</p>}
        </div>

        <div className="flex items-center gap-md px-lg py-sm">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon" aria-hidden>
            <Icon name="edit" size={14} />
          </span>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText()
            }}
            placeholder={freeText.placeholder}
            aria-label={question}
            className="min-w-0 flex-1 border-0 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>

        <QuestionSheetFooter
          onSkipAll={onSkipAll}
          onSkip={onSkip}
          skipLabel={skipLabel}
          canNext={typed}
          onNext={submitText}
          nextLabel={nextLabel}
        />
      </div>
    )
  }

  return (
    <div
      className={`agent-build-fade ml-3xl mt-sm flex max-w-full flex-col overflow-hidden rounded-sm border border-border bg-surface ${className}`}
    >
      {/* Question + pager */}
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

      {/* Free text — the only answer when there are no options. With options, this row is the
          "write something else" escape and the composer underneath stays hidden. */}
      {freeText && (
        <div className={`flex flex-col gap-sm px-lg py-sm !pb-md ${dividers ? 'border-t border-border' : ''}`}>
          <div className="flex items-center gap-md">
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
          </div>
          {typed ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submitText}
                className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                {freeText.submitLabel}
              </button>
            </div>
          ) : (
            onSkip && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSkip}
                  className="flex h-9 shrink-0 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary transition-colors hover:bg-surface-l2"
                >
                  {skipLabel}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
