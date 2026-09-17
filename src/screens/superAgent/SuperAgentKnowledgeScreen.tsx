import { useMemo, useState } from 'react'
import {
  Chip,
  DataTable,
  FilesModal,
  FilterPanel,
  HeaderSearchField,
  Icon,
  type Column,
  type FilesModalFile,
  type FilterField,
} from '../../components'
import {
  isLibraryAgentVisibleForRole,
  SUPER_AGENT_ACTIVE_AGENTS,
  SUPER_AGENT_PAUSED_AGENTS,
  type SuperAgentKnowledgeItem,
  type SuperAgentRole,
} from './superAgentSeedData'

// Native "Knowledge" screen for the Super agent L1 module — a flat hub of every file,
// link, and note across all agents (not grouped by agent), with search/filter/sort and
// an "Add files" action, mirroring the prototype iframe's own new "Knowledge" nav row.
interface KnowledgeRow {
  id: string
  title: string
  kind: SuperAgentKnowledgeItem['kind']
  detail: string
  source: string
  addedByUser?: boolean
  /** Source agent's id, for role-based visibility. Absent for user-added rows, which
   *  are always visible regardless of role. */
  agentId?: string
  [key: string]: unknown
}

const ALL_KNOWLEDGE_AGENTS = [...SUPER_AGENT_ACTIVE_AGENTS, ...SUPER_AGENT_PAUSED_AGENTS]

const KIND_LABEL: Record<SuperAgentKnowledgeItem['kind'], string> = {
  file: 'File',
  image: 'Image',
  link: 'Link',
  note: 'Note',
}

const KIND_ICON: Record<SuperAgentKnowledgeItem['kind'], string> = {
  file: 'description',
  image: 'image',
  link: 'link',
  note: 'sticky_note_2',
}

const KIND_CHIP_VARIANT: Record<SuperAgentKnowledgeItem['kind'], 'neutral' | 'info' | 'success' | 'warning'> = {
  file: 'neutral',
  image: 'info',
  link: 'success',
  note: 'warning',
}

function buildInitialRows(): KnowledgeRow[] {
  return ALL_KNOWLEDGE_AGENTS.flatMap((agent) =>
    agent.knowledge.map((item, index) => ({
      id: `${agent.id}-${index}`,
      title: item.title,
      kind: item.kind,
      detail: item.detail,
      source: agent.name,
      agentId: agent.id,
    })),
  )
}

export interface SuperAgentKnowledgeScreenProps {
  /** Gates which rows (by source agent) are visible for the current user. */
  activeRole: SuperAgentRole
}

export function SuperAgentKnowledgeScreen({ activeRole }: SuperAgentKnowledgeScreenProps) {
  const [rows, setRows] = useState<KnowledgeRow[]>(buildInitialRows)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [addFilesOpen, setAddFilesOpen] = useState(false)

  const roleVisibleRows = useMemo(() => {
    const agentById = new Map(ALL_KNOWLEDGE_AGENTS.map((a) => [a.id, a]))
    return rows.filter((r) => {
      if (!r.agentId) return true
      const agent = agentById.get(r.agentId)
      return agent ? isLibraryAgentVisibleForRole(agent, activeRole) : true
    })
  }, [rows, activeRole])

  const sourceOptions = useMemo(
    () => Array.from(new Set(roleVisibleRows.map((r) => r.source))).sort().map((s) => ({ value: s, label: s })),
    [roleVisibleRows],
  )

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: 'kind',
        label: 'Type',
        options: (Object.keys(KIND_LABEL) as SuperAgentKnowledgeItem['kind'][]).map((k) => ({
          value: k,
          label: KIND_LABEL[k],
        })),
      },
      { id: 'source', label: 'Source agent', options: sourceOptions },
    ],
    [sourceOptions],
  )

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const kindFilter = selections.kind ?? []
    const sourceFilter = selections.source ?? []
    return roleVisibleRows.filter((r) => {
      if (kindFilter.length > 0 && !kindFilter.includes(r.kind)) return false
      if (sourceFilter.length > 0 && !sourceFilter.includes(r.source)) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q)
      )
    })
  }, [roleVisibleRows, searchQuery, selections])

  function removeRow(id: string) {
    setRows((list) => list.filter((r) => r.id !== id))
  }

  function handleAddFiles(files: FilesModalFile[]) {
    if (files.length === 0) return
    setRows((list) => [
      ...files.map((f) => ({
        id: `user-${f.id}-${Date.now()}`,
        title: f.label,
        kind: 'file' as const,
        detail: 'Uploaded just now',
        source: 'You',
        addedByUser: true,
      })),
      ...list,
    ])
  }

  const columns: Column<KnowledgeRow>[] = [
    {
      key: 'title',
      label: 'Name',
      sortable: true,
      minWidth: 240,
      render: (value, row) => (
        <span className="flex items-center gap-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-surface-l2 text-text-icon">
            <Icon name={KIND_ICON[row.kind]} size={16} />
          </span>
          <span className="truncate text-body text-text-primary">{String(value)}</span>
        </span>
      ),
    },
    {
      key: 'kind',
      label: 'Type',
      width: 120,
      sortable: true,
      truncate: false,
      render: (value) => <Chip label={KIND_LABEL[value as SuperAgentKnowledgeItem['kind']]} variant={KIND_CHIP_VARIANT[value as SuperAgentKnowledgeItem['kind']]} />,
    },
    {
      key: 'source',
      label: 'Source agent',
      width: 200,
      sortable: true,
    },
    {
      key: 'detail',
      label: 'Updated',
      width: 220,
      sortable: true,
    },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-2xl py-xl">
        <div>
          <h1 className="text-h3 text-text-primary">Knowledge</h1>
          <p className="mt-xs text-body text-text-secondary">
            Every document, template, and policy your agents can reference — {roleVisibleRows.length} sources.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <HeaderSearchField
            open={searchOpen}
            value={searchQuery}
            onOpenChange={setSearchOpen}
            onChange={setSearchQuery}
            placeholder="Search knowledge"
          />
          <button
            type="button"
            onClick={() => setAddFilesOpen(true)}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Add files
          </button>
          <button
            type="button"
            aria-label="Filter"
            onClick={() => setFilterOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Icon name="filter_list" size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto px-2xl py-lg">
          <DataTable
            columns={columns}
            data={filteredData}
            rowMenuItems={[
              {
                label: 'Remove',
                variant: 'danger',
                visible: (row) => Boolean(row.addedByUser),
                onClick: (row) => removeRow(row.id),
              },
            ]}
          />
        </div>
        <FilterPanel
          open={filterOpen}
          fields={filterFields}
          selections={selections}
          onSelectionsChange={setSelections}
          onClose={() => setFilterOpen(false)}
        />
      </div>

      <FilesModal open={addFilesOpen} onClose={() => setAddFilesOpen(false)} onDone={handleAddFiles} />
    </div>
  )
}
