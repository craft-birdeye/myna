import { useState } from 'react'
import voicemailSample from '../../assets/voicemail_sample.mp3'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import { Icon } from '../Icon/Icon'
import { RefChip } from '../RefChip/RefChip'
import { Tooltip } from '../Tooltip/Tooltip'
import type {
  LogDetailsPanelProps,
  LogToolCall,
  LogToolOutputEntry,
  LogToolProperty,
  LogTranscriptEntry,
} from './LogDetailsPanel.types'

const DEFAULT_SUMMARY =
  "The caller reported a bad headache she suspected was a migraine. The agent traced it to a back tooth with mild swelling, then routed her to booking, which scheduled her with Dr. Patel for Thursday at 2 PM."

const DEFAULT_TOOL_OUTPUT: LogToolOutputEntry[] = [
  { kind: 'field', key: 'patientPresent', value: 'true' },
  { kind: 'field', key: 'guarantorPresent', value: 'false' },
  { kind: 'field', key: 'cids', value: '425270500, 563631216, 503143111' },
  {
    kind: 'object',
    key: 'patientDetails',
    propertyCount: 6,
    properties: [
      { key: 'PatientFirstName', value: 'Sarah' },
      { key: 'PatientLastName', value: 'Weiss' },
      { key: 'phone', value: '919) 747-3001' },
      { key: 'emailId', value: 'sarahl@xyz.com' },
      { key: 'patientDob', value: '02-01-1998' },
      { key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' },
    ],
  },
  { kind: 'field', key: 'futureAppointments', value: '-' },
  { kind: 'field', key: 'pastAppointments', value: '-' },
  { kind: 'field', key: 'cancelledAppointments', value: '1' },
  {
    kind: 'object',
    key: 'cancelledAppointments',
    propertyCount: 13,
    properties: [
      { key: 'appointmentId', value: '7GY6JvpXWe' },
      { key: 'start', value: '2026-05-12T09:00:00' },
      { key: 'end', value: '2026-05-12T09:15:00' },
      { key: 'action', value: 'cancel' },
      { key: 'status', value: 'success' },
      { key: 'businessId', value: '1717392' },
      { key: 'businessName', value: 'Trillium Clinic Dermatology Burlington' },
      { key: 'specialistId', value: '1717392' },
      { key: 'specialistName', value: 'Crystal Foust, Pa-c' },
      { key: 'serviceId', value: '103915' },
      { key: 'serviceName', value: 'Derm Est' },
      { key: 'source', value: 'widget' },
      { key: 'cid', value: '563631216' },
    ],
  },
]

const DEFAULT_TOOL_INPUTS: LogToolProperty[] = [
  { key: 'phoneNumber', value: '(032) 902 9023' },
  { key: 'lookupType', value: 'patient' },
]

const DEFAULT_TRANSCRIPT: LogTranscriptEntry[] = [
  { id: 'sys1', role: 'system', text: 'Conversation started' },
  {
    id: 'a1',
    role: 'agent',
    text: 'Thank you for calling Rock Dental Brands — my name is Myna, your virtual assistant. How can I help you today?',
    llmResponseTime: '0.42s',
    tts: '700ms',
  },
  {
    id: 'c1',
    role: 'caller',
    text: 'I am having a very bad headache. I think it is migraine.',
    durationLabel: '5s',
  },
  {
    id: 'a2',
    role: 'agent',
    text: "I'm really sorry you're dealing with that — a bad headache is no fun. Just so I point you in the right direction: is the pain coming from your teeth, jaw, or gums, or is it more of a general head pain?",
    llmResponseTime: '0.51s',
    tts: '820ms',
    knowledgeBase: '5s',
    toolCall: {
      id: 'tool-1',
      name: 'Patient record - Lookup',
      propertyCount: 3,
      durationLabel: '400ms',
      output: DEFAULT_TOOL_OUTPUT,
      inputs: DEFAULT_TOOL_INPUTS,
    },
  },
  {
    id: 'c2',
    role: 'caller',
    text: 'Now that you ask — it kind of started near my back tooth and spread up.',
    durationLabel: '4s',
  },
  {
    id: 'a3',
    role: 'agent',
    text: 'Thank you, that helps. Pain that radiates from a tooth can sometimes need prompt attention. Are you having any swelling in your face or jaw, fever, or trouble swallowing or breathing?',
    llmResponseTime: '0.48s',
    tts: '640ms',
  },
  {
    id: 'c3',
    role: 'caller',
    text: 'A little swelling near the tooth, no fever',
    durationLabel: '3s',
  },
  {
    id: 'a4',
    role: 'agent',
    text: "Good to know there's no fever. Swelling near a tooth is still worth having a dentist look at soon, so let's get you an appointment rather than wait it out.",
    llmResponseTime: '0.39s',
    tts: '610ms',
  },
  { id: 'sys2', role: 'system', text: 'Routed to appointment booking agent' },
  { id: 'sys3', role: 'system', text: 'Procedure switched : Book appointment' },
  {
    id: 'a5',
    role: 'agent',
    text: 'I have an opening this Thursday at 2 PM with Dr. Patel — would that work for you?',
    llmResponseTime: '0.35s',
    tts: '580ms',
  },
  {
    id: 'c4',
    role: 'caller',
    text: 'Yes please, Thursday at 2 PM works.',
    durationLabel: '3s',
  },
  {
    id: 'a6',
    role: 'agent',
    text: "You're all set for Thursday at 2 PM with Dr. Patel. Anything else I can help with?",
    llmResponseTime: '0.31s',
    tts: '520ms',
    toolCall: {
      id: 'tool-2',
      name: 'Schedule Appointment',
      propertyCount: 4,
      durationLabel: '350ms',
      output: [
        { kind: 'field', key: 'appointmentId', value: 'AP93F2KcTm' },
        { kind: 'field', key: 'start', value: '2026-05-14T14:00:00' },
        { kind: 'field', key: 'end', value: '2026-05-14T14:30:00' },
        { kind: 'field', key: 'specialistName', value: 'Dr. Patel' },
      ],
      inputs: [
        { key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' },
        { key: 'specialistId', value: '1717392' },
        { key: 'start', value: '2026-05-14T14:00:00' },
      ],
    },
  },
  {
    id: 'c5',
    role: 'caller',
    text: "No, that's all. Thank you!",
    durationLabel: '2s',
  },
]

function parseDurationSecs(duration: string): number {
  const mmss = duration.match(/^(\d+):(\d+)$/)
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2])
  const verbose = duration.match(/(\d+)\s*m(?:in)?[^\d]*(\d+)?\s*s?/i)
  if (verbose) return Number(verbose[1]) * 60 + Number(verbose[2] ?? 0)
  const secsOnly = Number(duration)
  return Number.isFinite(secsOnly) ? secsOnly : 332
}

