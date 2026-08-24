import { Fragment, useState, type ReactNode } from 'react'
import { useFeedbackRecommendationsStore } from '../../data/FeedbackRecommendationsStoreContext'
import { REMINDER_CONVERSATION_EVENTS } from '../../data/reminderInboxConversation'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import type { MessageFeedbackValue } from '../ChatBubble/ChatBubble.types'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { ShareFeedbackModal } from '../ShareFeedbackModal/ShareFeedbackModal'
import { Tabs } from '../Tabs/Tabs'
import { Toast } from '../Toast/Toast'
import { Tooltip } from '../Tooltip/Tooltip'
import type {
  RunConversationEntry,
  RunDetailsPanelProps,
  RunLogField,
  RunLogStep,
} from './RunDetailsPanel.types'

/** Explains each meta-line abbreviation on hover — LLM/TTS/KB (business bubbles) and STT (user
 *  bubbles), all part of the same transcript-metrics family. */
const META_LABEL_TOOLTIPS: Record<string, string> = {
  LLM: 'Large language model',
  TTS: 'Text to speech',
  STT: 'Speech to text',
  KB: 'Knowledge base',
}

function MetaLabel({ label }: { label: string }) {
  return (
    <Tooltip content={META_LABEL_TOOLTIPS[label]} variant="brief">
      <span className="cursor-default">{label}</span>
    </Tooltip>
  )
}

/** Node-type icon + colour, matched to the canvas node-card glyphs. Shared with `TestRunPanel`. */
export const TYPE_META: Record<RunLogStep['type'], { icon: string; colorClass: string; label: string }> = {
  trigger: { icon: 'bolt', colorClass: 'text-[#C2410C]', label: 'Trigger' },
  task: { icon: 'list_alt', colorClass: 'text-[#37A248]', label: 'Action' },
  delay: { icon: 'schedule', colorClass: 'text-text-icon', label: 'Delay' },
  branch: { icon: 'account_tree', colorClass: 'text-[#5071CE]', label: 'Branch' },
  procedures: { icon: 'menu_book', colorClass: 'text-[#37A248]', label: 'Procedures' },
}

