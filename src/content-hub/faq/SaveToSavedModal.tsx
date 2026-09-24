/**
 * SaveToSavedModal
 *
 * "Add block to Saved" dialog — mirrors the Campaigns editor pattern.
 * Shows a visual preview of the content being saved, lets the user name it,
 * then calls onSave(name) to commit to the savedBlocksStore.
 */

import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
} from '@/contenthub-ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SaveToSavedModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-filled name for the block (section title or "FAQ content"). */
  defaultName: string;
  /** First 2–4 question texts shown in the preview, styled like the FAQ canvas. */
  previewSnippets: string[];
  /** Called with the trimmed name when the user clicks Save. */
  onSave: (name: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SaveToSavedModal({
  open,
  onClose,
  defaultName,
  previewSnippets,
  onSave,
}: SaveToSavedModalProps) {
  const [name, setName] = useState(defaultName);

  // Reset name each time the modal is opened for a (possibly different) section
  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-[520px] rounded-xl bg-background shadow-modal',
            'outline-none',
          )}
          onEscapeKeyDown={onClose}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
            <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>
              Add block to Saved
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:bg-surface-hover transition-colors"
            >
              <X size={15} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          {/* Preview — mirrors the FAQ canvas (numbered, bold questions) */}
          <div className="px-6 pt-5">
            <div className="rounded-xl border border-border bg-background px-4 py-4">
              {previewSnippets.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">No questions yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {previewSnippets.slice(0, 3).map((q, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="select-none text-[14px] leading-snug text-foreground flex-none w-5 text-right">
                        {i + 1}.
                      </span>
                      <p className="text-[13px] leading-snug text-foreground line-clamp-2">
                        {q}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Name field */}
          <div className="px-6 pt-4 pb-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] text-foreground">
                Block name
                <span className="text-destructive ml-0.5">*</span>
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                maxLength={80}
                placeholder="Name this block..."
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-2 py-2',
                  'text-[13px] text-foreground placeholder:text-muted-foreground',
                  'outline-none focus:border-primary transition-colors',
                )}
              />
            </label>
            <p className="mt-2 text-[12px] text-muted-foreground">
              You can access this block from the Saved tab to reuse it in other templates.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] px-4 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className={cn(
                'h-[34px] px-4 rounded-lg text-[13px] transition-colors',
                name.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              Save
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
