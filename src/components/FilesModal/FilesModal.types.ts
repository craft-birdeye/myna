export type FilesModalFileType = 'pdf' | 'xls' | 'ppt'

export interface FilesModalFile {
  id: string
  label: string
  type: FilesModalFileType
}

export interface FilesModalProps {
  open: boolean
  onClose: () => void
  onDone: (selected: FilesModalFile[]) => void
  files?: FilesModalFile[]
}
