import { useEffect, useMemo, useState } from 'react'
import {
  CustomizeColumnsDrawer,
  DataTable,
  FilterPanel,
  HeaderSearchField,
  Icon,
  MoreLabelsCell,
  TopNav,
  type Column,
  type ColumnOption,
  type FilterField,
} from '../components'
import { useBookingTemplateStore } from '../data/BookingTemplateStoreContext'
import { BOOKING_SERVICES, type BookingTemplate } from '../data/bookingTemplatesData'
import { BookingTemplateEditorScreen } from './BookingTemplateEditorScreen'

interface TemplateRow {
  id: string
  name: string
  serviceIds: string[]
  fieldGroupsCount: number
  usedByLabel: string
  createdBy: string
  createdDate: string
  updatedBy: string
  updatedDate: string
  template: BookingTemplate
  [key: string]: string | number | string[] | BookingTemplate
}

function toRow(t: BookingTemplate): TemplateRow {
  return {
    id: t.id,
    name: t.name,
    serviceIds: t.serviceIds,
    fieldGroupsCount: t.fieldGroups.length,
    usedByLabel: t.usedBy.length > 0 ? t.usedBy.join(', ') : '—',
    createdBy: t.createdBy,
    createdDate: t.createdDate,
    updatedBy: t.updatedBy,
    updatedDate: t.updatedDate,
    template: t,
  }
}

const COLUMN_DEFS: Array<Column<TemplateRow> & { locked?: boolean }> = [
  { key: 'name', label: 'Template name', sortable: true, locked: true },
  {
    key: 'serviceIds',
    label: 'Appointment types',
    render: (v) => {
      const ids = v as string[]
      const all = ids.length === 0 || ids.length === BOOKING_SERVICES.length
      return (
        <MoreLabelsCell
          labels={all ? [] : ids.map((id) => BOOKING_SERVICES.find((s) => s.id === id)?.label ?? id)}
          emptyLabel="All appointment types"
        />
      )
    },
  },
  { key: 'fieldGroupsCount', label: 'Field groups' },
  { key: 'usedByLabel', label: 'Used by', locked: true },
  { key: 'createdBy', label: 'Created by' },
  { key: 'createdDate', label: 'Created date' },
  { key: 'updatedBy', label: 'Updated by' },
  { key: 'updatedDate', label: 'Last updated' },
]

const DEFAULT_ORDER = COLUMN_DEFS.map((c) => String(c.key))
const DEFAULT_VISIBLE = ['name', 'serviceIds', 'fieldGroupsCount', 'usedByLabel', 'updatedBy', 'updatedDate']
const DEF_BY_KEY = new Map(COLUMN_DEFS.map((c) => [String(c.key), c]))

const opts = (labels: string[]) => labels.map((l) => ({ value: l, label: l }))

interface BookingTemplatesScreenProps {
  /** When set, open this template's editor immediately (e.g. from an "Edit template" link). */
  initialEditId?: string | null
  onInitialEditConsumed?: () => void
}

