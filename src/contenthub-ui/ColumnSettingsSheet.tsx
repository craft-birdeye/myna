"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, RotateCcw } from "lucide-react";
import { Button } from "./button";
import { Label } from "./label";
import { Switch } from "./switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { cn } from "./utils";
import { reorderColumnIds } from "./columnSettingsReorder";

export { reorderColumnIds } from "./columnSettingsReorder";

const COLUMN_DND_MIME = "application/x-shareconsolidated-column-id";

export interface ColumnSettingsSheetColumn {
  id: string;
  label: string;
  visible: boolean;
  /** When false, row still shows but switch is disabled (e.g. required column). */
  canHide: boolean;
}

interface ColumnSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  columns: ColumnSettingsSheetColumn[];
  /** Full column id list after drag-reorder (order matches table columnOrder). */
  onReorder: (orderedColumnIds: string[]) => void;
  onToggleVisibility: (columnId: string, visible: boolean) => void;
  onReset: () => void;
}

function DropSlot() {
  return (
    <div className="flex flex-col gap-2 py-1 motion-safe:transition-opacity motion-safe:duration-150" aria-hidden>
      <div className="h-1 w-full shrink-0 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] motion-safe:animate-pulse motion-reduce:animate-none" />
      <div className="min-h-[52px] w-full rounded-lg border-2 border-dashed border-primary/40 bg-primary/[0.07] motion-safe:animate-pulse motion-reduce:animate-none" />
    </div>
  );
}

function insertSlotAnnouncement(columns: ColumnSettingsSheetColumn[], insertIndex: number | null): string {
  if (insertIndex == null) return "";
  if (insertIndex <= 0) return `Insert at start, before ${columns[0]?.label ?? "first column"}.`;
  if (insertIndex >= columns.length) return `Insert at end, after ${columns[columns.length - 1]?.label ?? "last column"}.`;
  return `Insert before ${columns[insertIndex]?.label ?? "column"}.`;
}

