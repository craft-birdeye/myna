import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { ChatSystemLabel } from '../ChatBubble/ChatBubble'
import {
  copilotMessage,
  useCopilotThreadsStore,
  type CopilotThread,
  type CopilotThreadOrigin,
} from '../../data/CopilotThreadsStoreContext'
import { CopilotPanelProps } from './CopilotPanel.types'

/** BirdAI gradient sparkle cluster — one large 4-point star + two accents. */
function BirdAiStar({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="copilot-star-grad" x1="6" y1="8" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b18cf5" />
          <stop offset="60%" stopColor="#7c4ddb" />
          <stop offset="100%" stopColor="#6834b7" />
        </linearGradient>
      </defs>
      <path d="M19 14 Q19 29 34 29 Q19 29 19 44 Q19 29 4 29 Q19 29 19 14 Z" fill="url(#copilot-star-grad)" />
      <path d="M35 8 Q35 15 42 15 Q35 15 35 22 Q35 15 28 15 Q35 15 35 8 Z" fill="url(#copilot-star-grad)" />
      <path d="M42 3 Q42 6 45 6 Q42 6 42 9 Q42 6 39 6 Q42 6 42 3 Z" fill="url(#copilot-star-grad)" />
    </svg>
  )
}

const ORIGIN_ICON: Record<CopilotThreadOrigin, string> = {
  create: 'auto_awesome',
  recommendation: 'emoji_objects',
  coaching: 'thumb_down',
  ask: 'chat_bubble',
}

const SUGGESTIONS = [
  'Why did escalations rise this week?',
  'Tighten the greeting procedure',
  'What should this agent do better?',
]

/** Scripted acknowledgement so the prototype composer feels alive end-to-end. */
function cannedReply(agentName: string): string {
  return `Got it — I've noted that for ${agentName.replace(/ - .+$/, '').toLowerCase()}. I'll fold it into my next recommendation pass; anything I change will show up on the Recommendation tab for your review.`
}

