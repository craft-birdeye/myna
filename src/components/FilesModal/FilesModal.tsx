import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import iconFilePdf from '../../assets/icon-file-pdf.png'
import iconFileXls from '../../assets/icon-file-xls.png'
import iconFilePpt from '../../assets/icon-file-ppt.png'
import type { FilesModalFile, FilesModalFileType, FilesModalProps } from './FilesModal.types'

const FILE_TYPE_STYLE: Record<FilesModalFileType, { bg: string; icon: string }> = {
  pdf: { bg: '#feeceb', icon: iconFilePdf },
  xls: { bg: '#f1faf0', icon: iconFileXls },
  ppt: { bg: '#ffefea', icon: iconFilePpt },
}

const DEFAULT_FILES: FilesModalFile[] = [
  { id: 'file-1', label: 'front-desk-SOP.pdf', type: 'pdf' },
  { id: 'file-2', label: 'appointment-schedule.xls', type: 'xls' },
  { id: 'file-3', label: 'front-desk-training.ppt', type: 'ppt' },
  { id: 'file-4', label: 'insurance-faq.pdf', type: 'pdf' },
  { id: 'file-5', label: 'call-volume-report.xls', type: 'xls' },
  { id: 'file-6', label: 'staff-onboarding-deck.ppt', type: 'ppt' },
  { id: 'file-7', label: 'hipaa-consent-form.pdf', type: 'pdf' },
  { id: 'file-8', label: 'patient-waitlist.xls', type: 'xls' },
  { id: 'file-9', label: 'clinic-marketing-plan.ppt', type: 'ppt' },
  { id: 'file-10', label: 'patient-intake-form.pdf', type: 'pdf' },
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

// Centered modal matching the "Files" Figma spec (Content Hub 9894:64966):
// a "Select all" row, then a checkbox list of files with type-colored icons,
// and a footer with the selection count + Done.
export function FilesModal({ open, onClose, onDone, files = DEFAULT_FILES }: FilesModalProps) {
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

  const allSelected = files.length > 0 && selectedIds.length === files.length

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : files.map((f) => f.id))
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
        aria-labelledby="files-modal-title"
        className="relative flex h-[calc(100vh-130px)] w-full max-w-[1200px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl py-md">
          <h2 id="files-modal-title" className="text-body text-text-primary">
            Files
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

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2xl pb-lg">
          <label className="flex w-full cursor-pointer items-center gap-md py-md">
            <Checkbox checked={allSelected} onChange={toggleAll} ariaLabel="Select all" />
            <span className="text-small text-text-secondary">Select all</span>
          </label>

          {files.map((file) => {
            const checked = selectedIds.includes(file.id)
            const style = FILE_TYPE_STYLE[file.type]
            return (
              <label key={file.id} className="flex w-full cursor-pointer items-center gap-md py-md">
                <Checkbox checked={checked} onChange={() => toggle(file.id)} ariaLabel={file.label} />
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: style.bg }}
                >
                  <img src={style.icon} alt="" className="size-6" />
                </div>
                <span className="text-small text-text-secondary">{file.label}</span>
              </label>
            )
          })}
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
