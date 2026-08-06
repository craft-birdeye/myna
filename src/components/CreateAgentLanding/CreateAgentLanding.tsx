import { AttachMenuPopover } from '../AttachMenuPopover/AttachMenuPopover'
import { Icon } from '../Icon/Icon'
import { PromptComposer } from '../PromptComposer/PromptComposer'
import { RefChip } from '../RefChip/RefChip'
import { Tooltip } from '../Tooltip/Tooltip'
import { SendIcon } from '../../assets/SendIcon'
import { AiAvatarChatIcon } from '../../assets/AiAvatarChatIcon'
import { CreateAgentLandingProps } from './CreateAgentLanding.types'

export function CreateAgentLanding({
  greeting,
  options,
  value,
  onChange,
  onSend,
  placeholder = 'What would you like to build?',
  disabled = false,
  attachments = [],
  onRemoveAttachment,
  onAttach,
  compact = false,
  className = '',
}: CreateAgentLandingProps) {
  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className={`flex h-full w-full flex-col gap-md overflow-hidden pb-md ${className}`}>
      <div
        className={
          compact
            ? 'flex min-h-0 flex-1 flex-col justify-end gap-md overflow-hidden'
            : 'flex min-h-0 flex-1 flex-col justify-center gap-md overflow-hidden'
        }
      >
        <div className={compact ? 'flex items-start gap-sm' : 'flex translate-y-lg items-start justify-start gap-md'}>
          <AiAvatarChatIcon size={compact ? 24 : 40} className={compact ? 'mt-[2px] shrink-0' : 'mt-1 shrink-0'} />
          <div className="flex min-w-0 flex-col items-start gap-md">
            <p className={compact ? 'text-body text-text-primary' : 'text-h3 leading-8 text-text-primary'}>
              {greeting}
            </p>
            <div className="flex flex-col items-start gap-sm">
              {options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={option.onSelect}
                  className="min-h-10 rounded-sm border border-border-selected bg-surface px-lg py-sm text-left text-body text-text-primary hover:bg-surface-l2"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {compact ? (
        <PromptComposer
          value={value}
          onChange={onChange}
          onSend={onSend}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
          onAttach={onAttach}
        />
      ) : (
        <div className="flex min-h-40 shrink-0 flex-col gap-md rounded-lg border border-border-selected bg-surface px-lg py-md shadow-card focus-within:border-ai-brand">
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
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            rows={3}
            disabled={disabled}
            placeholder={placeholder}
            className="scrollbar-none min-h-16 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-xs text-text-icon">
              {onAttach ? (
                <AttachMenuPopover disabled={disabled} onSelect={onAttach} />
              ) : (
                <button
                  type="button"
                  aria-label="Add"
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-sm hover:bg-surface-hover hover:text-text-primary"
                >
                  <Icon name="add" size={20} />
                </button>
              )}
              <Tooltip content="Dictate" variant="brief">
                <button
                  type="button"
                  aria-label="Dictate"
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-sm hover:bg-surface-hover hover:text-text-primary"
                >
                  <Icon name="mic" size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Add context" variant="brief">
                <button
                  type="button"
                  aria-label="Add context"
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-sm hover:bg-surface-hover hover:text-text-primary"
                >
                  <Icon name="data_object" size={20} />
                </button>
              </Tooltip>
              <Tooltip content="More options" variant="brief">
                <button
                  type="button"
                  aria-label="More options"
                  disabled={disabled}
                  className="flex size-8 items-center justify-center rounded-sm hover:bg-surface-hover hover:text-text-primary"
                >
                  <Icon name="more_horiz" size={22} />
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
      )}
    </div>
  )
}
