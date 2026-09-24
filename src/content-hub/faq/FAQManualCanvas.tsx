/**
 * FAQManualCanvas — the editable canvas for "Create manually" mode.
 *
 * Features:
 *  • Subscribes to faqStore and renders sections + ungrouped questions
 *  • HTML5 drag-and-drop for reordering sections and questions
 *  • Inline contenteditable editing (question + answer on selection)
 *  • GripVertical drag handles on every row / section header
 *  • Double-click section header to rename
 *  • Click any row to select → notifies parent (opens FAQEditPanel)
 *  • Toolbar visibility toggled via onToolbarVisible callback
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import {
  getFAQs, getFAQMeta, getSections, subscribeFAQs,
  updateFAQ, updateMeta,
  deleteQuestion, deleteSection, renameSection,
  reorderSections, reorderItems, moveToSection,
  type FAQSection, type FAQMeta,
} from './faqStore';
import type { LegacyFAQItem } from './faqStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FAQManualCanvasProps {
  selectedFaqId: string | null;
  onSelectFaq: (faqId: string | null) => void;
  onToolbarVisible: (visible: boolean) => void;
}

interface DragPayload {
  type: 'question' | 'section';
  id: string;
}

// ── FAQCanvasRow — one FAQ item ────────────────────────────────────────────────

interface RowProps {
  faq: LegacyFAQItem;
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onFocus: (field: 'question' | 'answer') => void;
  onSaveField: (field: 'question' | 'answer', value: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDelete: () => void;
}

const FAQCanvasRow = memo(({
  faq, isSelected, isDragOver,
  onSelect, onFocus, onSaveField,
  onDragStart, onDragOver, onDrop, onDragEnd, onDelete,
}: RowProps) => {
  const questionRef = useRef<HTMLDivElement>(null);
  const answerRef   = useRef<HTMLDivElement>(null);

  // Sync content when the FAQ changes externally (e.g., saved from FAQEditPanel)
  useEffect(() => {
    if (questionRef.current && document.activeElement !== questionRef.current) {
      questionRef.current.innerText = faq.question;
    }
  }, [faq.question]);

  useEffect(() => {
    if (answerRef.current && document.activeElement !== answerRef.current) {
      answerRef.current.innerText = faq.answer;
    }
  }, [faq.answer]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={cn(
        'group relative border-b border-border last:border-b-0 transition-colors cursor-pointer',
        isSelected  && 'bg-primary/5',
        isDragOver  && 'border-t-2 border-t-primary',
        !isSelected && 'hover:bg-surface-hover',
      )}
    >
      {/* Grip */}
      <div className="absolute left-1 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
      </div>

      <div className="pl-6 pr-8 py-2 flex flex-col gap-1">
        {/* Question — contenteditable */}
        <div
          ref={questionRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => { onSelect(); onFocus('question'); }}
          onBlur={e => onSaveField('question', e.currentTarget.innerText.trim())}
          onClick={e => e.stopPropagation()}
          className="text-[13px] text-foreground leading-snug outline-none rounded px-1 -mx-1 min-h-[20px] focus:ring-1 focus:ring-primary/30 focus:bg-white"
        />

        {/* Answer — shown inline when selected */}
        {isSelected && (
          <div
            ref={answerRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => onFocus('answer')}
            onBlur={e => onSaveField('answer', e.currentTarget.innerText.trim())}
            onClick={e => e.stopPropagation()}
            className="text-[12px] text-muted-foreground leading-relaxed outline-none rounded px-1 -mx-1 min-h-[36px] focus:ring-1 focus:ring-primary/30 focus:bg-white"
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Delete question"
        className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
      </button>
    </div>
  );
});
FAQCanvasRow.displayName = 'FAQCanvasRow';

// ── Main component ─────────────────────────────────────────────────────────────

