import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'
import {
  DEFAULT_CONTEXT_BRAND,
  DEFAULT_CONTEXT_FIELDS,
  DEFAULT_CONTEXT_KNOWLEDGE,
} from '../../data/contextModalData'
import type {
  ContextBrandItem,
  ContextField,
  ContextModalProps,
  ContextModalTab,
} from './ContextModal.types'

const TABS: ContextModalTab[] = ['Fields', 'Knowledge', 'Brand', 'Industry']

function CheckBox({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange?: () => void
  ariaLabel?: string
}) {
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

function ModalTabs({
  activeTab,
  onChange,
  search,
  onSearchChange,
  showSearch,
}: {
  activeTab: ContextModalTab
  onChange: (tab: ContextModalTab) => void
  search: string
  onSearchChange: (value: string) => void
  showSearch: boolean
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-md px-2xl">
      <div className="flex items-end gap-xs">
        {TABS.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className="flex flex-col items-stretch"
            >
              <span
                className={`flex h-9 items-center rounded-sm px-sm text-body transition-colors ${
                  active ? 'text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {tab}
              </span>
              <span className={`h-[2px] w-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
      {showSearch && (
        <div className="flex h-9 w-[240px] shrink-0 items-center gap-sm rounded-sm border border-border-input bg-surface px-md">
          <Icon name="search" size={20} className="text-text-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search fields"
            className="min-w-0 flex-1 bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search">
              <Icon name="close" size={18} className="text-text-icon" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FieldGroup({
  groupName,
  fields,
  totalInGroup,
  onToggleEnabled,
  defaultOpen = true,
}: {
  groupName: string
  fields: ContextField[]
  totalInGroup: number
  onToggleEnabled: (id: number) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const enabledCount = fields.filter((f) => f.enabled).length

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-sm bg-surface-l2 px-2xl py-sm text-left hover:bg-surface-hover"
      >
        <Icon
          name="chevron_right"
          size={20}
          className={`text-text-icon transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-body text-text-primary">{groupName}</span>
        <span className="text-small text-text-secondary">
          ({enabledCount}/{totalInGroup})
        </span>
      </button>
      {open &&
        fields.map((field) => (
          <div
            key={field.id}
            className={`flex items-center border-t border-border px-2xl py-sm ${
              !field.enabled ? 'opacity-50' : ''
            }`}
          >
            <div className="w-12 shrink-0">
              <CheckBox
                checked={field.enabled}
                onChange={() => onToggleEnabled(field.id)}
                ariaLabel={`Enable ${field.name}`}
              />
            </div>
            <div className="min-w-0 flex-1 pr-md">
              <p className="text-body text-text-primary">{field.name}</p>
              <p className="truncate text-small text-text-secondary">{field.description}</p>
            </div>
            <div className="w-[120px] shrink-0 text-body text-text-secondary">{field.source}</div>
            <div className="w-[200px] shrink-0 text-body text-text-secondary">{field.sampleData}</div>
          </div>
        ))}
    </div>
  )
}

function FieldsTab({
  fields,
  setFields,
  search,
}: {
  fields: ContextField[]
  setFields: React.Dispatch<React.SetStateAction<ContextField[]>>
  search: string
}) {
  const filtered = useMemo(
    () =>
      fields.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase()) ||
          f.source.toLowerCase().includes(search.toLowerCase()),
      ),
    [fields, search],
  )

  const groups = useMemo(() => {
    const map = new Map<string, ContextField[]>()
    filtered.forEach((f) => {
      const list = map.get(f.group) ?? []
      list.push(f)
      map.set(f.group, list)
    })
    return [...map.entries()]
  }, [filtered])

  const toggleEnabled = (id: number) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)))

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pt-lg">
        <div className="sticky top-0 z-10 flex items-center border-b border-border bg-surface px-2xl py-sm">
          <div className="w-12 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center gap-xs pr-md text-small text-text-secondary">
            Name
            <Icon name="expand_more" size={16} className="text-text-icon" />
          </div>
          <div className="flex w-[120px] shrink-0 items-center gap-xs text-small text-text-secondary">
            Source
            <Icon name="expand_more" size={16} className="text-text-icon" />
          </div>
          <div className="w-[200px] shrink-0 text-small text-text-secondary">Sample data</div>
        </div>

        {groups.map(([groupName, groupFields], idx) => (
          <FieldGroup
            key={groupName}
            groupName={groupName}
            fields={groupFields}
            totalInGroup={groupName === 'Business' ? 100 : groupFields.length}
            onToggleEnabled={toggleEnabled}
            defaultOpen={idx === 0}
          />
        ))}

        {groups.length === 0 && (
          <p className="px-2xl py-2xl text-center text-body text-text-secondary">No fields match your search.</p>
        )}
      </div>
    </div>
  )
}

function KnowledgeTab({
  files,
  links,
  onAddFile,
  onRemoveFile,
  onAddLink,
  onRemoveLink,
}: {
  files: { id: number; name: string }[]
  links: { id: number; url: string }[]
  onAddFile: (name: string) => void
  onRemoveFile: (id: number) => void
  onAddLink: (url: string) => void
  onRemoveLink: (id: number) => void
}) {
  const [addingLink, setAddingLink] = useState(false)
  const [linkInput, setLinkInput] = useState('')

  function confirmLink() {
    const url = linkInput.trim()
    if (url) onAddLink(url)
    setLinkInput('')
    setAddingLink(false)
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-2xl py-lg">
      <div className="mb-2xl">
        <div className="mb-sm flex items-center gap-xs">
          <span className="text-body text-text-primary">Files</span>
          <InfoTooltip text="Upload files the agent can reference — PDFs, docs, or images relevant to this context." />
        </div>
        <div className="flex flex-col gap-sm">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-sm">
              <span className="flex size-8 items-center justify-center rounded-sm bg-surface-selected text-text-icon">
                <Icon name="description" size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">{file.name}</span>
              <button type="button" onClick={() => onRemoveFile(file.id)} aria-label="Remove file">
                <Icon name="close" size={18} className="text-text-icon hover:text-text-primary" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onAddFile(`Document-${Date.now()}.pdf`)}
          className="mt-sm flex items-center gap-xs text-body text-text-action hover:text-primary-hover"
        >
          <Icon name="add_circle" size={16} />
          Add
        </button>
      </div>

      <div>
        <p className="mb-sm text-body text-text-primary">Links</p>
        <div className="flex flex-col gap-sm">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-sm">
              <span className="flex size-8 items-center justify-center rounded-sm bg-surface-selected text-text-icon">
                <Icon name="link" size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">{link.url}</span>
              <button type="button" onClick={() => onRemoveLink(link.id)} aria-label="Remove link">
                <Icon name="close" size={18} className="text-text-icon hover:text-text-primary" />
              </button>
            </div>
          ))}
          {addingLink && (
            <div className="flex items-center gap-sm">
              <span className="flex size-8 items-center justify-center rounded-sm bg-surface-selected text-text-icon">
                <Icon name="link" size={18} />
              </span>
              <input
                type="text"
                value={linkInput}
                autoFocus
                placeholder="Enter URL"
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmLink()
                  if (e.key === 'Escape') {
                    setAddingLink(false)
                    setLinkInput('')
                  }
                }}
                onBlur={confirmLink}
                className="min-w-0 flex-1 rounded-sm border border-border-input bg-surface px-md py-xs text-body text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAddingLink(true)}
          className="mt-sm flex items-center gap-xs text-body text-text-action hover:text-primary-hover"
        >
          <Icon name="add_circle" size={16} />
          Add
        </button>
      </div>
    </div>
  )
}

function BrandTab({
  items,
  setItems,
}: {
  items: ContextBrandItem[]
  setItems: React.Dispatch<React.SetStateAction<ContextBrandItem[]>>
}) {
  const toggle = (id: number) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)))

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="flex gap-md border-b border-border px-2xl py-lg">
          <CheckBox checked={item.enabled} onChange={() => toggle(item.id)} ariaLabel={`Enable ${item.name}`} />
          <div className="min-w-0 flex-1">
            <p className="text-body text-text-primary">{item.name}</p>
            <p className="mt-xs text-small text-text-secondary">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function IndustryTab({
  enabled,
  setEnabled,
}: {
  enabled: boolean
  setEnabled: (v: boolean) => void
}) {
  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto px-2xl py-lg">
      <div className="flex items-start justify-between gap-2xl">
      <div className="min-w-0 flex-1">
        <p className="text-body text-text-primary">Industry context</p>
        <p className="mt-xs text-small text-text-secondary">
          Built-in industry expertise and compliance guidelines created by Birdeye. Enable this to send
          industry context along with your prompts
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Industry context"
        onClick={() => setEnabled(!enabled)}
        className={`relative h-[16px] w-[32px] shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${
          enabled ? 'bg-primary' : 'bg-surface-selected'
        }`}
      >
        <span
          className={`absolute top-[2px] size-3 rounded-full bg-white shadow-sm transition-[left] ${
            enabled ? 'left-[18px]' : 'left-[2px]'
          }`}
        />
      </button>
      </div>
    </div>
  )
}

export function ContextModal({ open, onClose, onSave, overlayZIndex = 110 }: ContextModalProps) {
  const [activeTab, setActiveTab] = useState<ContextModalTab>('Fields')
  const [fieldsSearch, setFieldsSearch] = useState('')
  const [fields, setFields] = useState<ContextField[]>(DEFAULT_CONTEXT_FIELDS)
  const [knowledge, setKnowledge] = useState(DEFAULT_CONTEXT_KNOWLEDGE)
  const [brandItems, setBrandItems] = useState<ContextBrandItem[]>(DEFAULT_CONTEXT_BRAND)
  const [industryEnabled, setIndustryEnabled] = useState(true)
  const nextIdRef = useRef(1000)

  useEffect(() => {
    if (open) setActiveTab('Fields')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSave() {
    onSave({ fields, knowledge, brandItems, industryEnabled })
    onClose()
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center ${open ? '' : 'pointer-events-none'}`}
      style={{ zIndex: overlayZIndex }}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-modal-title"
        className={`relative flex h-[calc(100vh-130px)] w-full max-w-[1200px] flex-col overflow-hidden rounded-md bg-surface shadow-modal transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-2xl py-md">
          <div>
            <h2 id="context-modal-title" className="text-body text-text-primary">
              Context
            </h2>
            <p className="text-small text-text-secondary">
              This is sent to the LLM to improve the accuracy and quality of responses.
            </p>
          </div>
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={handleSave}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <ModalTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          search={fieldsSearch}
          onSearchChange={setFieldsSearch}
          showSearch={activeTab === 'Fields'}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === 'Fields' && (
            <FieldsTab fields={fields} setFields={setFields} search={fieldsSearch} />
          )}
          {activeTab === 'Knowledge' && (
            <KnowledgeTab
              files={knowledge.files}
              links={knowledge.links}
              onAddFile={(name) =>
                setKnowledge((prev) => ({
                  ...prev,
                  files: [...prev.files, { id: nextIdRef.current++, name }],
                }))
              }
              onRemoveFile={(id) =>
                setKnowledge((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }))
              }
              onAddLink={(url) =>
                setKnowledge((prev) => ({
                  ...prev,
                  links: [...prev.links, { id: nextIdRef.current++, url }],
                }))
              }
              onRemoveLink={(id) =>
                setKnowledge((prev) => ({ ...prev, links: prev.links.filter((l) => l.id !== id) }))
              }
            />
          )}
          {activeTab === 'Brand' && <BrandTab items={brandItems} setItems={setBrandItems} />}
          {activeTab === 'Industry' && (
            <IndustryTab enabled={industryEnabled} setEnabled={setIndustryEnabled} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
