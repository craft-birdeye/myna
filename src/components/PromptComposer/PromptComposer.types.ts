import type { RefKind } from '../../data/procedureData'
import type { AttachMenuOption } from '../AttachMenuPopover/AttachMenuPopover.types'

export interface PromptComposerAttachment {
  id: string
  kind: RefKind
  label: string
}

export interface PromptComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  /** Disables only the send button (e.g. empty input) while the field stays editable. */
  sendDisabled?: boolean
  rows?: number
  attachments?: PromptComposerAttachment[]
  onRemoveAttachment?: (id: string) => void
  /** Renders the attach ("+") button as a popover when provided; otherwise a plain non-interactive button. */
  onAttach?: (option: AttachMenuOption) => void
  onFocus?: () => void
  onClick?: () => void
  className?: string
}