export function BookingTemplatesScreen({ initialEditId, onInitialEditConsumed }: BookingTemplatesScreenProps) {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useBookingTemplateStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const [visible, setVisible] = useState<string[]>(DEFAULT_VISIBLE)
  const [editing, setEditing] = useState<BookingTemplate | 'new' | null>(() => {
    if (!initialEditId) return null
    return templates.find((t) => t.id === initialEditId) ?? null
  })

  useEffect(() => {
    if (initialEditId) onInitialEditConsumed?.()
    // Consume once on mount; parent callback identity is not stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditId])

  const fieldGroupOptions = useMemo(
    () => Array.from(new Set(templates.flatMap((t) => t.fieldGroups.map((g) => g.name)))),
    [templates],
  )
  const usedByOptions = useMemo(
    () => Array.from(new Set(templates.flatMap((t) => t.usedBy))),
    [templates],
  )
  const columns = useMemo<Column<TemplateRow>[]>(
    () => order.filter((k) => visible.includes(k)).map((k) => DEF_BY_KEY.get(k)!).filter(Boolean),
    [order, visible],
  )
  const columnOptions = useMemo<ColumnOption[]>(
    () => order.map((k) => ({ key: k, label: DEF_BY_KEY.get(k)!.label, locked: DEF_BY_KEY.get(k)!.locked })),
    [order],
  )

  if (editing) {
    return (
      <BookingTemplateEditorScreen
        template={editing === 'new' ? null : editing}
        onBack={() => setEditing(null)}
        onSave={(tmpl, isNew) => {
          if (isNew) addTemplate(tmpl)
          else updateTemplate(tmpl)
          setEditing(null)
        }}
        onDelete={(id) => {
          deleteTemplate(id)
          setEditing(null)
        }}
      />
    )
  }

  const FILTER_FIELDS: FilterField[] = [
    { id: 'services', label: 'Appointment types', options: opts(BOOKING_SERVICES.map((s) => s.label)) },
    { id: 'field-groups', label: 'Field groups', options: opts(fieldGroupOptions) },
    { id: 'used-by', label: 'Used by', options: opts(usedByOptions) },
  ]

  const selectedServiceLabels = filterSelections['services'] ?? []
  const selectedServiceIds = BOOKING_SERVICES.filter((s) => selectedServiceLabels.includes(s.label)).map((s) => s.id)
  const selectedFieldGroups = filterSelections['field-groups'] ?? []
  const selectedUsedBy = filterSelections['used-by'] ?? []

  const q = searchQuery.trim().toLowerCase()
  const filteredTemplates = templates.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q)) return false
    if (selectedServiceIds.length > 0 && !t.serviceIds.some((id) => selectedServiceIds.includes(id))) return false
    if (selectedFieldGroups.length > 0 && !t.fieldGroups.some((g) => selectedFieldGroups.includes(g.name))) return false
    if (selectedUsedBy.length > 0 && !t.usedBy.some((u) => selectedUsedBy.includes(u))) return false
    return true
  })
  const rows = filteredTemplates.map(toRow)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopNav initials="S" />

      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col overflow-auto bg-surface">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
            <h1 className="text-h3 text-text-primary">{templates.length} Booking templates</h1>
            <div className="flex items-center gap-sm">
              <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} placeholder="Search templates" />
              <button
                type="button"
                onClick={() => setEditing('new')}
                className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                Create template
              </button>
              <button
                type="button"
                aria-label="Customize columns"
                onClick={() => setCustomizeOpen(true)}
                className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Icon name="view_column" size={20} />
              </button>
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className={`flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 ${filterOpen ? 'bg-surface-selected' : ''}`}
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          </div>

          <div className="px-2xl pb-2xl">
            <DataTable
              columns={columns}
              data={rows}
              onRowClick={(row) => setEditing(row.template)}
              rowMenuItems={[
                { label: 'Edit', onClick: (row) => setEditing(row.template) },
                {
                  label: 'Duplicate',
                  onClick: (row) => {
                    const t = row.template
                    addTemplate({ ...t, id: `${t.id}-copy-${Date.now()}`, name: `${t.name} (Copy)`, usedBy: [] })
                  },
                },
                {
                  label: 'Delete',
                  variant: 'danger',
                  onClick: (row) => deleteTemplate(row.id),
                  disabled: (row) => row.template.usedBy.length > 0,
                  disabledTooltip: 'This template is in use and can’t be deleted.',
                },
              ]}
            />
          </div>
        </div>

        <FilterPanel
          open={filterOpen}
          fields={FILTER_FIELDS}
          selections={filterSelections}
          onSelectionsChange={setFilterSelections}
          onClose={() => setFilterOpen(false)}
        />
      </div>

      <CustomizeColumnsDrawer
        open={customizeOpen}
        options={columnOptions}
        visibleKeys={visible}
        onClose={() => setCustomizeOpen(false)}
        onSave={(orderedKeys, visibleKeys) => {
          setOrder(orderedKeys)
          setVisible(visibleKeys)
        }}
        onRestoreDefault={() => {
          setOrder(DEFAULT_ORDER)
          setVisible(DEFAULT_VISIBLE)
        }}
      />
    </div>
  )
}