function ThreadTranscript({ thread }: { thread: CopilotThread }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [thread.messages.length])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto px-lg py-lg">
      {thread.messages.map((m) =>
        m.role === 'system' ? (
          <ChatSystemLabel key={m.id} text={m.text} />
        ) : m.role === 'user' ? (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-lg bg-[#f0f0f0] px-lg py-md text-body text-text-primary">
              {m.text}
            </div>
          </div>
        ) : (
          <div key={m.id} className="flex items-start gap-sm">
            <div className="mt-xs shrink-0">
              <BirdAiStar size={20} />
            </div>
            <p className="m-0 min-w-0 text-body text-text-primary">{m.text}</p>
          </div>
        ),
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function Composer({ onSend, placeholder = 'Ask your Copilot…' }: { onSend: (text: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0

  const send = () => {
    if (!canSend) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className="shrink-0 px-lg pb-lg">
      <div className="flex flex-col gap-sm rounded-lg border border-border bg-surface px-md py-md shadow-card">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={2}
          placeholder={placeholder}
          className="min-h-9 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <div className="flex items-center justify-end">
          <button
            type="button"
            aria-label="Send"
            disabled={!canSend}
            onClick={send}
            className={`flex size-8 items-center justify-center rounded-full ${
              canSend
                ? 'bg-text-primary text-white hover:opacity-90'
                : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            <Icon name="arrow_upward" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * The one Copilot surface: a docked side panel scoped to an agent instance. Home view is the
 * agent's conversation history (create flow, recommendations, coaching feedback, ad-hoc asks);
 * threads open in place, except recommendation-linked ones which navigate to the detail page.
 */
export function CopilotPanel({ agentName, userName = 'John', onClose, onExpand, onOpenRecommendation }: CopilotPanelProps) {
  const { listThreads, getThread, upsertThread, appendMessages } = useCopilotThreadsStore()
  const [view, setView] = useState<'home' | 'history'>('home')
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)
  const [expandedInternal, setExpandedInternal] = useState(false)
  const [replying, setReplying] = useState(false)
  const replyTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current)
  }, [])

  const expanded = onExpand ? false : expandedInternal
  const handleExpandClick = onExpand ?? (() => setExpandedInternal((e) => !e))

  const threads = listThreads(agentName)
  const openThread = openThreadId ? getThread(openThreadId) : undefined

  const scheduleReply = (threadId: string) => {
    setReplying(true)
    replyTimer.current = window.setTimeout(() => {
      appendMessages(threadId, [copilotMessage('copilot', cannedReply(agentName))])
      setReplying(false)
    }, 900)
  }

  const handleSend = (text: string) => {
    if (openThreadId && openThread) {
      appendMessages(openThreadId, [copilotMessage('user', text)])
      scheduleReply(openThreadId)
      return
    }
    const title = text.length > 48 ? `${text.slice(0, 48)}…` : text
    const id = upsertThread({
      agentName,
      origin: 'ask',
      title,
      messages: [copilotMessage('user', text)],
    })
    setOpenThreadId(id)
    scheduleReply(id)
  }

  const handleOpenThread = (thread: CopilotThread) => {
    if (thread.recommendationId && onOpenRecommendation) {
      onOpenRecommendation(thread.recommendationId)
      return
    }
    setOpenThreadId(thread.id)
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col rounded-tl-xl border-l border-border bg-surface ${
        expanded ? 'w-[640px]' : 'w-[400px]'
      }`}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between px-lg">
        {openThread ? (
          <button
            type="button"
            onClick={() => setOpenThreadId(null)}
            className="flex min-w-0 items-center gap-xs rounded-sm px-sm py-xs text-body text-text-primary hover:bg-surface-hover"
          >
            <Icon name="arrow_back" size={18} className="shrink-0 text-text-icon" />
            <span className="truncate">{openThread.title}</span>
          </button>
        ) : view === 'history' ? (
          <button
            type="button"
            onClick={() => setView('home')}
            className="flex min-w-0 items-center gap-xs rounded-sm px-sm py-xs text-body text-text-primary hover:bg-surface-hover"
          >
            <Icon name="arrow_back" size={18} className="shrink-0 text-text-icon" />
            <span className="truncate">Conversations</span>
          </button>
        ) : (
          <span className="flex items-center gap-sm text-body text-text-primary">
            <BirdAiStar size={20} />
            Copilot
          </span>
        )}
        <div className="flex shrink-0 items-center gap-xs">
          {view !== 'history' && (
            <button
              type="button"
              aria-label="Conversation history"
              onClick={() => {
                setOpenThreadId(null)
                setView('history')
              }}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="history" size={18} />
            </button>
          )}
          <button
            type="button"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={handleExpandClick}
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name={expanded ? 'close_fullscreen' : 'open_in_full'} size={18} />
          </button>
          <button
            type="button"
            aria-label="Close Copilot"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </div>

      {openThread ? (
        <>
          <ThreadTranscript thread={openThread} />
          {replying && (
            <div className="flex items-center gap-sm px-lg pb-sm">
              <BirdAiStar size={16} />
              <span className="text-small text-text-tertiary">Copilot is thinking…</span>
            </div>
          )}
          <Composer onSend={handleSend} placeholder="Reply to your Copilot…" />
        </>
      ) : view === 'history' ? (
        /* History — this agent's past Copilot conversations, opened from the header icon */
        <div className="flex min-h-0 flex-1 flex-col gap-xs overflow-y-auto px-lg pb-lg">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => handleOpenThread(thread)}
              className="flex items-center gap-sm rounded-sm px-sm py-sm text-left hover:bg-surface-hover"
            >
              <Icon
                name={ORIGIN_ICON[thread.origin]}
                size={18}
                className={`shrink-0 ${thread.origin === 'coaching' ? 'text-chip-danger-text' : 'text-text-icon'}`}
              />
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">{thread.title}</span>
              <span className="shrink-0 text-small text-text-tertiary">{thread.timeLabel}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Home — clean welcome; history lives behind the header icon */}
          <div className="shrink-0 px-lg pb-md">
            <h2 className="m-0 text-display text-text-primary">
              Hi {userName},
              <br />
              how can I help with this agent?
            </h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-lg px-2xl">
            <BirdAiStar size={72} />
            <p className="m-0 max-w-[240px] text-center text-body text-text-tertiary">
              Ask about this agent, refine its procedures, or coach it with feedback
            </p>
          </div>

          <div className="shrink-0 px-lg pb-md">
            <div className="flex flex-wrap gap-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border bg-surface px-md py-xs text-small text-text-secondary hover:bg-surface-hover"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Composer onSend={handleSend} />
        </>
      )}
    </aside>
  )
}
