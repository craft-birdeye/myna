import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Search, MoreVertical, Copy, FolderInput, Trash2, Pencil, LayoutGrid, List, Info } from 'lucide-react';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle';
import { AppDataTable } from '@/contenthub-ui/AppDataTable';
import { AppDataTableColumnSettingsTrigger } from '@/contenthub-ui/AppDataTableColumnSettingsTrigger';
import { FilterPane, FilterPaneTriggerButton } from '@/content-hub/FilterPane';
import type { FilterItem } from '@/content-hub/FilterPanel.v1';
import { Button } from '@/contenthub-ui/button';
import { Input } from '@/contenthub-ui/input';
import { TextTabsRow, type TextTabItem } from '@/contenthub-ui/text-tabs';
import { Badge } from '@/contenthub-ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/contenthub-ui/dropdown-menu';
import {
  MAIN_VIEW_HEADER_BAND_CLASS,
  MAIN_VIEW_PRIMARY_HEADING_CLASS,
} from '@/contenthub-ui/mainViewTitleClasses';
// @ts-ignore
import TemplateLibrary from './faq-agents/Organisms/TemplateLibrary/TemplateLibrary';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgentStatus = 'Draft' | 'Running' | 'Paused';

export interface AgentRow {
  id: string;
  name: string;
  status: AgentStatus;
  generatedFAQs: number;
  acceptedFAQs: number;
  timeSaved: string;
  locations: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_AGENTS: AgentRow[] = [
  { id: 'a1',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 30, acceptedFAQs: 28, timeSaved: '1h',     locations: 2 },
  { id: 'a2',  name: 'On demand FAQ generation agent',      status: 'Draft',   generatedFAQs: 24, acceptedFAQs: 22, timeSaved: '1h',     locations: 3 },
  { id: 'a3',  name: 'Search AI metric enhancer FAQ agent', status: 'Running', generatedFAQs: 40, acceptedFAQs: 38, timeSaved: '2h',     locations: 5 },
  { id: 'a4',  name: 'On demand FAQ generation agent',      status: 'Draft',   generatedFAQs: 18, acceptedFAQs: 16, timeSaved: '45m',    locations: 1 },
  { id: 'a5',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 22, acceptedFAQs: 20, timeSaved: '1h',     locations: 2 },
  { id: 'a6',  name: 'On demand FAQ generation agent',      status: 'Running', generatedFAQs: 28, acceptedFAQs: 26, timeSaved: '1h',     locations: 4 },
  { id: 'a7',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 15, acceptedFAQs: 14, timeSaved: '30m',    locations: 1 },
  { id: 'a8',  name: 'Search AI metric enhancer FAQ agent', status: 'Running', generatedFAQs: 35, acceptedFAQs: 33, timeSaved: '1h 30m', locations: 3 },
  { id: 'a9',  name: 'On demand FAQ generation agent',      status: 'Draft',   generatedFAQs: 20, acceptedFAQs: 18, timeSaved: '45m',    locations: 2 },
  { id: 'a10', name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 19, acceptedFAQs: 17, timeSaved: '30m',    locations: 2 },
  { id: 'a11', name: 'On demand FAQ generation agent',      status: 'Draft',   generatedFAQs: 14, acceptedFAQs: 13, timeSaved: '15m',    locations: 1 },
];

const DEFAULT_TEMPLATES = [
  { id: 't1', title: 'AEO-optimized FAQ',                    description: 'Generate AEO-optimized FAQs using your website and Search AI score.',                                  source: 'default' },
  { id: 't2', title: 'On demand FAQ generation agent',        description: 'Instantly generate structured FAQs on any topic by entering a prompt or URL — no schedule required.',  source: 'default' },
];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<AgentStatus, 'outline' | 'success' | 'warning'> = {
  Draft:   'outline',
  Running: 'success',
  Paused:  'warning',
};

// ── Metrics strip (no icons) ──────────────────────────────────────────────────

const METRICS = [
  { label: 'Generated FAQs', value: '265' },
  { label: 'Accepted FAQs',  value: '265' },
  { label: 'Time saved',     value: '9h'  },
];

function MetricsStrip() {
  return (
    <div className="flex gap-4 px-6 pt-4 pb-0 shrink-0">
      {METRICS.map((m) => (
        <div
          key={m.label}
          className="flex-1 flex flex-col gap-1 bg-background border border-border rounded-lg px-4 py-2.5 min-w-0"
        >
          <span className="text-[24px] tracking-tight text-foreground leading-8">{m.value}</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" strokeWidth={1.6} absoluteStrokeWidth />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Row actions ───────────────────────────────────────────────────────────────

interface AgentRowActionsProps {
  agentId: string;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function AgentRowActions({ agentId, onEdit, onDuplicate, onDelete }: AgentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover/table-row:opacity-100 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(agentId); }}>
          <Pencil className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(agentId); }}>
          <Copy className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FolderInput className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Move to
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e) => { e.stopPropagation(); onDelete(agentId); }}
        >
          <Trash2 className="size-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Filters config ────────────────────────────────────────────────────────────

const AGENT_FILTERS_DEFAULT: FilterItem[] = [
  { id: 'status',    label: 'Status',    options: ['All statuses', 'Draft', 'Running', 'Paused'] },
  { id: 'locations', label: 'Locations', options: ['Any locations', '1–2', '3–5', '5+'] },
];

const LIBRARY_FILTERS_DEFAULT: FilterItem[] = [
  { id: 'type', label: 'Agent type', options: ['All types', 'Search AI enhancer', 'Competitor gap', 'Local SEO', 'Review-based'] },
];

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = 'agents' | 'library';

const TABS: TextTabItem<TabId>[] = [
  { id: 'agents',  label: 'Agents'  },
  { id: 'library', label: 'Library' },
];

// ── Column helper ─────────────────────────────────────────────────────────────

const col = createColumnHelper<AgentRow>();

// ── View ──────────────────────────────────────────────────────────────────────

export interface FAQAgentsDashboardViewProps {
  onOpenAgent: (agentId: string, agents: AgentRow[]) => void;
  onCreateAgent: (agent: AgentRow) => void;
}

export function FAQAgentsDashboardView({ onOpenAgent, onCreateAgent }: FAQAgentsDashboardViewProps) {
  const [activeTab, setActiveTab]                   = useState<TabId>('agents');
  const [agents, setAgents]                         = useState<AgentRow[]>(INITIAL_AGENTS);
  const [templates, setTemplates]                   = useState(DEFAULT_TEMPLATES);
  const [filterPanelOpen, setFilterPanelOpen]       = useState(false);
  const [agentFilters, setAgentFilters]             = useState<FilterItem[]>(AGENT_FILTERS_DEFAULT);
  const [libraryFilters, setLibraryFilters]         = useState<FilterItem[]>(LIBRARY_FILTERS_DEFAULT);
  const [columnSheetOpen, setColumnSheetOpen]       = useState(false);
  const [libSearchOpen, setLibSearchOpen]           = useState(false);
  const [libQuery, setLibQuery]                     = useState('');
  const [libraryView, setLibraryView]               = useState<'grid' | 'list'>('grid');

  // ── Agent handlers ──────────────────────────────────────────────────────────

  const handleCreateAgent = useCallback(() => {
    const newAgent: AgentRow = {
      id: `a-${Date.now()}`,
      name: 'Untitled FAQ agent',
      status: 'Draft',
      generatedFAQs: 0,
      acceptedFAQs: 0,
      timeSaved: '—',
      locations: 0,
    };
    setAgents((prev) => [...prev, newAgent]);
    onCreateAgent(newAgent);
  }, [onCreateAgent]);

  const handleDeleteAgent = useCallback((id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleDuplicateAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const src = prev.find((a) => a.id === id);
      if (!src) return prev;
      return [...prev, { ...src, id: `a-${Date.now()}`, name: `${src.name} (copy)`, status: 'Draft', generatedFAQs: 0, acceptedFAQs: 0 }];
    });
  }, []);