export const FAQManualCanvas = ({
  selectedFaqId,
  onSelectFaq,
  onToolbarVisible,
}: FAQManualCanvasProps) => {
  const [faqs,     setFaqs]     = useState<LegacyFAQItem[]>(() => getFAQs());
  const [meta,     setMeta]     = useState<FAQMeta[]>(() => getFAQMeta());
  const [sections, setSections] = useState<FAQSection[]>(() => getSections());

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [editingSectionId,  setEditingSectionId]  = useState<string | null>(null);
  const [dragOverId,        setDragOverId]        = useState<string | null>(null);

  const dragPayload = useRef<DragPayload | null>(null);

  useEffect(() => {
    return subscribeFAQs(() => {
      setFaqs(getFAQs());
      setMeta(getFAQMeta());
      setSections(getSections());
    });
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getFaqById = useCallback((id: string) => faqs.find(f => f.faq_id === id), [faqs]);

  const getItemsForSection = useCallback((sectionId: string | null) => {
    return meta
      .filter(m => m.sectionId === sectionId)
      .sort((a, b) => a.order - b.order)
      .map(m => getFaqById(m.faq_id))
      .filter(Boolean) as LegacyFAQItem[];
  }, [meta, getFaqById]);

  const getMetasForSection = useCallback((sectionId: string | null) => {
    return meta
      .filter(m => m.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }, [meta]);

  // ── DnD ───────────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, type: 'question' | 'section', id: string) => {
    dragPayload.current = { type, id };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetType: 'question' | 'section',
    targetId: string,
    targetSectionId?: string | null,
  ) => {
    e.preventDefault();
    setDragOverId(null);
    const payload = dragPayload.current;
    if (!payload || payload.id === targetId) return;

    if (payload.type === 'section' && targetType === 'section') {
      const ids = [...sections].sort((a, b) => a.order - b.order).map(s => s.id);
      const from = ids.indexOf(payload.id);
      const to   = ids.indexOf(targetId);
      if (from === -1 || to === -1) return;
      const reordered = [...ids];
      reordered.splice(from, 1);
      reordered.splice(to, 0, payload.id);
      reorderSections(reordered);
    }

    if (payload.type === 'question' && targetType === 'question') {
      const dragMeta   = meta.find(m => m.faq_id === payload.id);
      const targetMeta = meta.find(m => m.faq_id === targetId);
      if (!dragMeta || !targetMeta) return;

      if (dragMeta.sectionId === targetMeta.sectionId) {
        // Reorder within same section
        const ids = meta
          .filter(m => m.sectionId === dragMeta.sectionId)
          .sort((a, b) => a.order - b.order)
          .map(m => m.faq_id);
        const from = ids.indexOf(payload.id);
        const to   = ids.indexOf(targetId);
        const reordered = [...ids];
        reordered.splice(from, 1);
        reordered.splice(to, 0, payload.id);
        reorderItems(reordered);
      } else {
        // Move to different section
        moveToSection(payload.id, targetSectionId ?? null, targetId);
      }
    }

    dragPayload.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragPayload.current = null;
  };

  // ── Render FAQ row ─────────────────────────────────────────────────────────

  const renderRow = (faq: LegacyFAQItem, faqMeta: FAQMeta) => {
    const sectionId = faqMeta.sectionId;
    return (
      <FAQCanvasRow
        key={faq.faq_id}
        faq={faq}
        isSelected={selectedFaqId === faq.faq_id}
        isDragOver={dragOverId === faq.faq_id}
        onSelect={() => onSelectFaq(faq.faq_id)}
        onFocus={() => onToolbarVisible(true)}
        onSaveField={(field, value) => updateFAQ(faq.faq_id, { [field]: value })}
        onDragStart={e => handleDragStart(e, 'question', faq.faq_id)}
        onDragOver={e => handleDragOver(e, faq.faq_id)}
        onDrop={e => handleDrop(e, 'question', faq.faq_id, sectionId)}
        onDragEnd={handleDragEnd}
        onDelete={() => deleteQuestion(faq.faq_id)}
      />
    );
  };

  // ── Render section ─────────────────────────────────────────────────────────

  const renderSection = (section: FAQSection) => {
    const isCollapsed  = collapsedSections.has(section.id);
    const isEditing    = editingSectionId === section.id;
    const isDragOver   = dragOverId === section.id;
    const items        = getItemsForSection(section.id);
    const itemsMeta    = getMetasForSection(section.id);

    return (
      <div key={section.id} className="mb-4">
        {/* Section header */}
        <div
          draggable
          onDragStart={e => handleDragStart(e, 'section', section.id)}
          onDragOver={e => handleDragOver(e, section.id)}
          onDrop={e => handleDrop(e, 'section', section.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            'flex items-center gap-1 mb-1.5 group select-none',
            isDragOver && 'opacity-50',
          )}
        >
          {/* Section grip */}
          <GripVertical
            size={14}
            strokeWidth={1.6}
            absoluteStrokeWidth
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0"
          />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsedSections(prev => {
              const next = new Set(prev);
              if (next.has(section.id)) next.delete(section.id); else next.add(section.id);
              return next;
            })}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            {isCollapsed
              ? <ChevronRight size={13} strokeWidth={1.6} absoluteStrokeWidth />
              : <ChevronDown  size={13} strokeWidth={1.6} absoluteStrokeWidth />
            }
          </button>

          {/* Section name — double-click to edit */}
          {isEditing ? (
            <input
              autoFocus
              defaultValue={section.name}
              onBlur={e => {
                renameSection(section.id, e.target.value.trim() || section.name);
                setEditingSectionId(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setEditingSectionId(null);
              }}
              className="text-[12px] text-foreground outline-none border-b border-primary bg-transparent flex-1"
            />
          ) : (
            <span
              className="text-[12px] text-foreground cursor-text flex-1"
              onDoubleClick={() => setEditingSectionId(section.id)}
            >
              {section.name}
            </span>
          )}

          <span className="text-[11px] text-muted-foreground ml-1">({items.length})</span>

          {/* Delete section (keep questions) */}
          <button
            onClick={() => {
              if (window.confirm(`Delete section "${section.name}"? Questions will be ungrouped.`)) {
                deleteSection(section.id, true);
              }
            }}
            title="Delete section"
            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        {/* Section card */}
        {!isCollapsed && (
          <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <p className="px-4 py-2 text-[12px] text-muted-foreground italic">
                No questions yet — use "Add question" in the left panel.
              </p>
            ) : (
              items.map((faq, i) => {
                const m = itemsMeta.find(m => m.faq_id === faq.faq_id);
                if (!m) return null;
                void i;
                return renderRow(faq, m);
              })
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Layout ─────────────────────────────────────────────────────────────────

  const orderedSections   = [...sections].sort((a, b) => a.order - b.order);
  const ungroupedItems    = getItemsForSection(null);
  const ungroupedMetas    = getMetasForSection(null);
  const totalCount        = faqs.length;

  return (
    <div
      className="flex-grow h-full bg-surface-hover overflow-y-auto"
      onClick={() => { onSelectFaq(null); onToolbarVisible(false); }}
    >
      <div className="max-w-[680px] mx-auto py-8 px-4">

        {/* Sections */}
        {orderedSections.map(renderSection)}

        {/* Ungrouped questions */}
        {ungroupedItems.length > 0 && (
          <div className="mb-4">
            {orderedSections.length > 0 && (
              <span className="text-[12px] text-muted-foreground mb-1.5 block px-1">
                Ungrouped
              </span>
            )}
            <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden">
              {ungroupedItems.map((faq, i) => {
                const m = ungroupedMetas.find(m => m.faq_id === faq.faq_id);
                if (!m) return null;
                void i;
                return renderRow(faq, m);
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-[14px] text-foreground">No questions yet</p>
            <p className="text-[12px] text-muted-foreground max-w-[280px]">
              Use the left panel to add your first question or create a section to organise them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
