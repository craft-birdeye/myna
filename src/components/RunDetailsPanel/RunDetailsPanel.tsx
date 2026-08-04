import { Fragment, useState } from 'react'
import { REMINDER_CONVERSATION_EVENTS } from '../../data/reminderInboxConversation'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import type { MessageFeedbackValue } from '../ChatBubble/ChatBubble.types'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { Tabs } from '../Tabs/Tabs'
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

const TYPE_META: Record<RunLogStep['type'], { icon: string; colorClass: string; label: string }> = {
  trigger: { icon: 'bolt', colorClass: 'text-[#C2410C]', label: 'Trigger' },
  task: { icon: 'list_alt', colorClass: 'text-[#37A248]', label: 'Task' },
  delay: { icon: 'schedule', colorClass: 'text-text-icon', label: 'Delay' },
  branch: { icon: 'account_tree', colorClass: 'text-[#5071CE]', label: 'Branch' },
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

function FieldList({ fields }: { fields: RunLogField[] }) {
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
  const outputLabel = step.outputLabel ?? (step.type === 'branch' ? 'Branch output' : 'Task output')

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
      <p className="m-0 mt-xs text-body text-text-primary">{value}</p>
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
    <div className="rounded-sm border border-border px-lg py-lg">
      <div className="grid grid-cols-2 gap-x-lg gap-y-lg">
        <MetaField label="Caller number" value={callerNumber} />
        <MetaField label="Language detected" value={languageDetected} />
        <MetaField label="Duration" value={duration} />
        <MetaField label="Call SID" value={sidNumber} />
        <MetaField label="Start time" value={startTime} />
        <MetaField label="Call end reason" value={callEndReason} />
        <MetaField label="Routed via" value={routedVia} />
      </div>
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

/** Renders a run conversation thread (system labels, email cards, voice bubbles). Reused by the Inbox deep-link view. */
export function RunConversationThread({
  entries,
  meta = 'diagnostics',
  feedbackForMessage,
  onFeedbackChange,
  showCallRecording = false,
  audioUrl,
  durationSecs,
}: RunConversationThreadProps) {
  return (
    <div className="flex flex-col gap-lg">
      {entries.map((entry, index) => {
        if (entry.kind === 'system') {
          // The sticky block must be a direct sibling within the thread's own flex container
          // (not nested inside this entry's own short-lived wrapper) — a sticky element can never
          // stay stuck past the bottom edge of its immediate parent's box, and this wrapper alone
          // is far too short to keep it pinned once the transcript below has scrolled by.
          return (
            <Fragment key={entry.id}>
              <div className={showCallRecording && index === 0 ? 'pt-lg' : undefined}>
                <ChatSystemLabel text={entry.text} />
              </div>
              {showCallRecording && entry.insertCallRecordingAfter && (
                <div className="sticky top-0 z-10 -mx-[15px] bg-surface px-[15px] pb-lg pt-lg">
                  <p className="m-0 mb-lg text-[13px] tracking-[-0.26px] text-[#555]">Call recording</p>
                  <CallRecordingPlayer
                    audioUrl={audioUrl}
                    durationSecs={durationSecs}
                    padded={false}
                  />
                </div>
              )}
            </Fragment>
          )
        }
        if (entry.kind === 'card') {
          return (
            <div key={entry.id} className={showCallRecording && index === 0 ? 'pt-lg' : undefined}>
              <ConversationCard entry={entry} />
            </div>
          )
        }

        const withFeedback = meta === 'time' && entry.sender === 'business'

        return (
          <div key={entry.id} className={showCallRecording && index === 0 ? 'pt-lg' : undefined}>
            <ChatBubble
              sender={entry.sender}
              text={entry.text}
              gap="gap-sm"
              bubbleClassName="max-w-[85%] px-lg py-md"
              showFeedback={withFeedback}
              feedback={withFeedback ? feedbackForMessage?.(entry.id) ?? null : undefined}
              onFeedbackChange={withFeedback ? (value) => onFeedbackChange?.(entry.id, value) : undefined}
            >
              {meta === 'time'
                ? entry.time && <span className="text-small text-text-tertiary">{entry.time}</span>
                : <DiagnosticsMeta entry={entry} />}
            </ChatBubble>
          </div>
        )
      })}
    </div>
  )
}

export function RunDetailsPanel({
  onViewConversation,
  steps = DEFAULT_STEPS,
  conversation = DEFAULT_CONVERSATION,
  conversationContent,
  showTabs = true,
  title = 'Run details',
  showHeader = true,
  showCallRecording = false,
  audioUrl,
  durationSecs,
  callDetails,
  callDetailsContent,
}: RunDetailsPanelProps) {
  const [tab, setTab] = useState<'logs' | 'conversation' | 'call-details'>('logs')
  // The sticky waveform anchors to `top: 0` of this scroll container's padding edge — any
  // padding-top here would leave a permanent gap once it's stuck, so that spacing moves onto the
  // conversation thread's first entry instead (see `RunConversationThread`).
  const skipContainerTopPadding = showCallRecording && tab === 'conversation'

  return (
    <div className="preview-panel log-details-panel flex h-full w-[600px] min-w-[360px] flex-col overflow-hidden">
      {showHeader && (
        <div className="flex h-[60px] shrink-0 items-center justify-between px-[15px]">
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
        <div className="shrink-0 border-b border-border px-[15px]">
          <Tabs
            tabs={[
              { id: 'logs', label: 'Logs' },
              { id: 'conversation', label: 'Conversation' },
              ...(callDetails || callDetailsContent ? [{ id: 'call-details', label: 'Call details' }] : []),
            ]}
            activeTab={tab}
            onChange={(id) => setTab(id as 'logs' | 'conversation' | 'call-details')}
          />
        </div>
      )}

      <div className={`min-h-0 flex-1 overflow-y-auto px-[15px] pb-lg ${skipContainerTopPadding ? '' : 'pt-lg'}`}>
        {(!showTabs || tab === 'logs') ? (
          <LogsTab steps={steps} />
        ) : tab === 'call-details' && (callDetails || callDetailsContent) ? (
          callDetailsContent ?? (callDetails && <CallDetailsTab {...callDetails} />)
        ) : conversationContent ? (
          conversationContent
        ) : (
          <RunConversationThread
            entries={conversation}
            showCallRecording={showCallRecording}
            audioUrl={audioUrl}
            durationSecs={durationSecs}
          />
        )}
      </div>
    </div>
  )
}
