import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AddFieldForm, BaseFieldsEditor, Chip, DataTable, FieldTypeIcon, Icon, MoreLabelsCell, SelectMenu, TopNav, type Column } from '../components'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import {
  BOOKING_SERVICES,
  BOOKING_PROVIDERS,
  emptyTemplate,
  formatTemplateDate,
  isOptionFieldType,
  type BookingTemplate,
  type FieldGroup,
  type TemplateField,
} from '../data/bookingTemplatesData'

// ── Small shared bits ───────────────────────────────────────────────────────

function CheckboxRow({ checked, label, description, onChange }: { checked: boolean; label: string; description?: string; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer gap-sm py-xs ${description ? 'items-start' : 'items-center'}`}>
      <span
        onClick={(e) => { e.preventDefault(); onChange() }}
        className={`flex size-[18px] shrink-0 items-center justify-center rounded-[3px] border transition-colors ${description ? 'mt-xs' : ''} ${
          checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
        }`}
      >
        {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body text-text-primary">{label}</span>
        {description && <span className="text-xs text-text-tertiary">{description}</span>}
      </span>
    </label>
  )
}

/** Space-saving multi-select field with an "All" option — used for the template's own
    appointment types / providers pickers (the field group modal keeps its checkbox list, since there
    the mapped appointment-type set is usually small and benefits from being fully visible at once). */
interface MultiSelectFieldProps {
  label: string
  options: { value: string; label: string; description?: string }[]
  value: string[]
  onChange: (v: string[]) => void
}
function MultiSelectField({ label, options, value, onChange }: MultiSelectFieldProps) {
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

  const allSelected = options.length > 0 && value.length === options.length
  const displayLabel = allSelected
    ? 'All'
    : value.length === 1
      ? (options.find((o) => o.value === value[0])?.label ?? label)
      : value.length === 0
        ? 'Select'
        : `${value.length} selected`

  return (
    <div>
      <label className="mb-xs block text-small text-text-secondary">{label}</label>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-9 w-full items-center justify-between rounded-sm border px-md text-body text-text-primary transition-colors hover:bg-surface-hover ${open ? 'border-primary' : 'border-border-input'}`}
        >
          <span>{displayLabel}</span>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} className="shrink-0 text-text-icon" />
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-[70] w-full">
            <SelectMenu
              options={options}
              value={value}
              multi
              searchable={false}
              onChange={onChange}
              onApply={() => setOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Field group drawer ───────────────────────────────────────────────────────

interface FieldGroupDrawerProps {
  open: boolean
  group: FieldGroup | 'new'
  availableServiceIds: string[]
  onCancel: () => void
  onSave: (group: FieldGroup) => void
}
function FieldGroupDrawer({ open, group, availableServiceIds, onCancel, onSave }: FieldGroupDrawerProps) {
  const isNew = group === 'new'
  const [name, setName] = useState('')
  const [mappedServiceIds, setMappedServiceIds] = useState<string[]>([])
  const [extraFields, setExtraFields] = useState<TemplateField[]>([])
  const [addingField, setAddingField] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null)
  const dragFieldIndex = useRef<number | null>(null)

  // (Re)initialise the draft whenever the drawer opens, mirroring CustomizeColumnsDrawer.
  useEffect(() => {
    if (!open) return
    setName(isNew ? '' : group.name)
    setMappedServiceIds(isNew ? [] : [...group.mappedServiceIds])
    setExtraFields(isNew ? [] : group.extraFields.map((f) => ({ ...f })))
    setAddingField(false)
    setEditingFieldId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isNew, isNew ? null : group.id])

  const services = BOOKING_SERVICES.filter((s) => availableServiceIds.includes(s.id))
  const canSave = name.trim().length > 0

  function toggleService(id: string) {
    setMappedServiceIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  function reorderExtraField(targetIndex: number) {
    const from = dragFieldIndex.current
    if (from === null || from === targetIndex) return
    setExtraFields((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
    dragFieldIndex.current = targetIndex
  }

  return createPortal(
    <div className={`fixed inset-0 z-[1300] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-[640px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-2xl">
          <div className="flex items-center gap-sm">
            <button type="button" aria-label="Back" onClick={onCancel} className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
              <BackArrowIcon />
            </button>
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
              {isNew ? 'New field group' : `Edit field group — ${group.name}`}
            </h2>
          </div>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return
              onSave({
                id: isNew ? `group-${Date.now()}` : group.id,
                name: name.trim(),
                mappedServiceIds,
                extraFields,
              })
            }}
            className={`rounded-sm px-lg py-[7px] text-body font-medium transition-colors ${
              canSave ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
            }`}
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-xl py-lg">
          <div className="mb-xl">
            <label className="mb-xs block text-small text-text-secondary">
              Group name <span className="text-chip-danger-text">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Surgical intake"
              className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
            />
          </div>

          <div className="mb-xl">
            <label className="mb-xs block text-small text-text-secondary">Appointment types</label>
            <p className="mb-md text-small text-text-tertiary">Only appointment types on this template appear here.</p>
            <div className="flex flex-col">
              {services.map((s) => (
                <CheckboxRow key={s.id} checked={mappedServiceIds.includes(s.id)} label={s.label} description={s.description} onChange={() => toggleService(s.id)} />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-xs block text-small text-text-secondary">Extra fields</label>
            <p className="mb-md text-small text-text-tertiary">Extra questions asked only for mapped appointment types.</p>

            <div className="flex flex-col gap-sm">
              {extraFields.map((f) => (
                editingFieldId === f.id ? (
                  <AddFieldForm
                    key={f.id}
                    field={f}
                    onCancel={() => setEditingFieldId(null)}
                    onAdd={(updated) => {
                      setExtraFields((prev) => prev.map((x) => (x.id === f.id ? updated : x)))
                      setEditingFieldId(null)
                    }}
                  />
                ) : (
                  <div
                    key={f.id}
                    onDragOver={(e) => {
                      if (dragFieldIndex.current === null) return
                      e.preventDefault()
                      reorderExtraField(extraFields.indexOf(f))
                    }}
                    onDrop={(e) => e.preventDefault()}
                    className={`flex items-center gap-md border-b border-border py-sm transition-[opacity,background-color] duration-150 ease-out last:border-0 ${
                      draggingFieldId === f.id ? 'opacity-40' : ''
                    }`}
                  >
                    <FieldTypeIcon type={f.type} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className="text-body text-text-primary">
                        {f.label}
                        {f.required && <span className="text-chip-danger-text"> *</span>}
                      </span>
                      {isOptionFieldType(f.type) && f.options && f.options.length > 0 && (
                        <div className="leading-4">
                          <MoreLabelsCell labels={f.options} maxVisible={5} className="text-small text-text-tertiary" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Edit field"
                      onClick={() => { setAddingField(false); setEditingFieldId(f.id) }}
                      className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove field"
                      onClick={() => setExtraFields((prev) => prev.filter((x) => x.id !== f.id))}
                      className="flex size-6 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
                    >
                      <Icon name="close" size={16} />
                    </button>
                    <span
                      role="button"
                      aria-label="Drag to reorder"
                      draggable
                      onDragStart={() => {
                        dragFieldIndex.current = extraFields.indexOf(f)
                        setDraggingFieldId(f.id)
                      }}
                      onDragEnd={() => {
                        dragFieldIndex.current = null
                        setDraggingFieldId(null)
                      }}
                      className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover active:cursor-grabbing"
                    >
                      <Icon name="drag_indicator" size={16} />
                    </span>
                  </div>
                )
              ))}

              {addingField ? (
                <AddFieldForm
                  onCancel={() => setAddingField(false)}
                  onAdd={(field) => { setExtraFields((prev) => [...prev, field]); setAddingField(false) }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => { setEditingFieldId(null); setAddingField(true) }}
                  className="flex items-center gap-xs self-start py-xs text-body text-text-action"
                >
                  <Icon name="add" size={18} />
                  Add field
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  )
}

// ── Field groups table row ──────────────────────────────────────────────────

interface FieldGroupRow {
  id: string
  name: string
  mappedServiceLabels: string[]
  extraFieldLabels: string[]
  group: FieldGroup
  [key: string]: string | string[] | FieldGroup
}

const FIELD_GROUP_COLUMNS: Column<FieldGroupRow>[] = [
  { key: 'name', label: 'Group' },
  {
    key: 'mappedServiceLabels',
    label: 'Mapped appointment types',
    render: (v) => <MoreLabelsCell labels={v as string[]} />,
  },
  {
    key: 'extraFieldLabels',
    label: 'Extra fields',
    render: (v) => <MoreLabelsCell labels={v as string[]} emptyLabel="Base fields only" />,
  },
]

// ── Main screen ──────────────────────────────────────────────────────────────

interface BookingTemplateEditorScreenProps {
  /** null = create a new template. */
  template: BookingTemplate | null
  onBack: () => void
  onSave: (template: BookingTemplate, isNew: boolean) => void
  onDelete: (id: string) => void
}

function withAllSelected(t: BookingTemplate): BookingTemplate {
  return {
    ...t,
    serviceIds: t.serviceIds.length === 0 ? BOOKING_SERVICES.map((s) => s.id) : t.serviceIds,
    providerIds: t.providerIds.length === 0 ? BOOKING_PROVIDERS.map((p) => p.id) : t.providerIds,
  }
}

export function BookingTemplateEditorScreen({ template, onBack, onSave, onDelete }: BookingTemplateEditorScreenProps) {
  const isNew = template === null
  const [local, setLocal] = useState<BookingTemplate>(() => withAllSelected(template ?? emptyTemplate()))
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(local.name)
  const [groupModal, setGroupModal] = useState<FieldGroup | 'new' | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [showImpactConfirm, setShowImpactConfirm] = useState(false)

  const canSave = local.name.trim().length > 0

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed) setLocal((prev) => ({ ...prev, name: trimmed }))
    setEditingName(false)
  }

  function commitSave() {
    const stamped: BookingTemplate = isNew
      ? local
      : { ...local, updatedBy: 'You', updatedDate: formatTemplateDate(new Date()) }
    onSave(stamped, isNew)
  }

  function handleSaveClick() {
    if (!canSave) return
    if (!isNew && local.usedBy.length > 0) {
      setShowImpactConfirm(true)
      return
    }
    commitSave()
  }

  const fieldGroupRows: FieldGroupRow[] = local.fieldGroups.map((g) => ({
    id: g.id,
    name: g.name,
    mappedServiceLabels: g.mappedServiceIds.map((id) => BOOKING_SERVICES.find((s) => s.id === id)?.label ?? id),
    extraFieldLabels: g.extraFields.map((f) => f.label),
    group: g,
  }))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav initials="S" />

      <div className="flex-1 overflow-y-auto bg-surface">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex min-w-0 items-center gap-sm">
            <button type="button" aria-label="Back" onClick={onBack} className="flex size-8 items-center justify-center rounded-sm text-text-icon transition-colors hover:bg-surface-hover">
              <BackArrowIcon color="#555" />
            </button>
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName() }}
                className="h-8 rounded-sm border border-primary bg-surface px-sm text-h3 text-text-primary outline-none"
              />
            ) : (
              <h1 className="truncate text-h3 text-text-primary">{local.name}</h1>
            )}
            <button
              type="button"
              aria-label="Rename template"
              onClick={() => { setNameDraft(local.name); setEditingName(true) }}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="edit" size={16} />
            </button>
          </div>

          <div className="flex items-center gap-sm">
            {isNew ? (
              <button type="button" onClick={onBack} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">
                Cancel
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  aria-label="More actions"
                  onClick={() => setActionsOpen((o) => !o)}
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon transition-colors hover:bg-surface-l2"
                >
                  <Icon name="more_vert" size={20} />
                </button>
                {actionsOpen && (
                  <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setActionsOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full z-[110] mt-xs min-w-[168px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      <button
                        type="button"
                        className="block w-full px-md py-sm text-left text-body text-chip-danger-text hover:bg-surface-hover"
                        onClick={() => onDelete(local.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSaveClick}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                canSave ? 'bg-primary text-white hover:bg-primary-hover' : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              Save
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex max-w-[960px] flex-col gap-2xl px-2xl pb-2xl pt-md">
          {/* Base form fields */}
          <section className="rounded-md border border-border p-2xl">
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Base form fields</h2>
            <p className="mt-xs text-small text-text-tertiary">
              These questions appear on every booking, for every appointment type.
            </p>

            <div className="mt-lg">
              <BaseFieldsEditor
                value={local.baseFields}
                onChange={(baseFields) => setLocal((prev) => ({ ...prev, baseFields }))}
              />
            </div>
          </section>

          {/* Appointment types and providers */}
          <section className="rounded-md border border-border p-2xl">
            <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Appointment types and providers</h2>
            <p className="mt-xs text-small text-text-tertiary">
              Choose the appointment types and providers patients can book.
            </p>

            <div className="mt-lg grid grid-cols-2 gap-lg">
              <MultiSelectField
                label="Appointment types"
                options={BOOKING_SERVICES.map((s) => ({ value: s.id, label: s.label, description: s.description }))}
                value={local.serviceIds}
                onChange={(ids) => setLocal((prev) => ({ ...prev, serviceIds: ids }))}
              />
              <MultiSelectField
                label="Providers"
                options={BOOKING_PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
                value={local.providerIds}
                onChange={(ids) => setLocal((prev) => ({ ...prev, providerIds: ids }))}
              />
            </div>
          </section>

          {/* Field groups */}
          <section className="rounded-md border border-border p-2xl">
            <div className="flex items-center gap-sm">
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">Field groups</h2>
              <Chip label="Optional" variant="neutral" />
            </div>
            <p className="mt-xs text-small text-text-tertiary">
              Extra questions for specific appointment types.
            </p>

            {fieldGroupRows.length > 0 && (
              <div className="mt-lg">
                <DataTable
                  columns={FIELD_GROUP_COLUMNS}
                  data={fieldGroupRows}
                  onRowClick={(row) => setGroupModal(row.group)}
                  rowAction={{ icon: 'edit', label: 'Edit', onClick: (row) => setGroupModal(row.group) }}
                />
              </div>
            )}

            <div className="mt-md">
              <button
                type="button"
                onClick={() => setGroupModal('new')}
                className="flex items-center gap-xs text-body text-text-action"
              >
                <Icon name="add" size={18} />
                Add field group
              </button>
            </div>
          </section>
        </div>
      </div>

      <FieldGroupDrawer
        open={groupModal !== null}
        group={groupModal ?? 'new'}
        availableServiceIds={local.serviceIds}
        onCancel={() => setGroupModal(null)}
        onSave={(group) => {
          setLocal((prev) => ({
            ...prev,
            fieldGroups: groupModal === 'new'
              ? [...prev.fieldGroups, group]
              : prev.fieldGroups.map((g) => (g.id === group.id ? group : g)),
          }))
          setGroupModal(null)
        }}
      />

      {showImpactConfirm && createPortal(
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setShowImpactConfirm(false) }}>
          <div className="relative w-[440px] max-w-[92vw] rounded-md bg-surface p-xl shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-sm">
              <Icon name="info" size={20} className="shrink-0 text-text-primary" />
              <h2 className="text-h3 text-text-primary">This template is in use</h2>
            </div>
            <p className="mt-md text-body text-text-secondary">
              &ldquo;{local.name}&rdquo; is used by {local.usedBy.join(' and ')}. Saving will update it everywhere it&apos;s used.
            </p>
            <div className="mt-xl flex items-center justify-end gap-md">
              <button type="button" onClick={() => setShowImpactConfirm(false)} className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowImpactConfirm(false); commitSave() }}
                className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                Save
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
