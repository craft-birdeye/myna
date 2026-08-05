export type AttachMenuOption = 'upload-image' | 'media-library' | 'files'

export interface AttachMenuPopoverProps {
  onSelect: (option: AttachMenuOption) => void
  disabled?: boolean
  className?: string
}
