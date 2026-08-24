import { useEffect, useRef, useState, type ReactNode } from 'react'
import voicemailSample from '../../assets/voicemail_sample.mp3'
import iconAgentsPurple from '../../assets/icon-agents-purple.svg'
import { AiCoachSparkleIcon } from '../../assets/AiCoachSparkleIcon'
import { AGENT_LANGUAGES } from '../../data/agentLanguages'
import { useFeedbackRecommendationsStore } from '../../data/FeedbackRecommendationsStoreContext'
import type { Channel } from '../../data/recommendationsData'
import { CallRecordingPlayer } from '../CallRecordingPlayer/CallRecordingPlayer'
import { ChatBubble, ChatSystemLabel } from '../ChatBubble/ChatBubble'
import { Chip } from '../Chip/Chip'
import type { ChipVariant } from '../Chip/Chip.types'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import { LanguageFlag } from '../LanguageSelectMenu/LanguageSelectMenu'
import { RefChip } from '../RefChip/RefChip'
import {
  CallTranscriptSection,
  CollapsibleCallDetails,
  getUserRatingForLogStatus,
  RunDetailsPanel,
  UserRatingDisplay,
} from '../RunDetailsPanel/RunDetailsPanel'
import type { RunLogStep } from '../RunDetailsPanel/RunDetailsPanel.types'
import { ShareFeedbackModal } from '../ShareFeedbackModal/ShareFeedbackModal'
import { Toast } from '../Toast/Toast'
import { Tooltip } from '../Tooltip/Tooltip'
import type {
  LogDetailsPanelProps,
  LogToolCall,
  LogToolOutputEntry,
  LogToolProperty,
  LogTranscriptEntry,
} from './LogDetailsPanel.types'

/** Loosely matches the demo data's varied channel labels ("Voice call", "Web chat", ...) to the
 *  strict `Channel` union `submitFeedback` expects. */
function normalizeChannel(channel: string): Channel {
  const lower = channel.toLowerCase()
  if (lower.includes('voice') || lower.includes('call')) return 'Voice'
  if (lower.includes('chat')) return 'Chat'
  return 'Text'
}

// Logs-tab steps for Front desk — mirrors the canvas workflow (Conversation trigger → Procedures)
// with this call's trigger output / inputs and the procedures that ran.
export const CALL_LOG_STEPS: RunLogStep[] = [
  {
    id: 'step-1',
    type: 'trigger',
    stepNumber: 1,
    title: 'Channel',
    durationSecs: 1,
    output: [
      { key: 'Source', value: 'Voice call' },
      { key: 'Caller', value: '(032) 902 9023' },
      { key: 'Comments', value: 'I am having a very bad headache. I think it is migraine.' },
    ],
    inputs: [
      { key: 'channel', value: 'Voice' },
      { key: 'condition', value: 'incoming_call' },
      { key: 'time', value: 'during_business' },
    ],
  },
  {
    id: 'step-2',
    type: 'procedures',
    stepNumber: 2,
    title: 'Follow procedures',
    durationSecs: 3,
    output: [
      { key: 'Procedure path', value: 'General inquiry → Book, cancel, reschedule appointment' },
      { key: 'Procedure used', value: 'Book, cancel, reschedule appointment' },
      { key: 'Intent detected', value: 'Headache / migraine → appointment booking' },
      { key: 'Summary', value: "You're all set for Thursday at 2 PM with Dr. Patel." },
      {
        key: 'Procedures available',
        properties: [
          { key: '1', value: 'General inquiry' },
          { key: '2', value: 'Talk to human' },
          { key: '3', value: 'Book, cancel, reschedule appointment' },
          { key: '4', value: 'Verify insurance' },
        ],
      },
      {
        key: 'Patient record - Lookup',
        properties: [
          { key: 'patientPresent', value: 'true' },
          { key: 'PatientFirstName', value: 'Sarah' },
          { key: 'PatientLastName', value: 'Weiss' },
          { key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' },
        ],
      },
    ],
    tool: {
      name: 'Schedule Appointment',
      properties: [
        { key: 'appointmentId', value: 'AP93F2KcTm' },
        { key: 'start', value: '2026-05-14T14:00:00' },
        { key: 'end', value: '2026-05-14T14:30:00' },
        { key: 'specialistName', value: 'Dr. Patel' },
      ],
    },
    inputs: [
      { key: 'utterance', value: 'I am having a very bad headache. I think it is migraine.' },
      { key: 'phoneNumber', value: '(032) 902 9023' },
      { key: 'patientId', value: 'a764c0d3-fd32-44f0-8c89-79fd12' },
      { key: 'specialistId', value: '1717392' },
      { key: 'start', value: '2026-05-14T14:00:00' },
    ],
  },
]

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
    time: '5:30 PM',
  },
  {
    id: 'c1',
    role: 'caller',
    text: 'I am having a very bad headache. I think it is migraine.',
    durationLabel: '5s',
    time: '5:30 PM',
  },
  {
    id: 'a2',
    role: 'agent',
    text: "I'm really sorry you're dealing with that — a bad headache is no fun. Just so I point you in the right direction: is the pain coming from your teeth, jaw, or gums, or is it more of a general head pain?",
    llmResponseTime: '0.51s',
    tts: '820ms',
    knowledgeBase: '5s',
    time: '5:31 PM',
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
    time: '5:31 PM',
  },
  {
    id: 'a3',
    role: 'agent',
    text: 'Thank you, that helps. Pain that radiates from a tooth can sometimes need prompt attention. Are you having any swelling in your face or jaw, fever, or trouble swallowing or breathing?',
    llmResponseTime: '0.48s',
    tts: '640ms',
    time: '5:31 PM',
  },
  {
    id: 'c3',
    role: 'caller',
    text: 'A little swelling near the tooth, no fever',
    durationLabel: '3s',
    time: '5:32 PM',
  },
  {
    id: 'a4',
    role: 'agent',
    text: "Good to know there's no fever. Swelling near a tooth is still worth having a dentist look at soon, so let's get you an appointment rather than wait it out.",
    llmResponseTime: '0.39s',
    tts: '610ms',
    knowledgeBase: '10s',
    time: '5:32 PM',
  },
  { id: 'sys2', role: 'system', text: 'Routed to appointment booking agent' },
  { id: 'sys3', role: 'system', text: 'Procedure switched : Book appointment' },
  {
    id: 'a5',
    role: 'agent',
    text: 'I have an opening this Thursday at 2 PM with Dr. Patel — would that work for you?',
    llmResponseTime: '0.35s',
    tts: '580ms',
    time: '5:32 PM',
  },
  {
    id: 'c4',
    role: 'caller',
    text: 'Yes please, Thursday at 2 PM works.',
    durationLabel: '3s',
    time: '5:33 PM',
  },
  {
    id: 'a6',
    role: 'agent',
    text: "You're all set for Thursday at 2 PM with Dr. Patel. Anything else I can help with?",
    llmResponseTime: '0.31s',
    tts: '520ms',
    time: '5:33 PM',
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
    time: '5:33 PM',
  },
]

