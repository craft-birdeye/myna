/**
 * BlockShell
 *
 * Wraps every block with:
 * - Selection ring when focused
 * - Drag handle (grip icon, left edge)
 * - Hover toolbar (right side: move up / move down / duplicate / delete)
 * - Click-outside to deselect
 */

import React, { useRef } from 'react';
import {
  GripVertical, ChevronUp, ChevronDown, Copy, Trash2,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

interface BlockShellProps {
  blockId: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
  surface?: 'card' | 'page';
  /** For drag-and-drop */
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  isShimmering?: boolean;
}

export function BlockShell({
  blockId,
  focused,
  onFocus,
  onBlur,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  isFirst,
  isLast,
  children,
  surface = 'card',
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
  isShimmering,
}: BlockShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={shellRef}
      data-block-id={blockId}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onFocus}
      className={cn(
        'group/shell relative rounded-xl transition-all',
        surface === 'card'
          ? focused
            ? 'ring-2 ring-primary/30 bg-background'
            : 'hover:ring-1 hover:ring-border bg-background'
          : focused
            ? 'ring-2 ring-primary/30'
            : 'hover:ring-1 hover:ring-border',
        isDragOver && 'ring-2 ring-primary',
      )}
    >
      {/* Drag handle — left edge, visible on hover / focus */}
      <div
        className={cn(
          'absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-opacity',
          focused || 'opacity-0 group-hover/shell:opacity-100',
        )}
      >
        <GripVertical size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/50" />
      </div>

      {/* Hover/focus toolbar — top-right */}
      <div className={cn(
        'absolute -right-2 -top-3 flex items-center gap-0.5 bg-background border border-border rounded-lg px-1 py-0.5 shadow-sm transition-opacity z-10',
        focused ? 'opacity-100' : 'opacity-0 group-hover/shell:opacity-100',
      )}>
        <button
          type="button"
          title="Move up"
          disabled={isFirst}
          onClick={e => { e.stopPropagation(); onMoveUp(); }}
          className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          title="Move down"
          disabled={isLast}
          onClick={e => { e.stopPropagation(); onMoveDown(); }}
          className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <div className="w-px h-3 bg-border mx-0.5" />
        <button
          type="button"
          title="Duplicate"
          onClick={e => { e.stopPropagation(); onDuplicate(); }}
          className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Copy size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          title="Delete block"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Block content */}
      <div className={cn(surface === 'card' ? 'px-4 py-4' : 'px-4 py-0.5')} onBlur={onBlur}>
        {isShimmering ? (
          <div className="pointer-events-none space-y-3 py-1">
            {/* Header skeleton lines */}
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
            {/* Large content block */}
            <div className="mt-2 h-36 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <div onBlur={onBlur}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
