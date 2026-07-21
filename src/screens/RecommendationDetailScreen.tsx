import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import { ChatBubble, ChatSystemLabel, Chip, Icon, RefChip } from '../components'
import {
  CONV_THREADS,
  GAP_ICON,
  GAP_LABEL,
  PRIORITY_VARIANT,
  RECOMMENDATIONS,
  type Channel,
  type ConversationItem,
  type GapType,
  type ManualUpdate,
  type ProcedureStep,
  type RecommendationChange,
  type RecStatus,
  type Recommendation,
  type Turn,
} from '../data/recommendationsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import {
  ANNETTE_BLACK_CHAT_EVENTS,
  ANNETTE_BLACK_CONVERSATION_ID,
  ANNETTE_BLACK_IMPROVED_HOURS_REPLY,
} from '../data/annetteBlackChatConversation'
import { useRecommendationOverridesStore } from '../data/RecommendationOverridesStoreContext'
import PreviewPanel from '../workflow/Molecules/PreviewPanel/PreviewPanel'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'

interface RecommendationDetailScreenProps {
  recommendationId: string
  onBack: () => void
}

// ── Confirm accept modal ──────────────────────────────────────────────────────

// Where each change type's content actually lives, for the confirm-modal copy.
const TYPE_DESTINATION: Record<GapType, string> = {
  knowledge: "the agent's knowledge base",
  procedure: 'the current workflow and your shared procedure library, so it can be reused across other agents',
  action: "the agent's workflow as an automated action",
}

