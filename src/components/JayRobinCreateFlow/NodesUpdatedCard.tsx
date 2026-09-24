/**
 * "N nodes updated · Accept / Undo" — the review card the build pass leaves docked above the
 * composer. Collapsed, it's one row (chevron, count, the two actions); expanded, it lists
 * every node the pass touched with the node's glyph; added nodes sit on a light tint.
 *
 * Chrome matches the docked question cards (`rounded-sm border-border bg-surface`), regular
 * weight only, sentence case.
 */
import { useState } from 'react'
import type { JrNodeUpdate } from '../../data/jayRobinCreateFlow'
import { JR_NODES_CARD } from '../../data/jayRobinCreateFlow'
import { Icon } from '../Icon/Icon'

export interface NodesUpdatedCardProps {
  nodes: JrNodeUpdate[]
  onAccept: () => void
  onUndo: () => void
  /** A row was clicked — open that node's config panel on the canvas. */
  onOpenNode?: (nodeId: string) => void
  className?: string
}

export function NodesUpdatedCard({ nodes, onAccept, onUndo, onOpenNode, className = '' }: NodesUpdatedCardProps) {
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
          {JR_NODES_CARD.title.replace('{n}', String(nodes.length))}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex h-8 items-center rounded-sm bg-primary px-md text-body text-white transition-colors hover:bg-primary-hover"
        >
          {JR_NODES_CARD.accept}
        </button>
        <button
          type="button"
          onClick={onUndo}
          className="flex h-8 items-center rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary transition-colors hover:bg-surface-l2"
        >
          {JR_NODES_CARD.undo}
        </button>
      </div>
      {open && (
        <ul className="m-0 flex list-none flex-col gap-2xs border-t border-border px-md py-sm">
          {nodes.map((node) => {
            const clickable = !!node.id && !!onOpenNode
            const rowClass = `gw-flow__in flex w-full items-center gap-sm rounded-sm px-sm py-xs text-left ${
              node.kind === 'added' ? 'bg-surface-hover' : ''
            } ${clickable ? 'transition-colors hover:bg-surface-selected' : ''}`
            const content = (
              <>
                <Icon name={node.icon} size={16} className="shrink-0 text-[#7c3aed]" />
                <span className="min-w-0 flex-1 text-body text-text-primary">{node.label}</span>
                {clickable && <Icon name="chevron_right" size={16} className="shrink-0 text-text-icon" />}
              </>
            )
            return (
              <li key={node.label}>
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
