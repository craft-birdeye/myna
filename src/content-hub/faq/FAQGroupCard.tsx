/**
 * FAQGroupCard — single-card FAQ editor used on the review canvas.
 *
 * One card, one AEO score in the header.
 * Clicking a row selects it → opens the EditFAQPanel on the right.
 * Drag-to-reorder, delete on hover.
 * Shows an empty state when there are no questions yet.
 */
import React, { useRef, useState } from 'react';
import { ChevronDown, GripVertical, Trash2, Plus, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { scoreColor, scoreStrokeColor } from '../shared/scoreColors';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FAQCardItem {
  faq_id: string;
  question: string;
  answer: string;
}

interface FAQGroupCardProps {
  questions: FAQCardItem[];
  onQuestionsChange: (updated: FAQCardItem[]) => void;
  onQuestionSelect: (index: number) => void;
  selectedQuestionIndex: number | null;
  score: number;
  editable?: boolean;
  onDelete?: (faqId: string, index: number) => void;
  onAddQuestion?: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const FAQGroupCard = ({
  questions,
  onQuestionsChange: _onQuestionsChange,
  onQuestionSelect,
  selectedQuestionIndex,
  score,
  editable = false,
  onDelete,
  onAddQuestion,
  onReorder,
}: FAQGroupCardProps) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSrcIdx = useRef<number | null>(null);

  // ── drag-and-drop ───────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    const fromIdx = dragSrcIdx.current;
    if (fromIdx === null || fromIdx === toIdx) return;
    onReorder?.(fromIdx, toIdx);
    dragSrcIdx.current = null;
    setExpandedIdx(null);
  };

  const handleDragEnd = () => {
    setDragOverIdx(null);
    dragSrcIdx.current = null;
  };

  // ── empty state ─────────────────────────────────────────────────────────────

  const isEmpty = questions.length === 0;

  return (
    <div className="bg-white border border-border rounded-md w-full max-w-[620px] overflow-hidden shadow-sm">

      {/* ── Card header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        {/* Left: checkbox · icon · label · draft badge · count */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-border accent-primary flex-shrink-0"
            onClick={e => e.stopPropagation()}
            readOnly
          />
          <FileText size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-shrink-0" />
          <span className="text-[12px] text-foreground">FAQ</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded leading-none bg-surface-hover text-text-secondary">
            Draft
          </span>
          {!isEmpty && (
            <span className="text-[11px] text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Right: AEO score bar — only shown when there are questions */}
        {!isEmpty && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${score}%`, background: scoreStrokeColor(score) }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">AEO</span>
            <span
              className="text-[12px] leading-none"
              style={{ color: scoreColor(score).text }}
            >
              {score}/100
            </span>
          </div>
        )}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center">
            <MessageSquare size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-primary/60" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-foreground">No questions yet</span>
            <span className="text-[12px] text-muted-foreground leading-relaxed">
              Add your first question, or use the AI copilot<br />on the left to generate a full FAQ set.
            </span>
          </div>
          {editable && onAddQuestion && (
            <button
              onClick={onAddQuestion}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
              Add question
            </button>
          )}
        </div>
      )}

      {/* ── Q&A rows ─────────────────────────────────────────────────────────── */}
      {!isEmpty && (
        <div>
          {questions.map((item, i) => {
            const isExpanded = expandedIdx === i;
            const isSelected = selectedQuestionIndex === i;
            const isDragOver = dragOverIdx === i;

            return (
              <div
                key={item.faq_id}
                draggable={editable}
                onDragStart={editable ? e => handleDragStart(e, i) : undefined}
                onDragOver={editable ? e => handleDragOver(e, i) : undefined}
                onDrop={editable ? e => handleDrop(e, i) : undefined}
                onDragEnd={editable ? handleDragEnd : undefined}
                className={cn(
                  'group relative border-b border-border last:border-b-0',
                  isDragOver && 'border-t-2 border-t-primary',
                )}
              >
                {/* Grip handle */}
                {editable && (
                  <div className="absolute left-1 top-[14px] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
                    <GripVertical size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                  </div>
                )}

                {/* Question row — clicking selects (opens right panel) */}
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2 py-2 text-left transition-colors',
                    editable ? 'pl-6 pr-9' : 'px-4',
                    isSelected
                      ? 'bg-surface-selected'
                      : 'hover:bg-surface-hover',
                  )}
                  onClick={e => {
                    e.stopPropagation();
                    onQuestionSelect(i);
                  }}
                >
                  {/* Q number */}
                  <span className="text-[11px] text-muted-foreground flex-shrink-0 w-6">
                    Q{i + 1}.
                  </span>

                  {/* Question text */}
                  <span className={cn(
                    'flex-1 text-[13px] leading-snug text-left',
                    item.question ? 'text-foreground' : 'text-muted-foreground italic',
                  )}>
                    {item.question || 'Untitled question'}
                  </span>

                  {/* Expand chevron — toggles answer preview */}
                  <span
                    role="button"
                    tabIndex={-1}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={e => { e.stopPropagation(); setExpandedIdx(isExpanded ? null : i); }}
                    onKeyDown={e => e.key === 'Enter' && setExpandedIdx(isExpanded ? null : i)}
                  >
                    <ChevronDown
                      size={14}
                      strokeWidth={1.6}
                      absoluteStrokeWidth
                      className={cn('transition-transform duration-200', isExpanded ? 'rotate-0' : '-rotate-90')}
                    />
                  </span>
                </button>

                {/* Delete button */}
                {editable && (
                  <button
                    onClick={e => { e.stopPropagation(); onDelete?.(item.faq_id, i); }}
                    title="Delete question"
                    className="absolute right-2 top-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                )}

                {/* Expanded answer preview (read-only) */}
                {isExpanded && (
                  <div
                    className={cn(
                      'pb-3 pl-10 pr-4',
                      isSelected ? 'bg-surface-selected' : 'bg-surface-hover',
                    )}
                  >
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {item.answer || (
                        <span className="italic text-muted-foreground/60">No answer yet — click the row to edit.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add question footer ────────────────────────────────────────────────── */}
      {editable && onAddQuestion && !isEmpty && (
        <button
          onClick={onAddQuestion}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] text-muted-foreground hover:text-primary hover:bg-surface-hover/40 transition-colors border-t border-border"
        >
          <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Add question
        </button>
      )}
    </div>
  );
};
