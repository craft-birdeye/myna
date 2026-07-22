import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import type { AttachItem, ComposerAttachPopoverProps } from './ComposerAttachPopover.types'

// Birdeye front desk integrations offered by default.
const DEFAULT_TOOLS: AttachItem[] = [
  { id: 'tool-scheduler', kind: 'tool', label: 'Appointment scheduler', icon: 'calendar_today' },
  { id: 'tool-ehr', kind: 'tool', label: 'Patient records (EHR)', icon: 'clinical_notes' },
  { id: 'tool-insurance', kind: 'tool', label: 'Insurance verification', icon: 'verified_user' },
  { id: 'tool-messaging', kind: 'tool', label: 'Messaging (SMS)', icon: 'sms' },
  { id: 'tool-voice', kind: 'tool', label: 'Voice call', icon: 'call' },
]

const DEFAULT_PROCEDURES: AttachItem[] = [
  { id: 'proc-intake', kind: 'procedure', label: 'New patient intake', icon: 'menu_book' },
  { id: 'proc-book', kind: 'procedure', label: 'Book new appointment', icon: 'menu_book' },
  { id: 'proc-emergency', kind: 'procedure', label: 'Handle emergency or urgent concern', icon: 'menu_book' },
  { id: 'proc-human', kind: 'procedure', label: 'Talk to human', icon: 'menu_book' },
]

const ADD_FILE_ITEM: AttachItem = { id: 'add-file', kind: 'file', label: 'Add file' }

type TabId = 'all' | 'files' | 'tools' | 'procedures'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'files', label: 'Files' },
  { id: 'tools', label: 'Tools' },
  { id: 'procedures', label: 'Procedures' },
]

function SectionHeader({ label }: { label: string }) {
  return <p className="px-md py-sm text-small text-text-tertiary">{label}</p>
}

function ItemRow({ item, onPick }: { item: AttachItem; onPick: (item: AttachItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(item)}
      className="flex w-full items-center gap-md px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
    >
      {item.icon && <Icon name={item.icon} size={18} className="shrink-0 text-text-icon" />}
      <span className="truncate">{item.label}</span>
    </button>
  )
}

// Plus-button trigger + anchored attach popover for chat composers:
// pick an integrated tool, an available procedure, or add a file.
export function ComposerAttachPopover({
  onSelect,
  disabled = false,
  tools = DEFAULT_TOOLS,
  procedures = DEFAULT_PROCEDURES,
}: ComposerAttachPopoverProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('all')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) setTab('all')
  }, [open])

  const pick = (item: AttachItem) => {
    onSelect(item)
    setOpen(false)
  }

  const showFiles = tab === 'all' || tab === 'files'
  const showTools = (tab === 'all' || tab === 'tools') && tools.length > 0
  const showProcedures = (tab === 'all' || tab === 'procedures') && procedures.length > 0

  return (
    <div ref={wrapperRef} className="relative flex">
      <button
        type="button"
        aria-label="Add"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`hover:text-text-primary ${open ? 'text-text-primary' : ''} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Icon name="add" size={20} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-sm flex w-[320px] flex-col rounded-lg border border-border bg-surface shadow-dropdown">
          <div className="flex items-center gap-xs px-md pt-md">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={tab === t.id}
                className={`rounded-sm px-sm py-xs text-body ${
                  tab === t.id ? 'bg-surface-selected text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Fixed height so the panel doesn't resize when switching tabs */}
          <div className="flex h-[360px] flex-col overflow-y-auto py-sm">
            {tab === 'files' ? (
              <button
                type="button"
                onClick={() => pick(ADD_FILE_ITEM)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  pick(ADD_FILE_ITEM)
                }}
                className="mx-md mb-sm flex flex-1 flex-col items-center justify-center gap-sm rounded-lg border border-dashed border-border-strong text-center hover:bg-surface-hover"
              >
                <Icon name="upload" size={28} className="text-text-secondary" />
                <span className="text-body text-text-secondary">
                  <span className="text-text-action">Click</span> or drag and drop
                </span>
              </button>
            ) : (
              <>
                {showFiles && (
                  <>
                    <SectionHeader label="Files" />
                    <button
                      type="button"
                      onClick={() => setTab('files')}
                      className="flex w-full items-center gap-md px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                    >
                      <Icon name="add" size={18} className="shrink-0 text-text-icon" />
                      Add file
                    </button>
                  </>
                )}

                {showTools && (
                  <>
                    <SectionHeader label="Tools" />
                    {tools.map((item) => (
                      <ItemRow key={item.id} item={item} onPick={pick} />
                    ))}
                  </>
                )}

                {showProcedures && (
                  <>
                    <SectionHeader label="Procedures" />
                    {procedures.map((item) => (
                      <ItemRow key={item.id} item={item} onPick={pick} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
