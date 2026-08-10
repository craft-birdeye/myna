import type { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T
  label: string
  /** Initial column width in px (default 160). */
  width?: number
  /** Minimum width when resizing (default 80). */
  minWidth?: number
  sortable?: boolean
  /** Allow the user to drag-resize this column (default true). */
  resizable?: boolean
  /** When false, last-column cells render content without single-line truncation. */
  truncate?: boolean
  render?: (value: T[keyof T], row: T) => ReactNode
  /** Custom header cell content; receives sort state and toggle handler. */
  headerRender?: (context: {
    sorted: boolean
    sortDir: SortDir
    onSort: () => void
  }) => ReactNode
}

export type SortDir = 'asc' | 'desc'

export interface RowAction<T> {
  /** Icon name (Material Symbols key mapped to Lucide in DataTable). Use `iconElement` for a custom element. */
  icon?: string
  /** Custom React element to render instead of an Icon (takes priority over icon). */
  iconElement?: ReactNode
  label: string | ((row: T) => string)
  onClick: (row: T) => void
  /** When provided, the button is only rendered for rows where this returns true. */
  visible?: (row: T) => boolean
}

export interface RowMenuItem<T> {
  label: string
  onClick: (row: T) => void
  /** When omitted, the item is always shown. */
  visible?: (row: T) => boolean
  variant?: 'default' | 'danger'
  icon?: string
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  /** Primary CTA shown on row hover (page-specific). */
  rowAction?: RowAction<T>
  /** Multiple action buttons shown on row hover. When used, each gets its own tooltip. */
  rowActions?: RowAction<T>[]
  /** Items in the three-dots "more" menu shown on row hover. */
  rowMenuItems?: RowMenuItem<T>[]
  /** Hide the horizontal scrollbar until the user hovers over the table. */
  scrollOnHover?: boolean
  /** Returns extra className(s) for the <tr> — use for row-level styling like disabled/dimmed. */
  rowClassName?: (row: T, index: number) => string
  /** Row height in px. Defaults to 48 (h-12). */
  rowHeight?: number
}
