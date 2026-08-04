import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { CoachAgentPanelProps } from './CoachAgentPanel.types'

export function CoachAgentPanel({ onClose }: CoachAgentPanelProps) {
  const [draft, setDraft] = useState('')

  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-l border-border bg-surface">
      {/* Header — New chat + utilities */}
      <div className="flex h-14 shrink-0 items-center justify-between px-lg">
        <button
          type="button"
          className="flex h-8 items-center gap-xs rounded-sm px-sm text-body text-text-primary hover:bg-surface-hover"
        >
          <Icon name="edit_square" size={18} className="text-text-icon" />
          New chat
        </button>
        <div className="flex items-center gap-xs">
          <button
            type="button"
            aria-label="History"
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="history" size={18} />
          </button>
          <button
            type="button"
            aria-label="More"
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="more_horiz" size={18} />
          </button>
          <button
            type="button"
            aria-label="Close coach agent"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>

      {/* Chat thread */}
      <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto px-lg pb-lg" />

      {/* Composer */}
      <div className="shrink-0 px-lg pb-lg">
        <p className="mb-sm text-small text-text-tertiary">
          Tip: Use + to add files or commands to the chat
        </p>
        <div className="flex flex-col gap-sm rounded-sm border border-border bg-surface px-md py-sm shadow-card">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Ask anything... Type @ to reference."
            className="min-h-9 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Add"
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="add" size={20} />
            </button>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                aria-label="Voice input"
                className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="mic" size={20} />
              </button>
              <button
                type="button"
                aria-label="Send"
                disabled={!draft.trim()}
                className={`flex size-8 items-center justify-center rounded-full ${
                  draft.trim()
                    ? 'bg-text-primary text-white hover:opacity-90'
                    : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                }`}
              >
                <Icon name="arrow_upward" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
