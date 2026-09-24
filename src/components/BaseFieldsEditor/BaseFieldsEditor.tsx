import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Chip } from '../Chip/Chip'
import { Icon } from '../Icon/Icon'
import { MoreLabelsCell } from '../MoreLabelsCell/MoreLabelsCell'
import { Tabs } from '../Tabs/Tabs'
import {
  FIELD_TYPE_OPTIONS,
  defaultFieldOptions,
  isOptionFieldType,
  type FieldType,
  type TemplateField,
} from '../../data/bookingTemplatesData'
import type { BaseFieldsEditorProps } from './BaseFieldsEditor.types'

const FIELD_TYPE_GLYPH: Record<FieldType, { text?: string; icon?: string }> = {
  text: { text: 'T' },
  number: { text: '123' },
  date: { icon: 'calendar_today' },
  'dropdown-single': { icon: 'radio_button_checked' },
  'dropdown-multi': { icon: 'check_box' },
  'multiple-choice': { icon: 'checklist' },
}

/** Prefix glyph shown beside each answer option while editing. */
function optionMarkerIcon(type: FieldType): string {
  if (type === 'dropdown-multi') return 'check_box_outline_blank'
  if (type === 'dropdown-single') return 'radio_button_unchecked'
  return 'radio_button_unchecked'
}

export function FieldTypeIcon({ type }: { type: FieldType }) {
  const glyph = FIELD_TYPE_GLYPH[type]
  return (
    <span className="flex w-6 shrink-0 items-center justify-center text-small text-text-tertiary">
      {glyph?.icon ? <Icon name={glyph.icon} size={16} /> : (glyph?.text ?? '?')}
    </span>
  )
}

