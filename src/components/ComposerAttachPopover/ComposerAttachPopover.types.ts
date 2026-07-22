export type AttachItemKind = 'file' | 'tool' | 'procedure'

export interface AttachItem {
  id: string
  kind: AttachItemKind
  label: string
  /** Material Symbol name shown before the label */
  icon?: string
}

export interface ComposerAttachPopoverProps {
  /** Called with the picked item; "+ Add file" fires { id: 'add-file', kind: 'file', label: 'Add file' } */
  onSelect: (item: AttachItem) => void
  disabled?: boolean
  /** Override the built-in Birdeye tool list */
  tools?: AttachItem[]
  /** Override the built-in procedure list */
  procedures?: AttachItem[]
}