  // ── Template handlers ───────────────────────────────────────────────────────

  const handleCreateTemplate  = useCallback((tmpl: any) => setTemplates((p) => [...p, { ...tmpl, id: `t-${Date.now()}`, source: 'custom' }]), []);
  const handleDeleteTemplate  = useCallback((id: string) => setTemplates((p) => p.filter((t) => t.id !== id)), []);
  const handleSaveTemplate    = useCallback((tmpl: any)  => setTemplates((p) => p.map((t) => (t.id === tmpl.id ? { ...t, ...tmpl } : t))), []);
  const handleUseTemplate     = useCallback((id: string) => {
    const src = templates.find((t) => t.id === id);
    if (!src) return;
    const newAgent: AgentRow = { id: `a-${Date.now()}`, name: src.title, status: 'Draft', generatedFAQs: 0, acceptedFAQs: 0, timeSaved: '—', locations: 0 };
    setAgents((p) => [...p, newAgent]);
    onCreateAgent(newAgent);
  }, [templates, onCreateAgent]);

  // ── Library search filter ───────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    const q = libQuery.toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [libQuery, templates]);

  // ── Column definitions ──────────────────────────────────────────────────────

  const columns = useMemo(() => [
    col.accessor('name', {
      id: 'name',
      header: 'Agent name',
      size: 280,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="truncate text-[13px] font-normal text-foreground group-hover/table-row:text-primary transition-colors">
          {getValue()}
        </span>
      ),
    }),
    col.accessor('status', {
      id: 'status',
      header: 'Status',
      size: 110,
      enableSorting: true,
      cell: ({ getValue }) => <Badge variant={STATUS_VARIANT[getValue()]}>{getValue()}</Badge>,
    }),
    col.accessor('generatedFAQs', {
      id: 'generatedFAQs',
      header: 'Generated FAQs',
      size: 140,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[13px] font-normal text-foreground">{getValue()}</span>
      ),
    }),
    col.accessor('acceptedFAQs', {
      id: 'acceptedFAQs',
      header: 'Accepted FAQs',
      size: 130,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[13px] font-normal text-foreground">{getValue()}</span>
      ),
    }),
    col.accessor('timeSaved', {
      id: 'timeSaved',
      header: 'Time saved',
      size: 110,
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-[13px] font-normal text-foreground">{getValue()}</span>
      ),
    }),
    col.accessor('locations', {
      id: 'locations',
      header: 'Locations',
      size: 100,
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[13px] font-normal text-foreground">{getValue()}</span>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      size: 52,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => (
        <AgentRowActions
          agentId={row.original.id}
          onEdit={(id) => onOpenAgent(id, agents)}
          onDuplicate={handleDuplicateAgent}
          onDelete={handleDeleteAgent}
        />
      ),
    }),
  ], [agents, onOpenAgent, handleDuplicateAgent, handleDeleteAgent]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header band */}
        <div className={MAIN_VIEW_HEADER_BAND_CLASS}>
          <h1 className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>FAQ generation agents</h1>

          <div className="flex items-center gap-2">
            {activeTab === 'agents' && (
              <>
                <Button type="button" variant="outline" size="icon" aria-label="Search agents">
                  <Search className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
                </Button>
                <Button type="button" onClick={handleCreateAgent}>
                  Create agent
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="More options">
                  <MoreVertical className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
                </Button>
                <AppDataTableColumnSettingsTrigger
                  sheetTitle="Agent columns"
                  onClick={() => setColumnSheetOpen(true)}
                />
                <FilterPaneTriggerButton open={filterPanelOpen} onOpenChange={setFilterPanelOpen} />
              </>
            )}

            {activeTab === 'library' && (
              <>
                <SegmentedToggle<'grid' | 'list'>
                  iconOnly
                  ariaLabel="Library view"
                  value={libraryView}
                  onChange={setLibraryView}
                  items={[
                    { value: 'grid', label: 'Grid view', icon: <LayoutGrid className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden /> },
                    { value: 'list', label: 'List view', icon: <List className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden /> },
                  ]}
                />
                {libSearchOpen || libQuery ? (
                  <div className="relative h-[var(--button-height)] w-[240px]">
                    <Search
                      size={14}
                      strokeWidth={1.6}
                      absoluteStrokeWidth
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      type="search"
                      value={libQuery}
                      onChange={(e) => setLibQuery(e.target.value)}
                      onBlur={() => { if (!libQuery) setLibSearchOpen(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setLibQuery(''); setLibSearchOpen(false); }
                      }}
                      autoFocus
                      placeholder="Search templates"
                      className="h-full pl-8 pr-2 text-[13px]"
                      aria-label="Search templates"
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Search templates"
                    onClick={() => setLibSearchOpen(true)}
                  >
                    <Search className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
                  </Button>
                )}
                <Button type="button" variant="outline" size="icon" aria-label="More options">
                  <MoreVertical className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
                </Button>
                <FilterPaneTriggerButton open={filterPanelOpen} onOpenChange={setFilterPanelOpen} />
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <TextTabsRow<TabId>
          items={TABS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="FAQ agents tabs"
          variant="plain"
          className="px-6"
        />

        {/* Agents tab */}
        {activeTab === 'agents' && (
          <>
            <MetricsStrip />
            <div className="min-h-0 flex-1 overflow-hidden py-4">
              <AppDataTable<AgentRow>
                tableId="content-hub.faq-agents"
                data={agents}
                columns={columns}
                scrollableBody
                rowDensity="default"
                stickyLeadingColumnCount={1}
                hideColumnsButton
                columnSheetOpen={columnSheetOpen}
                onColumnSheetOpenChange={setColumnSheetOpen}
                onRowClick={(agent) => onOpenAgent(agent.id, agents)}
              />
            </div>
          </>
        )}

        {/* Library tab */}
        {activeTab === 'library' && (
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <TemplateLibrary
              templates={filteredTemplates}
              variant={libraryView}
              viewOnly
              onUseTemplate={handleUseTemplate}
            />
          </div>
        )}

      </div>

      {/* Filter panel */}
      <FilterPane
        key={activeTab}
        initialFilters={activeTab === 'agents' ? agentFilters : libraryFilters}
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        onFiltersChange={activeTab === 'agents' ? setAgentFilters : setLibraryFilters}
        motion="static"
        dock="right"
        storageKey={activeTab === 'agents' ? 'faq-agents-agent-filters' : 'faq-agents-library-filters'}
      />
    </div>
  );
}
