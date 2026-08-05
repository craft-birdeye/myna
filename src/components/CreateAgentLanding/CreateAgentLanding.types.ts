import type { RefKind } from '../../data/procedureData'
import type { AttachMenuOption } from '../AttachMenuPopover/AttachMenuPopover.types'

export interface CreateAgentLandingOption {
  label: string
  onSelect: () => void
}

export interface CreateAgentLandingAttachment {
  id: string
  kind: RefKind
  label: string
}

export interface CreateAgentLandingProps {
  /** e.g. "Hi! I'm here to help you build your Front desk agent. Tell me what you'd like to build" */
  greeting: string
  options: CreateAgentLandingOption[]
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  attachments?: CreateAgentLandingAttachment[]
  onRemoveAttachment?: (id: string) => void
  onAttach?: (option: AttachMenuOption) => void
  className?: string
}