// Logs-tab steps for a Reminder agent call — mirrors that workflow's real trigger/task/delay/
// branch/task sequence (an appointment-confirmation voice call), just summarized as a run history.
export const REMINDER_CALL_LOG_STEPS: RunLogStep[] = [
  {
    id: 'r-step-1',
    type: 'trigger',
    stepNumber: 1,
    title: 'Appointment is booked',
    output: [
      { key: 'Source', value: 'Email' },
      { key: 'Comments', value: 'Patient booked an appointment online' },
      {
        key: 'Scheduled appointment',
        properties: [
          { key: 'Name', value: 'Sarah Lauren' },
          { key: 'Appointment type', value: 'Routine checkup' },
        ],
      },
    ],
  },
  {
    id: 'r-step-2',
    type: 'task',
    stepNumber: 2,
    title: 'Send scheduled reminders',
    output: [
      { key: 'Summary', value: 'Email reminder sent' },
      { key: 'Status', value: 'Confirmed' },
    ],
    tool: {
      name: 'Reminder tool',
      properties: [
        { key: 'channel', value: 'Email' },
        { key: 'sentAt', value: '4 weeks before appointment' },
      ],
    },
  },
  {
    id: 'r-step-3',
    type: 'task',
    stepNumber: 3,
    title: 'Schedule appointment reminder',
    output: [
      { key: 'Summary', value: 'Email reminder sent' },
      { key: 'Status', value: 'Confirmed' },
    ],
    tool: {
      name: 'Reminder tool',
      properties: [
        { key: 'channel', value: 'Email' },
        { key: 'sentAt', value: '2 weeks before appointment' },
      ],
    },
  },
  {
    id: 'r-step-4',
    type: 'delay',
    stepNumber: 4,
    title: 'Delay until 2 days before appointment date and time',
    note: 'Delay completed.',
  },
  {
    id: 'r-step-5',
    type: 'branch',
    stepNumber: 5,
    title: 'Based on conditions',
    outputLabel: 'Branch output',
    output: [{ key: 'Status', value: 'Unconfirmed' }],
  },
  {
    id: 'r-step-6',
    type: 'task',
    stepNumber: 6,
    title: 'Initiate voice call',
    output: [
      { key: 'Source', value: 'Voice call' },
      { key: 'Summary', value: 'Patient confirmed the appointment' },
      { key: 'Comments', value: 'Asked a follow-up question about insurance coverage' },
    ],
    tool: {
      name: 'Initiate voice call',
      properties: [
        { key: 'phoneNumber', value: '+1 (555) 010-1234' },
        { key: 'callerId', value: 'Rock Dental Brands' },
        { key: 'voice', value: 'Andrea' },
      ],
    },
  },
]

