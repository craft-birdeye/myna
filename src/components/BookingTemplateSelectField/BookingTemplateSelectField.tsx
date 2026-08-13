import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import type { BookingTemplateSelectFieldProps } from './BookingTemplateSelectField.types'

/** Booking-template picker — dropdown of template names + an optional "Edit template" link
    that opens the selected template's editor. Shared by the Front desk agent Settings tab
    (agent inherits a template) and the appointment widget editor's Configuration tab. */
export function BookingTemplateSelectField({
  label = 'Booking template',
  description,
  value,
  onChange,
  templates,
  noneLabel,
  onEditTemplate,
}: BookingTemplateSelectFieldProps) {
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

  const options = [
    ...(noneLabel ? [{ value: '', label: noneLabel }] : []),
    ...templates.map((t) => ({ value: t.id, label: t.name })),
  ]
  const selected = templates.find((t) => t.id === value)
  const displayLabel = value === '' ? (noneLabel ?? 'Select a template') : (selected?.name ?? 'Select a template')

  return (
    <div className="flex flex-col gap-xs">
      {label && <label className="text-small text-text-secondary">{label}</label>}
      {description && <p className="mb-xs text-body text-text-secondary">{description}</p>}
      <div ref={ref} className="relative max-w-[420px]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-9 w-full items-center justify-between rounded-sm border px-md text-body text-text-primary transition-colors hover:bg-surface-hover ${open ? 'border-primary' : 'border-border-input'}`}
        >
          <span>{displayLabel}</span>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} className="shrink-0 text-text-icon" />
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] z-[60] w-full">
            <SelectMenu
              options={options}
              value={[value]}
              searchable={false}
              onChange={(v) => { onChange(v[0] ?? ''); setOpen(false) }}
            />
          </div>
        )}
      </div>
      {selected && onEditTemplate && (
        <button
          type="button"
          onClick={() => onEditTemplate(selected.id)}
          className="mt-xs flex items-center gap-xs self-start text-body text-text-action hover:underline"
        >
          <span>Edit template</span>
          <Icon name="open_in_new" size={16} className="shrink-0 text-text-action" />
        </button>
      )}
    </div>
  )
}
