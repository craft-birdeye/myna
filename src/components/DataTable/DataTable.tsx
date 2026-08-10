import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../EmptyState/EmptyState'
import type { LucideIcon } from 'lucide-react'
import {
  ChevronDown, ChevronUp, MoreVertical,
  Pencil, Trash2, Eye, EyeOff, Check, X, Phone, Mail,
  Settings, User, Plus, Minus, Copy, Download, Upload,
  Search, ListFilter, Calendar, Clock, RefreshCw, Send,
  Paperclip, Headphones, AlertCircle, AlertTriangle, Info,
  BookOpen, FileText, Star, Tag, Link, ExternalLink,
  MessageSquare, CalendarPlus, Wrench,
} from 'lucide-react'
import { Column, DataTableProps, SortDir } from './DataTable.types'

/** Map from legacy Material Symbols names → Lucide components, for dynamic icon props. */
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  edit: Pencil,
  delete: Trash2,
  visibility: Eye,
  visibility_off: EyeOff,
  check: Check,
  close: X,
  cancel: X,
  more_vert: MoreVertical,
  phone: Phone,
  phone_in_talk: Phone, // TODO: check icon
  call: Phone,
  email: Mail,
  settings: Settings,
  person: User,
  add: Plus,
  remove: Minus,
  content_copy: Copy,
  copy_all: Copy,
  download: Download,
  upload: Upload,
  search: Search,
  filter_list: ListFilter,
  calendar_today: Calendar,
  event: Calendar,
  schedule: Clock,
  access_time: Clock,
  refresh: RefreshCw,
  send: Send,
  attach_file: Paperclip,
  headset: Headphones,
  support_agent: Headphones,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  menu_book: BookOpen,
  description: FileText,
  article: FileText,
  star: Star,
  label: Tag,
  link: Link,
  open_in_new: ExternalLink,
  chat: MessageSquare,
  chat_bubble: MessageSquare,
  chat_bubble_outline: MessageSquare,
  calendar_add_on: CalendarPlus,
  sms: MessageSquare,
  build: Wrench,
}

/** Renders a Lucide icon looked up by Material Symbols name. Returns null for unmapped names. */
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Component = LUCIDE_ICON_MAP[name]
  if (!Component) return null
  return <Component className={className ?? 'size-5'} strokeWidth={1.6} absoluteStrokeWidth />
}

