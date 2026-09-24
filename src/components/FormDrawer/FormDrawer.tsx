import { useEffect, useState } from 'react'
import { ChevronDown, Search, Paperclip } from 'lucide-react'
import { BackArrowIcon } from '../../assets/BackArrowIcon'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { FormDrawerProps, TemplateOption } from './FormDrawer.types'

export function FormDrawer({
  open,
  title,
  subtitle,
  fields,
  submitLabel,
  requiredKeys,
  initialValues,
  onClose,
  onSubmit,
}: FormDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [openField, setOpenField] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const [templateSearch, setTemplateSearch] = useState('')

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? {})
      setOpenField(null)
    }
  }, [open, initialValues])

  const required = requiredKeys ?? fields.map((f) => f.key)
  const canSubmit = required.every((k) => !!values[k])

  function openMenu(key: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (openField === key) {
      setOpenField(null)
      setTemplateSearch('')
      return
    }
    setTemplateSearch('')
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpenField(key)
  }

  const activeField = fields.find((f) => f.key === openField && (f.type === 'select' || f.type === 'template-picker'))
  const activeTemplateField = activeField?.type === 'template-picker' ? activeField : null
  const activeSelectField = activeField?.type === 'select' ? activeField : null

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-2 top-2 flex h-[calc(100%-16px)] w-[650px] max-w-[calc(92vw-8px)] flex-col overflow-hidden rounded-2xl bg-surface shadow-modal transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-2xl pb-lg pt-2xl">
          <div className="flex items-center gap-sm">
            <button
              type="button"
              aria-label="Back"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
            >
              <BackArrowIcon />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h2>
              {subtitle && <span className="text-small text-text-secondary">{subtitle}</span>}
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm px-md py-xs text-body font-medium text-text-action hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onSubmit(values)}
              className={`rounded-sm px-lg py-[7px] text-body font-medium transition-colors ${
                canSubmit
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              {submitLabel}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl pb-2xl pt-md">
          {fields.map((field) => {
            const value = values[field.key] ?? ''
            return (
              <div key={field.key} className="flex flex-col gap-xs">
                {field.type === 'textarea' ? (
                  <div className="flex items-center justify-between">
                    <label className="text-small text-text-primary">{field.label}</label>
                    <span className="text-small text-text-secondary">{value.length}/{field.charLimit ?? 300}</span>
                  </div>
                ) : (
                  <label className="text-small text-text-primary">{field.label}</label>
                )}
                {field.type === 'text' ? (
                  <input
                    value={value}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder ?? 'Enter input'}
                    className="h-[34px] w-full rounded-md border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={value}
                    maxLength={field.charLimit ?? 300}
                    rows={5}
                    placeholder={field.placeholder ?? 'Enter text'}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-full resize-none rounded-sm border border-border px-md py-sm text-body text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => openMenu(field.key, e)}
                    className={`flex h-[34px] w-full items-center gap-sm rounded-md border bg-surface pl-md pr-sm hover:bg-surface-l2 ${
                      openField === field.key ? 'border-primary' : 'border-border-input'
                    }`}
                  >
                    <span className={`min-w-0 flex-1 truncate text-left text-body ${value ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {value || field.placeholder || 'Select'}
                    </span>
                    <ChevronDown className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                )}

              </div>
            )
          })}
        </div>
      </aside>

      {/* Select menu */}
      {activeSelectField && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpenField(null)} />
          <div className="fixed z-[110]" style={{ top: anchor.top, left: anchor.left, width: anchor.width }}>
            <SelectMenu
              options={(activeSelectField.options ?? []).map((o) => ({ value: o, label: o }))}
              value={values[activeSelectField.key] ? [values[activeSelectField.key]] : []}
              searchable={(activeSelectField.options ?? []).length > 6}
              onChange={(val) => {
                setValues((v) => ({ ...v, [activeSelectField.key]: val[0] ?? '' }))
                setOpenField(null)
              }}
            />
          </div>
        </>
      )}

      {/* Template picker dropdown */}
      {activeTemplateField && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => { setOpenField(null); setTemplateSearch('') }} />
          <div
            className="fixed z-[110] flex flex-col overflow-hidden rounded-sm bg-surface shadow-dropdown"
            style={{ top: anchor.top, left: anchor.left, width: anchor.width }}
          >
            {/* Search bar */}
            <div className="shrink-0 p-sm">
              <div className="flex h-[34px] items-center gap-sm rounded-md border border-border-selected bg-surface px-md">
                <Search className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                <input
                  autoFocus
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates"
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </div>
            </div>
            <div className="h-px bg-border" />

            {/* Template list — 3 rows visible, scroll for more */}
            <div className="overflow-y-auto" style={{ maxHeight: 3 * 108 }}>
              {(activeTemplateField.templateOptions ?? [])
                .filter((tpl) => tpl.label.toLowerCase().includes(templateSearch.toLowerCase()) || tpl.body.toLowerCase().includes(templateSearch.toLowerCase()))
                .map((tpl: TemplateOption, i: number, arr) => {
                  const isSelected = values[activeTemplateField.key] === tpl.label
                  return (
                    <div key={tpl.label}>
                      <button
                        type="button"
                        onClick={() => {
                          setValues((v) => ({ ...v, [activeTemplateField.key]: tpl.label }))
                          setOpenField(null)
                          setTemplateSearch('')
                        }}
                        className={`flex w-full items-start gap-md px-md py-md text-left transition-colors hover:bg-surface-hover ${isSelected ? 'bg-surface-selected' : ''}`}
                      >
                        {/* Thumbnail */}
                        <div className="flex h-[76px] w-[88px] shrink-0 flex-col overflow-hidden rounded-sm border border-border bg-surface-subtle p-xs">
                          <p className="line-clamp-4 text-[9px] leading-[13px] text-text-secondary">{tpl.body}</p>
                          {tpl.hasAttachment && (
                            <Paperclip className="size-4 mt-auto text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
                          )}
                        </div>
                        {/* Meta */}
                        <div className="flex min-w-0 flex-1 flex-col gap-xs">
                          <span className="text-body text-text-primary">{tpl.label}</span>
                          <span className="line-clamp-2 text-small text-text-secondary">{tpl.body}</span>
                          {tpl.hasAttachment && (
                            <Paperclip className="size-4 text-text-tertiary" strokeWidth={1.6} absoluteStrokeWidth />
                          )}
                        </div>
                      </button>
                      {i < arr.length - 1 && <div className="h-px bg-border" />}
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
