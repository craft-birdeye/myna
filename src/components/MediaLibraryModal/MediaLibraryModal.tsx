import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import photo1 from '../../assets/media-library/photo-1.jpg'
import photo2 from '../../assets/media-library/photo-2.jpg'
import photo3 from '../../assets/media-library/photo-3.jpg'
import photo4 from '../../assets/media-library/photo-4.jpg'
import photo5 from '../../assets/media-library/photo-5.jpg'
import photo6 from '../../assets/media-library/photo-6.jpg'
import photo7 from '../../assets/media-library/photo-7.jpg'
import photo8 from '../../assets/media-library/photo-8.jpg'
import photo9 from '../../assets/media-library/photo-9.jpg'
import photo10 from '../../assets/media-library/photo-10.jpg'
import photo11 from '../../assets/media-library/photo-11.jpg'
import photo12 from '../../assets/media-library/photo-12.jpg'
import type { MediaLibraryFile, MediaLibraryFolder, MediaLibraryModalProps } from './MediaLibraryModal.types'

const DEFAULT_FOLDERS: MediaLibraryFolder[] = [
  { id: 'facility', name: 'Facility photos', images: [photo1, photo2, photo3], badge: 10, overflowCount: 4 },
  { id: 'team', name: 'Team', images: [photo4, photo5, photo6], overflowCount: 3 },
  { id: 'promotions', name: 'Promotions', images: [photo7, photo8, photo9], overflowCount: 40 },
  { id: 'before-after', name: 'Before & after', images: [photo10, photo11, photo12], overflowCount: 10 },
]

const DEFAULT_FILES: MediaLibraryFile[] = [
  { id: 'file-1', label: 'clinic-exterior.jpg', thumbnail: photo1 },
  { id: 'file-2', label: 'reception-desk.jpg', thumbnail: photo2 },
  { id: 'file-3', label: 'team-photo.jpg', thumbnail: photo4 },
  { id: 'file-4', label: 'waiting-room-tour.jpg', thumbnail: photo5 },
  { id: 'file-5', label: 'promo-banner.jpg', thumbnail: photo7 },
]

function Checkbox({ checked, onChange, ariaLabel }: { checked: boolean; onChange: () => void; ariaLabel?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
    </button>
  )
}

function FolderCover({ folder }: { folder: MediaLibraryFolder }) {
  return (
    <div className="flex w-[216px] shrink-0 flex-col gap-sm">
      <div className="relative size-[216px] rounded-lg border border-border bg-surface-l2 p-[11px]">
        <div className="grid size-full grid-cols-2 grid-rows-2 gap-sm">
          {folder.images.slice(0, 3).map((src, i) => (
            <div key={i} className="overflow-hidden rounded-[4px] border border-border bg-surface">
              <img src={src} alt="" className="size-full object-cover" />
            </div>
          ))}
          <div className="flex items-center justify-center overflow-hidden rounded-[4px] border border-border bg-surface">
            <span className="text-body text-text-primary">+{folder.overflowCount}</span>
          </div>
        </div>
        {folder.badge != null && (
          <span className="absolute -top-xs left-lg flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white bg-primary px-xs text-small text-white">
            {folder.badge}
          </span>
        )}
      </div>
      <p className="text-small text-text-primary">{folder.name}</p>
    </div>
  )
}

// Centered modal matching the "Media library" Figma spec (Content Hub 9894:64621):
// header + close, a horizontal row of folder covers, then a checkbox list of
// individual media files, and a footer with the selection count + Done.
export function MediaLibraryModal({
  open,
  onClose,
  onDone,
  folders = DEFAULT_FOLDERS,
  files = DEFAULT_FILES,
}: MediaLibraryModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (open) setSelectedIds([])
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleDone() {
    onDone(files.filter((f) => selectedIds.includes(f.id)))
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-library-modal-title"
        className="relative flex h-[calc(100vh-130px)] w-full max-w-[1200px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl py-md">
          <h2 id="media-library-modal-title" className="text-body text-text-primary">
            Media library
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-xl overflow-y-auto px-2xl pb-lg">
          <div className="flex flex-col gap-sm">
            <p className="text-small text-text-secondary">Folders</p>
            <div className="flex flex-wrap gap-lg">
              {folders.map((folder) => (
                <FolderCover key={folder.id} folder={folder} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-sm">
            <p className="text-small text-text-secondary">Other media</p>
            <div className="flex flex-col">
              {files.map((file) => {
                const checked = selectedIds.includes(file.id)
                return (
                  <label
                    key={file.id}
                    className="flex w-full cursor-pointer items-center gap-md border-b border-border py-sm last:border-0"
                  >
                    <Checkbox checked={checked} onChange={() => toggle(file.id)} ariaLabel={file.label} />
                    <div className="size-[50px] shrink-0 overflow-hidden rounded-sm border border-border bg-surface-l2">
                      <img src={file.thumbnail} alt="" className="size-full object-cover" />
                    </div>
                    <span className="text-small text-text-primary">{file.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-2xl py-md">
          <p className="text-body text-text-primary">{selectedIds.length} files selected</p>
          <button
            type="button"
            onClick={handleDone}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