const DEFAULT_STEPS: RunLogStep[] = [
  {
    id: 'step-1',
    type: 'trigger',
    stepNumber: 1,
    title: 'Appointment is booked',
    output: [
      { key: 'Source', value: 'Email' },
      { key: 'Comments', value: 'Patient called reporting tooth pain and mild swelling scheduled appointment' },
      {
        key: 'Scheduled appointment',
        properties: [
          { key: 'Name', value: 'Sarah Jones' },
          {
            key: 'Contact',
            properties: [
              { key: 'Email', value: 'Sarah Jones@birdeye.com' },
              { key: 'Phone', value: '+1(555)010-1234' },
            ],
          },
        ],
      },
    ],
    inputs: [
      { key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' },
      { key: 'appointmentType', value: 'Routine checkup' },
    ],
  },
  {
    id: 'step-2',
    type: 'task',
    stepNumber: 2,
    title: 'Send scheduled reminders',
    output: [
      { key: 'Source', value: 'Email' },
      { key: 'Summary', value: 'Email reminder sent' },
      { key: 'Status', value: 'Confirmed' },
    ],
    inputs: [
      { key: 'reminderOffset', value: '4 weeks before appointment' },
      { key: 'channel', value: 'Email' },
    ],
  },
  {
    id: 'step-3',
    type: 'task',
    stepNumber: 3,
    title: 'Schedule appointment reminder',
    output: [
      { key: 'Source', value: 'Email' },
      { key: 'Summary', value: 'Email reminder sent' },
      { key: 'Status', value: 'Confirmed' },
    ],
    inputs: [
      { key: 'reminderOffset', value: '2 weeks before appointment' },
      { key: 'channel', value: 'Email' },
    ],
  },
  {
    id: 'step-4',
    type: 'delay',
    stepNumber: 4,
    title: 'Delay until 2 days before appointment date and time',
    note: 'Delay completed',
  },
  {
    id: 'step-5',
    type: 'branch',
    stepNumber: 5,
    title: 'Based on conditions',
    outputLabel: 'Branch output',
    output: [{ key: 'Status', value: 'Unconfirmed' }],
    inputs: [{ key: 'confirmationWindow', value: '48 hours' }],
  },
  {
    id: 'step-6',
    type: 'task',
    stepNumber: 6,
    title: 'Initiate voice call',
    output: [
      { key: 'Source', value: 'Voice call' },
      { key: 'Summary', value: 'User confirmed the appointment booking' },
      { key: 'Comments', value: 'Additional question about  insurance  coverage' },
      { key: 'Call routed to', value: 'Front desk agent' },
      { key: 'Procedure used', value: 'Insurance claims' },
    ],
    tool: {
      name: 'Initiate voice call',
      properties: [
        { key: 'phoneNumber', value: '+1(555)010-1234' },
        { key: 'callerId', value: 'Rock Dental Brands' },
        { key: 'voice', value: 'Myna' },
      ],
    },
    inputs: [{ key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' }],
  },
]

const DEFAULT_CONVERSATION: RunConversationEntry[] = REMINDER_CONVERSATION_EVENTS

function FieldRow({ fieldKey, value }: { fieldKey: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-sm text-small">
      <RefChip kind="context" label={fieldKey} />
      <span className="min-w-0 break-words text-text-primary">{value}</span>
    </div>
  )
}

function NestedFieldBlock({ field }: { field: RunLogField }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs text-left text-small"
      >
        <Icon name={open ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0 text-text-tertiary" />
        <RefChip kind="context" label={field.key} />
        <span className="text-text-tertiary">{`{ ${field.properties?.length ?? 0} properties }`}</span>
      </button>
      {open && (
        <div className="ml-sm mt-xs flex flex-col gap-xs border-l border-border pl-sm">
          {field.properties?.map((p) =>
            p.properties ? (
              <NestedFieldBlock key={p.key} field={p} />
            ) : (
              <FieldRow key={p.key} fieldKey={p.key} value={p.value ?? ''} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

/** `{}`-chip keyed field tree (nested objects collapse). Shared with `TestRunPanel`. */
export function FieldList({ fields }: { fields: RunLogField[] }) {
  return (
    <div className="flex flex-col gap-xs">
      {fields.map((f) =>
        f.properties ? <NestedFieldBlock key={f.key} field={f} /> : <FieldRow key={f.key} fieldKey={f.key} value={f.value ?? ''} />,
      )}
    </div>
  )
}

function RunLogStepRow({ step }: { step: RunLogStep }) {
  const [outputOpen, setOutputOpen] = useState(true)
  const [inputsOpen, setInputsOpen] = useState(false)
  const [toolOpen, setToolOpen] = useState(false)
  const meta = TYPE_META[step.type]
  const outputLabel =
    step.outputLabel ??
    (step.type === 'trigger'
      ? 'Trigger output'
      : step.type === 'procedures'
        ? 'Procedure output'
        : step.type === 'branch'
          ? 'Branch output'
          : 'Action output')

  return (
    <div className="relative flex gap-md">
      <div className="absolute bottom-0 left-[9px] top-[24px] w-px bg-border" aria-hidden />
      <Icon name="check_circle" size={20} fill className="relative z-10 mt-[2px] shrink-0 text-accent-positive" />
      <div className="min-w-0 flex-1 pb-2xl">
        <div className="flex items-center gap-xs text-small text-text-tertiary">
          <Icon name={meta.icon} size={16} className={`shrink-0 ${meta.colorClass}`} />
          {meta.label}
        </div>
        <p className="mt-xs text-body text-text-primary">
          {step.stepNumber}. {step.title}
        </p>

        {step.note ? (
          <p className="mt-sm text-small text-text-tertiary">{step.note}</p>
        ) : (
          <div className="mt-sm flex flex-col gap-sm">
            {step.output && (
              <div>
                <button
                  type="button"
                  onClick={() => setOutputOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={outputOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  {outputLabel}
                </button>
                {outputOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.output} />
                  </div>
                )}
              </div>
            )}

            {step.tool && (
              <div>
                <button
                  type="button"
                  onClick={() => setToolOpen((v) => !v)}
                  className="flex min-w-0 items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={toolOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  <span className="truncate">{`Tool : ${step.tool.name}`}</span>
                  <span className="shrink-0 text-text-tertiary">{`{ ${step.tool.properties.length} properties }`}</span>
                </button>
                {toolOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.tool.properties} />
                  </div>
                )}
              </div>
            )}

            {step.inputs && (
              <div>
                <button
                  type="button"
                  onClick={() => setInputsOpen((v) => !v)}
                  className="flex items-center gap-xs text-left text-small text-text-action"
                >
                  <Icon name={inputsOpen ? 'expand_more' : 'chevron_right'} size={16} className="shrink-0" />
                  View inputs
                </button>
                {inputsOpen && (
                  <div className="ml-sm mt-xs">
                    <FieldList fields={step.inputs} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LogsTab({ steps }: { steps: RunLogStep[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step) => (
        <RunLogStepRow key={step.id} step={step} />
      ))}
      <div className="flex items-center gap-md">
        <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
        <span className="text-small text-text-tertiary">Completed</span>
      </div>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="m-0 text-small text-text-tertiary">{label}</p>
      <p className="m-0 mt-xs text-small text-text-primary">{value}</p>
    </div>
  )
}

function CallDetailsTab({
  callerNumber,
  languageDetected,
  duration,
  sidNumber,
  startTime,
  callEndReason,
  routedVia,
}: NonNullable<RunDetailsPanelProps['callDetails']>) {
  return (
    <div className="grid grid-cols-2 gap-x-lg gap-y-md">
      <MetaField label="Caller number" value={callerNumber} />
      <MetaField label="Language detected" value={languageDetected} />
      <MetaField label="Duration" value={duration} />
      <MetaField label="Call SID" value={sidNumber} />
      <MetaField label="Start time" value={startTime} />
      <MetaField label="Call end reason" value={callEndReason} />
      <MetaField label="Routed via" value={routedVia} />
    </div>
  )
}

export function parseUserRatingValue(rating: string): string {
  const ofMatch = rating.match(/^(\d+(?:\.\d+)?)\s+of\s+\d+/i)
  if (ofMatch) return ofMatch[1]
  return rating.trim()
}

/** Maps a log run status to a user-rating string for call details. */
export function getUserRatingForLogStatus(status: string): string | undefined {
  if (status === 'Complete' || status === 'Resolved') return '4 of 5'
  if (status === 'Not resolved') return '2.5 of 5'
  if (status === 'Failed') return '2 of 5'
  return undefined
}

/** Compact rating — numeric value + filled star in a subtle rounded chip. */
export function UserRatingDisplay({ rating }: { rating: string }) {
  const value = parseUserRatingValue(rating)
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-xs rounded-sm bg-surface-muted px-xs">
      <span className="text-small text-text-secondary">{value}</span>
      <Icon name="star" size={12} fill className="text-rating-star" />
    </span>
  )
}

/** First section on the Conversation tab — collapsed by default; arrow toggles the fields. */
export function CollapsibleCallDetails({
  children,
  userRating,
}: {
  children: ReactNode
  userRating?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-lg shrink-0 rounded-sm border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-sm px-lg py-sm text-left"
      >
        <span className="flex min-w-0 flex-1 items-center gap-sm">
          <span className="text-[13px] tracking-[-0.26px] text-[#555]">Call details</span>
          {userRating ? <UserRatingDisplay rating={userRating} /> : null}
        </span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={20}
          className="shrink-0 text-text-icon"
        />
      </button>
      {open && <div className="px-lg pb-md">{children}</div>}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function ConversationCard({ entry }: { entry: Extract<RunConversationEntry, { kind: 'card' }> }) {
  const isBusiness = entry.tone === 'business'
  const hasDivider = Boolean(entry.contactName || entry.fields?.length || entry.body || entry.actionLabel)

  return (
    <div className={`flex flex-col gap-xs ${isBusiness ? 'items-end' : 'items-start'}`}>
      <div
        className={`w-full rounded-lg px-lg py-md ${isBusiness ? 'max-w-[85%] bg-[#dbeafe]' : 'max-w-[260px] bg-[#f5f5f5]'}`}
      >
        <div className="flex items-center gap-xs">
          <Icon name={entry.icon} size={18} className="shrink-0 text-text-primary" />
          <span className="text-body text-text-primary">{entry.title}</span>
        </div>

        {hasDivider && <div className="my-sm border-t border-dashed border-border-strong" />}

        {entry.contactName && (
          <div className="flex items-center gap-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-small text-text-primary">
              {initials(entry.contactName)}
            </div>
            <div>
              <p className="m-0 text-body text-text-primary">{entry.contactName}</p>
              {entry.contactType && <p className="m-0 text-small text-text-tertiary">{entry.contactType}</p>}
            </div>
          </div>
        )}

        {entry.fields?.map((f) => (
          <div key={f.label} className="mt-sm">
            <p className="m-0 text-small text-text-tertiary">{f.label}</p>
            <p className="m-0 text-body text-text-primary">{f.value}</p>
          </div>
        ))}

        {entry.body && <p className="m-0 whitespace-pre-line text-body leading-[1.6] text-text-primary">{entry.body}</p>}

        {entry.actionLabel && <p className="m-0 text-body text-text-secondary">{entry.actionLabel}</p>}
      </div>
      {entry.time && <span className="text-small text-text-tertiary">{entry.time}</span>}
    </div>
  )
}

export interface RunConversationThreadProps {
  entries: RunConversationEntry[]
  /** 'diagnostics' (default, run logs) shows LLM/TTS/STT meta; 'time' (inbox) shows timestamps + feedback on agent bubbles. */
  meta?: 'diagnostics' | 'time'
  feedbackForMessage?: (id: string) => MessageFeedbackValue
  onFeedbackChange?: (id: string, value: MessageFeedbackValue) => void
  /** Renders a sticky call-recording waveform right after whichever system entry has
   *  `insertCallRecordingAfter` set. Default false — Inbox's reuse of this thread doesn't set it. */
  showCallRecording?: boolean
  audioUrl?: string
  durationSecs?: number
  /** 'diagnostics'-mode only — maps a business message id to the recommendation id its feedback
   *  landed on, once known. Switches that bubble's "Coach agent" link to "Track your feedback". */
  recIdByMessage?: Record<string, string>
  /** 'diagnostics'-mode only — opens the Share-feedback flow for this message. */
  onCoachAgent?: (messageId: string) => void
  /** 'diagnostics'-mode only — navigates to the recommendation this message's feedback landed on. */
  onTrackFeedback?: (recId: string) => void
}

/** Diagnostics-mode meta line — "LLM : X • TTS : Y", each label wrapped in an explanatory
 *  tooltip. Only used in 'diagnostics' mode (run logs); 'time' mode (Inbox) is unaffected. */
function DiagnosticsMeta({ entry }: { entry: Extract<RunConversationEntry, { kind: 'message' }> }) {
  if (entry.sender === 'business') {
    if (!entry.llmResponseTime && !entry.tts) return null
    return (
      <span className="text-small text-text-tertiary">
        {entry.llmResponseTime && (
          <>
            <MetaLabel label="LLM" /> {`: ${entry.llmResponseTime}`}
          </>
        )}
        {entry.llmResponseTime && entry.tts && ' • '}
        {entry.tts && (
          <>
            <MetaLabel label="TTS" /> {`: ${entry.tts}`}
          </>
        )}
        {entry.time && ` • ${entry.time}`}
      </span>
    )
  }

  if (!entry.sttLabel) return null
  return (
    <span className="text-small text-text-tertiary">
      <MetaLabel label="STT" /> {`: ${entry.sttLabel}`}
      {entry.time && ` • ${entry.time}`}
    </span>
  )
}

/** Collapsible "Call transcript" block — wraps translation control + bubbles on voice-call logs. */
export function CallTranscriptSection({
  children,
  defaultOpen = true,
}: {
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-xs text-left"
      >
        <span className="min-w-0 flex-1 text-body text-text-primary">Call transcript</span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={20}
          className="shrink-0 text-text-icon"
        />
      </button>
      {open && <div className="mt-sm flex flex-col gap-lg">{children}</div>}
    </div>
  )
}

function callTranscriptSplitIndex(entries: RunConversationEntry[], showCallRecording: boolean): number {
  if (!showCallRecording) return -1
  const recordingIdx = entries.findIndex(
    (entry) => entry.kind === 'system' && entry.insertCallRecordingAfter,
  )
  if (recordingIdx >= 0) {
    const messageIdx = entries.findIndex((entry, index) => index > recordingIdx && entry.kind === 'message')
    return messageIdx
  }
  return entries.findIndex((entry) => entry.kind === 'message')
}

/** Renders a run conversation thread (system labels, email cards, voice bubbles). Reused by the Inbox deep-link view. */
export function RunConversationThread({
  entries,
  meta = 'diagnostics',
  feedbackForMessage,
  onFeedbackChange,
  showCallRecording = false,
  audioUrl,
  durationSecs,
  recIdByMessage,
  onCoachAgent,
  onTrackFeedback,
}: RunConversationThreadProps) {
  const transcriptStartIdx = callTranscriptSplitIndex(entries, showCallRecording)
  const useCallTranscriptSection = transcriptStartIdx >= 0
  const leadEntries = useCallTranscriptSection ? entries.slice(0, transcriptStartIdx) : entries
  const transcriptEntries = useCallTranscriptSection ? entries.slice(transcriptStartIdx) : []

  const renderEntry = (entry: RunConversationEntry, index: number, padTopWhenFirst: boolean) => {
    if (entry.kind === 'system') {
      return (
        <Fragment key={entry.id}>
          <div className={padTopWhenFirst && index === 0 ? 'pt-lg' : undefined}>
            <ChatSystemLabel text={entry.text} />
          </div>
          {showCallRecording && entry.insertCallRecordingAfter && (
            <div className="sticky top-0 z-10 bg-surface pb-sm pt-sm">
              <div className="border border-transparent px-lg">
                <p className="m-0 mb-sm text-[13px] tracking-[-0.26px] text-[#555]">
                  Call recording
                </p>
                <CallRecordingPlayer
                  audioUrl={audioUrl}
                  durationSecs={durationSecs}
                  padded={false}
                />
              </div>
            </div>
          )}
        </Fragment>
      )
    }

    if (entry.kind === 'card') {
      return (
        <div key={entry.id} className={padTopWhenFirst && index === 0 ? 'pt-lg' : undefined}>
          <ConversationCard entry={entry} />
        </div>
      )
    }

    const withFeedback = meta === 'time' && entry.sender === 'business'
    const withCoachAgent = meta === 'diagnostics' && entry.sender === 'business' && Boolean(onCoachAgent)
    const recId = withCoachAgent ? recIdByMessage?.[entry.id] : undefined

    return (
      <div key={entry.id} className={padTopWhenFirst && index === 0 ? 'pt-lg' : undefined}>
        <ChatBubble
          sender={entry.sender}
          text={entry.text}
          gap="gap-sm"
          bubbleClassName="max-w-[85%] px-lg py-md"
          showFeedback={withFeedback}
          feedback={withFeedback ? feedbackForMessage?.(entry.id) ?? null : undefined}
          onFeedbackChange={withFeedback ? (value) => onFeedbackChange?.(entry.id, value) : undefined}
        >
          {meta === 'time' ? (
            entry.time && <span className="text-small text-text-tertiary">{entry.time}</span>
          ) : withCoachAgent ? (
            <div className="flex w-full max-w-[85%] items-center gap-sm">
              <div className="min-w-0 flex-1">
                <DiagnosticsMeta entry={entry} />
              </div>
              <div className="flex shrink-0 items-center gap-xs">
                {recId ? (
                  <button
                    type="button"
                    onClick={() => onTrackFeedback?.(recId)}
                    className="group flex items-center gap-xs text-small text-text-action"
                  >
                    <Icon name="track_changes" size={16} />
                    <span className="group-hover:underline">Track your feedback</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCoachAgent?.(entry.id)}
                    className="group flex items-center gap-xs text-small text-text-action"
                  >
                    <Icon name="auto_awesome" size={16} />
                    <span className="group-hover:underline">Coach agent</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <DiagnosticsMeta entry={entry} />
          )}
        </ChatBubble>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-lg">
      {leadEntries.map((entry, index) => renderEntry(entry, index, showCallRecording))}
      {useCallTranscriptSection && (
        <CallTranscriptSection>
          {transcriptEntries.map((entry, index) => renderEntry(entry, index, false))}
        </CallTranscriptSection>
      )}
    </div>
  )
}

export function RunDetailsPanel({
  onViewConversation,
  steps = DEFAULT_STEPS,
  conversation = DEFAULT_CONVERSATION,
  conversationContent,
  showTabs = true,
  conversationTabLabel = 'Conversation',
  title = 'Run details',
  showHeader = true,
  showCallRecording = false,
  audioUrl,
  durationSecs,
  callDetails,
  callDetailsContent,
  agentName,
  onTrackFeedback,
}: RunDetailsPanelProps) {
  const [tab, setTab] = useState<'logs' | 'conversation'>('conversation')
  const hasCallDetails = Boolean(callDetails || callDetailsContent)
  // The sticky waveform anchors to `top: 0` of this scroll container's padding edge — any
  // padding-top here would leave a permanent gap once it's stuck, so that spacing moves onto the
  // conversation thread's first entry instead (see `RunConversationThread`).
  const skipContainerTopPadding = showCallRecording && tab === 'conversation'

  // Same "Coach agent" → "Track your feedback" flow as `LogDetailsPanel`'s call transcript —
  // Coach agent opens the Share-feedback modal; once submitted, that message's link switches to
  // "Track your feedback", pointing at the recommendation the feedback landed on. Only wired up
  // when the caller passes `agentName` (e.g. the Reminder agent's run detail view).
  const { submitFeedback } = useFeedbackRecommendationsStore()
  const [recIdByMessage, setRecIdByMessage] = useState<Record<string, string>>({})
  const [shareFeedbackMessageId, setShareFeedbackMessageId] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleShareFeedbackSubmit = (details: string) => {
    if (!shareFeedbackMessageId || !agentName) return
    const feedbackMessageId = shareFeedbackMessageId
    setShareFeedbackMessageId(null)
    setToastMessage('Feedback submitted! The agent will be trained on your input.')
    setToastVisible(true)

    const flaggedEntry = conversation.find((entry) => entry.kind === 'message' && entry.id === feedbackMessageId)
    const recId = submitFeedback({
      text: details,
      agentName,
      conversation: {
        name: agentName,
        message: details,
        channel: 'Voice',
        date: flaggedEntry?.kind === 'message' ? flaggedEntry.time ?? '' : '',
        location: '',
      },
      messageId: feedbackMessageId,
    })
    setRecIdByMessage((prev) => ({ ...prev, [feedbackMessageId]: recId }))
  }

  return (
    <div className="preview-panel log-details-panel flex h-full w-[600px] min-w-[360px] flex-col overflow-hidden">
      {showHeader && (
        <div className="flex h-[60px] shrink-0 items-center justify-between px-lg">
          <h2 className="m-0 text-body text-text-primary">{title}</h2>
          {onViewConversation && (
            <button
              type="button"
              onClick={onViewConversation}
              className="flex items-center gap-xs text-body text-text-action hover:text-primary-hover"
            >
              View conversation
              <Icon name="open_in_new" size={16} />
            </button>
          )}
        </div>
      )}

      {showTabs && (
        <div className={`shrink-0 px-lg ${showHeader ? '' : 'pt-sm'}`}>
          <Tabs
            tabs={[
              { id: 'conversation', label: conversationTabLabel },
              { id: 'logs', label: 'Log' },
            ]}
            activeTab={tab}
            onChange={(id) => setTab(id as 'logs' | 'conversation')}
          />
        </div>
      )}

      {(!showTabs || tab === 'logs') ? (
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-lg pb-lg ${
            skipContainerTopPadding ? '' : 'pt-lg'
          }`}
        >
          <LogsTab steps={steps} />
        </div>
      ) : (
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden px-lg pb-lg ${
            skipContainerTopPadding ? '' : 'pt-lg'
          }`}
        >
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {conversationContent ? (
              conversationContent
            ) : (
              <div className="h-full overflow-y-auto">
                {hasCallDetails && (
                  <CollapsibleCallDetails>
                    {callDetailsContent ?? (callDetails && <CallDetailsTab {...callDetails} />)}
                  </CollapsibleCallDetails>
                )}
                <RunConversationThread
                  entries={conversation}
                  showCallRecording={showCallRecording}
                  audioUrl={audioUrl}
                  durationSecs={durationSecs}
                  recIdByMessage={recIdByMessage}
                  onCoachAgent={agentName ? (messageId) => setShareFeedbackMessageId(messageId) : undefined}
                  onTrackFeedback={onTrackFeedback}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {agentName && (
        <>
          <ShareFeedbackModal
            open={shareFeedbackMessageId !== null}
            onClose={() => setShareFeedbackMessageId(null)}
            onSubmit={handleShareFeedbackSubmit}
          />
          <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
        </>
      )}
    </div>
  )
}
