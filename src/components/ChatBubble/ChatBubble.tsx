import type { ReactNode } from 'react'
import { Icon } from '../Icon/Icon'
import { Tooltip } from '../Tooltip/Tooltip'
import { ChatBubbleProps, MessageFeedbackValue } from './ChatBubble.types'

function MessageFeedback({
  value = null,
  onChange,
}: {
  value?: MessageFeedbackValue
  onChange?: (value: MessageFeedbackValue) => void
}) {
  const toggle = (next: 'up' | 'down') => {
    onChange?.(value === next ? null : next)
  }

  return (
    <div className="flex items-center gap-xs">
      <Tooltip content="Good response" variant="brief">
        <button
          type="button"
          aria-label="Good response"
          aria-pressed={value === 'up'}
          onClick={() => toggle('up')}
          className={`flex size-5 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover ${
            value === 'up' ? 'text-accent-positive' : 'text-text-tertiary'
          }`}
        >
          <Icon name="thumb_up" size={16} />
        </button>
      </Tooltip>
      <Tooltip
        content={
          value === 'down' ? (
            <span>
              Feedback submitted.{' '}
              <button
                type="button"
                className="text-white underline hover:opacity-90"
                onClick={(e) => e.stopPropagation()}
              >
                Track
              </button>
            </span>
          ) : (
            'Bad response'
          )
        }
        variant={value === 'down' ? 'detail' : 'brief'}
        interactive={value === 'down'}
      >
        <button
          type="button"
          aria-label={value === 'down' ? 'Feedback submitted' : 'Bad response'}
          aria-pressed={value === 'down'}
          onClick={() => toggle('down')}
          className={`flex size-5 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover ${
            value === 'down' ? 'text-chip-danger-text' : 'text-text-tertiary'
          }`}
        >
          <Icon name="thumb_down" size={16} />
        </button>
      </Tooltip>
    </div>
  )
}

export function ChatBubble({
  sender,
  text,
  children,
  className = '',
  bubbleClassName = '',
  gap = 'gap-xs',
  showFeedback = false,
  feedback = null,
  onFeedbackChange,
  leadingIcon,
}: ChatBubbleProps) {
  const isBusiness = sender === 'business'

  const bubble = (
    <div
      className={[
        'rounded-lg text-body leading-[1.5] text-text-primary',
        isBusiness ? 'bg-[#dbeafe]' : 'bg-[#f0f0f0]',
        bubbleClassName || 'max-w-[70%] px-md py-sm',
      ].join(' ')}
    >
      {text}
    </div>
  )

  return (
    <div className={`flex flex-col ${gap} ${isBusiness ? 'items-end' : 'items-start'} ${className}`}>
      {leadingIcon ? (
        <div className="flex items-start gap-sm">
          {leadingIcon}
          {bubble}
        </div>
      ) : (
        bubble
      )}
      {showFeedback ? (
        <div className="flex items-center gap-sm">
          <MessageFeedback value={feedback} onChange={onFeedbackChange} />
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export function ChatSystemLabel({ text }: { text: ReactNode }) {
  return (
    <div className="flex items-center justify-center">
      <span className="text-small text-text-tertiary">{text}</span>
    </div>
  )
}
