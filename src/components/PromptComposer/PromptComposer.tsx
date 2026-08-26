import { useState } from 'react'
import { AttachMenuPopover } from '../AttachMenuPopover/AttachMenuPopover'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { Tooltip } from '../Tooltip/Tooltip'
import { SendIcon } from '../../assets/SendIcon'
import { PromptComposerProps } from './PromptComposer.types'

export function PromptComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled = false,
  sendDisabled = false,
  rows = 2,
  attachments = [],
  onRemoveAttachment,
  onAttach,
  onFocus,
  onClick,
  className = '',
}: PromptComposerProps) {
  const [focused, setFocused] = useState(false)
  const canSend = value.trim().length > 0 && !sendDisabled && !disabled

  return (
    <div
      className={
        focused
          ? `ai-gradient-border rounded-xl p-px ${className}`.trim()
          : `rounded-xl border border-border bg-surface p-px shadow-card ${className}`.trim()
      }
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
    >
      <div className="flex flex-col gap-md rounded-xl bg-surface px-lg py-md">
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-sm">
            {attachments.map((item) => (
              <RefChip
                key={item.id}
                kind={item.kind}
                label={item.label}
                onRemove={onRemoveAttachment ? () => onRemoveAttachment(item.id) : undefined}
              />
            ))}
          </div>
        )}
        <textarea
          value={value}
          onFocus={onFocus}
          onClick={onClick}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className="scrollbar-light min-h-9 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed"
        />
        <div className="flex items-center justify-between align-bottom">
          <div className="flex items-center gap-xs text-text-icon">
            {onAttach ? (
              <AttachMenuPopover disabled={disabled} onSelect={onAttach} />
            ) : (
              <button
                type="button"
                aria-label="Add"
                disabled={disabled}
                className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="add" size={20} />
              </button>
            )}
            <Tooltip content="Dictate" variant="brief">
              <button
                type="button"
                aria-label="Dictate"
                disabled={disabled}
                className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="mic" size={20} />
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            aria-label="Send"
            onClick={onSend}
            disabled={!canSend}
            className={`flex size-9 items-center justify-center rounded-sm transition-colors ${
              canSend ? 'text-ai-brand hover:bg-surface-hover' : 'cursor-not-allowed text-text-tertiary opacity-40'
            }`}
          >
            <SendIcon size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