const DEFAULT_WIDTH = 160
const DEFAULT_MIN_WIDTH = 80

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  onRowClick,
  rowAction,
  rowActions,
  rowMenuItems,
  scrollOnHover = false,
  rowClassName,
  rowHeight = 48,
}: DataTableProps<T>) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    columns.forEach((c) => (init[String(c.key)] = c.width ?? DEFAULT_WIDTH))
    return init
  })
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({ key: null, dir: 'asc' })
  const [resizingKey, setResizingKey] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ rowIndex: number; top: number; left: number } | null>(null)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    setWidths((prev) => {
      const next: Record<string, number> = {}
      columns.forEach((c) => (next[String(c.key)] = prev[String(c.key)] ?? c.width ?? DEFAULT_WIDTH))
      return next
    })
  }, [columns])

  const sortedData = useMemo(() => {
    if (!sort.key) return data
    const key = sort.key
    return [...data].sort((a, b) => {
      const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, { numeric: true })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [data, sort])

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return
    const key = String(col.key)
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  function startResize(col: Column<T>, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const key = String(col.key)
    const min = col.minWidth ?? DEFAULT_MIN_WIDTH
    const startX = e.clientX
    const startW = widths[key] ?? DEFAULT_WIDTH
    setResizingKey(key)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    const onMove = (ev: MouseEvent) =>
      setWidths((w) => ({ ...w, [key]: Math.max(min, startW + ev.clientX - startX) }))
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setResizingKey(null)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center text-body text-text-secondary">Loading…</div>
  }
  if (data.length === 0) {
    return (
      <EmptyState
        className="h-full min-h-[300px] flex-1"
        title="No results found"
        description="Try adjusting your search or filters"
      />
    )
  }

  const totalWidth = columns.reduce((sum, c) => sum + (widths[String(c.key)] ?? DEFAULT_WIDTH), 0)
  const hasRowCtas = !!rowAction || !!(rowActions && rowActions.length) || !!(rowMenuItems && rowMenuItems.length)

  return (
    <div className={`overflow-x-auto${scrollOnHover ? ' scroll-on-hover' : ''}`}>
      <table className="text-left" style={{ tableLayout: 'fixed', width: '100%', minWidth: totalWidth }}>
        <colgroup>
          {columns.map((col) => (
            <col key={String(col.key)} style={{ width: widths[String(col.key)] ?? DEFAULT_WIDTH }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col, i) => {
              const key = String(col.key)
              const sorted = sort.key === key
              const resizable = col.resizable !== false
              const showDivider = i < columns.length - 1
              return (
                <th key={key} className="relative h-12 border-b border-border px-[10px] align-middle font-normal">
                  {col.headerRender ? (
                    col.headerRender({
                      sorted,
                      sortDir: sort.dir,
                      onSort: () => toggleSort(col),
                    })
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={`group/hdr flex min-w-0 items-center gap-xs ${col.sortable ? '' : 'cursor-default'}`}
                    >
                      <span className={`truncate text-small ${sorted ? 'text-text-primary' : 'text-text-icon'}`}>
                        {col.label}
                      </span>
                      {col.sortable && (
                        sorted && sort.dir === 'asc'
                          ? <ChevronUp
                              className={`size-4 shrink-0 transition-opacity ${sorted ? 'text-text-primary opacity-100' : 'text-text-icon opacity-0 group-hover/hdr:opacity-100'}`}
                              strokeWidth={1.6} absoluteStrokeWidth
                            />
                          : <ChevronDown
                              className={`size-4 shrink-0 transition-opacity ${sorted ? 'text-text-primary opacity-100' : 'text-text-icon opacity-0 group-hover/hdr:opacity-100'}`}
                              strokeWidth={1.6} absoluteStrokeWidth
                            />
                      )}
                    </button>
                  )}
                  {showDivider && (
                    <span
                      onMouseDown={resizable ? (e) => startResize(col, e) : undefined}
                      className={`group/rz absolute right-0 top-0 z-10 flex h-full w-[11px] translate-x-1/2 items-center justify-center ${
                        resizable ? 'cursor-col-resize' : ''
                      }`}
                    >
                      <span
                        className={`w-px transition-all ${
                          resizingKey === key
                            ? 'h-full w-[2px] bg-primary'
                            : 'h-5 bg-border-selected group-hover/rz:h-full group-hover/rz:w-[2px] group-hover/rz:bg-primary'
                        }`}
                      />
                    </span>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`group/row border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover ${
                onRowClick ? 'cursor-pointer' : ''
              } ${menu?.rowIndex === i ? 'bg-surface-hover' : ''} ${rowClassName ? rowClassName(row, i) : ''}`}
            >
              {columns.map((col, ci) => {
                const isLast = ci === columns.length - 1
                const content = col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')
                const wrapTruncate = isLast && col.truncate !== false
                return (
                  <td
                    key={String(col.key)}
                    style={{ height: rowHeight }}
                  className={`px-[10px] align-middle text-body text-text-primary ${
                      isLast ? 'relative' : 'truncate'
                    }`}
                  >
                    {wrapTruncate ? <span className="block truncate">{content}</span> : content}

                    {/* Row hover CTAs anchored to the right edge */}
                    {isLast && hasRowCtas && (
                      <div className={`absolute right-sm top-1/2 z-20 -translate-y-1/2 items-center gap-xs ${menu?.rowIndex === i ? 'flex' : 'hidden group-hover/row:flex'}`}>
                        {rowAction && (!rowAction.visible || rowAction.visible(row)) && (() => {
                          const tooltipText = typeof rowAction.label === 'function' ? rowAction.label(row) : rowAction.label
                          return (
                            <button
                              type="button"
                              aria-label={tooltipText}
                              onClick={(e) => { e.stopPropagation(); rowAction.onClick(row) }}
                              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: tooltipText, x: r.left + r.width / 2, y: r.bottom + 6 }) }}
                              onMouseLeave={() => setTooltip(null)}
                              className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                            >
                              {rowAction.iconElement ?? (rowAction.icon && <DynamicIcon name={rowAction.icon} />)}
                            </button>
                          )
                        })()}
                        {rowActions && rowActions.map((action, ai) => {
                          if (action.visible && !action.visible(row)) return null
                          const tip = typeof action.label === 'function' ? action.label(row) : action.label
                          return (
                            <button
                              key={ai}
                              type="button"
                              aria-label={tip}
                              onClick={(e) => { e.stopPropagation(); action.onClick(row) }}
                              onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ text: tip, x: r.left + r.width / 2, y: r.bottom + 6 }) }}
                              onMouseLeave={() => setTooltip(null)}
                              className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                            >
                              {action.iconElement ?? (action.icon && <DynamicIcon name={action.icon} />)}
                            </button>
                          )
                        })}
                        {rowMenuItems && rowMenuItems.length > 0 && (
                          <button
                            type="button"
                            aria-label="More actions"
                            onClick={(e) => {
                              e.stopPropagation()
                              const r = e.currentTarget.getBoundingClientRect()
                              setMenu(
                                menu?.rowIndex === i
                                  ? null
                                  : { rowIndex: i, top: r.bottom + 4, left: r.right - 216 },
                              )
                            }}
                            className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
                          >
                            <MoreVertical className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tooltip — fixed so it is never clipped by overflow containers */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[120] -translate-x-1/2 whitespace-nowrap rounded-sm bg-tooltip px-sm py-xs text-small text-white shadow-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Three-dots menu */}
      {menu && rowMenuItems && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setMenu(null)} />
          <div
            className="fixed z-[110] min-w-[216px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
            style={{ top: menu.top, left: menu.left }}
          >
            {rowMenuItems
              .filter((item) => {
                const row = sortedData[menu.rowIndex]
                return item.visible ? item.visible(row) : true
              })
              .map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick(sortedData[menu.rowIndex])
                    setMenu(null)
                  }}
                  className={`flex w-full items-center justify-between px-md py-md text-left text-body hover:bg-surface-hover ${
                    item.variant === 'danger' ? 'text-chip-danger-text' : 'text-text-primary'
                  }`}
                >
                  {item.label}
                  {item.icon && <DynamicIcon name={item.icon} className="size-4 shrink-0 text-text-icon" />}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
