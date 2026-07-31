import type { ComponentType } from 'react'
import type { SavedCreateChat } from '../../data/createAgentChatStore'

export interface AiAssistHistoryItem {
  id: string
  title: string
  /** Relative label shown under the title (e.g. "2 hours ago"). */
  date?: string
  /** Canned prompt used to start a brand-new conversation when no past transcript is available below. */
  prompt?: string
  /**
   * Past conversation for this recent chat. When present, selecting the item replays it statically
   * (with a composer to continue) via `CreateConversation`'s `historyChat` prop instead of re-starting
   * the live flow with `prompt`.
   */
  draftTitle?: string
  draftDescription?: string
  replies?: string[][]
}

export interface AiAssistCreateConversationProps {
  variant: 'frontdesk' | 'reminder'
  initialPrompt: string
  autoStart?: boolean
  pageTitle?: string
  onBack?: () => void
  onViewWorkflow?: () => void
  onDraftReady?: (name: string | null) => void
  /** Set together with `historyChat` to replay a past recent chat instead of starting a new one. */
  historyChatId?: string | null
  historyChat?: SavedCreateChat | null
  workflowVisible?: boolean
  selectedCanvasNode?: { id: string; label: string; flowType: string } | null
  onClearSelectedCanvasNode?: () => void
}

export interface AiAssistPanelProps {
  /** First name shown in the greeting (e.g. "Hi John!"). Defaults to "John". */
  userName?: string
  /** Current agent — used to pick Front desk vs Reminder zero-state copy. */
  agentName?: string
  /**
   * `build` (default) = create-agent copy; `analyze` = instance Workflow-tab copy
   * ("help you analyze your front desk agent" + outcome/gap CTAs).
   */
  mode?: 'build' | 'analyze'
  /** Close the panel. */
  onClose: () => void
  /**
   * When set, shows a diagonal expand control that leaves the docked-canvas layout
   * for full-page AI assist. Omit on the instance Workflow-tab analyze panel.
   */
  onExpand?: () => void
  /** Reflects whether AI assist is currently expanded to full page. */
  expanded?: boolean
  /** Optional hook when New chat is clicked. */
  onNewChat?: () => void
  /** Zero-state suggestion chips. */
  suggestions?: readonly string[]
  /** Items shown in the history list. */
  historyItems?: readonly AiAssistHistoryItem[]
  /** Canvas node selected while this panel is open — shown as a composer pill. */
  selectedCanvasNode?: { id: string; label: string; flowType: string } | null
  onClearSelectedCanvasNode?: () => void
  /**
   * When provided, suggestion / send starts the Front desk or Reminder create-agent
   * conversation in place of the zero-state greeting.
   */
  CreateConversation?: ComponentType<AiAssistCreateConversationProps>
}
