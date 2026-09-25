/**
 * "N nodes updated · Undo" — the review card the build pass leaves docked above the
 * composer. Collapsed, it's one row (chevron, count, Undo); expanded, it lists
 * every node the pass touched. Each glyph is the same one that node wears on the
 * canvas, drawn in grey, and every row sits on white.
 *
 * Chrome matches the docked question cards (`rounded-sm border-border bg-surface`), regular
 * weight only, sentence case.
 */
import { useState } from 'react'
import type { JrNodeUpdate } from '../../data/jayRobinCreateFlow'
import { JR_NODES_CARD } from '../../data/jayRobinCreateFlow'
import { Icon } from '../Icon/Icon'
import { NODE_TYPE_BADGES, NodeTypeBadgeIcon } from '../../workflow/Molecules/Canvas/nodeTypeBadges.jsx'

/** Canvas badge for a workflow node. Path chips and End have no glyph on the canvas. */
function canvasBadgeType(id?: string) {
  if (id === '__start__') return 'start'
  if (id === 'rr-1') return 'trigger'
  if (id === 'rr-3') return 'branch'
  if (id === 'rr-2' || id === 'rr-4' || id === 'rr-5' || id === 'rr-5t' || id === 'rr-6' || id === 'rr-7' || id === 'rr-8') return 'task'
  return null
}

function NodeGlyph({ id }: { id?: string }) {
  const type = canvasBadgeType(id)
  if (!type) return <span className="size-4 shrink-0" aria-hidden />
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-text-secondary">
      <NodeTypeBadgeIcon
        badge={NODE_TYPE_BADGES[type]}
        className="shrink-0 text-text-secondary"
        maskClassName="size-4 shrink-0 bg-current [mask-repeat:no-repeat] [mask-position:center] [mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center] [-webkit-mask-size:contain]"
      />
    </span>
  )
}

export interface NodesUpdatedCardProps {
  nodes: JrNodeUpdate[]
  onAccept: () => void
  onUndo: () => void
  /** A later message has been sent, so the canvas changes can no longer be undone. */
  undoDisabled?: boolean
  /** A row was clicked — open that node's config panel on the canvas. */
  onOpenNode?: (nodeId: string) => void
  className?: string
}

export function NodesUpdatedCard({ nodes, onUndo, onOpenNode, undoDisabled = false, className = '' }: NodesUpdatedCardProps) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`agent-build-fade ml-3xl mt-sm flex max-w-full flex-col overflow-hidden rounded-sm border border-border bg-surface ${className}`}
    >
      <div className="flex items-center gap-sm px-md py-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-xs rounded-sm py-xs text-left text-body text-text-primary"
        >
          <Icon
            name="chevron_right"
            size={18}
            className={`shrink-0 text-text-icon transition-transform ${open ? 'rotate-90' : ''}`}
          />
          {nodes.length === 1 ? '1 node updated' : JR_NODES_CARD.title.replace('{n}', String(nodes.length))}
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={undoDisabled}
          className={`flex h-8 items-center rounded-sm border bg-surface px-md text-body transition-colors ${
            undoDisabled
              ? 'cursor-not-allowed border-border text-text-tertiary'
              : 'border-border-selected text-text-primary hover:bg-surface-l2'
          }`}
        >
          {JR_NODES_CARD.undo}
        </button>
      </div>
      {open && (
        <ul className="m-0 flex list-none flex-col gap-2xs border-t border-border px-md py-sm">
          {nodes.map((node, i) => {
            const clickable = !!node.id && !!onOpenNode
            const rowClass = `gw-flow__in flex w-full items-center gap-sm rounded-sm bg-surface px-sm py-xs text-left ${
              clickable ? 'transition-colors hover:bg-surface-hover' : ''
            }`
            const content = (
              <>
                <NodeGlyph id={node.id} />
                <span className="min-w-0 flex-1 text-body text-text-primary">{node.label}</span>
                {clickable && <Icon name="chevron_right" size={16} className="shrink-0 text-text-icon" />}
              </>
            )
            return (
              <li key={node.id ?? `${node.label}-${i}`}>
                {clickable ? (
                  <button type="button" onClick={() => onOpenNode?.(node.id!)} className={rowClass}>
                    {content}
                  </button>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
