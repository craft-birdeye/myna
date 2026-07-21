import { useEffect, useState } from 'react'
import { Chip } from '../Chip/Chip'
import { Icon } from '../Icon/Icon'
import { CoachAgentPanelProps } from './CoachAgentPanel.types'

type Feedback = 'up' | 'down' | null
type Phase = 'prompt' | 'reading' | 'typing' | 'done'

const REPLY_INTRO =
  "Based on this agent's open recommendations, here's where I'd focus first:"

const REPLY_PRIORITIES = [
  {
    title: 'Update business hours',
    reason: 'Highest affected volume — blocking basic inbound questions.',
    affected: 19,
  },
  {
    title: 'Add a payment processing procedure',
    reason: 'Customers ask about payments with no agent guidance available.',
    affected: 12,
  },
  {
    title: 'Update appointment rescheduling procedure',
    reason: 'Same-day reschedule and waitlist paths are missing.',
    affected: 8,
  },
]

const REPLY_ACTIONS = [
  'Walk me through the business hours fix',
  'Compare impact across recommendations',
]

function TypedIntro({ text, complete }: { text: string; complete: boolean }) {
  return (
    <p className="text-body text-text-primary">
      {complete ? REPLY_INTRO : text}
      {!complete && (
        <span className="coach-caret ml-px inline-block h-[1em] w-px translate-y-px bg-text-primary" aria-hidden />
      )}
    </p>
  )
}

export function CoachAgentPanel({ agentName, onClose }: CoachAgentPanelProps) {
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [phase, setPhase] = useState<Phase>('prompt')
  const [typed, setTyped] = useState('')

  useEffect(() => {
    setPhase('prompt')
    setTyped('')
    setFeedback(null)

    const tReading = window.setTimeout(() => setPhase('reading'), 300)
    const tTyping = window.setTimeout(() => setPhase('typing'), 1600)

    return () => {
      window.clearTimeout(tReading)
      window.clearTimeout(tTyping)
    }
  }, [agentName])

  useEffect(() => {
    if (phase !== 'typing') return

    let i = 0
    setTyped('')
    const id = window.setInterval(() => {
      i += 1
      setTyped(REPLY_INTRO.slice(0, i))
      if (i >= REPLY_INTRO.length) {
        window.clearInterval(id)
        setPhase('done')
      }
    }, 12)

    return () => window.clearInterval(id)
  }, [phase])

  function toggleFeedback(value: 'up' | 'down') {
    setFeedback((prev) => (prev === value ? null : value))
  }

  const showReading = phase === 'reading' || phase === 'typing' || phase === 'done'
  const showReply = phase === 'typing' || phase === 'done'

  return (
    <aside className="flex h-full w-[400px] shrink-0 flex-col border-l border-border bg-surface">
      <style>{`
        @keyframes coach-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        @keyframes coach-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes coach-caret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .coach-fade-in { animation: coach-fade-in 280ms ease-out both; }
        .coach-bounce { animation: coach-bounce 1s ease-in-out infinite; }
        .coach-caret { animation: coach-caret 0.9s step-end infinite; }
      `}</style>

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
      <div className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto px-lg pb-lg">
        <p className="coach-fade-in text-body text-text-primary">
          Help me improve recommendations for {agentName}. What should I prioritize first?
        </p>

        {showReading && (
          <div className="coach-fade-in flex items-center gap-xs text-small text-text-secondary">
            {phase === 'reading' ? (
              <>
                <Icon name="progress_activity" size={16} className="animate-spin text-text-icon" />
                <span>Reading agent recommendations</span>
                <span className="inline-flex items-center gap-px" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="coach-bounce size-1 rounded-full bg-text-secondary"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              <>
                <Icon name="check_circle" size={16} className="text-accent-positive" fill />
                Reading agent recommendations
              </>
            )}
          </div>
        )}

        {showReply && (
          <div className="flex flex-col gap-md">
            <TypedIntro text={typed} complete={phase === 'done'} />
            {phase === 'done' && (
              <>
                <ol className="flex flex-col gap-sm">
                  {REPLY_PRIORITIES.map((item, i) => (
                    <li
                      key={item.title}
                      className="coach-fade-in flex gap-md rounded-sm border border-border px-md py-sm"
                      style={{ animationDelay: `${i * 140}ms` }}
                    >
                      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-selected text-small text-text-secondary">
                        {i + 1}
                      </span>
                      <div className="flex min-w-0 flex-col gap-xs">
                        <span className="text-body text-text-primary">{item.title}</span>
                        <span className="text-small text-text-secondary">{item.reason}</span>
                        <div className="flex items-center gap-sm pt-xs">
                          <Chip label="High" variant="danger" />
                          <span className="inline-flex items-center gap-xs text-small text-text-tertiary">
                            <Icon name="chat_bubble_outline" size={14} />
                            {item.affected} affected
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div
                  className="coach-fade-in flex flex-col gap-sm"
                  style={{ animationDelay: `${REPLY_PRIORITIES.length * 140 + 80}ms` }}
                >
                  <div className="flex flex-wrap gap-sm">
                    {REPLY_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="rounded-full border border-border-selected px-md py-xs text-small text-text-action hover:bg-surface-l2"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-xs pt-xs">
                    <button
                      type="button"
                      aria-label="Good response"
                      aria-pressed={feedback === 'up'}
                      onClick={() => toggleFeedback('up')}
                      className={`flex size-7 items-center justify-center rounded-sm hover:bg-surface-hover ${
                        feedback === 'up' ? 'text-text-primary' : 'text-text-icon'
                      }`}
                    >
                      <Icon name="thumb_up" size={16} fill={feedback === 'up'} />
                    </button>
                    <button
                      type="button"
                      aria-label="Bad response"
                      aria-pressed={feedback === 'down'}
                      onClick={() => toggleFeedback('down')}
                      className={`flex size-7 items-center justify-center rounded-sm hover:bg-surface-hover ${
                        feedback === 'down' ? 'text-text-primary' : 'text-text-icon'
                      }`}
                    >
                      <Icon name="thumb_down" size={16} fill={feedback === 'down'} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
