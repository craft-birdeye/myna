import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../Icon/Icon'
import { SendIcon } from '../../assets/SendIcon'
import iconAgentsPurple from '../../assets/icon-agents-purple.svg'
import type { CreateChatTurn } from '../../data/createAgentChatStore'
import { AiBuilderPanelProps } from './AiBuilderPanel.types'
import { useAiBuilderTrail } from './useAiBuilderTrail'

const DEFAULT_SUGGESTIONS = [
  'Change reply tone',
  'Update escalation for negative reviews',
  'Adjust which sources to watch',
  'Add another location',
]

function suggestionsForAgent(agentName: string): string[] {
  const name = agentName.toLowerCase()
  if (/review generation/i.test(name)) {
    return [
      'Change request tone',
      'Update send timing',
      'Adjust who receives requests',
      'Add a follow-up nudge',
    ]
  }
  if (/reminder/i.test(name)) {
    return [
      'Change reminder timing',
      'Update email, text, or call channels',
      'Adjust confirmation follow-up',
      'Skip reminders for certain visits',
    ]
  }
  if (/front desk/i.test(name)) {
    return [
      'Update call routing',
      'Change the greeting',
      'Add a booking rule',
      'Escalate more intents to a human',
    ]
  }
  if (/review response/i.test(name)) {
    return DEFAULT_SUGGESTIONS
  }
  return [
    'Update a workflow step',
    'Change a trigger condition',
    'Add a task or procedure',
    'Adjust escalation rules',
  ]
}

/** Same sparkle glyph as the full-page create chat (non-spinning in the trail). */
function TrailSparkle({ size = 14 }: { size?: number }) {
  const gradId = useId().replace(/:/g, '')
  return (
    <span className="sparkle-loader" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <defs>
          <linearGradient id={gradId} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6cf0" />
            <stop offset="55%" stopColor="#6834b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
          fill={`url(#${gradId})`}
        />
      </svg>
    </span>
  )
}

