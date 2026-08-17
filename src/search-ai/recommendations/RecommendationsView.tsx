import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import {
  CircleCheck, CircleX,
  ChevronDown, Columns3, ListFilter,
} from 'lucide-react'
import { APP_MAIN_CONTENT_SHELL_CLASS } from '@/contenthub-ui/appShellClasses'
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses'
import {
  DataTable, FilterPanel, CustomizeColumnsDrawer,
  type Column, type ColumnOption, type RowAction, type FilterField,
} from '../../components'
import { useRecStore } from './useRecStore'
import { RecDetailView, RejectConfirmDialog } from './RecDetailView'
import type { RecStatus, Recommendation, RecCategory } from './recTypes'
import type { BusinessMetrics } from './recTypes'

// ── Asset base path — handles both local dev (/) and GitHub Pages (/contenthub/) ─

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const B: string = (import.meta as any).env?.BASE_URL ?? '/'  // '/' locally, '/contenthub/' on GH Pages

// ── Status tile config ────────────────────────────────────────────────────────

const TILE_CONFIG: {
  tab: RecStatus
  label: string
  iconSrc: string
}[] = [
  { tab: 'pending',   label: 'Pending',   iconSrc: `${B}assets/rec/pending-icon.svg`      },
  { tab: 'accepted',  label: 'Accepted',  iconSrc: `${B}assets/rec/check_circle.svg`      },
  { tab: 'completed', label: 'Completed', iconSrc: `${B}assets/rec/Component 75-1.svg`    },
  { tab: 'rejected',  label: 'Rejected',  iconSrc: `${B}assets/rec/Component 75-2.svg`    },
]

// ── Effort sort order ─────────────────────────────────────────────────────────

const EFFORT_ORDER: Record<Recommendation['effort'], number> = {
  'Quick win':   0,
  'Medium':      1,
  'Bigger lift': 2,
}

// ── Category → metric map ─────────────────────────────────────────────────────

const CATEGORY_METRIC: Partial<Record<RecCategory, { label: string; key: keyof BusinessMetrics }>> = {
  'Content':             { label: 'Citation share',   key: 'citationShare' },
  'Website content':     { label: 'Citation share',   key: 'citationShare' },
  'FAQ':                 { label: 'Citation share',   key: 'citationShare' },
  'Social':              { label: 'Citation share',   key: 'citationShare' },
  'Local SEO':           { label: 'Visibility score', key: 'visibility' },
  'Technical SEO':       { label: 'Visibility score', key: 'visibility' },
  'Website improvement': { label: 'Visibility score', key: 'visibility' },
  'Conversion':          { label: 'Visibility score', key: 'visibility' },
  'Trust & Reputation':  { label: 'Sentiment score',  key: 'sentiment' },
  'Reviews':             { label: 'Sentiment score',  key: 'sentiment' },
}

// ── Filter fields ─────────────────────────────────────────────────────────────

const s = (v: string) => ({ value: v, label: v })

const REC_FILTER_FIELDS: FilterField[] = [
  { id: 'location', label: 'Location', options: ['Dubbo NSW', 'Sydney NSW', 'Melbourne VIC', 'Brisbane QLD', 'Perth WA', 'Adelaide SA', 'Gold Coast QLD', 'Canberra ACT'].map(s) },
  { id: 'type',     label: 'Type',     options: ['Local SEO', 'Blog', 'FAQs', 'Conversion', 'Website content', 'Website improvement', 'Reviews', 'Social', 'Trust & Reputation', 'Technical SEO'].map(s) },
  { id: 'theme',    label: 'Themes',   options: ['Visibility', 'Citations', 'Sentiment', 'Engagement', 'Local Presence'].map(s) },
  { id: 'team',     label: 'Team',     options: ['Unassigned', 'My team', 'External agency'].map(s) },
]

const TYPE_DISPLAY_TO_CATEGORY: Record<string, RecCategory> = {
  'Blog': 'Content',
  'FAQs': 'FAQ',
}

// ── Column options (for CustomizeColumnsDrawer) ───────────────────────────────

const REC_COL_OPTIONS: ColumnOption[] = [
  { key: 'title',     label: 'Recommendation', locked: true },
  { key: 'category',  label: 'Type'           },
  { key: 'effort',    label: 'Impact'         },
  { key: 'youScore',  label: 'You vs competitor' },
  { key: 'locations', label: 'Locations'      },
]

