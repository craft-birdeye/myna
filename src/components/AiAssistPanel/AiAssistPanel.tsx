import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { SendIcon } from '../../assets/SendIcon'
import { CanvasNodeTypeIcon } from '../../workflow/Molecules/Canvas/CanvasNodeIcons'
import { AiAssistPanelProps, type AiAssistHistoryItem } from './AiAssistPanel.types'

const JOHN_CREATE_PROMPT =
  "I want a front desk agent for our clinic. It should answer inbound calls, book and reschedule appointments, answer basic insurance questions, and hand off anything about billing disputes to a human. I've got a bunch of our real call recordings if that helps."

const REMINDER_CREATE_PROMPT =
  "Every time an appointment gets booked, I want patients to automatically get reminded — email and text. Start about a month out, then again a week before. If they still haven't confirmed two days before the appointment, have the agent actually call them. If they don't pick up, send a text. And nobody should get calls at weird hours"

type SuggestionOption = { label: string; prompt: string }

const FRONTDESK_SUGGESTIONS: readonly SuggestionOption[] = [
  {
    label: 'Routing and triage',
    prompt:
      'Create a Front desk agent that identifies why a patient is calling and routes urgent or complex requests to the right team.',
  },
  {
    label: 'New patient intake',
    prompt:
      'Create a Front desk agent that guides new patients through intake, verifies insurance, and books the right appointment.',
  },
  {
    label: 'Patient scheduling',
    prompt:
      'Create a Front desk agent that finds patient records and books, reschedules, or cancels appointments.',
  },
]

const FRONTDESK_ANALYZE_SUGGESTIONS: readonly SuggestionOption[] = [
  {
    label: 'Learn more about the outcomes',
    prompt:
      'Walk me through the key outcomes for this front desk agent — what the numbers mean and where performance looks strongest.',
  },
  {
    label: 'Learn about where the agent is not working well',
    prompt:
      'Where is this front desk agent falling short? Highlight gaps in call handling, booking, insurance questions, or human handoffs.',
  },
  {
    label: 'See how callers are being routed',
    prompt:
      'Show me how inbound callers are being triaged and routed — including scheduling, urgent cases, and handoffs to a human.',
  },
]

const REMINDER_SUGGESTIONS: readonly SuggestionOption[] = [
  {
    label: 'Appointment confirmation reminder',
    prompt: REMINDER_CREATE_PROMPT,
  },
  {
    label: 'No-show risk intervention agent',
    prompt:
      'Create an agent that identifies patients at high risk of missing appointments and uses additional reminders and a confirmation call.',
  },
  {
    label: 'Pre-visit preparation reminder',
    prompt:
      'Create an agent that reminds patients about forms, fasting instructions, insurance cards, and other preparation before their visit.',
  },
]

const REMINDER_ANALYZE_SUGGESTIONS: readonly SuggestionOption[] = [
  {
    label: 'Learn more about the outcomes',
    prompt:
      'Walk me through the key outcomes for this reminder agent — confirmation rates, reach, and where performance looks strongest.',
  },
  {
    label: 'Learn about where the agent is not working well',
    prompt:
      'Where is this reminder agent falling short? Highlight gaps in confirmation, no-show risk, or quiet-hours coverage.',
  },
  {
    label: 'Review the reminder cadence',
    prompt:
      'Show me how the reminder cadence is performing across email, text, and call touchpoints before the appointment.',
  },
]

