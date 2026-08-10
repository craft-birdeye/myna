import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreVertical, Pencil, Copy, FolderInput, Trash2 } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { prefetchAgent } from '../../../services/agentService';
import styles from './AgentsTable.module.css';

const DEFAULT_COLUMNS = [
  { id: 'name',          label: 'Agent name' },
  { id: 'status',        label: 'Status' },
  { id: 'generatedFAQs', label: 'Generated FAQs' },
  { id: 'acceptedFAQs',  label: 'Accepted FAQs' },
  { id: 'timeSaved',     label: 'Time saved' },
  { id: 'locations',     label: 'Locations' },
];

const STATUS_VARIANT = { Running: 'success', Paused: 'warning', Draft: 'secondary' };
const STATUS_DOT = {
  Running: 'bg-[#34a853]',
  Paused:  'bg-[#f9ab00]',
  Draft:   'bg-[#9e9e9e]',
};

const NON_EDITABLE_CELLS = new Set(['status', 'locations', 'generatedFAQs', 'acceptedFAQs']);

function CellValue({ colId, value }) {
  if (colId === 'status') {
    const variant = STATUS_VARIANT[value] || 'secondary';
    const dotClass = STATUS_DOT[value] || 'bg-[#9e9e9e]';
    return (
      <Badge variant={variant}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0 inline-block`} />
        {String(value)}
      </Badge>
    );
  }
  if (colId === 'locations') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span>{value}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.6} absoluteStrokeWidth />
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function AgentsTable({ agents = [], onRowClick, onDeleteAgent, onAgentUpdate, onDuplicateAgent, onMoveAgent }) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [editingHeader, setEditingHeader] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [draft, setDraft] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const inputRef = useRef(null);
  const menuRefs = useRef({});

  useEffect(() => {
    if (!openMenuId) return;
    function handleOutside(e) {
      const ref = menuRefs.current[openMenuId];
      if (ref && !ref.contains(e.target)) setOpenMenuId(null);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenuId]);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function startHeaderEdit(col) {
    setEditingHeader(col.id);
    setEditingCell(null);
    setDraft(col.label);
    focusInput();
  }

  function commitHeaderEdit(colId) {
    setColumns((prev) => prev.map((c) => c.id === colId ? { ...c, label: draft.trim() || c.label } : c));
    setEditingHeader(null);
  }

  function startCellEdit(agent, colId) {
    if (NON_EDITABLE_CELLS.has(colId)) return;
    setEditingCell({ rowId: agent.id, colId });
    setEditingHeader(null);
    setDraft(String(agent[colId] ?? ''));
    focusInput();
  }

  function commitCellEdit() {
    if (!editingCell) return;
    onAgentUpdate?.(editingCell.rowId, editingCell.colId, draft.trim());
    setEditingCell(null);
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.id} className={styles.th}>
                {editingHeader === col.id ? (
                  <input
                    ref={inputRef}
                    className={styles.thInput}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commitHeaderEdit(col.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitHeaderEdit(col.id);
                      if (e.key === 'Escape') setEditingHeader(null);
                    }}
                  />
                ) : (
                  <div className={styles.thInner}>
                    {col.label}
                    <span
                      className={styles.thEditIcon}
                      onClick={() => startHeaderEdit(col)}
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.6} absoluteStrokeWidth />
                    </span>
                  </div>
                )}
              </th>
            ))}
            <th className={styles.th} />
          </tr>
        </thead>

        <tbody>
          {agents.map((agent) => (
            <tr
              key={agent.id}
              className={styles.tr}
              onMouseEnter={() => prefetchAgent(agent.agentSlug, agent.moduleSlug)}
              onClick={() => !editingCell && onRowClick?.(agent)}
            >
              {columns.map((col) => {
                const isEditing = editingCell?.rowId === agent.id && editingCell?.colId === col.id;
                return (
                  <td
                    key={col.id}
                    className={`${styles.td} ${col.id === 'name' ? styles.nameCell : ''}`}
                    onDoubleClick={(e) => { e.stopPropagation(); startCellEdit(agent, col.id); }}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className={styles.cellInput}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitCellEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitCellEdit();
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <CellValue colId={col.id} value={agent[col.id]} />
                    )}
                  </td>
                );
              })}

              <td className={`${styles.td} ${styles.tdActions}`}>
                <div
                  className={styles.menuWrap}
                  ref={(el) => { menuRefs.current[agent.id] = el; }}
                >
                  <button
                    className={styles.menuBtn}
                    title="More options"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === agent.id ? null : agent.id); }}
                  >
                    <MoreVertical className="h-4 w-4" strokeWidth={1.6} />
                  </button>

                  {openMenuId === agent.id && (
                    <div className={styles.menu}>
                      <button
                        className={styles.menuItem}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDuplicateAgent?.(agent.id); setOpenMenuId(null); }}
                      >
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
                        Duplicate
                      </button>
                      <button
                        className={styles.menuItem}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onMoveAgent?.(agent.id); setOpenMenuId(null); }}
                      >
                        <FolderInput className="h-3.5 w-3.5" strokeWidth={1.6} />
                        Move to
                      </button>
                      <div className={styles.menuDivider} />
                      <button
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteAgent?.(agent.id); setOpenMenuId(null); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
