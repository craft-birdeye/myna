import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ExternalLink, Eye, Info, Search, X } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface TemplateItem {
  id: string
  category: string
  title: string
  preview: string
}

export interface TemplateCategory {
  id: string
  label: string
  count: number
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'appointment', label: 'Appointment reminder', count: 3 },
  { id: 'previsit',    label: 'Pre-visit',            count: 4 },
  { id: 'followup',   label: 'Follow-up',             count: 2 },
  { id: 'custom',     label: 'Custom',                count: 0 },
]

export const TEMPLATE_LIST: TemplateItem[] = [
  { id: 'tpl-5', category: 'appointment', title: 'Appointment confirmation',  preview: 'Hi [Patient Name], your appointment with Dr. [Provider] is confirmed for [Date] at [Time]. Reply CONFIRM to confirm or CANCEL to cancel.' },
  { id: 'tpl-6', category: 'appointment', title: '24-hour reminder',          preview: 'Reminder: your appointment is tomorrow at [Time]. Please arrive 10 minutes early and bring your insurance card and ID.' },
  { id: 'tpl-7', category: 'appointment', title: 'Day-of reminder',           preview: 'Good morning! You have an appointment today at [Time] with [Provider]. We look forward to seeing you.' },
  { id: 'tpl-1', category: 'previsit',    title: 'Pre-visit intake form',     preview: 'Hi [Patient Name], your appointment is on [Date]. Please complete your intake form before your visit to help us serve you better.' },
  { id: 'tpl-2', category: 'previsit',    title: 'Health history questionnaire', preview: 'Hi [Patient Name], to prepare for your upcoming appointment, please take a few minutes to complete your health history questionnaire.' },
  { id: 'tpl-3', category: 'previsit',    title: 'Forms completion reminder', preview: 'Hi [Patient Name], you still have outstanding intake forms to complete before your appointment on [Date].' },
  { id: 'tpl-4', category: 'previsit',    title: 'Appointment preparation guide', preview: "Hi [Patient Name], here's how to prepare for your visit with us. Please review the instructions and complete your forms." },
  { id: 'tpl-8', category: 'followup',    title: 'Post-visit summary',        preview: 'Thank you for visiting us today, [Patient Name]. Here is a summary of your visit and your next steps.' },
  { id: 'tpl-9', category: 'followup',    title: 'Follow-up care reminder',   preview: 'Hi [Patient Name], as discussed at your last visit, please remember to follow up with the recommended next steps.' },
]

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function TemplateThumbnail() {
  return (
    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-sm border border-border bg-surface-subtle p-xs">
      <div className="mb-xs h-3.5 rounded-sm bg-border" />
      <div className="mb-[3px] h-1.5 rounded-sm bg-surface-hover" />
      <div className="mb-[3px] h-1.5 rounded-sm bg-surface-hover" />
      <div className="mb-2 h-1.5 rounded-sm bg-surface-hover" />
      <div className="h-3.5 rounded-sm bg-primary opacity-30" />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface TemplatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (ids: string[]) => void
  initialSelected?: string[]
}

export function TemplatePickerModal({ isOpen, onClose, onSelect, initialSelected = [] }: TemplatePickerModalProps) {
  const [activeCategory, setActiveCategory] = useState('appointment')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  const filtered = TEMPLATE_LIST.filter(
    (t) =>
      t.category === activeCategory &&
      (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative flex max-h-[80vh] w-[720px] max-w-[95vw] flex-col overflow-hidden rounded-xl bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-md py-sm">
          <button
            type="button"
            className="mr-auto flex items-center gap-xs text-body text-text-action hover:underline"
          >
            Create template
            <ExternalLink className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <X className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-sm border-t border-border bg-[#e8f4fd] px-md py-sm">
          <Info className="size-4 shrink-0 text-[#1976d2]" strokeWidth={1.6} absoluteStrokeWidth />
          <span className="text-small text-text-primary">
            Select a template to pre-fill the message. You can edit it before sending.
          </span>
        </div>

        {/* Search */}
        <div className="border-b border-border px-md py-sm">
          <div className="flex items-center gap-sm rounded-sm border border-border px-sm">
            <Search className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            <input
              className="flex-1 bg-transparent py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[190px] shrink-0 overflow-y-auto border-r border-border pt-xs">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex w-full items-center justify-between border-l-2 px-md py-sm text-left text-body transition-colors ${
                  activeCategory === cat.id
                    ? 'border-primary bg-[#f0f6ff] text-primary'
                    : 'border-transparent text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count > 0 && (
                  <span className="text-small text-text-tertiary">{cat.count} ›</span>
                )}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto p-sm">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => toggle(tpl.id)}
                className={`mb-xs flex cursor-pointer items-start gap-md rounded-sm border p-sm transition-colors ${
                  selected.has(tpl.id)
                    ? 'border-primary bg-[#f0f6ff]'
                    : 'border-transparent hover:bg-surface-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(tpl.id)}
                  onChange={() => toggle(tpl.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-xs shrink-0 accent-primary"
                />
                <TemplateThumbnail />
                <div className="min-w-0 flex-1">
                  <div className="mb-xs text-body text-text-primary">{tpl.title}</div>
                  <div className="text-small text-text-secondary line-clamp-2">{tpl.preview}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-text-icon hover:text-text-primary"
                >
                  <Eye className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-2xl text-center text-body text-text-secondary">
                No templates found
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-md py-sm">
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-body text-text-action hover:underline"
          >
            Clear
          </button>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSelect(Array.from(selected))}
              className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white hover:bg-primary-hover"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Trigger field ─────────────────────────────────────────────────────────────

export interface TemplateSelectFieldProps {
  label: string
  selectedIds: string[]
  placeholder?: string
  onSelect: (ids: string[]) => void
}

export function TemplateSelectField({ label, selectedIds, placeholder = 'Select', onSelect }: TemplateSelectFieldProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const displayText =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
      ? (TEMPLATE_LIST.find((t) => t.id === selectedIds[0])?.title ?? '1 selected')
      : `${selectedIds.length} selected`

  return (
    <>
      <div className="flex flex-col gap-xs">
        <label className="text-small text-text-primary">{label}</label>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex h-[34px] w-full items-center gap-sm rounded-md border border-border-input bg-surface pl-md pr-sm hover:bg-surface-l2"
        >
          <span
            className={`min-w-0 flex-1 truncate text-left text-body ${
              selectedIds.length > 0 ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            {displayText}
          </span>
          <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      <TemplatePickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(ids) => { onSelect(ids); setModalOpen(false) }}
        initialSelected={selectedIds}
      />
    </>
  )
}
