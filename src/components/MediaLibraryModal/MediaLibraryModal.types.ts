export interface MediaLibraryFolder {
  id: string
  name: string
  /** Up to 3 cover thumbnails shown in the folder's 2x2 grid. */
  images: string[]
  /** Total item count shown as a small badge on the cover (e.g. "10"). */
  badge?: number
  /** "+N" shown over the last cover cell for the rest of the folder's items. */
  overflowCount: number
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
