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
}
