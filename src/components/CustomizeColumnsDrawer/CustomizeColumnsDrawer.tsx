import { useEffect, useMemo, useRef, useState } from 'react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { ColumnOption, CustomizeColumnsDrawerProps } from './CustomizeColumnsDrawer.types'
import { Check, GripVertical, Search } from 'lucide-react'

interface DraftItem extends ColumnOption {
  checked: boolean
}

function Checkbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border ${
        checked
          ? disabled
            ? 'border-control-disabled bg-control-disabled'
            : 'border-primary bg-primary'
          : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Check className="size-4 text-white" strokeWidth={1.6} absoluteStrokeWidth />}
    </span>
  )
}

export function CustomizeColumnsDrawer({
  open,
  options,
  visibleKeys,
  onClose,
  onSave,
  onRestoreDefault,
}: CustomizeColumnsDrawerProps) {
  const [draft, setDraft] = useState<DraftItem[]>([])
  const [query, setQuery] = useState('')
  const dragIndex = useRef<number | null>(null)

  // (Re)initialise the draft whenever the drawer opens.
  useEffect(() => {
    if (!open) return
    const visible = new Set(visibleKeys)
    const locked = options.filter((o) => o.locked)
    const rest = options.filter((o) => !o.locked)
    setDraft([...locked, ...rest].map((o) => ({ ...o, checked: o.locked || visible.has(o.key) })))
    setQuery('')
  }, [open, options, visibleKeys])

  const lockedCount = useMemo(() => draft.filter((d) => d.locked).length, [draft])
  const filtered = useMemo(
    () => draft.filter((d) => d.label.toLowerCase().includes(query.trim().toLowerCase())),
    [draft, query],
  )
  const dndEnabled = query.trim() === ''

  function toggle(key: string) {
    setDraft((d) => d.map((it) => (it.key === key && !it.locked ? { ...it, checked: !it.checked } : it)))
  }

  function onDragOverRow(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) return
    if (targetIndex < lockedCount) return // can't move above locked columns
    setDraft((d) => {
      const next = [...d]
      const [moved] = next.splice(from, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    dragIndex.current = targetIndex
  }

  function save() {
    onSave(
      draft.map((d) => d.key),
      draft.filter((d) => d.checked).map((d) => d.key),
    )
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
              Customize table view
            </h2>
          </div>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onRestoreDefault}
              className="rounded-sm px-md py-xs text-body font-medium text-text-action hover:bg-surface-hover"
            >
              Restore to default
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-primary px-lg py-[7px] text-body font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Save
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-lg overflow-y-auto px-2xl pb-2xl pt-md">
          <p className="text-body text-text-primary">
            Select the columns to show and order them by priority
          </p>

          {/* Search */}
          <div className="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface px-md">
            <Search className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search columns"
              className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
            />
          </div>

          {/* Column list */}
          <div className="flex flex-col gap-sm">
            {filtered.map((item) => {
              const index = draft.indexOf(item)
              const draggable = dndEnabled && !item.locked
              return (
                <div
                  key={item.key}
                  draggable={draggable}
                  onDragStart={() => (dragIndex.current = index)}
                  onDragOver={(e) => {
                    if (!dndEnabled) return
                    e.preventDefault()
                    onDragOverRow(index)
                  }}
                  onDragEnd={() => (dragIndex.current = null)}
                  onClick={() => toggle(item.key)}
                  className={`flex h-[38px] items-center gap-[9px] rounded-md border border-border-selected px-md transition-colors ${
                    item.locked ? 'cursor-default' : 'cursor-pointer hover:bg-surface-hover'
                  }`}
                >
                  <Checkbox checked={item.checked} disabled={item.locked} />
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                    {item.label}
                  </span>
                  {!item.locked && (
                    <GripVertical className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
                  )}
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p className="py-lg text-center text-body text-text-tertiary">No columns found.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