// ── Column definitions factory ────────────────────────────────────────────────

const REC_ALL_COLUMNS = (
  metrics: BusinessMetrics,
  base: string,
  chevronRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>,
  onChevronEnter: (rec: Recommendation) => void,
  onMouseLeaveChevron: () => void,
): Column<Recommendation & Record<string, unknown>>[] => [
  {
    key: 'title',
    label: 'Recommendation',
    width: 320,
    sortable: true,
    truncate: false,
    render: (_, row) => (
      <p className="text-body text-text-primary leading-[22px] group-hover/row:text-primary transition-colors pr-4 whitespace-normal">
        {row.title}
      </p>
    ),
  },
  {
    key: 'category',
    label: 'Type',
    width: 120,
    sortable: true,
    render: (_, row) => {
      const CATEGORY_DISPLAY: Partial<Record<string, string>> = { FAQ: 'FAQs', Content: 'Blog' }
      const label = CATEGORY_DISPLAY[row.category] ?? row.category
      return <span className="text-body text-text-primary whitespace-nowrap">{label}</span>
    },
  },
  {
    key: 'effort',
    label: 'Impact',
    width: 320,
    sortable: true,
    truncate: false,
    render: (_, row) => (
      <div className="flex items-start gap-2 pr-4">
        <div className="w-4 h-4 flex-shrink-0 mt-0.5">
          {row.effort === 'Quick win' && (
            <img src={`${base}assets/rec/electric_bolt.svg`} alt="" className="w-4 h-4" />
          )}
          {row.effort === 'Bigger lift' && (
            <img src={`${base}assets/rec/lead.svg`} alt="" className="w-4 h-4" />
          )}
        </div>
        <p className="text-body text-text-primary leading-[22px] line-clamp-3 whitespace-normal">
          {row.description}
        </p>
      </div>
    ),
  },
  {
    key: 'youScore',
    label: 'You vs competitor',
    width: 160,
    sortable: true,
    render: (_, row) => {
      const meta = CATEGORY_METRIC[row.category]
      const metricLabel = meta?.label ?? 'Score'
      const youScore = row.youScore !== undefined ? row.youScore : (meta ? (metrics[meta.key] as number) : 0)
      const compScore = row.compScore ?? 0
      return (
        <div className="flex flex-col gap-0.5 min-w-0 pr-4">
          <div className="flex items-center gap-1">
            <span className="text-body text-text-primary leading-[20px] whitespace-nowrap">
              {youScore.toFixed(1)}%
            </span>
            <span className="text-body text-muted-foreground leading-[20px]">|</span>
            <span className="text-body text-text-primary leading-[20px] whitespace-nowrap">
              {compScore.toFixed(1)}%
            </span>
          </div>
          <span className="text-small text-muted-foreground leading-[16px]">{metricLabel}</span>
        </div>
      )
    },
  },
  {
    key: 'locations',
    label: 'Locations',
    width: 160,
    sortable: true,
    truncate: false,
    render: (_, row) => {
      const locationCount = row.locations ?? 1
      return (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <span className="text-body text-text-primary">{locationCount}</span>
          <button
            ref={el => { chevronRefs.current[row.id] = el }}
            className="flex items-center justify-center size-[34px] hover:bg-surface-hover rounded-md transition-colors"
            onClick={e => { e.stopPropagation(); onChevronEnter(row) }}
            onMouseEnter={() => onChevronEnter(row)}
            onMouseLeave={onMouseLeaveChevron}
          >
            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />
          </button>
        </div>
      )
    },
  },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface RecommendationsViewProps {
  onNavigateToContentHub?: (recId: string, recTitle: string, recAeoScore: number, preloadedQuestions?: { question: string; answer: string }[]) => void
  onNavigateToBlogCanvas?: (recId: string, recTitle: string, aeoScore: number, preloadedBlogSections?: { heading?: string; body?: string; listItems?: string[]; image?: string; imageAlt?: string }[]) => void
  initialRecId?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RecommendationsView({ onNavigateToContentHub, onNavigateToBlogCanvas, initialRecId }: RecommendationsViewProps) {
  const store = useRecStore()
  const {
    recommendations, metrics, activeTab, setActiveTab,
    rejectRec, acceptRec, completeRec, revertToPending,
  } = store

  const [selectedRecId,    setSelectedRecId]    = useState<string | null>(initialRecId ?? null)
  const [filterPanelOpen,  setFilterPanelOpen]  = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  const [rejectingRecId,   setRejectingRecId]   = useState<string | null>(null)
  const [columnSheetOpen,  setColumnSheetOpen]  = useState(false)
  const [visibleColKeys,   setVisibleColKeys]   = useState<string[]>(REC_COL_OPTIONS.map(c => c.key))

  // Location popover
  const [showLocPopover,  setShowLocPopover]  = useState(false)
  const [locPopoverPos,   setLocPopoverPos]   = useState({ top: 0, left: 0 })
  const [popoverLocs,     setPopoverLocs]     = useState<string[]>([])
  const chevronRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Status counts
  const counts: Record<RecStatus, number> = {
    pending:     recommendations.filter(r => r.status === 'pending').length,
    accepted:    recommendations.filter(r => r.status === 'accepted').length,
    in_progress: recommendations.filter(r => r.status === 'in_progress').length,
    completed:   recommendations.filter(r => r.status === 'completed').length,
    rejected:    recommendations.filter(r => r.status === 'rejected').length,
  }

  // Filtered list
  const filtered = recommendations.filter(r => {
    if (activeTab !== 'all' && r.status !== activeTab) return false
    const typeFilter = filterSelections['type']?.[0]
    if (typeFilter) {
      const cat = (TYPE_DISPLAY_TO_CATEGORY[typeFilter] ?? typeFilter) as RecCategory
      if (r.category !== cat) return false
    }
    return true
  })

  function handleChevronEnter(rec: Recommendation) {
    const el = chevronRefs.current[rec.id]
    if (el) {
      const rect = el.getBoundingClientRect()
      setLocPopoverPos({ top: rect.bottom + 6, left: rect.left - 80 })
    }
    const locs = rec.locationNames ?? [`Location 1`]
    setPopoverLocs(locs)
    setShowLocPopover(true)
  }

  // Derived columns (visibility-filtered)
  const columns = REC_ALL_COLUMNS(
    metrics,
    B,
    chevronRefs,
    handleChevronEnter,
    () => setTimeout(() => setShowLocPopover(false), 200),
  ).filter(c => visibleColKeys.includes(String(c.key)))

  // Row actions
  const rowActions: RowAction<Recommendation & Record<string, unknown>>[] = [
    {
      iconElement: <CircleX size={18} strokeWidth={1.6} absoluteStrokeWidth />,
      label: 'Reject',
      onClick: (rec) => setRejectingRecId((rec as Recommendation).id),
      visible: (rec) => (rec as Recommendation).status === 'pending',
    },
    {
      iconElement: <CircleCheck size={18} strokeWidth={1.6} absoluteStrokeWidth />,
      label: 'Accept',
      onClick: (rec) => acceptRec((rec as Recommendation).id, 'self'),
      visible: (rec) => (rec as Recommendation).status === 'pending',
    },
  ]

  // Selected rec
  const selectedRec = selectedRecId ? recommendations.find(r => r.id === selectedRecId) ?? null : null

  if (selectedRec) {
    return (
      <div className={cn(APP_MAIN_CONTENT_SHELL_CLASS)}>
        <RecDetailView
          rec={selectedRec}
          metrics={metrics}
          onBack={() => setSelectedRecId(null)}
          onAccept={(id) => {
            acceptRec(id, 'self')
          }}
          onReject={(id) => {
            rejectRec(id)
          }}
          onNavigateToContentHub={
            onNavigateToContentHub
              ? (questions) => {
                  if (selectedRec.status === 'pending') acceptRec(selectedRec.id, 'self')
                  const aeoScore = selectedRec.aeoScore?.you ?? 95
                  onNavigateToContentHub(selectedRec.id, selectedRec.title, aeoScore, questions)
                }
              : undefined
          }
          onNavigateToBlogCanvas={
            onNavigateToBlogCanvas
              ? () => {
                  if (selectedRec.status === 'pending') acceptRec(selectedRec.id, 'self')
                  let dynSections: { heading?: string; body?: string; listItems?: string[]; image?: string; imageAlt?: string }[] | undefined
                  try { dynSections = selectedRec.generatedAsset?.fullContent ? JSON.parse(selectedRec.generatedAsset.fullContent) : undefined } catch { dynSections = undefined }
                  onNavigateToBlogCanvas(selectedRec.id, selectedRec.title, selectedRec.aeoScore?.you ?? 92, dynSections)
                }
              : undefined
          }
          onCompleteRec={(id) => completeRec(id)}
          onRevertToPending={(id) => revertToPending(id)}
        />
      </div>
    )
  }

  return (
    <div className={cn(APP_MAIN_CONTENT_SHELL_CLASS)}>
      {/* ── Flex row: main content column + full-height filter panel ────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main content column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
            <h1 className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Recommendations</h1>
            <div className="flex items-center gap-sm">
              <button
                type="button"
                aria-label="Customize columns"
                onClick={() => setColumnSheetOpen(true)}
                className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <Columns3 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button
                type="button"
                aria-label="Filter"
                onClick={() => setFilterPanelOpen(o => !o)}
                className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
              >
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
          </div>

          {/* ── Status tiles ─────────────────────────────────────────────── */}
          <div className="flex-shrink-0 px-6">
            <div className="flex">
              {TILE_CONFIG.map(tile => {
                const isSelected = activeTab === tile.tab
                const n = counts[tile.tab]
                return (
                  <button
                    key={tile.tab}
                    onClick={() => setActiveTab(tile.tab)}
                    className={cn(
                      'flex-1 flex flex-col items-start px-4 pt-4 pb-4 text-left transition-colors',
                      isSelected ? 'bg-surface-selected' : 'hover:bg-surface-hover',
                    )}
                  >
                    <span className={cn(
                      'text-[32px] leading-[48px] font-normal tracking-[-0.64px] block',
                      isSelected ? 'text-primary' : 'text-foreground',
                    )}>
                      {n}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <img src={tile.iconSrc} alt="" className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[14px] text-foreground leading-[20px] tracking-[-0.28px] font-normal">
                        {tile.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Table ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <p className="text-[14px]">No recommendations match the current filters.</p>
              </div>
            ) : (
              <div className="mt-5 px-6">
                <DataTable<Recommendation & Record<string, unknown>>
                  data={filtered as (Recommendation & Record<string, unknown>)[]}
                  columns={columns}
                  onRowClick={rec => setSelectedRecId((rec as Recommendation).id)}
                  rowActions={rowActions}
                />
              </div>
            )}
          </div>
        </div>

        {/* Drawers — CustomizeColumnsDrawer then FilterPanel as flex siblings */}
        <CustomizeColumnsDrawer
          open={columnSheetOpen}
          options={REC_COL_OPTIONS}
          visibleKeys={visibleColKeys}
          onClose={() => setColumnSheetOpen(false)}
          onSave={(_, visible) => setVisibleColKeys(visible)}
          onRestoreDefault={() => setVisibleColKeys(REC_COL_OPTIONS.map(c => c.key))}
        />

        <FilterPanel
          open={filterPanelOpen}
          fields={REC_FILTER_FIELDS}
          selections={filterSelections}
          onSelectionsChange={setFilterSelections}
          onClose={() => setFilterPanelOpen(false)}
        />
      </div>

      {/* Location popover portal */}
      {showLocPopover && createPortal(
        <div
          className="fixed z-[9999] bg-background rounded-lg shadow-dropdown border border-border w-56 py-2"
          style={{ top: locPopoverPos.top, left: locPopoverPos.left }}
          onMouseEnter={() => setShowLocPopover(true)}
          onMouseLeave={() => setShowLocPopover(false)}
        >
          <p className="px-2 pt-1 pb-2 text-[11px] text-muted-foreground tracking-[0.4px] uppercase">
            Locations covered
          </p>
          <ul className="max-h-52 overflow-y-auto">
            {popoverLocs.map(loc => (
              <li key={loc} className="px-2 py-1.5 hover:bg-surface-hover">
                <span className="text-[13px] text-foreground leading-[18px]">{loc}</span>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}

      {/* Reject confirmation dialog — same dialog as detail view */}
      {rejectingRecId && (
        <RejectConfirmDialog
          onCancel={() => setRejectingRecId(null)}
          onConfirm={() => {
            rejectRec(rejectingRecId)
            setRejectingRecId(null)
          }}
        />
      )}
    </div>
  )
}