function ConfirmAddProcedureModal({
  isNew,
  procedureTitle,
  changeTypes,
  onCancel,
  onConfirm,
}: {
  isNew: boolean
  procedureTitle: string
  changeTypes: GapType[]
  onCancel: () => void
  onConfirm: () => void
}) {
  const singleType = changeTypes.length === 1 ? changeTypes[0] : null
  const typeNoun = singleType ? GAP_LABEL[singleType].toLowerCase() : 'recommendation'
  const destination = singleType
    ? TYPE_DESTINATION[singleType]
    : 'the current workflow and your shared procedure library'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-md bg-surface p-xl shadow-modal">
        <div className="flex items-center justify-between">
          <h3 className="text-h3 text-text-primary">
            {isNew ? `Confirm adding ${typeNoun}` : `Confirm updating ${typeNoun}`}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <p className="mt-lg text-body text-text-secondary">
          {isNew ? (
            <>
              This will add "<span className="text-text-primary">{procedureTitle}</span>" to {destination}
            </>
          ) : (
            <>
              This will update "<span className="text-text-primary">{procedureTitle}</span>" in {destination}
            </>
          )}
        </p>
        <div className="mt-xl flex items-center justify-end gap-md">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastData = { message: string; onUndo?: () => void; variant?: 'success' | 'danger' }

function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const isDanger = data.variant === 'danger'
  return createPortal(
    <div
      className="fixed left-1/2 top-[24px] z-[500] flex -translate-x-1/2 items-center gap-[12px] rounded-[8px] bg-white px-[16px] py-[12px]"
      style={{ minWidth: 360, maxWidth: 520, boxShadow: '0 4px 16px 0 rgba(0,0,0,0.14), 0 1px 4px 0 rgba(0,0,0,0.08)' }}
    >
      {isDanger ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <circle cx="10" cy="10" r="8" stroke="#DE1B0C" strokeWidth="1.5" />
          <path d="M10 5.5v5" stroke="#DE1B0C" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="1" fill="#DE1B0C" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path d="M4 10.5l4.5 4.5 7.5-9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <span className="flex-1 text-[13px] leading-[20px] text-[#111827]">{data.message}</span>

      {data.onUndo && (
        <button
          type="button"
          onClick={() => { data.onUndo?.(); onDismiss() }}
          className="shrink-0 text-[13px] leading-[20px] text-[#2563EB]"
        >
          Undo
        </button>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="ml-[4px] flex size-[20px] shrink-0 items-center justify-center text-[#6B7280] hover:text-[#111827]"
      >
        <Icon name="close" size={16} />
      </button>
    </div>,
    document.body
  )
}

// ── Conversations drawer ──────────────────────────────────────────────────────

function channelIcon(ch: Channel) {
  return ch === 'Voice' ? 'call' : ch === 'Chat' ? 'chat_bubble_outline' : 'sms'
}

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="size-[7px] rounded-full bg-[#6b9fd4]"
          style={{ animation: 'sim-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

type DivPhase = 'hidden' | 'original' | 'typing' | 'improved'

function ConversationThread({ conv, sim, onBack }: { conv: ConversationItem; sim?: { before: Turn[]; after: Turn[] }; onBack: () => void }) {
  const [simActive, setSimActive] = useState(false)
  const [visibleCount, setVisibleCount] = useState(9999)
  const [divPhase, setDivPhase] = useState<DivPhase>('hidden')
  const afterCardRef = React.useRef<HTMLDivElement>(null)

  const allTurns = CONV_THREADS[conv.message] ?? [
    { role: 'user' as const,  text: conv.message, time: '10:12 AM' },
    { role: 'agent' as const, text: 'Thank you for reaching out. Let me look into that for you.', time: '10:12 AM' },
  ]

  const improvedAgentTexts = (sim?.after ?? []).filter(t => t.role === 'agent').map(t => t.text)

  let aIdx = 0
  let divergeTurnIdx = -1
  let divergeAgentIdx = -1
  for (let i = 0; i < allTurns.length; i++) {
    if (allTurns[i].role === 'agent') {
      if (improvedAgentTexts[aIdx] && improvedAgentTexts[aIdx] !== allTurns[i].text) {
        divergeTurnIdx = i
        divergeAgentIdx = aIdx
        break
      }
      aIdx++
    }
  }

  const displayTurns = simActive && divergeTurnIdx >= 0
    ? allTurns.slice(0, divergeTurnIdx + 1)
    : allTurns

  const startTime    = allTurns[0]?.time ?? '10:12 AM'
  const endTime      = allTurns[allTurns.length - 1]?.time ?? '10:15 AM'
  const channelLabel = conv.channel === 'Voice' ? 'Voice call' : conv.channel === 'Chat' ? 'Chatbot AI' : 'Text message'
  const improvedText = divergeAgentIdx >= 0 ? (improvedAgentTexts[divergeAgentIdx] ?? '') : ''

  React.useEffect(() => {
    if (!simActive || divergeTurnIdx < 0) {
      setVisibleCount(9999)
      setDivPhase('hidden')
      return
    }

    setVisibleCount(0)
    setDivPhase('hidden')

    const preTurns = divergeTurnIdx
    let count = 0
    let t1: ReturnType<typeof setTimeout>
    let t2: ReturnType<typeof setTimeout>
    let t3: ReturnType<typeof setTimeout>

    const schedulePhases = () => {
      t1 = setTimeout(() => {
        setDivPhase('original')
        t2 = setTimeout(() => {
          setDivPhase('typing')
          t3 = setTimeout(() => {
            setDivPhase('improved')
          }, 1600)
        }, 1000)
      }, 400)
    }

    if (preTurns === 0) {
      schedulePhases()
    } else {
      const reveal = () => {
        count++
        setVisibleCount(count)
        if (count < preTurns) {
          setTimeout(reveal, 500)
        } else {
          schedulePhases()
        }
      }
      setTimeout(reveal, 300)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [simActive, divergeTurnIdx])

  React.useEffect(() => {
    if (divPhase === 'improved') {
      afterCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [divPhase])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <style>{`
        @keyframes sim-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes sim-slide-in {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sim-slide-in { animation: sim-slide-in 0.4s ease-out forwards; }
        @keyframes sim-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sim-msg-in { animation: sim-msg-in 0.3s ease-out forwards; }
        @keyframes sim-glow-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(176, 144, 224, 0.45); }
          70%  { box-shadow: 0 0 0 14px rgba(176, 144, 224, 0); }
          100% { box-shadow: 0 0 0 0 rgba(176, 144, 224, 0); }
        }
        .sim-glow-pulse { animation: sim-glow-pulse 1s ease-out; }
        @keyframes sim-sparkle-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.3); opacity: 0.7; }
        }
        .sim-sparkle-pulse { animation: sim-sparkle-pulse 1.1s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex shrink-0 items-center border-b border-border px-lg" style={{ minHeight: 56 }}>
        <button
          type="button"
          onClick={onBack}
          className="mr-sm flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          aria-label="Back"
        >
          <Icon name="arrow_back" size={18} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-sm">
          <span className="truncate text-[15px] text-text-primary">{conv.name}</span>
          <Icon name={channelIcon(conv.channel)} size={15} className="shrink-0 text-text-tertiary" />
        </div>
      </div>

      {/* Thread body */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white px-[28px] py-lg">

        {/* Info banner */}
        <div className="mb-[20px] flex items-center gap-sm rounded-sm border border-[#bfdbfe] bg-[#eff6ff] px-md py-sm">
          <Icon name="info" size={14} className="shrink-0 text-[#2563eb]" />
          <p className="min-w-0 flex-1 text-[12px] leading-[18px] text-text-secondary">
            {simActive
              ? 'Simulating how this conversation would go with the new procedure'
              : 'The agent could not fully resolve this request. This conversation contributed to the recommendation.'}
          </p>
          <button
            type="button"
            onClick={() => setSimActive(v => !v)}
            className="flex w-fit shrink-0 items-center gap-[4px] text-[12px] text-text-action"
          >
            {simActive ? 'Hide simulation' : 'Simulate with the new procedure'}
          </button>
        </div>

        <p className="mb-[20px] text-center text-[13px] text-text-tertiary">{conv.date}</p>
        <p className="mb-[20px] text-center text-[13px] text-text-tertiary">
          {channelLabel} conversation started · {startTime}
        </p>

        {displayTurns.map((turn, i) => {
          const isDivergence = simActive && i === divergeTurnIdx

          const preVisible = !simActive || i < visibleCount
          const fadeClass = simActive && !isDivergence
            ? preVisible
              ? 'opacity-100 translate-y-0 transition-all duration-300'
              : 'opacity-0 translate-y-2 pointer-events-none'
            : ''

          if (turn.role === 'user') {
            return (
              <div key={i} className={`mb-[16px] flex max-w-[72%] flex-col gap-[6px] self-start ${fadeClass}`}>
                <div className="rounded-[18px] rounded-tl-[4px] bg-[#f1f3f4] px-[16px] py-[10px]">
                  <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
                </div>
                <div className="flex items-center gap-[6px]">
                  <span className="text-[12px] text-[#9aa0a6]">{turn.time}</span>
                  <Icon name="link" size={12} className="text-[#9aa0a6]" />
                </div>
              </div>
            )
          }

          if (isDivergence) {
            const beforeSettled = divPhase === 'improved'
            return (
              <div key={i} className="mb-[16px] flex max-w-[78%] flex-col items-end gap-[10px] self-end">
                {(divPhase === 'original' || divPhase === 'typing' || divPhase === 'improved') && (
                  <div
                    className="sim-msg-in flex flex-col items-end gap-[6px] transition-opacity duration-500 ease-out"
                    style={{ opacity: beforeSettled ? 0.5 : 1 }}
                  >
                    <span className="text-[11px] text-text-tertiary">Previous reply</span>
                    <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                      <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
                    </div>
                    <span className="text-[11px] text-[#9aa0a6]">{turn.time}</span>
                  </div>
                )}

                {divPhase === 'typing' && (
                  <div className="sim-msg-in rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[12px]">
                    <TypingDots />
                  </div>
                )}

                {divPhase === 'improved' && (
                  <>
                    <div className="sim-msg-in flex shrink-0 items-center gap-[6px] rounded-full bg-[#f9f7fd] px-[12px] py-[5px]">
                      <Icon name="auto_awesome" size={12} className="sim-sparkle-pulse text-ai-brand" />
                      <span className="text-[11px] text-ai-brand">Recommendation applied</span>
                    </div>
                    <div ref={afterCardRef} className="sim-msg-in flex flex-col items-end gap-[6px]">
                      <div className="sim-glow-pulse rounded-[18px]">
                        <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                          <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{improvedText}</p>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#9aa0a6]">{turn.time}</span>
                    </div>
                  </>
                )}
              </div>
            )
          }

          return (
            <div key={i} className={`mb-[16px] flex max-w-[72%] flex-col items-end gap-[6px] self-end ${fadeClass}`}>
              <div className="rounded-[18px] rounded-tr-[4px] bg-[#e8f0fe] px-[16px] py-[10px]">
                <p className="text-[15px] leading-[22px] text-[#1a1a1a]">{turn.text}</p>
              </div>
              <span className="text-[12px] text-[#9aa0a6]">{turn.time}</span>
            </div>
          )
        })}

        {(!simActive || divPhase === 'improved') && (
          <p className="mb-[20px] mt-[8px] text-center text-[13px] text-text-tertiary">
            {simActive
              ? 'With the new procedure, the conversation continues smoothly.'
              : `${conv.name} is inactive on ${channelLabel.toLowerCase()} · ${endTime}`}
          </p>
        )}

      </div>
    </div>
  )
}

/** Read-only replay of the real Inbox transcript a piece of human feedback was raised from —
 *  no feedback thumbs, no compose box, just what actually happened in the conversation. The
 *  message that was actually marked thumbs-down is flagged with a thumbs-down icon. */
function RealConversationThread({ flaggedMessageId, onClose }: { flaggedMessageId?: string; onClose: () => void }) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-border py-lg pl-[28px] pr-xl">
        <span className="text-h3 text-text-primary">Conversation with Annette Black</span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">
        {ANNETTE_BLACK_CHAT_EVENTS.map((event) => {
          if (event.kind === 'date') return <ChatSystemLabel key={event.id} text={event.label} />
          if (event.kind === 'status') {
            const label = event.time ? `${event.text} • ${event.time}` : event.text
            return <ChatSystemLabel key={event.id} text={label} />
          }
          const isAgent = event.sender === 'agent'
          const isFlagged = event.id === flaggedMessageId
          const bubbleText =
            event.fields && event.fields.length > 0 ? (
              <div className="flex flex-col gap-md">
                {event.fields.map((field) => (
                  <div key={field.label}>
                    <p className="m-0 text-small text-text-secondary">{field.label}</p>
                    <p className="m-0 text-body text-text-primary">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              event.text ?? ''
            )
          return (
            <ChatBubble
              key={event.id}
              sender={isAgent ? 'business' : 'user'}
              text={bubbleText}
              leadingIcon={isFlagged ? <Icon name="thumb_down" size={16} className="shrink-0 text-chip-danger-text" /> : undefined}
            >
              <span className="flex items-center gap-xs text-small text-text-tertiary">
                {!event.isBot && event.attribution ? `${event.attribution} • ` : ''}
                {event.time}
                {!isAgent && event.showLink && <Icon name="link" size={14} className="text-text-tertiary" />}
              </span>
            </ChatBubble>
          )
        })}
      </div>
    </>
  )
}

function ConversationsDrawer({ rec, open, onClose }: { rec: Recommendation; open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<ConversationItem | null>(null)

  if (!open) return null

  const handleClose = () => { setSelected(null); onClose() }
  const isRealFeedbackConversation =
    rec.source === 'feedback' && rec.sourceConversationId === ANNETTE_BLACK_CONVERSATION_ID

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/30" onClick={handleClose} aria-hidden />

      <div className="fixed bottom-0 right-0 top-0 z-[210] flex w-[650px] flex-col bg-surface shadow-modal">
        {isRealFeedbackConversation ? (
          <RealConversationThread flaggedMessageId={rec.sourceMessageId} onClose={handleClose} />
        ) : selected ? (
          <ConversationThread conv={selected} sim={rec.sim} onBack={() => setSelected(null)} />
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between py-lg pl-[28px] pr-xl">
              <span className="text-h3 text-text-primary">Conversations</span>
              <button
                type="button"
                onClick={handleClose}
                className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              {rec.conversations.map((c, i) => {
                const agentName = c.channel === 'Voice' ? 'Robin K.' : c.channel === 'Chat' ? 'Savannah A.' : 'Mia L.'
                const isUnread = i < 2
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(c)}
                    className="flex w-full items-start gap-sm py-[14px] pl-[28px] pr-xl text-left hover:bg-surface-hover"
                  >
                    <div className="mt-[6px] flex w-[10px] shrink-0 items-center justify-center">
                      {isUnread && <span className="size-[8px] rounded-full bg-primary" />}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <div className="flex items-baseline justify-between gap-sm">
                        <span className="truncate text-[15px] leading-[20px] text-[#3c3c3c]">
                          {c.name}
                        </span>
                        <span className="shrink-0 text-[13px] text-[#9aa0a6]">{c.date}</span>
                      </div>
                      <span className="truncate text-[13px] leading-[18px] text-[#5f6368]">
                        {agentName}: {c.message}
                      </span>
                      <div className="flex items-center gap-[4px] text-[12px] text-[#9aa0a6]">
                        <span>{c.location}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  )
}

// ── Detail body ────────────────────────────────────────────────────────────────

function StepsList({ steps }: { steps: ProcedureStep[] }) {
  return (
    <div className="flex flex-col gap-lg">
      {steps.map((step, i) => (
        <div key={i}>
          <p className="mb-xs text-body text-text-primary">
            {i + 1}. {step.title}
          </p>
          <ul className="flex flex-col pl-lg">
            {step.bullets.map((b, j) => (
              <li key={j} className="list-disc text-body text-text-primary marker:text-text-primary">
                {b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function CurrentProposedColumns({
  currentSteps,
  proposedSteps,
}: {
  currentSteps?: ProcedureStep[]
  proposedSteps: ProcedureStep[]
}) {
  const hasCurrent = Boolean(currentSteps && currentSteps.length > 0)
  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
      {/* Current version */}
      <div className="flex flex-col gap-md rounded-sm border border-border bg-surface p-lg">
        <div className="flex items-center gap-xs">
          <Icon name="history" size={16} className="text-text-icon" />
          <p className="text-body text-text-primary">Current version</p>
        </div>
        {hasCurrent ? (
          <StepsList steps={currentSteps!} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="text-body text-text-tertiary">No existing procedure — this is a new addition.</p>
          </div>
        )}
      </div>

      {/* Proposed version */}
      <div className="flex flex-col gap-md rounded-sm border border-accent-positive bg-chip-success-bg p-lg">
        <div className="flex items-center gap-xs">
          <Icon name="auto_awesome" size={16} className="text-accent-positive" />
          <p className="text-body text-text-primary">Proposed version</p>
        </div>
        <StepsList steps={proposedSteps} />
      </div>
    </div>
  )
}

function RecommendationWorkspaceSkeleton({ sectionCount = 1 }: { sectionCount?: number }) {
  const bar = (w: string, h = 'h-4', delay = 0) => (
    <div className={`${h} animate-pulse rounded-sm bg-surface-selected`} style={{ width: w, animationDelay: `${delay}ms` }} />
  )

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-xl py-xl">
      {/* Title + CTAs */}
      <div className="flex items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          {bar('280px', 'h-7')}
          {bar('70px', 'h-6', 60)}
        </div>
        <div className="flex items-center gap-sm">
          {bar('80px', 'h-9', 120)}
          {bar('100px', 'h-9', 180)}
        </div>
      </div>

      {/* AI banner */}
      <div className="flex flex-col gap-sm rounded-sm border border-border bg-surface-subtle px-lg py-md">
        {bar('95%', 'h-4', 0)}
        {bar('60%', 'h-4', 60)}
      </div>

      {/* Action needed */}
      <div className="flex flex-col gap-xs">
        {bar('100px', 'h-3')}
        {bar('70%', 'h-5', 60)}
      </div>

      {/* Per-type sections */}
      {Array.from({ length: sectionCount }).map((_, s) => (
        <div key={s} className="flex flex-col gap-md">
          <div className="flex items-center gap-xs">
            {bar('20px', 'h-5', s * 40)}
            {bar('160px', 'h-5', s * 40 + 20)}
          </div>
          {bar('80%', 'h-4', s * 40 + 40)}
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            {[0, 120].map((delay, i) => (
              <div key={i} className="flex flex-col gap-md rounded-sm border border-border bg-surface p-lg">
                {bar('140px', 'h-5', delay)}
                <div className="mt-sm flex flex-col gap-sm">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <React.Fragment key={j}>{bar(`${90 - j * 8}%`, 'h-4', delay + 100 + j * 40)}</React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Tools */}
      <div className="flex flex-col gap-xs">
        {bar('60px', 'h-3')}
        <div className="flex gap-sm">
          {bar('120px', 'h-8', 60)}
          {bar('140px', 'h-8', 120)}
        </div>
      </div>
    </div>
  )
}

function RecommendationDetailBody({
  rec,
  recStatus,
  onReject,
  onRequestAccept,
  onToast,
  onPreviewOpen,
  setConvsOpen,
  effectiveChanges,
  isThinking,
}: {
  rec: Recommendation
  recStatus: RecStatus
  onReject: (id: string) => void
  onRequestAccept: () => void
  onToast: (data: ToastData) => void
  onPreviewOpen: () => void
  setConvsOpen: (v: boolean) => void
  effectiveChanges: RecommendationChange[]
  isThinking: boolean
}) {
  const [applyOpen, setApplyOpen] = useState(false)

  if (isThinking) {
    return <RecommendationWorkspaceSkeleton sectionCount={effectiveChanges.length} />
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-xl py-xl">
      {/* Title + CTAs */}
      <div>
        <div className="flex items-center justify-between gap-md">
          <div className="flex min-w-0 flex-1 items-center gap-sm">
            <h2 className="min-w-0 truncate text-h2 text-text-primary">{rec.title}</h2>
            {recStatus === 'open' && <Chip label={rec.priority} variant={PRIORITY_VARIANT[rec.priority]} />}
            {recStatus === 'open' && rec.manualUpdates && rec.manualUpdates.length > 0 && (
              <Chip
                label={`${rec.manualUpdates.length} manual update${rec.manualUpdates.length > 1 ? 's' : ''} needed`}
                variant="warning"
              />
            )}
            {recStatus === 'accepted' && <Chip label="Accepted" variant="success" />}
            {recStatus === 'rejected' && <Chip label="Rejected" variant="danger" />}
          </div>
          <div className="flex shrink-0 items-center gap-sm">
            <button
              type="button"
              onClick={onPreviewOpen}
              className="flex h-9 items-center gap-xs rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              <Icon name="play_arrow" size={16} className="text-text-icon" />
              Test
            </button>
            {recStatus === 'accepted' ? (
              <button
                type="button"
                onClick={() => onToast({ message: `${rec.procedureTitle} successfully added to the library.` })}
                className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
              >
                Add to library
              </button>
            ) : (
              <div className="relative">
                <div className="flex h-9 overflow-hidden rounded-sm">
                  <button
                    className="flex h-9 items-center bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                    onClick={() => {
                      setApplyOpen(false)
                      onRequestAccept()
                    }}
                  >
                    Accept
                  </button>
                  <div className="w-px bg-white/30" />
                  <button
                    className="flex h-9 items-center bg-primary px-sm text-white transition-colors hover:bg-primary-hover"
                    onClick={() => setApplyOpen((v) => !v)}
                    aria-label="More apply options"
                  >
                    <Icon name="expand_more" size={16} />
                  </button>
                </div>
                {applyOpen && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setApplyOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[220px] rounded-sm border border-border bg-surface py-sm shadow-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onRequestAccept()
                        }}
                        className="block w-full px-lg py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Add to library
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApplyOpen(false)
                          onReject(rec.id)
                        }}
                        className="block w-full px-lg py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* What's the problem */}
        <p className="mt-lg text-small text-text-tertiary">What's the problem</p>
        <div className="mt-xs flex items-start gap-sm rounded-sm border border-[#b090e0] bg-[#f9f7fd] px-lg py-md">
          <Icon name="auto_awesome" size={14} className="mt-0.5 shrink-0 text-ai-brand" />
          <div className="flex min-w-0 flex-1 flex-col gap-xs">
            <p className="text-body text-text-secondary">{rec.rationale}</p>
            {rec.outcomes && rec.outcomes.length > 0 && (
              <ul className="flex flex-col gap-[4px] pl-md">
                {rec.outcomes.map((o, i) => (
                  <li key={i} className="list-disc text-body text-text-secondary marker:text-text-tertiary">
                    {o.includes(rec.procedureTitle) ? (
                      <>
                        {o.split(rec.procedureTitle)[0]}
                        <span className="text-text-primary">{rec.procedureTitle}</span>
                        {o.split(rec.procedureTitle)[1]}
                      </>
                    ) : (
                      o
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setConvsOpen(true)}
              className="flex w-fit items-center gap-xs text-small text-text-action"
            >
              <Icon name="chat_bubble_outline" size={13} />
              View {rec.conversationCount} conversations
              <Icon name="chevron_right" size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Action needed */}
      <div className="flex flex-col gap-xs">
        <p className="text-small text-text-tertiary">Action needed</p>
        <p className="text-body text-text-primary">{rec.changeType}</p>
      </div>

      {/* One section per change type (procedure / knowledge / action) */}
      {effectiveChanges.map((change) => (
        <div key={change.type} className="flex flex-col gap-md">
          <div className="flex items-center gap-xs">
            <Icon name={GAP_ICON[change.type]} size={18} className="text-text-icon" />
            <p className="text-h3 text-text-primary">{GAP_LABEL[change.type]} change</p>
          </div>
          <p className="text-body text-text-secondary">{change.description}</p>
          {change.type === 'procedure' && (
            <>
              <div className="flex flex-col gap-xs">
                <p className="text-small text-text-tertiary">Procedure title</p>
                <p className="text-body text-text-primary">{rec.procedureTitle}</p>
              </div>
              <div className="flex flex-col gap-xs">
                <p className="text-small text-text-tertiary">Context</p>
                <p className="text-body text-text-tertiary">No context added</p>
              </div>
            </>
          )}
          <CurrentProposedColumns currentSteps={change.currentSteps} proposedSteps={change.proposedSteps} />
        </div>
      ))}

      {/* Tools */}
      {rec.tools.length > 0 && (
        <div className="flex flex-col gap-xs">
          <p className="text-small text-text-primary">Tools</p>
          <div className="flex flex-wrap gap-sm">
            {rec.tools.map((t) => (
              <RefChip key={t.label} kind="tool" label={t.label} />
            ))}
          </div>
        </div>
      )}

      {/* Manual updates needed */}
      {recStatus === 'open' && rec.manualUpdates && rec.manualUpdates.length > 0 && (
        <div className="flex flex-col gap-md">
          <p className="text-small text-text-primary">Manual updates needed</p>
          <div className="flex items-start gap-sm rounded-sm border border-[#fde68a] bg-[#fffbeb] px-md py-sm">
            <Icon name="warning" size={14} className="mt-[2px] shrink-0 text-warning" />
            <p className="text-[12px] leading-[18px] text-text-secondary">
              Complete these steps to finish setting up this procedure. They require your input and can't be
              completed automatically.
            </p>
          </div>
          <div className="flex flex-col gap-md">
            {rec.manualUpdates.map((m, i) => (
              <div key={i} className="flex items-start gap-md">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-l2">
                  <Icon name={m.icon} size={16} className="text-text-icon" />
                </span>
                <div className="flex flex-col gap-[2px]">
                  <p className="text-body text-text-primary">{m.title}</p>
                  <p className="text-small text-text-secondary">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sticky copilot footer ─────────────────────────────────────────────────────

const ATTACHMENT_NAME = 'Callback policy.pdf'

function CopilotFooter({
  isThinking,
  onSubmit,
}: {
  isThinking: boolean
  onSubmit: (text: string, attachmentName?: string) => void
}) {
  const [copilotInput, setCopilotInput] = useState('')
  const [attached, setAttached] = useState(false)

  const handleSend = () => {
    const text = copilotInput.trim()
    if ((!text && !attached) || isThinking) return
    setCopilotInput('')
    setAttached(false)
    onSubmit(text || `Here's our callback policy document.`, attached ? ATTACHMENT_NAME : undefined)
  }

  return (
    <div className="shrink-0 bg-surface px-2xl py-md">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-sm">
        <div className="flex items-center gap-xs">
          <Icon name="auto_awesome" size={16} className="text-ai-brand" />
          <p className="text-body text-text-primary">Refine with copilot</p>
        </div>

        <div className="flex flex-col gap-sm rounded-sm border border-border-selected bg-surface p-sm focus-within:border-border-strong">
          {attached && (
            <div className="flex w-fit items-center gap-xs rounded-sm border border-border bg-surface-subtle px-sm py-xs">
              <Icon name="picture_as_pdf" size={16} className="shrink-0 text-chip-danger-text" />
              <span className="text-small text-text-primary">{ATTACHMENT_NAME}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setAttached(false)}
                className="flex size-4 shrink-0 items-center justify-center rounded-full text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-xs">
            <button
              type="button"
              aria-label="Attach a document"
              title="Wait for me to upload the documents"
              disabled={isThinking}
              onClick={() => setAttached((v) => !v)}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                attached ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-surface-hover'
              }`}
            >
              <Icon name="add" size={18} />
            </button>
            <textarea
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={isThinking}
              rows={1}
              placeholder='Ask for refinements — e.g. "Add a step to verify insurance before scheduling."'
              className="h-9 flex-1 resize-none bg-transparent py-0 pl-0 pr-sm leading-9 text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />
            <button
              type="button"
              aria-label="Send refinement"
              disabled={(!copilotInput.trim() && !attached) || isThinking}
              onClick={handleSend}
              className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                (copilotInput.trim() || attached) && !isThinking
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              <Icon name="send" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chat view ──────────────────────────────────────────────────────────────────

function ThinkingChecklist({ toolCount, conversationCount }: { toolCount: number; conversationCount: number }) {
  const subItems = [
    `Analyzing ${conversationCount} conversation${conversationCount === 1 ? '' : 's'}`,
    'Searching procedure library',
    'Reading agent config',
  ]
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = Array.from({ length: subItems.length + 1 }, (_, i) =>
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * 420),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-sm rounded-sm border border-border bg-surface p-lg">
      {visibleCount >= 1 && (
        <div className="chat-reveal-in flex items-center gap-xs text-body text-text-primary">
          <Icon name="check" size={14} className="shrink-0 text-accent-positive" />
          Gathering data from {toolCount} tool{toolCount === 1 ? '' : 's'}
        </div>
      )}
      <div className="flex flex-col gap-xs pl-lg">
        {subItems.map((item, i) =>
          visibleCount >= i + 2 ? (
            <div key={item} className="chat-reveal-in flex items-center gap-xs text-body text-text-secondary">
              <Icon name="check" size={14} className="shrink-0 text-accent-positive" />
              {item}
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}

function ThoughtsSection({
  thoughts,
  toolCount,
  conversationCount,
}: {
  thoughts: string
  toolCount: number
  conversationCount: number
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="flex flex-col gap-md">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-fit items-center gap-xs text-body text-text-secondary"
      >
        <Icon name="bolt" size={16} className="text-text-icon" />
        Thoughts
        <Icon name={expanded ? 'expand_less' : 'expand_more'} size={16} className="text-text-icon" />
      </button>
      {expanded && (
        <>
          <p className="text-body text-text-secondary">{thoughts}</p>
          <ThinkingChecklist toolCount={toolCount} conversationCount={conversationCount} />
        </>
      )}
    </div>
  )
}

function ChangeSummaryCard({
  change,
  procedureTitle,
  pending = false,
}: {
  change: RecommendationChange
  procedureTitle: string
  /** True while a manual action (e.g. an upload) that feeds this section is still unresolved —
   *  keeps the section visible, but honest that nothing's actually been added yet. */
  pending?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isAddition = !(change.currentSteps && change.currentSteps.length > 0)
  const count = change.proposedSteps.length
  const typeLabel = GAP_LABEL[change.type].toLowerCase()
  const pluralLabel = change.type === 'knowledge' ? 'knowledge items' : `${typeLabel}s`
  const summaryLabel = pending
    ? 'Pending — document required'
    : isAddition
      ? count > 1
        ? `${count} new ${pluralLabel} added`
        : `New ${typeLabel} added`
      : count > 1
        ? `${count} ${pluralLabel} updated`
        : `${GAP_LABEL[change.type]} updated`

  return (
    <div className="flex flex-col rounded-sm border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-lg py-md text-left"
      >
        <div className="flex min-w-0 items-center gap-sm">
          <Icon name={GAP_ICON[change.type]} size={18} className="shrink-0 text-text-icon" />
          <span className="truncate text-body text-text-primary">
            {GAP_LABEL[change.type]} {pending ? 'update needed' : isAddition ? 'added' : 'updated'}: {procedureTitle}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-xs">
          <span className={`text-body ${pending ? 'text-warning' : 'text-text-tertiary'}`}>{summaryLabel}</span>
          <Icon name={expanded ? 'expand_less' : 'chevron_right'} size={16} className="text-text-icon" />
        </div>
      </button>
      {expanded && (
        <div className="flex flex-col gap-lg border-t border-border p-lg">
          {change.type === 'procedure' && (
            <>
              <div className="flex flex-col gap-xs">
                <p className="text-small text-text-tertiary">Procedure title</p>
                <p className="text-body text-text-primary">{procedureTitle}</p>
              </div>
              <div className="flex flex-col gap-xs">
                <p className="text-small text-text-tertiary">Context</p>
                <p className="text-body text-text-tertiary">No context added</p>
              </div>
            </>
          )}
          {pending ? (
            <p className="text-body text-text-tertiary">
              We'll show the current and proposed version here once the required document is uploaded.
            </p>
          ) : (
            <CurrentProposedColumns currentSteps={change.currentSteps} proposedSteps={change.proposedSteps} />
          )}
        </div>
      )}
    </div>
  )
}

/** Finds a representative "agent said X, should have said Y" pair from the first sample
 *  conversation — reuses the same before/after transcript data the conversations drawer simulates with. */
function getMessageDiffPreview(rec: Recommendation): { original: string; revised: string } | null {
  // Human feedback tied to a real Inbox conversation we have a transcript for — pair the actual
  // flagged message against the answer the agent should have given once it has the document.
  if (rec.source === 'feedback' && rec.sourceConversationId === ANNETTE_BLACK_CONVERSATION_ID && rec.sourceMessageId) {
    const flagged = ANNETTE_BLACK_CHAT_EVENTS.find((e) => e.id === rec.sourceMessageId)
    if (flagged && flagged.kind === 'bubble' && flagged.text) {
      return { original: flagged.text, revised: ANNETTE_BLACK_IMPROVED_HOURS_REPLY }
    }
    return null
  }

  const conv = rec.conversations[0]
  if (!conv || !rec.sim) return null

  const allTurns = CONV_THREADS[conv.message] ?? []
  const improvedAgentTexts = rec.sim.after.filter((t) => t.role === 'agent').map((t) => t.text)

  let aIdx = 0
  for (const turn of allTurns) {
    if (turn.role === 'agent') {
      if (improvedAgentTexts[aIdx] && improvedAgentTexts[aIdx] !== turn.text) {
        return { original: turn.text, revised: improvedAgentTexts[aIdx] }
      }
      aIdx++
    }
  }
  return null
}

interface ChatTurn {
  id: string
  text: string
  attachment?: string
}

/** Turns a manual-update title into the question the copilot asks in Chat view, e.g.
 *  "Upload callback policy" -> "Can you upload your callback policy?" */
function questionFromManualUpdate(title: string): string {
  const [verb, ...rest] = title.split(' ')
  return `Can you ${verb.toLowerCase()} your ${rest.join(' ')}?`
}

/** One AI "answer" — thoughts, rationale, change cards, optionally the message diff and the
 *  final accept/keep-original decision — with its own progressive, ChatGPT-style reveal so each
 *  part of the response appears a beat after the last instead of landing on screen all at once. */
function ResponseBlock({
  thoughts,
  toolCount,
  conversationCount,
  bodyText,
  changes,
  procedureTitle,
  diff,
  outcomes,
  showAcceptPrompt,
  recStatus,
  onReject,
  onRequestAccept,
  recId,
  onOpenConversations,
  pendingManualUpdate,
  manualUpdateIndex,
  manualUpdateTotal,
  pendingChangeTypes,
}: {
  thoughts: string
  toolCount: number
  conversationCount: number
  bodyText: string
  changes: RecommendationChange[]
  procedureTitle: string
  diff: { original: string; revised: string } | null
  outcomes?: string[]
  showAcceptPrompt: boolean
  recStatus: RecStatus
  onReject: (id: string) => void
  /** Change types whose feeding manual action hasn't been resolved yet — their cards render in
   *  a pending state instead of claiming the change already happened. */
  pendingChangeTypes?: Set<GapType>
  onRequestAccept: () => void
  recId: string
  onOpenConversations?: () => void
  pendingManualUpdate?: ManualUpdate | null
  manualUpdateIndex?: number
  manualUpdateTotal?: number
}) {
  const changeStartIdx = 2 // 0 = thoughts, 1 = bodyText
  const diffIdx = changeStartIdx + changes.length
  const afterDiffIdx = diffIdx + (diff ? 1 : 0)
  const hasQuestion = Boolean(pendingManualUpdate)
  const hasOutcomes = showAcceptPrompt && Boolean(outcomes && outcomes.length > 0)
  const questionIdx = afterDiffIdx
  const outcomeIdx = afterDiffIdx
  const acceptIdx = outcomeIdx + (hasOutcomes ? 1 : 0)
  const totalSteps = hasQuestion
    ? questionIdx + 1
    : showAcceptPrompt
      ? acceptIdx + 1
      : afterDiffIdx

  const [revealStep, setRevealStep] = useState(0)

  useEffect(() => {
    setRevealStep(0)
    let cancelled = false
    let i = 0
    const scheduleNext = () => {
      // Thoughts' own checklist takes ~2s to finish revealing itself, so give it room before
      // the rest of the answer continues; steps after that land at a steady conversational pace.
      const delay = i === 0 ? 350 : i === 1 ? 2100 : 750
      setTimeout(() => {
        if (cancelled) return
        i++
        setRevealStep(i)
        if (i < totalSteps) scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-xl">
      {revealStep > 0 && (
        <div className="chat-reveal-in">
          <ThoughtsSection thoughts={thoughts} toolCount={toolCount} conversationCount={conversationCount} />
        </div>
      )}

      {revealStep > 0 && onOpenConversations && (
        <button
          type="button"
          onClick={onOpenConversations}
          className="chat-reveal-in flex w-fit items-center gap-xs text-small text-text-action"
        >
          <Icon name="chat_bubble_outline" size={13} />
          See conversations
        </button>
      )}

      {revealStep > 1 && <p className="chat-reveal-in text-body text-text-primary">{bodyText}</p>}

      {changes.map((change, i) =>
        revealStep > changeStartIdx + i ? (
          <div key={change.type} className="chat-reveal-in">
            <ChangeSummaryCard
              change={change}
              procedureTitle={procedureTitle}
              pending={pendingChangeTypes?.has(change.type)}
            />
          </div>
        ) : null,
      )}

      {diff && revealStep > diffIdx && (
        <div className="chat-reveal-in flex flex-col gap-md rounded-sm border border-border bg-surface p-lg">
          <div className="flex items-center gap-xs text-body text-text-primary">
            <Icon name="remove_circle" size={16} className="shrink-0 text-chip-danger-text" />
            Original message
          </div>
          <div className="rounded-lg bg-[#f0f0f0] px-md py-sm">
            <p className="text-body text-text-primary">{diff.original}</p>
          </div>
          <div className="flex items-center gap-xs text-body text-text-primary">
            <Icon name="check_circle" size={16} className="shrink-0 text-accent-positive" />
            Revised message
          </div>
          <div className="rounded-lg bg-[#dbeafe] px-md py-sm">
            <p className="text-body text-text-primary">{diff.revised}</p>
          </div>
        </div>
      )}

      {hasQuestion && pendingManualUpdate && revealStep > questionIdx && (
        <div className="chat-reveal-in flex flex-col gap-xs rounded-sm border border-[#fde68a] bg-[#fffbeb] p-lg">
          <p className="text-small text-text-tertiary">
            Before I can recommend accepting this
            {manualUpdateTotal && manualUpdateTotal > 1
              ? ` (question ${(manualUpdateIndex ?? 0) + 1} of ${manualUpdateTotal})`
              : ''}
            :
          </p>
          <div className="flex items-start gap-sm">
            <Icon name="warning" size={14} className="mt-0.5 shrink-0 text-warning" />
            <div className="flex flex-col gap-[2px]">
              <p className="text-body text-text-primary">{questionFromManualUpdate(pendingManualUpdate.title)}</p>
              <p className="text-small text-text-secondary">{pendingManualUpdate.description}</p>
            </div>
          </div>
        </div>
      )}

      {hasOutcomes && revealStep > outcomeIdx && (
        <div className="chat-reveal-in flex flex-col gap-xs rounded-sm border border-border bg-surface-subtle p-lg">
          <p className="text-body text-text-primary">If you accept, here's what to expect:</p>
          <ul className="flex flex-col gap-xs pl-md">
            {outcomes!.map((o, i) => (
              <li key={i} className="list-disc text-body text-text-secondary marker:text-text-tertiary">
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAcceptPrompt && revealStep > acceptIdx && (
        <div className="chat-reveal-in flex items-center justify-between gap-md rounded-sm border border-border bg-surface p-lg">
          {recStatus === 'open' ? (
            <>
              <p className="text-body text-text-primary">Do you accept this recommendation?</p>
              <div className="flex shrink-0 items-center gap-sm">
                <button
                  type="button"
                  onClick={() => onReject(recId)}
                  className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                >
                  Keep original
                </button>
                <button
                  type="button"
                  onClick={onRequestAccept}
                  className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
                >
                  Accept
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-sm">
              <Chip label={recStatus === 'accepted' ? 'Accepted' : 'Rejected'} variant={recStatus === 'accepted' ? 'success' : 'danger'} />
              <span className="text-body text-text-secondary">
                {recStatus === 'accepted' ? 'You accepted this recommendation.' : 'You kept the original — this recommendation was not applied.'}
              </span>
            </div>
          )}
        </div>
      )}

      {revealStep < totalSteps && (
        <div className="flex items-center px-md py-sm">
          <TypingDots />
        </div>
      )}
    </div>
  )
}

/** Shown for the most recent refinement turn while its update is still being computed. */
function RefinementThinking() {
  const items = ['Reviewing your request', 'Classifying the change', 'Updating the procedure']
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = items.map((_, i) => setTimeout(() => setVisibleCount(i + 1), (i + 1) * 580))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-xs rounded-sm border border-border bg-surface p-lg">
      {items.map((item, i) =>
        visibleCount >= i + 1 ? (
          <div key={item} className="chat-reveal-in flex items-center gap-xs text-body text-text-secondary">
            <Icon name="check" size={14} className="shrink-0 text-accent-positive" />
            {item}
          </div>
        ) : null,
      )}
      {visibleCount < items.length && <TypingDots />}
    </div>
  )
}

function RecommendationChatView({
  rec,
  recStatus,
  onReject,
  onRequestAccept,
  effectiveChanges,
  turns,
  isThinking,
  onOpenConversations,
}: {
  rec: Recommendation
  recStatus: RecStatus
  onReject: (id: string) => void
  onRequestAccept: () => void
  effectiveChanges: RecommendationChange[]
  turns: ChatTurn[]
  isThinking: boolean
  onOpenConversations: () => void
}) {
  const diff = getMessageDiffPreview(rec)
  const initialThoughts =
    rec.thoughts ??
    `I reviewed ${rec.conversationCount} related conversation${rec.conversationCount === 1 ? '' : 's'} flagged for this agent. Let me check the procedure library for coverage.`

  // Manual updates (e.g. "upload the callback policy") are asked one at a time in Chat view —
  // the Accept prompt is withheld until every one of them has been answered by a turn.
  const manualUpdates = rec.manualUpdates ?? []
  const totalManual = manualUpdates.length
  // Knowledge-gap message diffs are the pay-off for uploading the missing document — withhold
  // the Original/Revised preview until that specific manual update has been answered, instead of
  // showing it upfront before we actually "have" the document.
  const knowledgeManualIdx = manualUpdates.findIndex((m) => m.relatedType === 'knowledge')
  // Don't claim a section was already changed (e.g. "New knowledge added") while the manual
  // update feeding it is still outstanding — the section itself stays visible (so it's clear
  // there's a knowledge/procedure/action piece coming), just marked pending instead.
  const pendingChangeTypesAt = (resolvedCount: number) =>
    new Set(manualUpdates.slice(resolvedCount).map((m) => m.relatedType).filter((t): t is GapType => Boolean(t)))

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-xl py-xl">
      <style>{`
        @keyframes chat-reveal-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-reveal-in { animation: chat-reveal-in 0.35s ease-out forwards; }
        @keyframes sim-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <ResponseBlock
        key={`${rec.id}-initial`}
        thoughts={initialThoughts}
        toolCount={rec.tools.length}
        conversationCount={rec.conversationCount}
        bodyText={rec.rationale}
        changes={effectiveChanges}
        pendingChangeTypes={pendingChangeTypesAt(0)}
        procedureTitle={rec.procedureTitle}
        diff={knowledgeManualIdx === -1 ? diff : null}
        outcomes={rec.outcomes}
        showAcceptPrompt={turns.length === 0 && totalManual === 0}
        recStatus={recStatus}
        onReject={onReject}
        onRequestAccept={onRequestAccept}
        recId={rec.id}
        onOpenConversations={onOpenConversations}
        pendingManualUpdate={turns.length === 0 && totalManual > 0 ? manualUpdates[0] : null}
        manualUpdateIndex={0}
        manualUpdateTotal={totalManual}
      />

      {turns.map((turn, i) => {
        const isLastTurn = i === turns.length - 1
        const pending = isLastTurn && isThinking
        // Manual updates are answered strictly in order, one per turn — turn i answers
        // manualUpdates[i] (if it exists); once i has caught up to the total, every later turn
        // is a free-form refinement and the Accept prompt is unlocked.
        const resolvedAfterThisTurn = Math.min(i + 1, totalManual)
        const nextPendingIdx = resolvedAfterThisTurn
        const allResolved = resolvedAfterThisTurn >= totalManual
        return (
          <div key={turn.id} className="flex flex-col gap-xl">
            <ChatBubble sender="user" text={turn.text} bubbleClassName="max-w-[85%] px-md py-sm">
              {turn.attachment && (
                <div className="flex items-center gap-xs rounded-sm border border-border bg-surface px-sm py-xs">
                  <Icon name="picture_as_pdf" size={14} className="shrink-0 text-chip-danger-text" />
                  <span className="text-small text-text-secondary">{turn.attachment}</span>
                </div>
              )}
            </ChatBubble>
            {pending ? (
              <RefinementThinking />
            ) : (
              <ResponseBlock
                key={`${turn.id}-response`}
                thoughts={`You asked me to: "${turn.text}". Let me update the recommendation.`}
                toolCount={rec.tools.length}
                conversationCount={rec.conversationCount}
                bodyText="I've updated the recommendation to reflect your request — here's the current state of every section."
                changes={effectiveChanges}
                pendingChangeTypes={pendingChangeTypesAt(resolvedAfterThisTurn)}
                procedureTitle={rec.procedureTitle}
                diff={i === knowledgeManualIdx ? diff : null}
                outcomes={rec.outcomes}
                showAcceptPrompt={isLastTurn && allResolved}
                recStatus={recStatus}
                onReject={onReject}
                onRequestAccept={onRequestAccept}
                recId={rec.id}
                pendingManualUpdate={!allResolved ? manualUpdates[nextPendingIdx] : null}
                manualUpdateIndex={nextPendingIdx}
                manualUpdateTotal={totalManual}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function RecommendationDetailScreen({ recommendationId, onBack }: RecommendationDetailScreenProps) {
  const { feedbackRecommendations } = useFeedbackRecommendationsStore()
  const { overrides, submitRefinement, setRecommendationStatus, resetOverrides } = useRecommendationOverridesStore()
  const rec =
    [...RECOMMENDATIONS, ...feedbackRecommendations].find((r) => r.id === recommendationId) ?? RECOMMENDATIONS[0]

  // Multi-type recommendations carry `changes` directly; single-type ones fall back to their
  // legacy top-level fields so older data keeps working without a migration.
  const baseChanges: RecommendationChange[] = rec.changes ?? [
    {
      type: rec.gapType,
      description: rec.changeType,
      currentSteps: rec.originalSteps,
      proposedSteps: rec.steps,
    },
  ]
  const changeStepOverrides = overrides[rec.id]?.changeStepOverrides
  const effectiveChanges: RecommendationChange[] = baseChanges.map((c) => ({
    ...c,
    proposedSteps: changeStepOverrides?.[c.type] ?? c.proposedSteps,
  }))

  const [recStatus, setRecStatus] = useState<RecStatus>(() => overrides[rec.id]?.status ?? 'open')
  const [convsOpen, setConvsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [view, setView] = useState<'chat' | 'fixed'>('chat')
  // Chat view's back-and-forth is intentionally ephemeral — in-memory only, reset on refresh (or
  // when navigating to a different recommendation), never written to localStorage.
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([])
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    setChatTurns([])
  }, [rec.id])

  // As the Chat view's response streams in bit by bit, keep the page following it — unless the
  // user has scrolled up to read something earlier, in which case don't yank them back down.
  useEffect(() => {
    const container = chatScrollRef.current
    if (!container || view !== 'chat') return
    const content = container.firstElementChild
    if (!content) return

    stickToBottomRef.current = true

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      stickToBottomRef.current = distanceFromBottom < 120
    }
    container.addEventListener('scroll', handleScroll)

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        container.scrollTop = container.scrollHeight
      }
    })
    observer.observe(content)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [view, rec.id])

  const showToast = (data: ToastData) => {
    setToast(data)
    setTimeout(() => setToast(null), 5000)
  }

  const handleReject = (id: string) => {
    setRecStatus('rejected')
    setRecommendationStatus(id, 'rejected')
    showToast({ message: 'Recommendation rejected', variant: 'danger' })
  }

  const handleResetToOriginal = () => {
    resetOverrides(rec.id)
    setRecStatus('open')
    setChatTurns([])
    showToast({ message: 'Reset to the original recommendation.' })
  }

  // Manual updates are answered one per turn, in order — the turn at index `chatTurns.length`
  // (before this submission is added) answers `rec.manualUpdates[chatTurns.length]`, if one is
  // still pending, so its answer routes straight into the section it's meant to fix.
  const totalManual = rec.manualUpdates?.length ?? 0
  const pendingManualUpdate = chatTurns.length < totalManual ? rec.manualUpdates![chatTurns.length] : undefined

  const handleSubmitRefinement = (text: string, attachmentName?: string) => {
    setChatTurns((prev) => [...prev, { id: `turn-${prev.length + 1}-${Date.now()}`, text, attachment: attachmentName }])
    setIsThinking(true)
    const refinementText = attachmentName ? `Uploaded ${attachmentName}. ${text}` : text
    setTimeout(() => {
      submitRefinement(rec.id, effectiveChanges, refinementText, pendingManualUpdate?.relatedType)
      setIsThinking(false)
    }, 1800)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-sm border-b border-border px-2xl">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            aria-label="Back to recommendations"
            onClick={onBack}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <h1 className="min-w-0 truncate text-h3 text-text-primary">{rec.title}</h1>
          {rec.source === 'feedback' ? (
            <Icon name="thumb_down" size={16} className="shrink-0 text-chip-danger-text" />
          ) : (
            <Icon name="auto_awesome" size={16} className="shrink-0 text-ai-brand" />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-sm">
          {view === 'chat' && (
            <Chip
              label={recStatus === 'open' ? 'Open' : recStatus === 'accepted' ? 'Accepted' : 'Rejected'}
              variant={recStatus === 'accepted' ? 'success' : recStatus === 'rejected' ? 'danger' : 'neutral'}
            />
          )}
          <button
            type="button"
            aria-label="Reset to original"
            title="Reset to original"
            onClick={handleResetToOriginal}
            className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Icon name="restart_alt" size={18} />
          </button>
          <div className="flex h-9 shrink-0 items-center gap-[2px] rounded-sm border border-border-selected bg-surface p-[2px]">
            <button
              type="button"
              onClick={() => setView('chat')}
              className={`flex h-full items-center rounded-sm px-md text-body transition-colors ${
                view === 'chat' ? 'bg-surface-selected text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setView('fixed')}
              className={`flex h-full items-center rounded-sm px-md text-body transition-colors ${
                view === 'fixed' ? 'bg-surface-selected text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Fixed
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div ref={chatScrollRef} className="min-w-0 flex-1 overflow-y-auto px-2xl">
          {view === 'fixed' ? (
            <RecommendationDetailBody
              rec={rec}
              recStatus={recStatus}
              onReject={handleReject}
              onRequestAccept={() => setConfirmOpen(true)}
              onToast={showToast}
              onPreviewOpen={() => setPreviewOpen(true)}
              setConvsOpen={setConvsOpen}
              effectiveChanges={effectiveChanges}
              isThinking={isThinking}
            />
          ) : (
            <RecommendationChatView
              rec={rec}
              recStatus={recStatus}
              onReject={handleReject}
              onRequestAccept={() => setConfirmOpen(true)}
              effectiveChanges={effectiveChanges}
              turns={chatTurns}
              isThinking={isThinking}
              onOpenConversations={() => setConvsOpen(true)}
            />
          )}
        </div>

        {previewOpen && (
          <div className="preview-panel-float-wrap">
            <PreviewPanel
              onClose={() => setPreviewOpen(false)}
              onPreviewActiveChange={() => {}}
              agentName={rec.title}
            />
          </div>
        )}
      </div>

      <CopilotFooter isThinking={isThinking} onSubmit={handleSubmitRefinement} />

      <ConversationsDrawer rec={rec} open={convsOpen} onClose={() => setConvsOpen(false)} />

      {confirmOpen && (
        <ConfirmAddProcedureModal
          isNew={rec.isNew}
          procedureTitle={rec.procedureTitle}
          changeTypes={effectiveChanges.map((c) => c.type)}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            setRecStatus('accepted')
            setRecommendationStatus(rec.id, 'accepted')
            const singleType = effectiveChanges.length === 1 ? effectiveChanges[0].type : null
            const destination =
              singleType === 'knowledge'
                ? " to the agent's knowledge base"
                : singleType === 'action'
                  ? ' as an automated action'
                  : singleType === 'procedure'
                    ? ' to the procedure library'
                    : ''
            showToast({
              message: `${rec.procedureTitle} successfully ${rec.isNew ? 'added' : 'updated'}${destination}`,
            })
          }}
        />
      )}

      {toast && <Toast data={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