const FRONTDESK_HISTORY: readonly AiAssistHistoryItem[] = [
  {
    id: 'fd-ai-1',
    title: 'Improve insurance verification',
    date: '2 hours ago',
    prompt:
      "Can we tighten the insurance verification step? A few claims are getting flagged after the fact.",
    draftTitle: 'Insurance verification — tightened',
    draftDescription:
      'Checks eligibility and matches the policy number before booking, so mismatches get caught up front instead of after the claim.',
    replies: [
      [
        'Good catch — most of those after-the-fact flags come from policy-number mismatches, not lapsed coverage.',
        '• Verify eligibility and match the policy number before booking',
        '• Flag mismatches for staff review instead of booking through',
        '• Keep the original flow for everything that matches cleanly',
      ],
      [
        'Updated. Verification now runs before the slot is held, so a mismatch never makes it to the claim stage.',
      ],
    ],
  },
  {
    id: 'fd-ai-2',
    title: 'After-hours triage flow',
    date: 'Yesterday',
    prompt:
      'We need a way to triage calls that come in after hours — route anything urgent to the on-call line and schedule a callback for everything else.',
    draftTitle: 'After-hours triage — on-call routing',
    draftDescription:
      'Routes urgent after-hours calls to the on-call line and schedules a callback for everything else.',
    replies: [
      [
        'Added an after-hours branch that checks call urgency first.',
        '• Urgent → routed straight to the on-call line',
        '• Everything else → callback scheduled for next business day',
      ],
      [
        'Draft is ready — after-hours calls now split by urgency instead of all going to voicemail.',
      ],
    ],
  },
  {
    id: 'fd-ai-3',
    title: 'Escalation for billing disputes',
    date: 'Last week',
    prompt:
      "Billing disputes shouldn't be handled by the bot — hand those straight to a human rep with a summary of the conversation so far.",
    draftTitle: 'Billing disputes — human handoff',
    draftDescription:
      'Hands billing disputes to a human rep with a conversation summary instead of letting the bot handle them.',
    replies: [
      [
        'Makes sense — billing disputes need a human touch. Added a detection step that hands off as soon as a dispute is mentioned.',
        '• Detect billing dispute intent',
        '• Summarize the conversation so far',
        '• Hand off to a human rep with that summary attached',
      ],
      [
        'Draft is ready. Disputes now skip the bot entirely and go straight to a rep with full context.',
      ],
    ],
  },
]

const REMINDER_HISTORY: readonly AiAssistHistoryItem[] = [
  {
    id: 'rm-ai-1',
    title: 'Tighten reminder cadence',
    date: '2 hours ago',
    prompt:
      "Patients say they're getting too many reminders. Can we space them out to just three touchpoints — 72 hours, 24 hours, and 2 hours before the appointment?",
    draftTitle: 'Reminder cadence — three touchpoints',
    draftDescription:
      'Sends reminders at 72 hours, 24 hours, and 2 hours before the appointment instead of the old schedule.',
    replies: [
      [
        'Fair — the old cadence was sending more touches than needed. Reworked it to three fixed points.',
        '• 72 hours before',
        '• 24 hours before',
        '• 2 hours before',
      ],
      [
        'Draft is ready. Patients now get exactly three reminders instead of the previous schedule.',
      ],
    ],
  },
  {
    id: 'rm-ai-2',
    title: 'No-show risk call path',
    date: 'Yesterday',
    prompt:
      'Can we add a follow-up phone call for patients who are likely to no-show, instead of just another text?',
    draftTitle: 'No-show risk — follow-up call',
    draftDescription:
      'Adds a phone call for patients flagged as likely to no-show, instead of only sending another text.',
    replies: [
      [
        'Added a call step for patients flagged high-risk instead of just another text.',
        '• Risk score checked after the 24-hour reminder',
        '• High risk → outbound call attempt',
        '• No answer → falls back to a text',
      ],
      [
        'Draft is ready. High-risk patients now get a call before the appointment, not just another message.',
      ],
    ],
  },
  {
    id: 'rm-ai-3',
    title: 'Quiet hours for outbound calls',
    date: 'Last week',
    prompt: "Make sure outbound reminder calls aren't going out before 8am or after 8pm.",
    draftTitle: 'Reminder calls — quiet hours',
    draftDescription:
      'Holds outbound reminder calls to an 8am–8pm window regardless of when a reminder is triggered.',
    replies: [
      [
        'Added a quiet-hours check before any outbound call goes out.',
        '• Calls only place between 8am and 8pm local time',
        '• Anything outside that window queues for the next allowed hour',
      ],
      [
        'Draft is ready. Reminder calls now respect quiet hours no matter when the trigger fires.',
      ],
    ],
  },
]

