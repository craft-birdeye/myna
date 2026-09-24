import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { getTemplateLibrary } from '../../data/messageTemplateLibrary'
import { MESSAGE_TEMPLATE_LAYOUT as L, MESSAGE_TEMPLATE_POPUP as BOX } from './MessageTemplateModal.types'
import type { MessageTemplateModalProps } from './MessageTemplateModal.types'

export function MessageTemplateModal({
  open,
  kind,
  onClose,
  selected = [],
  onChange,
  categories,
  templates,
}: MessageTemplateModalProps) {
  const library = getTemplateLibrary(kind)
  const cats = categories ?? library.categories
  const items = templates ?? library.templates

  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  // Every open starts on All with an empty search.
  useEffect(() => {
    if (!open) return
    setActiveCategory('all')
    setQuery('')
  }, [open])

  // Park it over the canvas: vertically centred, right edge just clear of the RHS panel.
  useLayoutEffect(() => {
    if (!open) return undefined
    const place = () => {
      const rhs = document.querySelector('.agent-builder__rhs') ?? document.querySelector('.rhs-panel')
      const rhsLeft = rhs?.getBoundingClientRect().left ?? window.innerWidth
      setPos({
        top: Math.max(BOX.gap, Math.round((window.innerHeight - BOX.height) / 2)),
        right: Math.max(BOX.gap, Math.round(window.innerWidth - rhsLeft + BOX.gap)),
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // No backdrop to catch this — the popup is non-blocking, so watch the document instead.
    const onDown = (e: MouseEvent) => {
      if (!dialogRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, onClose])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((t) => {
      if (activeCategory !== 'all' && t.categoryId !== activeCategory) return false
      if (!q) return true
      return t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
    })
  }, [items, activeCategory, query])

  if (!open || !pos) return null

  const isEmail = kind === 'email'
  const label = isEmail ? 'Email templates' : 'Text templates'
  const titleIcon = isEmail ? 'mail' : 'chat'

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={label}
      className={L.dialog}
      style={{ top: pos.top, right: pos.right, width: BOX.width, height: BOX.height }}
    >
      <div className={L.header}>
        <h2 className={L.title}>
          <Icon name={titleIcon} size={20} className="text-text-icon" />
          {label}
        </h2>

        <div className="flex items-center gap-md">
          <div className={L.search}>
            <Icon name="search" size={20} className="shrink-0 text-text-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              aria-label={`Search ${label.toLowerCase()}`}
              className={L.searchInput}
            />
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={L.closeBtn}>
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      <div className={L.body}>
        <div className={L.rail}>
          {cats.map((cat) => {
            const isActive = cat.id === activeCategory
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`${L.railRow}${isActive ? ` ${L.railRowActive}` : ''}`}
              >
                <span className={L.railLabel}>{cat.label}</span>
                {cat.count !== undefined && (
                  <span className={`${L.railCount} text-text-secondary`}>{cat.count}</span>
                )}
                <Icon name="chevron_right" size={18} className="shrink-0 text-text-icon" />
              </button>
            )
          })}
        </div>

        <div className={L.list}>
          {visible.map((template) => {
            const checked = selected.includes(template.id)
            return (
              <button
                key={template.id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onChange(
                  checked ? selected.filter((id) => id !== template.id) : [...selected, template.id],
                )}
                className={L.row}
              >
                <span className={`${L.checkbox} ${checked ? L.checkboxOn : L.checkboxOff}`}>
                  {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
                </span>
                <div className={L.thumb}>
                  <p className={L.thumbText}>{template.body}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={L.rowTitle}>{template.title}</h3>
                  <p className={L.rowBody}>{template.body}</p>
                </div>
              </button>
            )
          })}

          {visible.length === 0 && (
            <p className="py-2xl text-center text-body text-text-secondary">No templates found.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
