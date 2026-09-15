import type { FC, ReactNode } from 'react'

export interface FieldPickerModalProps {
  onClose: () => void
  onSelectField: (value: string, name?: string, field?: { valueType?: string; name?: string; value?: string }) => void
  anchorEl?: HTMLElement | null
  overlayZIndex?: number
  showTriggerFields?: boolean
  placement?: 'dock' | 'dropdown'
  insertedText?: string
  /** When set, only these categories are shown (skips Business / Location / Contact). */
  categories?: unknown[]
}

declare const FieldPickerModal: FC<FieldPickerModalProps>
export default FieldPickerModal