const REMINDER_TOOL_OUTPUT: LogToolOutputEntry[] = [
  { kind: 'field', key: 'phoneNumber', value: '+1 (555) 010-1234' },
  { kind: 'field', key: 'callerId', value: 'Rock Dental Brands' },
  { kind: 'field', key: 'voice', value: 'Andrea' },
]

export const REMINDER_TRANSCRIPT: LogTranscriptEntry[] = [
  {
    id: 'ra1',
    role: 'agent',
    text: "Hi there! I'm Myna, your virtual assistant from Rock Dental Brands. I'm reaching out to confirm your upcoming appointment. Is now a good time to chat?",
    llmResponseTime: '0.42s',
    tts: '700ms',
    time: '5:30 PM',
    toolCall: {
      id: 'rtool-1',
      name: 'Initiate voice call',
      propertyCount: 3,
      durationLabel: '520ms',
      output: REMINDER_TOOL_OUTPUT,
      inputs: [{ key: 'phoneNumber', value: '+1 (555) 010-1234' }],
    },
  },
  {
    id: 'rc1',
    role: 'caller',
    text: 'Yes, go ahead.',
    durationLabel: '2s',
    time: '5:30 PM',
  },
  {
    id: 'ra2',
    role: 'agent',
    text: "Great! You have a routine checkup scheduled with us. I just wanted to make sure you're still planning to come in and answer any questions you might have beforehand.",
    llmResponseTime: '0.42s',
    tts: '700ms',
    knowledgeBase: '5s',
    time: '5:31 PM',
  },
  {
    id: 'rc2',
    role: 'caller',
    text: "Yes, I'll be there. Do I need to bring anything?",
    durationLabel: '3s',
    time: '5:31 PM',
  },
  {
    id: 'ra3',
    role: 'agent',
    text: "Glad to hear it! Please bring a valid photo ID and your insurance card if applicable. Also, arrive about 10 minutes early to complete any paperwork. Is there anything else you'd like to know before your visit?",
    llmResponseTime: '0.42s',
    tts: '700ms',
    time: '5:32 PM',
  },
  {
    id: 'rc3',
    role: 'caller',
    text: 'Actually, can you also tell me what my insurance covers for this visit?',
    durationLabel: '4s',
    time: '5:32 PM',
  },
  { id: 'rsys4', role: 'system', text: 'Routed to Front desk agent' },
  {
    id: 'ra4',
    role: 'agent',
    text: "That's a great question! Let me connect you with our front desk team — they'll be able to walk you through your coverage details right away.",
    llmResponseTime: '0.42s',
    tts: '700ms',
    time: '5:33 PM',
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

const DEFAULT_CALL_AI_SUMMARY = [
  'Caller reported a severe headache they believe is a migraine.',
  'Agent confirmed the pain is general head pain, not dental or jaw-related.',
  'Patient record was found and the caller was guided toward next steps for care.',
]

const REMINDER_CALL_AI_SUMMARY = [
  'Caller confirmed their upcoming routine checkup appointment.',
  'Agent shared arrival guidance and what to bring to the visit.',
  'Insurance coverage questions were routed to the Front desk agent.',
]

function CallAiSummary({ bullets = DEFAULT_CALL_AI_SUMMARY }: { bullets?: string[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="ai-summary-panel mt-lg">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-xs text-left"
      >
        <span
          className="ai-gradient-icon size-4 shrink-0"
          style={{
            WebkitMaskImage: `url("${iconAgentsPurple}")`,
            maskImage: `url("${iconAgentsPurple}")`,
          }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-body text-text-primary">AI summary</span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={20}
          className="shrink-0 text-text-icon"
        />
      </button>
      {open && (
        <ul className="mt-sm flex flex-col gap-xs">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-sm text-small text-text-secondary">
              <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-text-tertiary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const ORIGINAL_TRANSCRIPT = {
  id: 'original',
  label: 'Original transcript',
  countryCode: 'us',
} as const

/** Translate targets — English is the original, so it is omitted here. */
const TRANSLATE_LANGUAGES = [
  { id: 'af', label: 'Afrikaans', countryCode: 'za' },
  { id: 'ar', label: 'Arabic', countryCode: 'ae' },
  { id: 'hy', label: 'Armenian', countryCode: 'am' },
  { id: 'as', label: 'Assamese', countryCode: 'in' },
  { id: 'ast', label: 'Asturian', countryCode: 'es' },
  { id: 'az', label: 'Azerbaijani', countryCode: 'az' },
  ...AGENT_LANGUAGES.filter(
    (l) => !['en', 'af', 'ar', 'as'].includes(l.id),
  ),
]

function TranscriptTranslationControl() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>(ORIGINAL_TRANSCRIPT.id)
  const rootRef = useRef<HTMLDivElement>(null)

  const selected =
    selectedId === ORIGINAL_TRANSCRIPT.id
      ? ORIGINAL_TRANSCRIPT
      : TRANSLATE_LANGUAGES.find((l) => l.id === selectedId) ?? ORIGINAL_TRANSCRIPT

  const triggerLabel =
    selected.id === ORIGINAL_TRANSCRIPT.id ? ORIGINAL_TRANSCRIPT.label : selected.label

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative mt-md">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 max-w-full items-center gap-sm rounded-sm border border-border-selected bg-surface px-sm py-xs text-left hover:bg-surface-hover"
      >
        <LanguageFlag countryCode={selected.countryCode} label={triggerLabel} size="sm" />
        <span className="min-w-0 truncate text-body text-text-primary">{triggerLabel}</span>
        <Icon name="expand_more" size={18} className="shrink-0 text-text-icon" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Available languages"
          className="absolute left-0 top-full z-30 mt-xs flex w-[280px] max-h-[360px] flex-col overflow-hidden rounded-sm border border-border bg-surface py-sm shadow-dropdown"
        >
          <p className="px-md pb-xs text-small text-text-tertiary">Available languages</p>
          <button
            type="button"
            role="option"
            aria-selected={selectedId === ORIGINAL_TRANSCRIPT.id}
            onClick={() => {
              setSelectedId(ORIGINAL_TRANSCRIPT.id)
              setOpen(false)
            }}
            className={`mx-sm flex items-center gap-sm rounded-sm px-sm py-sm text-left ${
              selectedId === ORIGINAL_TRANSCRIPT.id
                ? 'bg-surface-selected'
                : 'hover:bg-surface-hover'
            }`}
          >
            <LanguageFlag
              countryCode={ORIGINAL_TRANSCRIPT.countryCode}
              label={ORIGINAL_TRANSCRIPT.label}
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate text-body text-text-primary">
              {ORIGINAL_TRANSCRIPT.label}
            </span>
            {selectedId === ORIGINAL_TRANSCRIPT.id && (
              <Icon name="check" size={18} className="shrink-0 text-text-primary" />
            )}
          </button>

          <div className="my-sm border-t border-border" />

          <div className="flex items-center gap-xs px-md pb-xs">
            <span className="text-small text-text-tertiary">Translate to more languages</span>
            <InfoTooltip
              text="Choose a language to view a translated version of this transcript."
              variant="detail"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-sm pb-xs">
            {TRANSLATE_LANGUAGES.map((lang) => {
              const isSelected = selectedId === lang.id
              return (
                <button
                  key={lang.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedId(lang.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-sm rounded-sm px-sm py-sm text-left ${
                    isSelected ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  <LanguageFlag countryCode={lang.countryCode} label={lang.label} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                    {lang.label}
                  </span>
                  {isSelected && (
                    <Icon name="check" size={18} className="shrink-0 text-text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function startTimeLabel(timestamp: string): string {
  const match = timestamp.match(/(\d{1,2}:\d{2}\s*[ap]m)/i)
  return match?.[1] ?? timestamp
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="m-0 text-small text-text-tertiary">{label}</p>
      <p className="m-0 mt-xs text-small text-text-primary">{value}</p>
    </div>
  )
}

const CALL_END_RESULT_VARIANT: Record<string, ChipVariant> = {
  Resolved: 'success',
  'Not resolved': 'danger',
  'In progress': 'warning',
  Complete: 'success',
  Failed: 'danger',
}

function CallEndReasonField({
  reason,
  resultBadge,
}: {
  reason: string
  resultBadge?: string
}) {
  if (!resultBadge) {
    return <MetaField label="Call end reason" value={reason} />
  }
  return (
    <div>
      <p className="m-0 text-small text-text-tertiary">Call end reason</p>
      <div className="mt-xs flex flex-col gap-xs items-start">
        <Chip
          label={resultBadge}
          variant={CALL_END_RESULT_VARIANT[resultBadge] ?? 'neutral'}
        />
        <p className="m-0 text-small text-text-primary">{reason}</p>
      </div>
    </div>
  )
}

function CallDetailsTab({
  callerNumber,
  languageDetected,
  durationSecs,
  sidNumber,
  startTime,
  callEndReason,
  routedVia,
  callEndResultBadge,
  userRating,
}: {
  callerNumber: string
  languageDetected: string
  durationSecs: number
  sidNumber: string
  startTime: string
  callEndReason: string
  routedVia: string
  callEndResultBadge?: string
  userRating?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-x-lg gap-y-md">
      <MetaField label="Caller number" value={callerNumber} />
      <MetaField label="Language detected" value={languageDetected} />
      <MetaField label="Duration" value={formatDurationLabel(durationSecs)} />
      <MetaField label="Call SID" value={sidNumber} />
      <MetaField label="Start time" value={startTime} />
      <CallEndReasonField reason={callEndReason} resultBadge={callEndResultBadge} />
      <MetaField label="Routed via" value={routedVia} />
      {userRating ? (
        <div>
          <p className="m-0 text-small text-text-tertiary">User rating</p>
          <div className="mt-xs">
            <UserRatingDisplay rating={userRating} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Shared shell for the Reminder agent's pre-voice-call email/booking cards — same bubble
 *  background + left/right alignment convention as `ChatBubble` (business = blue/right,
 *  user = gray/left), but with a structured icon+title+divider header instead of plain text. */
function EmailCardShell({
  sender,
  icon,
  title,
  time,
  children,
}: {
  sender: 'business' | 'user'
  icon: string
  title: string
  time?: string
  children?: ReactNode
}) {
  const isBusiness = sender === 'business'
  return (
    <div className={`flex flex-col gap-xs ${isBusiness ? 'items-end' : 'items-start'}`}>
      <div
        className={`w-full max-w-[85%] rounded-lg px-lg py-md text-body text-text-primary ${
          isBusiness ? 'bg-[#dbeafe]' : 'bg-[#f0f0f0]'
        }`}
      >
        <div className="flex items-center gap-xs">
          <Icon name={icon} size={18} className="shrink-0" />
          {title}
        </div>
        <div className="my-sm border-t border-dashed border-border" />
        {children}
      </div>
      {time && <span className="text-small text-text-tertiary">{time}</span>}
    </div>
  )
}

function AppointmentBookedCard({ time }: { time: string }) {
  return (
    <EmailCardShell sender="business" icon="check_circle" title="Appointment booked" time={time}>
      <div className="mt-sm flex items-center gap-sm">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-small text-text-primary">
          SL
        </div>
        <div>
          <p className="m-0 text-body text-text-primary">Sarah Lauren</p>
          <p className="m-0 text-small text-text-tertiary">Other</p>
        </div>
      </div>
      <div className="mt-md">
        <p className="m-0 text-small text-text-tertiary">Appointment type</p>
        <p className="m-0 mt-2xs text-body text-text-primary">Routine checkup</p>
      </div>
      <div className="mt-md">
        <p className="m-0 text-small text-text-tertiary">Booking date and time</p>
        <p className="m-0 mt-2xs text-body text-text-primary">Sat, Jun 14, 2026 • 2:30 PM - 3:00 PM</p>
      </div>
    </EmailCardShell>
  )
}

function EmailActionCard({ title }: { title: string }) {
  return (
    <EmailCardShell sender="user" icon="mail" title={title}>
      <p className="m-0 mt-sm text-body text-text-primary">Confirm</p>
    </EmailCardShell>
  )
}

function ReminderSentCard({ time }: { time: string }) {
  return (
    <EmailCardShell sender="business" icon="mail" title="Appointment reminder sent!" time={time}>
      <p className="m-0 mt-sm text-body text-text-primary">Hi Sarah,</p>
      <p className="m-0 mt-sm text-body text-text-primary">
        This is a reminder that you have a Routine checkup scheduled for Sat, Jun 14 • 2:30 PM. Please confirm your
        attendance by replying to this email.
      </p>
      <p className="m-0 mt-sm text-body text-text-primary">
        If you need to reschedule, tap "I need to reschedule" and a team member will be in touch.
      </p>
    </EmailCardShell>
  )
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

/** "Show info" dropdown under an agent bubble — reveals LLM response time / TTS / knowledge base
 *  / tool response time meta. Tool calls themselves render separately via `ToolCallLine`. */
/** A tool call this turn made, rendered as its own centered line (matching the style of system
 *  events like "Routed to appointment booking agent") instead of an inline pill — click to
 *  expand its structured output below it. */
function ToolCallLine({ tool }: { tool: LogToolCall }) {
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
    const text = JSON.stringify({ name: tool.name, output, inputs: tool.inputs }, null, 2)
    void navigator.clipboard?.writeText(text)
  }

  return (
    <div className="flex flex-col items-center gap-sm py-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-xs text-small text-text-tertiary hover:text-text-secondary"
      >
        <Icon name="build" size={16} className="shrink-0" />
        {tool.name}
        <Icon name="check_circle" size={16} fill className="shrink-0 text-accent-positive" />
        {tool.durationLabel && <span className="shrink-0 whitespace-nowrap">• {tool.durationLabel}</span>}
        <Icon name={open ? 'expand_less' : 'expand_more'} size={16} className="shrink-0" />
      </button>

      {open && (
        <div className="relative w-[380px] max-w-full rounded-lg bg-surface-l2 px-md py-md">
          <div className="absolute right-md top-md z-[1]">
            <Tooltip content="Copy" variant="brief">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy"
                className="flex size-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-icon"
              >
                <Icon name="content_copy" size={16} />
              </button>
            </Tooltip>
          </div>

          <div className="flex flex-col gap-xs pr-2xl">
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

/** Explains each meta-line abbreviation on hover — shown for LLM/TTS/KB (agent bubbles) and STT
 *  (caller bubbles), all part of the same transcript-metrics family. */
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

/** Renders a set of "LABEL : value" segments (each label carrying its own explanatory tooltip),
 *  joined by "•" — optionally followed by a plain trailing segment (e.g. a timestamp) that has no
 *  tooltip of its own. */
function MetaLine({ parts, trailing }: { parts: { label: string; value: string }[]; trailing?: string }) {
  if (parts.length === 0 && !trailing) return null
  return (
    <span className="text-small text-text-tertiary">
      {parts.map((part, i) => (
        <span key={part.label}>
          {i > 0 && ' • '}
          <MetaLabel label={part.label} />
          {` : ${part.value}`}
        </span>
      ))}
      {trailing && `${parts.length > 0 ? ' • ' : ''}${trailing}`}
    </span>
  )
}

function agentMetaParts(entry: Extract<LogTranscriptEntry, { role: 'agent' }>): { label: string; value: string }[] {
  const parts: { label: string; value: string }[] = []
  if (entry.llmResponseTime) parts.push({ label: 'LLM', value: entry.llmResponseTime })
  if (entry.tts) parts.push({ label: 'TTS', value: entry.tts })
  if (entry.knowledgeBase) parts.push({ label: 'KB', value: entry.knowledgeBase })
  return parts
}

function TranscriptEntry({
  entry,
  recId,
  onCoachAgent,
  onTrackFeedback,
}: {
  entry: LogTranscriptEntry
  /** Only meaningful for `role: 'agent'` entries — the other roles never show Coach agent. Set
   *  once feedback has been submitted for this message, switching it to "Track your feedback". */
  recId?: string
  onCoachAgent?: () => void
  onTrackFeedback?: () => void
}) {
  if (entry.role === 'system') {
    return (
      <div className="py-sm">
        <ChatSystemLabel text={entry.text} />
      </div>
    )
  }

  if (entry.role === 'caller') {
    const sttParts = entry.durationLabel ? [{ label: 'STT', value: entry.durationLabel }] : []
    return (
      <ChatBubble
        sender="user"
        text={entry.text}
        gap="gap-sm"
        bubbleClassName="max-w-[85%] px-lg py-md"
      >
        <MetaLine parts={sttParts} trailing={entry.time} />
      </ChatBubble>
    )
  }

  const metaParts = agentMetaParts(entry)

  return (
    <>
      <ChatBubble
        sender="business"
        text={entry.text}
        gap="gap-sm"
        bubbleClassName="max-w-[85%] px-lg py-md"
      >
        <div className="flex w-full max-w-[85%] items-center gap-sm">
          <div className="min-w-0 flex-1">
            <MetaLine parts={metaParts} />
          </div>
          <div className="flex shrink-0 items-center gap-xs">
            {recId ? (
              <button
                type="button"
                onClick={onTrackFeedback}
                className="group flex items-center gap-xs text-small text-text-action"
              >
                <Icon name="track_changes" size={16} />
                <span className="group-hover:underline">Track your feedback</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCoachAgent}
                className="group flex items-center gap-xs text-small text-text-action"
              >
                <AiCoachSparkleIcon />
                <span className="group-hover:underline">Coach agent</span>
              </button>
            )}
            {entry.time && (
              <>
                <span className="shrink-0 text-small text-text-tertiary">•</span>
                <span className="shrink-0 text-small text-text-tertiary">{entry.time}</span>
              </>
            )}
          </div>
        </div>
      </ChatBubble>
      {entry.toolCall && <ToolCallLine tool={entry.toolCall} />}
    </>
  )
}

export function LogDetailsPanel({
  row,
  agentName = 'Front desk agent - North region',
  transcript = DEFAULT_TRANSCRIPT,
  steps: stepsProp,
  durationSecs,
  audioUrl = voicemailSample,
  onTrackFeedback,
  callerNumber = '(032) 902 9023',
  sidNumber = 'CA45 T78 932',
  languageDetected = 'English',
  callEndReason = 'User ended the conversation',
  routedVia = agentName,
  showCallDetails = true,
  callEndResultBadge,
  userRating,
  showTranscriptTranslation = false,
}: LogDetailsPanelProps) {
  const isReminder = agentName.startsWith('Reminder agent')
  const steps = stepsProp ?? (isReminder ? REMINDER_CALL_LOG_STEPS : CALL_LOG_STEPS)
  // A purely text/web-chat conversation never recorded a call — no waveform to show.
  const hasVoiceCall = row.channel.toLowerCase().includes('voice')
  const totalSecs = durationSecs ?? (parseDurationSecs(row.duration) || 332)
  const displayCaller =
    row.contact.startsWith('+') || row.contact.startsWith('(') ? row.contact : callerNumber
  const displayUserRating = userRating
    ?? (callEndResultBadge ? getUserRatingForLogStatus(callEndResultBadge) : undefined)

  // Same "Coach agent" → "Track your feedback" flow as the Inbox transcript view — Coach agent
  // opens the Share-feedback modal; once submitted, that message's link switches to "Track your
  // feedback", pointing at the recommendation the feedback landed on.
  const { submitFeedback } = useFeedbackRecommendationsStore()
  const [recIdByMessage, setRecIdByMessage] = useState<Record<string, string>>({})
  const [shareFeedbackMessageId, setShareFeedbackMessageId] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showFeedbackToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const handleShareFeedbackClose = () => {
    setShareFeedbackMessageId(null)
  }

  const handleShareFeedbackSubmit = (details: string) => {
    if (!shareFeedbackMessageId) return
    const feedbackMessageId = shareFeedbackMessageId
    setShareFeedbackMessageId(null)
    showFeedbackToast('Feedback submitted! The agent will be trained on your input.')

    const recId = submitFeedback({
      text: details,
      agentName,
      conversation: {
        name: row.contact,
        message: details,
        channel: normalizeChannel(row.channel),
        date: row.timestamp,
        location: '',
      },
      conversationId: row.timestamp,
      messageId: feedbackMessageId,
    })
    setRecIdByMessage((prev) => ({ ...prev, [feedbackMessageId]: recId }))
  }

  // Chat auto-scrolls to track the call recording's playhead — the waveform itself stays put
  // (pinned above), only the transcript below it moves. A manual scroll (wheel/touch/drag)
  // suspends this until the user opts back in via "Resume auto scrolling".
  const [autoScroll, setAutoScroll] = useState(true)
  const [playbackProgress, setPlaybackProgress] = useState({ elapsed: 0, total: 0 })
  const chatScrollRef = useRef<HTMLDivElement>(null)
  // Set right before a programmatic scrollTop write, so the very next `onScroll` it fires can
  // be told apart from a genuine user-driven one (which should suspend auto-scroll).
  const isProgrammaticScrollRef = useRef(false)

  useEffect(() => {
    if (!autoScroll) return
    const el = chatScrollRef.current
    if (!el || playbackProgress.total <= 0) return
    const fraction = Math.min(1, Math.max(0, playbackProgress.elapsed / playbackProgress.total))
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    isProgrammaticScrollRef.current = true
    el.scrollTop = fraction * maxScroll
  }, [autoScroll, playbackProgress])

  const handleChatScroll = () => {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false
      return
    }
    setAutoScroll(false)
  }

  const transcriptNodes = transcript.map((entry) => (
    <TranscriptEntry
      key={entry.id}
      entry={entry}
      recId={entry.role === 'agent' ? recIdByMessage[entry.id] : undefined}
      onCoachAgent={entry.role === 'agent' ? () => setShareFeedbackMessageId(entry.id) : undefined}
      onTrackFeedback={
        entry.role === 'agent'
          ? () => recIdByMessage[entry.id] && onTrackFeedback?.(recIdByMessage[entry.id])
          : undefined
      }
    />
  ))

  const resumeAutoScrollButton = !autoScroll && (
    <button
      type="button"
      onClick={() => setAutoScroll(true)}
      className="absolute bottom-lg left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-xs rounded-sm bg-primary px-lg text-body text-white shadow-modal transition-colors hover:bg-primary-hover"
    >
      <Icon name="arrow_downward" size={16} className="text-white" />
      Resume auto scrolling
    </button>
  )

  return (
    <>
      <RunDetailsPanel
        steps={steps}
        showHeader={false}
        showCallRecording={hasVoiceCall}
        conversationTabLabel={hasVoiceCall ? 'Call transcript' : 'Conversation'}
        conversationContent={
          isReminder ? (
            <div className="relative flex h-full flex-col">
              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                className="min-h-0 flex-1 overflow-y-auto px-lg pb-2xl [scrollbar-gutter:stable_both-edges]"
              >
                <div className="flex flex-col gap-3xl pt-lg">
                  {showCallDetails && (
                    <CollapsibleCallDetails userRating={displayUserRating}>
                      <CallDetailsTab
                        callerNumber={displayCaller}
                        languageDetected={languageDetected}
                        durationSecs={totalSecs}
                        sidNumber={sidNumber}
                        startTime={startTimeLabel(row.timestamp)}
                        callEndReason={callEndReason}
                        routedVia={routedVia}
                        callEndResultBadge={callEndResultBadge}
                        userRating={displayUserRating}
                      />
                    </CollapsibleCallDetails>
                  )}
                  {/* Top spacing lives here (not on the scroll container) — the sticky waveform
                   *  below anchors to `top: 0` of the scroll container's padding edge, so any
                   *  padding-top on the container itself would leave a permanent gap once stuck. */}
                  <div>
                    <ChatSystemLabel text="Email conversation started" />
                  </div>
                  <AppointmentBookedCard time="08:03 PM" />
                  <EmailActionCard title="Appointment booked" />
                  <ReminderSentCard time="08:03 PM" />
                  <EmailActionCard title="Reminder confirmation" />
                  {hasVoiceCall && (
                    <>
                      <ChatSystemLabel text="Voice call started" />
                      <div className="sticky top-0 z-10 bg-surface pb-md pt-sm">
                        <div className="border border-transparent px-lg">
                          <p className="m-0 mb-sm text-[13px] tracking-[-0.26px] text-[#555]">
                            Call recording
                          </p>
                          <CallRecordingPlayer
                            audioUrl={audioUrl}
                            durationSecs={totalSecs}
                            padded={false}
                            onProgress={(elapsedSecs, playerTotalSecs) => setPlaybackProgress({ elapsed: elapsedSecs, total: playerTotalSecs })}
                          />
                        </div>
                      </div>
                      <CallAiSummary bullets={REMINDER_CALL_AI_SUMMARY} />
                      <CallTranscriptSection>
                        {transcriptNodes}
                      </CallTranscriptSection>
                    </>
                  )}
                  {!hasVoiceCall && transcriptNodes}
                </div>
              </div>
              {resumeAutoScrollButton}
            </div>
          ) : (
            <div className="relative flex h-full flex-col">
              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                className="min-h-0 flex-1 overflow-y-auto pb-sm [scrollbar-gutter:stable_both-edges]"
              >
                {/* Top spacing on scrollable content (not the container) so sticky recording
                 *  can dock flush under the tabs at `top: 0` with no permanent gap. */}
                {showCallDetails ? (
                  <div className="pt-lg">
                    <CollapsibleCallDetails userRating={displayUserRating}>
                      <CallDetailsTab
                        callerNumber={displayCaller}
                        languageDetected={languageDetected}
                        durationSecs={totalSecs}
                        sidNumber={sidNumber}
                        startTime={startTimeLabel(row.timestamp)}
                        callEndReason={callEndReason}
                        routedVia={routedVia}
                        callEndResultBadge={callEndResultBadge}
                        userRating={displayUserRating}
                      />
                    </CollapsibleCallDetails>
                  </div>
                ) : hasVoiceCall ? (
                  <div className="pt-lg" aria-hidden />
                ) : null}
                {hasVoiceCall && (
                  <div className="sticky top-0 z-10 bg-surface pb-md pt-sm">
                    {/* Same inset as Call details label (1px border + px-lg) for title + player. */}
                    <div className="border border-transparent px-lg">
                      <p className="m-0 mb-sm text-[13px] tracking-[-0.26px] text-[#555]">
                        Call recording
                      </p>
                      <CallRecordingPlayer
                        audioUrl={audioUrl}
                        durationSecs={totalSecs}
                        padded={false}
                        onProgress={(elapsedSecs, playerTotalSecs) => setPlaybackProgress({ elapsed: elapsedSecs, total: playerTotalSecs })}
                      />
                    </div>
                  </div>
                )}
                <div className={`flex flex-col gap-3xl ${hasVoiceCall ? 'mt-lg' : showCallDetails ? '' : 'pt-lg'}`}>
                  {hasVoiceCall && <CallAiSummary />}
                  {hasVoiceCall ? (
                    <CallTranscriptSection>
                      {showTranscriptTranslation && <TranscriptTranslationControl />}
                      {transcriptNodes}
                    </CallTranscriptSection>
                  ) : (
                    transcriptNodes
                  )}
                </div>
              </div>
              {resumeAutoScrollButton}
            </div>
          )
        }
      />

      <ShareFeedbackModal
        open={shareFeedbackMessageId !== null}
        onClose={handleShareFeedbackClose}
        onSubmit={handleShareFeedbackSubmit}
      />
      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
    </>
  )
}
