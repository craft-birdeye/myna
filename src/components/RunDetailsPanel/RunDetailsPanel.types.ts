export interface RunLogField {
  key: string
  value?: string
  /** When present, renders as a collapsible nested block instead of a plain value. */
  properties?: RunLogField[]
}

export type RunLogStepType = 'trigger' | 'task' | 'delay' | 'branch'

export interface RunLogStep {
  id: string
  type: RunLogStepType
  stepNumber: number
  title: string
  /** Defaults to "Branch output" for branch steps, "Task output" otherwise. */
  outputLabel?: string
  output?: RunLogField[]
  inputs?: RunLogField[]
  tool?: { name: string; properties: RunLogField[] }
  /** Plain status line shown instead of output/inputs (e.g. delay steps). */
  note?: string
}

// Conversation entry shape is shared with the inbox deep-link data.
export type {
  ReminderConversationCardField as RunConversationCardField,
  ReminderConversationEntry as RunConversationEntry,
} from '../../data/reminderInboxConversation'
import type { ReminderConversationEntry } from '../../data/reminderInboxConversation'

export interface RunDetailsPanelProps {
  onViewConversation?: () => void
  steps?: RunLogStep[]
  conversation?: ReminderConversationEntry[]
  /** When false, hides Logs/Conversation tabs and shows logs only. Default true. */
  showTabs?: boolean
  /** Panel header title. Default "Run details". */
  title?: string
  /** When false, hides the header row (title + optional "View conversation" button) entirely.
   *  Default true. */
  showHeader?: boolean
  /** Renders a call-recording waveform inline in the Conversation tab, right after whichever
   *  system entry has `insertCallRecordingAfter` set — sticky once scrolled past. Only meaningful
   *  when the underlying call actually included a voice leg. Default false. */
  showCallRecording?: boolean
  audioUrl?: string
  durationSecs?: number
  /** Shows a third "Call details" tab (Caller number, Language detected, Duration, Call SID,
   *  Start time, Call end reason, Routed via) when provided. */
  callDetails?: {
    callerNumber: string
    languageDetected: string
    duration: string
    sidNumber: string
    startTime: string
    callEndReason: string
    routedVia: string
  }
}
