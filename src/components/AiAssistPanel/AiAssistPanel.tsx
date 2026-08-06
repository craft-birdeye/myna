import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { SendIcon } from '../../assets/SendIcon'
import { AiAssistPanelProps } from './AiAssistPanel.types'

/** BirdAI gradient sparkle cluster — one large 4-point star + two accents. */
function BirdAiStar({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ai-assist-star-grad" x1="6" y1="8" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b18cf5" />
          <stop offset="60%" stopColor="#7c4ddb" />
          <stop offset="100%" stopColor="#6834b7" />
        </linearGradient>
      </defs>
      {/* Large star (lower-left) */}
      <path d="M19 14 Q19 29 34 29 Q19 29 19 44 Q19 29 4 29 Q19 29 19 14 Z" fill="url(#ai-assist-star-grad)" />
      {/* Medium accent star (upper-right) */}
      <path d="M35 8 Q35 15 42 15 Q35 15 35 22 Q35 15 28 15 Q35 15 35 8 Z" fill="url(#ai-assist-star-grad)" />
      {/* Tiny accent star (top-right) */}
      <path d="M42 3 Q42 6 45 6 Q42 6 42 9 Q42 6 39 6 Q42 6 42 3 Z" fill="url(#ai-assist-star-grad)" />
    </svg>
  )
}

export function AiAssistPanel({ userName = 'John', onClose }: AiAssistPanelProps) {
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const canSend = draft.trim().length > 0

  return (
    <aside
      className={`flex h-full shrink-0 flex-col rounded-tl-xl border-l border-border bg-surface ${
        expanded ? 'w-[640px]' : 'w-[400px]'
      }`}
    >
      {/* Top bar — expand + close */}
      <div className="flex h-14 shrink-0 items-center justify-end gap-xs px-lg">
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={() => setExpanded((e) => !e)}
          className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name={expanded ? 'close_fullscreen' : 'open_in_full'} size={18} />
        </button>
        <button
          type="button"
          aria-label="Close AI assist"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Greeting */}
      <div className="shrink-0 px-lg pb-lg">
        <h2 className="m-0 text-display text-text-primary">
          Hi {userName},
          <br />
          how can I help you today?
        </h2>
      </div>

      {/* Empty state — sparkle + caption */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-lg px-2xl">
        <BirdAiStar size={72} />
        <p className="m-0 max-w-[220px] text-center text-body text-text-tertiary">
          BirdAI fetches reports, provides insights for your questions
        </p>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-lg pb-lg">
        <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface px-md py-md shadow-card">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Ask your questions here..."
            className="min-h-[60px] w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={() => setDraft('')}
              className={`flex size-8 items-center justify-center rounded-sm transition-colors ${
                canSend
                  ? 'text-ai-brand hover:bg-surface-hover'
                  : 'cursor-not-allowed text-text-tertiary'
              }`}
            >
              <SendIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