function formatDurationLabel(secs: number): string {
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return `${mins}m ${String(rem).padStart(2, '0')}s`
}

function startTimeLabel(timestamp: string): string {
  const match = timestamp.match(/(\d{1,2}:\d{2}\s*[ap]m)/i)
  return match?.[1] ?? timestamp
}

function FieldRow({ fieldKey, value }: { fieldKey: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-sm text-small">
      <RefChip kind="context" label={fieldKey} />
      <span className="min-w-0 break-all text-text-primary">{value}</span>
    </div>
  )
}

function NestedObjectBlock({
  entry,
}: {
  entry: Extract<LogToolOutputEntry, { kind: 'object' }>
}) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs text-left text-small"
      >
        <Icon
          name={open ? 'expand_more' : 'chevron_right'}
          size={16}
          className="shrink-0 text-text-tertiary"
        />
        <RefChip kind="context" label={entry.key} />
        <span className="text-text-tertiary">{`{ ${entry.propertyCount} properties }`}</span>
      </button>
      {open && (
        <div className="ml-sm mt-xs flex flex-col gap-xs border-l border-border pl-sm">
          {entry.properties.map((p) => (
            <FieldRow key={p.key} fieldKey={p.key} value={p.value} />
          ))}
          {entry.trailingRaw && (
            <p className="m-0 text-small text-text-primary">{entry.trailingRaw}</p>
          )}
        </div>
      )}
    </div>
  )
}

