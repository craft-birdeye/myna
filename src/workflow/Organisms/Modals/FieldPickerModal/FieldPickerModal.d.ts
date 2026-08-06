import type { FC, ReactNode } from 'react'

export interface FieldPickerModalProps {
  onClose: () => void
  onSelectField: (value: string, name?: string) => void
  anchorEl?: HTMLElement | null
  overlayZIndex?: number
  showTriggerFields?: boolean
}

declare const FieldPickerModal: FC<FieldPickerModalProps>
export default FieldPickerModal
