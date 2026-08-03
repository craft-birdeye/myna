export interface MediaLibraryFolder {
  id: string
  name: string
  /** Up to 3 cover thumbnails shown in the folder's 2x2 grid. */
  images: string[]
  /** "+N" shown over the last cover cell for the rest of the folder's items. */
  overflowCount: number
  /** Full contents of the folder, shown when drilling into it to select items. */
  files: MediaLibraryFile[]
}

export interface MediaLibraryFile {
  id: string
  label: string
  thumbnail: string
}

export interface MediaLibraryModalProps {
  open: boolean
  onClose: () => void
  onDone: (selected: MediaLibraryFile[]) => void
  folders?: MediaLibraryFolder[]
  files?: MediaLibraryFile[]
}