export function ColumnSettingsSheet({
  open,
  onOpenChange,
  title = "Columns",
  columns,
  onReorder,
  onToggleVisibility,
  onReset,
}: ColumnSettingsSheetProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const insertIndexRef = useRef<number | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** True when `drop` fired this gesture — avoids `dragend` clearing before `drop` in some engines. */
  const dropHandledRef = useRef(false);

  useEffect(() => {
    insertIndexRef.current = insertIndex;
  }, [insertIndex]);

  const clearDrag = useCallback(() => {
    draggingIdRef.current = null;
    setDraggingId(null);
    setInsertIndex(null);
  }, []);

  useEffect(() => {
    if (!open) clearDrag();
  }, [open, clearDrag]);

  const ids = useMemo(() => columns.map((c) => c.id), [columns]);

  const applyDrop = useCallback(() => {
    const activeId = draggingIdRef.current;
    const slot = insertIndexRef.current;
    if (!activeId || slot == null) {
      clearDrag();
      return;
    }
    const from = ids.indexOf(activeId);
    if (from < 0) {
      clearDrag();
      return;
    }
    if (slot === from || slot === from + 1) {
      clearDrag();
      return;
    }
    const next = reorderColumnIds(ids, from, slot);
    onReorder(next);
    clearDrag();
  }, [clearDrag, ids, onReorder]);

  const updateInsertIndexFromClientY = useCallback(
    (clientY: number) => {
      const root = listRef.current;
      if (!root || draggingIdRef.current == null) return;
      const rowEls = root.querySelectorAll<HTMLElement>("[data-column-row]");
      const rects: { top: number; bottom: number; index: number }[] = [];
      rowEls.forEach((el, index) => {
        const r = el.getBoundingClientRect();
        rects.push({ top: r.top, bottom: r.bottom, index });
      });
      if (rects.length === 0) return;
      let slot = rects.length;
      for (let i = 0; i < rects.length; i++) {
        const { top, bottom, index } = rects[i];
        const mid = top + (bottom - top) / 2;
        if (clientY < mid) {
          slot = index;
          break;
        }
      }
      setInsertIndex(slot);
    },
    [],
  );

  const onListDragOverCapture = useCallback(
    (e: React.DragEvent) => {
      if (!draggingIdRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      updateInsertIndexFromClientY(e.clientY);
    },
    [updateInsertIndexFromClientY],
  );

  const onListDragLeave = useCallback((e: React.DragEvent) => {
    if (!draggingIdRef.current) return;
    const next = e.relatedTarget as Node | null;
    /** `relatedTarget` is often `null` when moving between descendants — do not clear the slot. */
    if (next == null) return;
    if (listRef.current?.contains(next)) return;
    setInsertIndex(null);
  }, []);

  const onListDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dropHandledRef.current = true;
      applyDrop();
    },
    [applyDrop],
  );

  const scheduleDragEndCleanup = useCallback(() => {
    requestAnimationFrame(() => {
      if (!dropHandledRef.current) clearDrag();
      dropHandledRef.current = false;
    });
  }, [clearDrag]);

  const moveByKeyboard = useCallback(
    (columnId: string, delta: -1 | 1) => {
      const from = ids.indexOf(columnId);
      if (from < 0) return;
      if (delta === -1) {
        if (from <= 0) return;
        onReorder(reorderColumnIds(ids, from, from - 1));
      } else {
        if (from >= ids.length - 1) return;
        onReorder(reorderColumnIds(ids, from, from + 2));
      }
    },
    [ids, onReorder],
  );

  const liveMsg = useMemo(
    () => (draggingId ? insertSlotAnnouncement(columns, insertIndex) : ""),
    [columns, draggingId, insertIndex],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" inset="floating" floatingSize="md" className="flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Show or hide columns. Drag the grip handle to reorder; widths are set from the table header. Use Alt +
            arrow keys while the grip is focused to move a row.
          </SheetDescription>
          {draggingId ? (
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              Dragging — release over a row to place it. Drop targets show a dashed outline.
            </p>
          ) : null}
        </SheetHeader>
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMsg}
        </span>
        <div
          ref={listRef}
          role="list"
          aria-label="Column order and visibility"
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-6 py-4"
          onDragLeave={onListDragLeave}
          onDragOverCapture={onListDragOverCapture}
          onDrop={onListDrop}
        >
          {columns.map((col, index) => (
            <div key={col.id} className="flex flex-col gap-2">
              {draggingId && insertIndex === index ? (
                <div
                  className="shrink-0"
                  onDragOver={(e) => {
                    if (!draggingIdRef.current) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setInsertIndex(index);
                  }}
                >
                  <DropSlot />
                </div>
              ) : null}
              <div
                data-column-row
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 transition-opacity duration-150",
                  draggingId === col.id && "border-primary/30 bg-muted/20 shadow-sm ring-1 ring-primary/20",
                  draggingId && draggingId !== col.id && "opacity-60",
                )}
                onDragOver={(e) => {
                  if (!draggingIdRef.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mid = rect.top + rect.height / 2;
                  setInsertIndex(e.clientY < mid ? index : index + 1);
                }}
              >
                <button
                  type="button"
                  draggable
                  className={cn(
                    "flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent",
                    "text-muted-foreground hover:border-border hover:bg-muted/60 active:cursor-grabbing",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  )}
                  aria-label={`Drag to reorder ${col.label}`}
                  title="Drag to reorder"
                  onDragStart={(e) => {
                    dropHandledRef.current = false;
                    draggingIdRef.current = col.id;
                    e.dataTransfer.setData(COLUMN_DND_MIME, col.id);
                    e.dataTransfer.effectAllowed = "move";
                    try {
                      e.dataTransfer.setData("text/plain", col.id);
                    } catch {
                      /* ignore */
                    }
                    setDraggingId(col.id);
                    setInsertIndex(index);
                  }}
                  onDragEnd={scheduleDragEndCleanup}
                  onKeyDown={(e) => {
                    if (!e.altKey) return;
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      moveByKeyboard(col.id, -1);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      moveByKeyboard(col.id, 1);
                    }
                  }}
                >
                  <GripVertical className="size-4 shrink-0" aria-hidden />
                </button>
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col",
                    draggingId === col.id && "pointer-events-none select-none",
                    draggingId && draggingId !== col.id && "pointer-events-none",
                  )}
                >
                  <Label htmlFor={`col-vis-${col.id}`} className="truncate text-sm font-medium text-foreground">
                    {col.label}
                  </Label>
                </div>
                <div
                  className={cn(
                    "shrink-0",
                    draggingId === col.id && "pointer-events-auto",
                    draggingId && draggingId !== col.id && "pointer-events-none",
                  )}
                >
                  <Switch
                    id={`col-vis-${col.id}`}
                    checked={col.visible}
                    disabled={!col.canHide && col.visible}
                    onCheckedChange={(v) => onToggleVisibility(col.id, v)}
                    className={cn(!col.canHide && col.visible && "opacity-60")}
                  />
                </div>
              </div>
            </div>
          ))}
          {draggingId && insertIndex === columns.length ? (
            <div
              className="shrink-0"
              onDragOver={(e) => {
                if (!draggingIdRef.current) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "move";
                setInsertIndex(columns.length);
              }}
            >
              <DropSlot />
            </div>
          ) : null}
        </div>
        <div className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onReset}>
            <RotateCcw className="size-4" aria-hidden />
            Reset columns
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
