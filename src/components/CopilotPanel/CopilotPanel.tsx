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
import { REVIEW_AGENT_SCRIPT, isReviewAgentTrigger } from './reviewAgentScript'

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

// Shown when the panel is opened on a brand-new / untitled agent (the create-from-scratch flow),
// so the reviewer can kick off the scripted build with one click.
const CREATE_SUGGESTIONS = [
  'Create a review agent',
  'What can you help me build?',
]

function isBlankAgent(agentName: string): boolean {
  const n = agentName.trim().toLowerCase()
  return n === '' || n === 'this agent' || n === 'untitled agent'
}

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
            <p className="m-0 min-w-0 whitespace-pre-line text-body text-text-primary">{m.text}</p>
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

/** Scripted-demo composer — one tap plays the next turn instead of free typing. */
function TapToContinue({ onTap, disabled }: { onTap: () => void; disabled: boolean }) {
  return (
    <div className="shrink-0 px-lg pb-lg">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          if (!disabled) onTap()
        }}
        aria-label="Continue"
        className={`flex w-full items-center justify-between rounded-lg border border-border bg-surface px-md py-md text-left shadow-card ${
          disabled ? 'cursor-default opacity-70' : 'hover:bg-surface-hover'
        }`}
      >
        <span className="text-body text-text-tertiary">
          {disabled ? 'Copilot is working…' : 'Tap to continue…'}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-text-primary text-white">
          <Icon name="arrow_upward" size={18} />
        </span>
      </button>
    </div>
  )
}

/**
 * The one Copilot surface: a docked side panel scoped to an agent instance. Home view is the
 * agent's conversation history (create flow, recommendations, coaching feedback, ad-hoc asks);
 * threads open in place, except recommendation-linked ones which navigate to the detail page.
 */
export function CopilotPanel({ agentName, userName = 'John', onClose, onExpand, onOpenRecommendation, onBuildAgent }: CopilotPanelProps) {
  const { listThreads, getThread, upsertThread, appendMessages } = useCopilotThreadsStore()
  const [view, setView] = useState<'home' | 'history'>('home')
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)
  const [expandedInternal, setExpandedInternal] = useState(false)
  const [replying, setReplying] = useState(false)
  const replyTimer = useRef<number | null>(null)

  // Scripted "create a review agent" demo flow (see reviewAgentScript.ts). `scriptIndex` is the
  // NEXT step to play; -1 means the flow hasn't started. Each composer tap plays one step.
  const [scriptThreadId, setScriptThreadId] = useState<string | null>(null)
  const [scriptIndex, setScriptIndex] = useState(-1)
  const [scriptPlaying, setScriptPlaying] = useState(false)
  const [thinkingLine, setThinkingLine] = useState<string | null>(null)
  const scriptTimers = useRef<number[]>([])
  const clearScriptTimers = () => {
    scriptTimers.current.forEach((t) => window.clearTimeout(t))
    scriptTimers.current = []
  }

  useEffect(() => () => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current)
    clearScriptTimers()
  }, [])

  const expanded = onExpand ? false : expandedInternal
  const handleExpandClick = onExpand ?? (() => setExpandedInternal((e) => !e))

  const threads = listThreads(agentName)
  const openThread = openThreadId ? getThread(openThreadId) : undefined

  const scriptActive =
    scriptThreadId !== null &&
    openThreadId === scriptThreadId &&
    scriptIndex >= 0 &&
    scriptIndex < REVIEW_AGENT_SCRIPT.length

  const LINE_MS = 850

  /** Reveal one script step: optional user line, then transient thinking lines, then the reply. */
  const playStep = (threadId: string, stepIndex: number, appendUser: boolean) => {
    const step = REVIEW_AGENT_SCRIPT[stepIndex]
    if (!step) return
    clearScriptTimers()
    setScriptPlaying(true)
    if (appendUser && step.user) {
      appendMessages(threadId, [copilotMessage('user', step.user)])
    }
    const lines = step.thinking ?? []
    lines.forEach((line, i) => {
      scriptTimers.current.push(window.setTimeout(() => setThinkingLine(line), i * LINE_MS))
    })
    const replyAt = lines.length * LINE_MS + (lines.length ? 350 : 300)
    scriptTimers.current.push(
      window.setTimeout(() => {
        setThinkingLine(null)
        appendMessages(threadId, [copilotMessage('copilot', step.reply)])
        setScriptPlaying(false)
        setScriptIndex(stepIndex + 1)
        // Final "Build it" step — tell the host to load the Library agent onto the canvas.
        if (stepIndex === REVIEW_AGENT_SCRIPT.length - 1) {
          onBuildAgent?.()
        }
      }, replyAt),
    )
  }

  const startReviewScript = (typedText: string) => {
    const id = upsertThread({
      agentName,
      origin: 'create',
      title: 'Create a review agent',
      messages: [copilotMessage('user', typedText)],
    })
    setOpenThreadId(id)
    setScriptThreadId(id)
    setScriptIndex(0)
    playStep(id, 0, false)
  }

  /** Composer tap in scripted mode — plays the next exchange. */
  const advanceScript = () => {
    if (scriptPlaying || !scriptThreadId) return
    playStep(scriptThreadId, scriptIndex, true)
  }

  const scheduleReply = (threadId: string) => {
    setReplying(true)
    replyTimer.current = window.setTimeout(() => {
      appendMessages(threadId, [copilotMessage('copilot', cannedReply(agentName))])
      setReplying(false)
    }, 900)
  }

  const handleSend = (text: string) => {
    // "Create a review agent" kicks off the scripted build flow instead of a canned reply.
    if (scriptIndex < 0 && isReviewAgentTrigger(text)) {
      startReviewScript(text)
      return
    }
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
          {(thinkingLine || replying) && (
            <div className="flex items-center gap-sm px-lg pb-sm">
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <span className="absolute inline-flex size-3 animate-ping rounded-full bg-ai-brand opacity-60" />
                <BirdAiStar size={14} />
              </span>
              <span className="text-small text-text-tertiary">{thinkingLine ?? 'Copilot is thinking…'}</span>
            </div>
          )}
          {scriptActive ? (
            <TapToContinue onTap={advanceScript} disabled={scriptPlaying} />
          ) : (
            <Composer onSend={handleSend} placeholder="Reply to your Copilot…" />
          )}
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
              {(isBlankAgent(agentName) ? CREATE_SUGGESTIONS : SUGGESTIONS).map((s) => (
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