function ToolCallBlock({ tool }: { tool: LogToolCall }) {
  const [open, setOpen] = useState(false)
  const [inputsOpen, setInputsOpen] = useState(false)

  const output: LogToolOutputEntry[] =
    tool.output ??
    (tool.properties ?? []).map((p) => ({
      kind: 'field' as const,
      key: p.label,
      value: p.value,
    }))

  function handleCopy() {
    const text = JSON.stringify(
      {
        name: tool.name,
        output,
        inputs: tool.inputs,
      },
      null,
      2,
    )
    void navigator.clipboard?.writeText(text)
  }

  return (
    <div className="w-[380px] max-w-full rounded-md bg-surface-l2">
      {/* Header row — same background as the expanded body, no seam on open */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-end gap-sm px-[12px] py-sm text-left text-small hover:opacity-80"
      >
        <Icon
          name={open ? 'expand_more' : 'chevron_right'}
          size={16}
          className="shrink-0 text-text-tertiary"
        />
        <span className="truncate text-text-action">Tool : {tool.name}</span>
        <Icon name="check_circle" size={16} fill className="shrink-0 text-accent-positive" />
        <span className="shrink-0 text-text-tertiary">
          {`{ ${tool.propertyCount} properties }`}
          {tool.durationLabel ? ` • ${tool.durationLabel}` : ''}
        </span>
      </button>

      {open && (
        <div className="relative px-[12px] pb-sm">
          <div className="absolute right-[12px] top-0 z-[1]">
            <Tooltip content="Copy" variant="brief">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy"
                className="flex size-7 items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-hover hover:text-text-icon"
              >
                <Icon name="content_copy" size={16} />
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-xs">
            {output.map((entry, i) => {
              if (entry.kind === 'field') {
                return <FieldRow key={`${entry.key}-${i}`} fieldKey={entry.key} value={entry.value} />
              }
              if (entry.kind === 'object') {
                return <NestedObjectBlock key={`${entry.key}-${i}`} entry={entry} />
              }
              return (
                <p key={`raw-${i}`} className="m-0 text-small text-text-primary">
                  {entry.value}
                </p>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setInputsOpen(false)
            }}
            className="mt-sm text-small text-text-action hover:text-primary-hover"
          >
            Hide
          </button>

          {(tool.inputs?.length ?? 0) > 0 && (
            <div className="mt-sm">
              <button
                type="button"
                onClick={() => setInputsOpen((v) => !v)}
                className="flex items-center gap-xs text-left text-small text-text-action hover:text-primary-hover"
              >
                <Icon
                  name={inputsOpen ? 'expand_more' : 'chevron_right'}
                  size={16}
                  className="shrink-0"
                />
                View inputs
              </button>
              {inputsOpen && (
                <div className="ml-sm mt-xs flex flex-col gap-xs border-l border-border pl-sm">
                  {tool.inputs!.map((p) => (
                    <FieldRow key={p.key} fieldKey={p.key} value={p.value} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
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

function agentMetaLine(entry: Extract<LogTranscriptEntry, { role: 'agent' }>): string | null {
  const parts: string[] = []
  if (entry.llmResponseTime) parts.push(`LLM response time : ${entry.llmResponseTime}`)
  if (entry.tts) parts.push(`TTS : ${entry.tts}`)
  if (entry.knowledgeBase) parts.push(`Knowledge base : ${entry.knowledgeBase}`)
  return parts.length > 0 ? parts.join(' • ') : null
}

function TranscriptEntry({ entry }: { entry: LogTranscriptEntry }) {
  if (entry.role === 'system') {
    return (
      <div className="py-sm">
        <ChatSystemLabel text={entry.text} />
      </div>
    )
  }

  if (entry.role === 'caller') {
    return (
      <ChatBubble
        sender="user"
        text={entry.text}
        gap="gap-sm"
        bubbleClassName="max-w-[85%] px-lg py-md"
      >
        {entry.durationLabel && (
          <span className="text-small text-text-tertiary">STT : {entry.durationLabel}</span>
        )}
      </ChatBubble>
    )
  }

  const meta = agentMetaLine(entry)

  return (
    <ChatBubble
      sender="business"
      text={entry.text}
      gap="gap-sm"
      bubbleClassName="max-w-[85%] px-lg py-md"
    >
      {meta && <span className="text-small text-text-tertiary">{meta}</span>}
      {entry.toolCall && <ToolCallBlock tool={entry.toolCall} />}
    </ChatBubble>
  )
}

export function LogDetailsPanel({
  row,
  callerNumber = '(032) 902 9023',
  sidNumber = 'CA45 T78 932',
  languageDetected = 'English',
  callEndReason = 'User ended the conversation',
  routedVia = 'Reminder agent',
  summary = DEFAULT_SUMMARY,
  transcript = DEFAULT_TRANSCRIPT,
  durationSecs,
  audioUrl = voicemailSample,
  onViewConversation,
}: LogDetailsPanelProps) {
  const totalSecs = durationSecs ?? (parseDurationSecs(row.duration) || 332)
  const displayCaller =
    row.contact.startsWith('+') || row.contact.startsWith('(') ? row.contact : callerNumber

  const [summaryOpen, setSummaryOpen] = useState(true)
  const [transcriptOpen, setTranscriptOpen] = useState(true)

  return (
    <div className="preview-panel log-details-panel flex h-full w-[600px] min-w-[360px] flex-col overflow-hidden">
      {/* Header — matches RHSPanelHeader (0 15px, height 60) */}
      <div className="flex h-[60px] shrink-0 items-center justify-between px-[15px]">
        <h2 className="m-0 text-body text-text-primary">Conversation details</h2>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-[15px] py-lg">
        {/* Meta card */}
        <div className="mb-2xl rounded-sm border border-border px-lg py-lg">
          <div className="grid grid-cols-2 gap-x-lg gap-y-lg">
            <MetaField label="Caller number" value={displayCaller} />
            <MetaField label="Language detected" value={languageDetected} />
            <MetaField label="Duration" value={formatDurationLabel(totalSecs)} />
            <MetaField label="Call SID" value={sidNumber} />
            <MetaField label="Start time" value={startTimeLabel(row.timestamp)} />
            <MetaField label="Call end reason" value={callEndReason} />
            <MetaField label="Routed via" value={routedVia} />
          </div>
        </div>

        {/* AI summary */}
        <div className="ai-summary-panel mb-2xl shrink-0">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-xs">
              <Icon name="auto_awesome" size={20} className="shrink-0 text-ai-brand" />
              <span className="text-body text-text-primary">Summary</span>
            </span>
            <Icon
              name={summaryOpen ? 'expand_less' : 'expand_more'}
              size={20}
              className="text-text-secondary"
            />
          </button>
          {summaryOpen && (
            <p className="m-0 mt-sm text-body leading-[1.6] text-text-secondary">{summary}</p>
          )}
        </div>

        {/* Call transcript — player + messages */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setTranscriptOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-body text-text-primary">Call transcript</span>
          </button>
          {transcriptOpen && (
            <div className="mt-[32px] flex flex-col gap-3xl">
              <CallRecordingPlayer
                audioUrl={audioUrl}
                durationSecs={totalSecs}
                padded={false}
              />
              <div className="flex flex-col gap-3xl">
                {transcript.map((entry) => (
                  <TranscriptEntry key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
