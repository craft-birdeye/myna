export interface TranscriptSidePanelLine {
  speaker: string
  text: string
}

export interface TranscriptSidePanelProps {
  open: boolean
  title?: string
  lines: TranscriptSidePanelLine[]
  onClose: () => void
}