/** Mirrors CreateAgentThinkingPanel chrome (bolt + Thoughts + vertical rule). */
function TrailThoughts({
  text,
  label = 'Thoughts',
  defaultOpen = false,
}: {
  text: string
  label?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const lines = text.split('\n')

  return (
    <div className="mt-3xl flex flex-col gap-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="group flex items-center gap-sm text-left"
      >
        <Icon name="bolt" size={18} className="shrink-0 text-text-icon" />
        <span className="text-body text-text-secondary transition-colors group-hover:text-text-primary">
          {label}
        </span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={18}
          className="shrink-0 text-text-icon transition-colors group-hover:text-text-primary"
        />
      </button>
      <div
        className={`overflow-hidden transition-[max-height,opacity,margin] duration-200 ${
          open ? 'mt-sm max-h-[2400px] opacity-100' : 'mt-0 max-h-0 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="ml-[9px] border-l border-border pl-lg text-body leading-6 text-text-tertiary">
          {lines.map((line, i) => {
            if (line.startsWith('•')) {
              const bullet = line.slice(1).trimStart()
              return (
                <div key={i} className="flex items-start gap-sm">
                  <span className="shrink-0 text-[18px] leading-6" aria-hidden>
                    •
                  </span>
                  <span className="min-w-0 flex-1">{bullet}</span>
                </div>
              )
            }
            if (line === '') {
              return <div key={i} className="h-md" />
            }
            return (
              <p key={i} className="m-0 whitespace-pre-wrap">
                {line}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TrailUserBubble({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return (
    <div className={`flex justify-end ${first ? 'pt-md' : 'mt-[36px]'}`}>
      <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-primary whitespace-pre-wrap">
        {children}
      </span>
    </div>
  )
}

function TrailAgentReply({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mt-3xl flex gap-sm">
      <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-summary">
        <TrailSparkle size={14} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-md text-body leading-6 text-text-primary">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="m-0 whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function TrailDraftCard({ title, description }: { title: string; description: string }) {
  const readyLabel = /review response/i.test(title)
    ? 'Review response agent draft is ready'
    : /review generation/i.test(title)
      ? 'Review generation agent draft is ready'
      : /front desk/i.test(title)
        ? 'Front desk agent draft is ready'
        : /reminder/i.test(title)
          ? 'Reminder agent draft is ready'
          : `${title.replace(/^New\s+/i, '')} draft is ready`

  return (
    <div className="mt-3xl flex flex-col gap-md">
      <p className="m-0 text-body leading-6 text-text-primary">{readyLabel}</p>
      <div className="rounded-md border border-border bg-surface p-lg">
        <div className="flex items-start gap-sm">
          <Icon name="account_tree" size={20} className="mt-px shrink-0 text-text-icon" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-sm">
              <span className="text-body text-text-primary">{title}</span>
              <span className="inline-flex h-6 shrink-0 items-center rounded-sm bg-surface-selected px-sm text-small text-text-secondary">
                Draft
              </span>
            </div>
            {description ? (
              <p className="mt-xs text-body text-text-secondary">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function TrailMessages({ trail }: { trail: CreateChatTurn[] }) {
  let seenUser = false

  return (
    <div className="flex w-full flex-col pb-md">
      {trail.map((turn, i) => {
        if (turn.kind === 'user') {
          const first = !seenUser
          seenUser = true
          return (
            <TrailUserBubble key={i} first={first}>
              {turn.text}
            </TrailUserBubble>
          )
        }
        if (turn.kind === 'user-files') {
          return (
            <div key={i} className="mt-[36px] flex justify-end">
              <span className="max-w-[80%] rounded-lg bg-surface-hover px-md py-sm text-body leading-[1.5] text-text-secondary">
                {(turn.labels || []).join(', ')}
              </span>
            </div>
          )
        }
        if (turn.kind === 'thoughts') {
          return (
            <TrailThoughts
              key={i}
              text={turn.text}
              label={turn.label || 'Thoughts'}
              defaultOpen={false}
            />
          )
        }
        if (turn.kind === 'agent') {
          return <TrailAgentReply key={i} paragraphs={turn.paragraphs || []} />
        }
        if (turn.kind === 'draft') {
          return (
            <TrailDraftCard
              key={i}
              title={turn.title}
              description={turn.description}
            />
          )
        }
        if (turn.kind === 'status') {
          return (
            <p key={i} className="mt-3xl m-0 text-center text-small text-text-tertiary">
              {turn.text}
            </p>
          )
        }
        return null
      })}
    </div>
  )
}

export function AiBuilderPanel({
  onClose,
  onExpand,
  agentName = 'agent',
  suggestions,
  onSend,
  className = '',
  fillShell = false,
  side = 'right',
}: AiBuilderPanelProps) {
  const [draft, setDraft] = useState('')
  const { trail, send, hasMessages } = useAiBuilderTrail(agentName)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canSend = draft.trim().length > 0
  const resolvedSuggestions = suggestions ?? suggestionsForAgent(agentName)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [trail.length])

  const handleSend = (text?: string) => {
    const value = (text ?? draft).trim()
    if (!value) return
    send(value)
    onSend?.(value)
    setDraft('')
  }

  return (
    <aside
      className={`flex h-full ${fillShell ? 'w-full' : 'w-[392px]'} shrink-0 flex-col bg-surface shadow-modal ${
        side === 'left' ? 'rounded-tr-xl border-r border-border' : 'rounded-tl-xl border-l border-border'
      } ${className}`.trim()}
    >
      <div className="flex shrink-0 items-center gap-sm bg-gradient-to-r from-violet-600 to-blue-500 px-lg py-md">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/15">
          <span
            className="size-5 shrink-0 bg-white"
            aria-hidden="true"
            style={{
              maskImage: `url("${iconAgentsPurple}")`,
              WebkitMaskImage: `url("${iconAgentsPurple}")`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-body text-white">Create with AI</p>
        </div>
        {onExpand && (
          <button
            type="button"
            aria-label="Expand Create with AI"
            onClick={onExpand}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <Icon name="open_in_full" size={18} />
          </button>
        )}
        <button
          type="button"
          aria-label="Close Create with AI"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-auto px-lg py-2xl"
      >
        <div className={`flex w-full flex-col ${hasMessages ? '' : 'mt-auto gap-lg'}`}>
          {!hasMessages && (
            <div className="flex flex-col items-center gap-xs text-center">
              <span
                className="ai-gradient-icon size-8"
                aria-hidden="true"
                style={{
                  maskImage: `url("${iconAgentsPurple}")`,
                  WebkitMaskImage: `url("${iconAgentsPurple}")`,
                }}
              />
              <p className="m-0 text-[14px] leading-6 text-text-secondary">
                Hi! I&apos;m here to help you. Tell me what you&apos;d like to do
              </p>
            </div>
          )}

          {hasMessages && <TrailMessages trail={trail} />}

          {!hasMessages && resolvedSuggestions.length > 0 && (
            <div className="flex w-full flex-col items-start gap-sm">
              {resolvedSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="flex h-8 items-center rounded-sm border border-border-selected bg-surface px-[10px] text-left text-[14px] leading-6 text-text-primary hover:bg-surface-l2"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-sm pb-sm">
        <div className="flex min-h-[156px] flex-col rounded-xl border border-border bg-surface px-lg py-lg">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={2}
            placeholder="What would you like to build? For example: Review response agent replying autonomously."
            className="min-h-0 flex-1 resize-none bg-transparent text-[14px] leading-6 text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <div className="mt-md flex items-center justify-between">
            <div className="flex items-center gap-md">
              <button
                type="button"
                aria-label="Add"
                className="flex size-7 items-center justify-center rounded-sm text-text-primary transition-colors hover:bg-surface-hover"
              >
                <Icon name="add" size={20} />
              </button>
              <button
                type="button"
                aria-label="Voice input"
                className="flex size-7 items-center justify-center rounded-sm text-text-primary transition-colors hover:bg-surface-hover"
              >
                <Icon name="mic_none" size={18} />
              </button>
            </div>
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={() => handleSend()}
              className={`flex size-9 shrink-0 items-center justify-center rounded-sm transition-colors ${
                canSend ? 'text-text-action hover:bg-surface-hover' : 'cursor-not-allowed text-text-tertiary'
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