export function fieldTypeLabel(type: FieldType): string {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export interface SimpleSelectOption {
  value: string
  label: string
  icon?: ReactNode
}
interface SimpleSelectProps {
  value: string
  options: SimpleSelectOption[]
  onChange: (v: string) => void
  className?: string
}
export function SimpleSelect({ value, options, onChange, className = '' }: SimpleSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  const selected = options.find((o) => o.value === value)
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center justify-between gap-sm rounded-sm border px-md text-body text-text-primary transition-colors hover:bg-surface-hover ${open ? 'border-primary' : 'border-border-input'}`}
      >
        <span className="flex min-w-0 items-center gap-sm">
          {selected?.icon}
          <span className="truncate">{selected?.label ?? 'Select'}</span>
        </span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} className="shrink-0 text-text-icon" />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-[70] w-full min-w-[240px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="flex w-full items-center gap-sm px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Google Forms–style answer options list for choice field types. */
function OptionsEditor({
  type,
  options,
  onChange,
}: {
  type: FieldType
  options: string[]
  onChange: (next: string[]) => void
}) {
  const marker = optionMarkerIcon(type)
  const canRemove = options.length > 2

  function updateOption(index: number, value: string) {
    onChange(options.map((opt, i) => (i === index ? value : opt)))
  }

  function removeOption(index: number) {
    if (!canRemove) return
    onChange(options.filter((_, i) => i !== index))
  }

  function addOption() {
    onChange([...options, `Option ${options.length + 1}`])
  }

  return (
    <div className="flex flex-col gap-sm">
      <label className="text-small text-text-secondary">Options</label>
      <div className="flex flex-col gap-xs">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-sm">
            <Icon name={marker} size={18} className="shrink-0 text-text-tertiary" />
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="h-9 min-w-0 flex-1 rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
            />
            <button
              type="button"
              aria-label={`Remove option ${i + 1}`}
              disabled={!canRemove}
              onClick={() => removeOption(i)}
              className={`flex size-6 shrink-0 items-center justify-center rounded-sm ${
                canRemove ? 'text-text-icon hover:bg-surface-hover' : 'cursor-not-allowed text-text-tertiary opacity-40'
              }`}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-xs self-start text-body text-text-action"
      >
        <Icon name="add" size={18} />
        Add option
      </button>
    </div>
  )
}

const TYPE_SELECT_OPTIONS: SimpleSelectOption[] = FIELD_TYPE_OPTIONS.map((o) => ({
  ...o,
  icon: <FieldTypeIcon type={o.value} />,
}))

/** Inline add/edit field form — Label + Type + (Options for choice types) + Required.
    Shared by base form fields and field-group extra fields. */
export function AddFieldForm({
  field,
  onAdd,
  onCancel,
}: {
  /** When set, the form edits this field instead of creating a new one. */
  field?: TemplateField
  onAdd: (field: TemplateField) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(field?.label ?? '')
  const [type, setType] = useState<FieldType>(field?.type ?? 'text')
  const [required, setRequired] = useState(field?.required ?? false)
  const [options, setOptions] = useState<string[]>(
    field?.options && field.options.length >= 2 ? [...field.options] : defaultFieldOptions(),
  )
  const canSave = label.trim().length > 0 && (
    !isOptionFieldType(type) || options.every((o) => o.trim().length > 0)
  )
  const isEdit = Boolean(field)
  const showOptions = isOptionFieldType(type)

  function handleTypeChange(next: string) {
    const nextType = next as FieldType
    setType(nextType)
    if (isOptionFieldType(nextType) && options.length < 2) {
      setOptions(defaultFieldOptions())
    }
  }

  return (
    <div className="flex flex-col gap-md rounded-sm border border-border-input bg-surface-l2 p-lg">
      <div className="flex flex-col gap-md sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-xs block text-small text-text-secondary">Label</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Preferred language"
            className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
          />
        </div>
        <div className="w-full sm:w-[260px]">
          <label className="mb-xs block text-small text-text-secondary">Field type</label>
          <SimpleSelect value={type} options={TYPE_SELECT_OPTIONS} onChange={handleTypeChange} />
        </div>
      </div>

      {showOptions && (
        <OptionsEditor type={type} options={options} onChange={setOptions} />
      )}

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-sm">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-primary" />
          <span className="text-body text-text-primary">Required</span>
        </label>
        <div className="flex items-center gap-md">
          <button type="button" onClick={onCancel} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onAdd({
                id: field?.id ?? `field-${Date.now()}`,
                label: label.trim(),
                type,
                required,
                ...(isOptionFieldType(type)
                  ? { options: options.map((o) => o.trim()) }
                  : { options: undefined }),
                ...(field?.system ? { system: true } : {}),
              })
            }}
            className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
              canSave ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            {isEdit ? 'Save' : 'Add field'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** "Myself / Someone else" tabbed base-fields list — used by both the Booking template editor
    (fully editable) and the appointment widget editor's Configuration tab (read-only once the
    widget is based on a template, since the fields are inherited from it). */
export function BaseFieldsEditor({ value, onChange, readOnly = false }: BaseFieldsEditorProps) {
  const [tab, setTab] = useState<'myself' | 'someone-else'>('myself')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)

  const activeList = tab === 'myself' ? value.myself : value.someoneElse

  function setActiveList(next: TemplateField[]) {
    onChange(tab === 'myself' ? { ...value, myself: next } : { ...value, someoneElse: next })
  }

  function startAdd() {
    setEditingId(null)
    setAdding(true)
  }

  function startEdit(id: string) {
    setAdding(false)
    setEditingId(id)
  }

  /** Custom fields always sit after the fixed system fields — dragging can only reorder within that tail. */
  function reorderCustomField(targetIndex: number) {
    const from = dragIndex.current
    if (from === null || from === targetIndex) return
    const firstCustomIndex = activeList.findIndex((f) => !f.system)
    if (firstCustomIndex === -1 || targetIndex < firstCustomIndex) return
    const next = [...activeList]
    const [moved] = next.splice(from, 1)
    next.splice(targetIndex, 0, moved)
    setActiveList(next)
    dragIndex.current = targetIndex
  }

  return (
    <div>
      <Tabs
        tabs={[{ id: 'myself', label: 'Myself' }, { id: 'someone-else', label: 'Someone else' }]}
        activeTab={tab}
        onChange={(id) => {
          setTab(id as 'myself' | 'someone-else')
          setAdding(false)
          setEditingId(null)
        }}
      />

      <div className="mt-md flex flex-col">
        {activeList.map((f) => (
          editingId === f.id ? (
            <div key={f.id} className="border-b border-border py-sm last:border-0">
              <AddFieldForm
                field={f}
                onCancel={() => setEditingId(null)}
                onAdd={(updated) => {
                  setActiveList(activeList.map((x) => (x.id === f.id ? updated : x)))
                  setEditingId(null)
                }}
              />
            </div>
          ) : (
            <div
              key={f.id}
              onDragOver={(e) => {
                if (dragIndex.current === null) return
                e.preventDefault()
                reorderCustomField(activeList.indexOf(f))
              }}
              onDrop={(e) => e.preventDefault()}
              className={`flex items-center gap-md border-b border-border py-sm transition-[opacity,background-color] duration-150 ease-out last:border-0 ${
                readOnly ? 'opacity-60' : ''
              } ${draggingId === f.id ? 'opacity-40' : ''}`}
            >
              <FieldTypeIcon type={f.type} />
              <div className="min-w-0 flex-1 leading-tight">
                <span className="text-body text-text-primary">
                  {f.label}
                  {f.required && <span className="text-chip-danger-text"> *</span>}
                </span>
                {isOptionFieldType(f.type) && f.options && f.options.length > 0 && (
                  <div className="leading-4">
                    <MoreLabelsCell
                      labels={f.options}
                      maxVisible={5}
                      className="text-small text-text-tertiary"
                    />
                  </div>
                )}
              </div>
              {!f.system && (
                <>
                  <Chip label="Custom" variant="neutral" />
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        aria-label="Edit field"
                        onClick={() => startEdit(f.id)}
                        className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove field"
                        onClick={() => setActiveList(activeList.filter((x) => x.id !== f.id))}
                        className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                      >
                        <Icon name="close" size={16} />
                      </button>
                      <span
                        role="button"
                        aria-label="Drag to reorder"
                        draggable
                        onDragStart={() => {
                          dragIndex.current = activeList.indexOf(f)
                          setDraggingId(f.id)
                        }}
                        onDragEnd={() => {
                          dragIndex.current = null
                          setDraggingId(null)
                        }}
                        className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover active:cursor-grabbing"
                      >
                        <Icon name="drag_indicator" size={16} />
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          )
        ))}
      </div>

      {!readOnly && (
        <div className="mt-md">
          {adding ? (
            <AddFieldForm
              onCancel={() => setAdding(false)}
              onAdd={(field) => { setActiveList([...activeList, field]); setAdding(false) }}
            />
          ) : (
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center gap-xs text-body text-text-action"
            >
              <Icon name="add" size={18} />
              Add field
            </button>
          )}
        </div>
      )}
    </div>
  )
}
