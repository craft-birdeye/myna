export interface RunLogField {
  key: string
  value?: string
  /** When present, renders as a collapsible nested block instead of a plain value. */
  properties?: RunLogField[]
}

export type RunLogStepType = 'trigger' | 'task' | 'delay' | 'branch' | 'procedures'

export interface RunLogStep {
  id: string
  type: RunLogStepType
  stepNumber: number
  title: string
  /** Canvas node id to pan/highlight when this log step is clicked. */
  nodeId?: string
  /** Defaults to "Trigger output" / "Procedure output" / "Branch output" / "Action output". */
  outputLabel?: string
  output?: RunLogField[]
  inputs?: RunLogField[]
  tool?: { name: string; properties: RunLogField[] }
  /** Plain status line shown instead of output/inputs (e.g. delay steps). */
  note?: string
  /** Wall-clock time for this step in milliseconds; falls back to a type-based default when omitted. */
  durationMs?: number
}

// Conversation entry shape is shared with the inbox deep-link data.
export type {
  ReminderConversationCardField as RunConversationCardField,
  ReminderConversationEntry as RunConversationEntry,
} from '../../data/reminderInboxConversation'
import type { ReactNode } from 'react'
import type { ReminderConversationEntry } from '../../data/reminderInboxConversation'

export interface RunDetailsPanelProps {
  onViewConversation?: () => void
  steps?: RunLogStep[]
  conversation?: ReminderConversationEntry[]
  /** Overrides the built-in `RunConversationThread` rendering of `conversation` with arbitrary
   *  content (e.g. `LogDetailsPanel`'s own call-transcript layout). Takes precedence when set. */
  conversationContent?: ReactNode
  /** When false, hides Logs/Conversation tabs and shows logs only. Default true. */
  showTabs?: boolean
  /** Conversation-tab label. Default "Conversation"; voice-call logs use "Call transcript". */
  conversationTabLabel?: string
  /** Logs-tab label. Default "Log"; review agents use "Logs". */
  logsTabLabel?: string
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
  /** When provided (or via `callDetailsContent`), shows a collapsible "Call details" section at
   *  the top of the Conversation tab — Caller number, Language detected, Duration, Call SID,
   *  Start time, Call end reason, Routed via. Collapsed on first land. */
  callDetails?: {
    callerNumber: string
    languageDetected: string
    duration: string
    sidNumber: string
    startTime: string
    callEndReason: string
    routedVia: string
  }
  /** Overrides the built-in call-details fields with arbitrary content. When set (or when
   *  `callDetails` is set), a collapsible "Call details" section appears at the top of the
   *  Conversation tab (collapsed on first land). */
  callDetailsContent?: ReactNode
  /** Agent instance name — enables the Coach agent / Track your feedback flow on business bubbles
   *  in the Conversation tab (matching `LogDetailsPanel`) and tags any submitted feedback with it. */
  agentName?: string
  /** Navigates to the recommendation a message's feedback landed on (see agentName). */
  onTrackFeedback?: (recommendationId: string) => void
  /** Hover "View" on a log step to focus the matching canvas node (`step.nodeId` or resolved by title). */
  onStepFocus?: (step: RunLogStep) => void
  /** Shown in the collapsible Call details header when `callDetails` / `callDetailsContent` is set. */
  userRating?: string
  /** When set, renders a collapsible AI summary at the top of the Conversation tab (e.g. Reminder
   *  multi-channel thread summary above email/voice events). */
  conversationAiSummary?: string[]
}
