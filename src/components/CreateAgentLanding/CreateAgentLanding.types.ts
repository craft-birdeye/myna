import type { ReactNode } from 'react'
import type { AttachItem } from '../ComposerAttachPopover/ComposerAttachPopover.types'
import type { AttachMenuOption } from '../AttachMenuPopover/AttachMenuPopover.types'

export interface CreateAgentLandingOption {
  label: string
  onSelect: () => void
}

export interface CreateAgentLandingProps {
  /** e.g. "Hi! I'm here to help you build your Reminder agent. Tell me what you'd like to build" */
  greeting: ReactNode
  options: CreateAgentLandingOption[]
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  attachments?: AttachItem[]
  onRemoveAttachment?: (id: string) => void
  /** Renders the attach (+) popover when set; omit to leave attach non-interactive. */
  onAttach?: (option: AttachMenuOption) => void
  /** Renders the greeting like a regular conversation turn (24px avatar, body-size text) and
   *  swaps the bigger attach/dictate/context/more composer for the plain `PromptComposer` used
   *  by the rest of the conversation — for surfaces where this is a returning-user utility panel,
   *  not a first-time "build something from scratch" moment that warrants a hero treatment. */
  compact?: boolean
  className?: string
}