function resolveAgentVariant(agentName?: string): 'frontdesk' | 'reminder' {
  return (agentName ?? '').toLowerCase().includes('reminder') ? 'reminder' : 'frontdesk'
}

/** Strip region / instance suffix so copy says "front desk agent", not "… - North region". */
function resolveAgentTypeLabel(agentName?: string, variant: 'frontdesk' | 'reminder' = 'frontdesk'): string {
  const base = (agentName ?? '').replace(/ - .+$/, '').trim().toLowerCase()
  if (base) return base
  return variant === 'reminder' ? 'reminder agent' : 'front desk agent'
}

function SparkleAvatar({ size = 14, large = false }: { size?: number; large?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-ai-summary ${
        large ? 'size-8' : 'size-6'
      }`}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="ai-assist-avatar-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6cf0" />
            <stop offset="55%" stopColor="#6834b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
          fill="url(#ai-assist-avatar-grad)"
        />
      </svg>
    </span>
  )
}

export function AiAssistPanel({
  userName = 'John',
  agentName,
  mode = 'build',
  onClose,
  onExpand,
  expanded = false,
  onNewChat,
  suggestions,
  historyItems,
  selectedCanvasNode = null,
  onClearSelectedCanvasNode,
  CreateConversation,
}: AiAssistPanelProps) {
  const variant = resolveAgentVariant(agentName)
  const agentTypeLabel = resolveAgentTypeLabel(agentName, variant)
  const defaultSuggestions =
    mode === 'analyze'
      ? variant === 'reminder'
        ? REMINDER_ANALYZE_SUGGESTIONS
        : FRONTDESK_ANALYZE_SUGGESTIONS
      : variant === 'reminder'
        ? REMINDER_SUGGESTIONS
        : FRONTDESK_SUGGESTIONS
  const resolvedSuggestions: readonly SuggestionOption[] = suggestions
    ? suggestions.map((label) => {
        const match = defaultSuggestions.find((s) => s.label === label)
        return {
          label,
          prompt:
            match?.prompt
            ?? (variant === 'reminder' ? REMINDER_CREATE_PROMPT : JOHN_CREATE_PROMPT),
        }
      })
    : defaultSuggestions
  const resolvedHistory =
    historyItems ?? (variant === 'reminder' ? REMINDER_HISTORY : FRONTDESK_HISTORY)
  const greeting =
    mode === 'analyze'
      ? `Hi ${userName}, I'm here to help you analyze your ${agentTypeLabel}. How can I help you today?`
      : variant === 'reminder'
        ? `Hi ${userName}! I'm here to help you build your Reminder agent. How can I help you today?`
        : `Hi ${userName}! I'm here to help you build your Front desk agent. How can I help you today?`

  const [draft, setDraft] = useState('')
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [startedPrompt, setStartedPrompt] = useState<string | null>(null)
  const [conversationKey, setConversationKey] = useState(0)
  const [draftAgentName, setDraftAgentName] = useState<string | null>(null)
  const canSend = draft.trim().length > 0
  const selectedHistoryItem = selectedHistoryId
    ? resolvedHistory.find((item) => item.id === selectedHistoryId) ?? null
    : null
  const showConversation = Boolean(
    CreateConversation && (startedPrompt || selectedHistoryItem) && view === 'chat',
  )
  const expandedTitle =
    draftAgentName ?? (variant === 'reminder' ? 'New reminder agent' : 'New front desk agent')

  const startConversation = (prompt: string) => {
    const text = prompt.trim()
    if (!text) return
    if (!CreateConversation) {
      setDraft(text)
      setView('chat')
      return
    }
    setSelectedHistoryId(null)
    setStartedPrompt(text)
    setConversationKey((k) => k + 1)
    setDraft('')
    setView('chat')
  }

  // Reopens a recent chat as a static replay of its own transcript (with a composer to
  // continue) instead of re-sending its canned prompt through the live, animated flow.
  const openHistoryChat = (item: AiAssistHistoryItem) => {
    if (!CreateConversation || !item.draftTitle) {
      if (item.prompt) startConversation(item.prompt)
      else setView('chat')
      return
    }
    setStartedPrompt(null)
    setSelectedHistoryId(item.id)
    setConversationKey((k) => k + 1)
    setView('chat')
  }

  const handleNewChat = () => {
    setDraft('')
    setSelectedHistoryId(null)
    setView('chat')
    setStartedPrompt(null)
    setDraftAgentName(null)
    setConversationKey((k) => k + 1)
    onClearSelectedCanvasNode?.()
    onNewChat?.()
  }

  const handleSuggestion = (option: SuggestionOption) => {
    startConversation(option.prompt)
  }

  const handleSend = () => {
    if (!canSend) return
    startConversation(draft.trim())
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-l border-border bg-surface ${
        expanded ? 'w-full min-w-0 border-l-0' : 'w-[400px]'
      }`}
    >
      {!expanded && (
      <div className="flex h-14 shrink-0 items-center justify-between px-md">
        <div className="flex min-w-0 items-center gap-sm">
          <SparkleAvatar />
          <span className="truncate text-body text-text-primary">AI assist</span>
        </div>
        <div className="flex items-center gap-xs">
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-text-primary"
              aria-label={expanded ? 'Collapse AI assist' : 'Expand AI assist'}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <Icon name={expanded ? 'close_fullscreen' : 'open_in_full'} size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={handleNewChat}
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-text-primary"
            aria-label="New chat"
            title="New chat"
          >
            <Icon name="add_comment" size={20} />
          </button>
          <button
            type="button"
            onClick={() => setView((v) => (v === 'history' ? 'chat' : 'history'))}
            className={`flex size-8 items-center justify-center rounded-sm hover:bg-surface-hover hover:text-text-primary ${
              view === 'history' ? 'bg-surface-selected text-text-primary' : 'text-text-icon'
            }`}
            aria-label="Conversation history"
            title="Conversation history"
            aria-pressed={view === 'history'}
          >
            <Icon name="format_list_bulleted" size={20} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-text-primary"
            aria-label="Close AI assist"
            title="Close AI assist"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {expanded && !showConversation && (
          <div className="flex h-16 shrink-0 items-center justify-between gap-sm bg-surface px-2xl">
            <div className="flex min-w-0 items-center gap-sm">
              <button
                type="button"
                onClick={onExpand}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                aria-label="Back to workflow"
              >
                <Icon name="arrow_back" size={20} />
              </button>
              <h1 className="truncate text-h3 text-text-primary">{expandedTitle}</h1>
            </div>
            {draftAgentName && onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover hover:text-text-primary"
                aria-label="View workflow"
                title="View workflow"
              >
                <Icon name="account_tree" size={20} />
              </button>
            )}
          </div>
        )}
        {view === 'history' ? (
          <div className={`scrollbar-subtle min-h-0 flex-1 overflow-y-auto py-sm ${
            expanded ? 'mx-auto flex w-full max-w-[720px] flex-col gap-xs px-lg' : 'flex flex-col gap-xs px-md'
          }`}>
            <div className="px-sm pb-xs pt-xs text-small text-text-tertiary">Recent chats</div>
            {resolvedHistory.map((item) => {
              const selected = selectedHistoryId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openHistoryChat(item)}
                  className={`flex w-full flex-col gap-xs rounded-md border px-md py-sm text-left transition-colors ${
                    selected
                      ? 'border-border-selected bg-surface-hover'
                      : 'border-transparent hover:border-border hover:bg-surface-hover'
                  }`}
                >
                  <span className="truncate text-body text-text-primary">{item.title}</span>
                  <span className="inline-flex items-center gap-xs text-small text-text-tertiary">
                    <Icon name="schedule" size={14} className="shrink-0" />
                    {item.date ?? 'Recently'}
                  </span>
                </button>
              )
            })}
          </div>
        ) : showConversation && CreateConversation ? (
          <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            expanded ? 'px-lg pb-lg' : 'px-md pb-md'
          }`}>
            <CreateConversation
              key={conversationKey}
              variant={variant}
              initialPrompt={selectedHistoryItem?.prompt ?? startedPrompt ?? ''}
              autoStart={!selectedHistoryItem}
              historyChatId={selectedHistoryItem?.id ?? null}
              historyChat={
                selectedHistoryItem
                  ? {
                      id: selectedHistoryItem.id,
                      title: selectedHistoryItem.title,
                      prompt: selectedHistoryItem.prompt ?? '',
                      draftTitle: selectedHistoryItem.draftTitle ?? selectedHistoryItem.title,
                      draftDescription: selectedHistoryItem.draftDescription ?? '',
                      replies: selectedHistoryItem.replies ?? [],
                      variant,
                    }
                  : null
              }
              workflowVisible={!expanded}
              pageTitle={expanded ? expandedTitle : undefined}
              onBack={expanded ? onExpand : undefined}
              onViewWorkflow={expanded && draftAgentName ? onExpand : undefined}
              onDraftReady={setDraftAgentName}
              selectedCanvasNode={selectedCanvasNode}
              onClearSelectedCanvasNode={onClearSelectedCanvasNode}
            />
          </div>
        ) : (
          <>
            <div className={`flex min-h-0 flex-1 flex-col justify-end overflow-y-auto pb-3xl ${
              expanded ? 'mx-auto w-full max-w-[720px] px-lg' : 'px-xl'
            }`}>
              <div className="flex gap-sm">
                <SparkleAvatar size={18} large />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-body leading-6 text-text-primary">{greeting}</p>
                  <div className="mt-md flex flex-col items-start gap-sm">
                    {resolvedSuggestions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSuggestion(option)}
                        className="flex min-h-9 items-center rounded-sm border border-border bg-surface px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`shrink-0 pb-md ${
              expanded ? 'mx-auto w-full max-w-[720px] px-lg' : 'px-xl'
            }`}>
              <div className="flex min-h-40 flex-col gap-md rounded-lg border border-border bg-surface px-lg py-md shadow-card">
                {selectedCanvasNode && (
                  <div className="flex flex-wrap items-center gap-sm">
                    <span className="inline-flex h-7 max-w-full items-center gap-xs rounded-full border border-border bg-surface px-sm text-small text-text-primary">
                      <span className="flex size-4 shrink-0 items-center justify-center">
                        {selectedCanvasNode.flowType === 'delay' ? (
                          <Icon name="schedule" size={14} className="text-text-icon" />
                        ) : (
                          <CanvasNodeTypeIcon flowType={selectedCanvasNode.flowType} />
                        )}
                      </span>
                      <span className="truncate">{selectedCanvasNode.label}</span>
                      {onClearSelectedCanvasNode && (
                        <button
                          type="button"
                          aria-label={`Remove ${selectedCanvasNode.label}`}
                          onClick={onClearSelectedCanvasNode}
                          className="flex size-4 shrink-0 items-center justify-center rounded-full text-text-icon hover:bg-surface-hover hover:text-text-primary"
                        >
                          <Icon name="close" size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                )}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Ask me anything"
                  className="scrollbar-none min-h-16 w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <button
                      type="button"
                      aria-label="Attach"
                      className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                    >
                      <Icon name="attach_file" size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Add context"
                      className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                    >
                      <Icon name="data_object" size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="More options"
                      className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                    >
                      <Icon name="more_horiz" size={20} />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Send"
                    disabled={!canSend}
                    onClick={handleSend}
                    className={`flex size-9 items-center justify-center rounded-sm transition-colors ${
                      canSend
                        ? 'text-ai-brand hover:bg-surface-hover'
                        : 'cursor-not-allowed text-text-tertiary'
                    }`}
                  >
                    <SendIcon size={24} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
