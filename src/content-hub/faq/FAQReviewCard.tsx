import React, { useState, useRef } from 'react';
import { TriangleAlert, Edit } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/contenthub-ui/button';
import { MiniScoreRing } from './MiniScoreRing';
import { scoreColor as scoreBg, STATUS_COLORS } from '../shared/scoreColors';

export interface FAQItem {
  faq_id: string;
  question: string;
  answer: string;
  intent: 'informational' | 'navigational' | 'transactional';
  funnel_stage: 'awareness' | 'consideration' | 'decision';
  editorialScore: number;
  lowestDimension: string;
  aeoScore?: number;
  status: 'ready' | 'needs-work' | 'blocked';
  warnings: string[];
  hardBlock: boolean;
}

function statusStyle(status: FAQItem['status']) {
  return STATUS_COLORS[status] ?? STATUS_COLORS['needs-work'];
}

interface FAQReviewCardProps extends FAQItem {
  position: { x: number; y: number };
  selected: boolean;
  showAEO?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onEdit: (id: string) => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
}

export const FAQReviewCard = ({
  faq_id,
  question,
  answer,
  editorialScore,
  lowestDimension,
  aeoScore,
  status,
  warnings,
  position,
  selected,
  showAEO = false,
  onSelect,
  onEdit,
  onPositionChange,
}: FAQReviewCardProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const { bg: scoreBgColor, text: scoreTextColor } = scoreBg(editorialScore);
  const { bg: statusBgColor, text: statusTextColor, label: statusLabel } = statusStyle(status);

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    const handleMove = (ev: MouseEvent) => {
      onPositionChange(faq_id, { x: ev.clientX - dragStart.current.x, y: ev.clientY - dragStart.current.y });
    };
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const dimensions = [
    { label: 'Brand voice', score: Math.round(editorialScore * 0.95 + Math.random() * 5), weight: '30%' },
    { label: 'Factual accuracy', score: Math.round(editorialScore * 1.02), weight: '30%' },
    { label: 'Content readability', score: Math.round(editorialScore * 0.98), weight: '25%' },
    { label: 'Originality', score: Math.round(editorialScore * 0.9), weight: '15%' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: 500,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div
        className="bg-white rounded-lg relative overflow-visible"
        style={{
          border: selected ? '2px solid #1976D2' : '1px solid #eaeaea',
          boxShadow: selected ? '0 0 0 3px rgba(25,118,210,0.12)' : 'none',
        }}
      >
        {/* Header — drag handle */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {/* Checkbox */}
            <div
              className="size-[16px] cursor-pointer shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onSelect(faq_id, e.shiftKey || e.metaKey || e.ctrlKey); }}
            >
              {selected ? (
                <svg viewBox="0 0 16 16" fill="none" className="size-full">
                  <rect x="1" y="1" width="14" height="14" rx="2" fill="#1976D2" />
                  <path d="M4 8l3 3 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" className="size-full">
                  <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="#CCC" strokeWidth="1.2" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted-foreground">
                <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 5h6M3 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-muted-foreground">FAQ {showAEO ? '· AEO' : ''}</span>
            </div>
          </div>

          {/* Score ring — click to toggle overlay */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowOverlay(v => !v); }}
            title="View editorial score"
          >
            <MiniScoreRing key={editorialScore} score={editorialScore} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3 flex flex-col gap-2">
          <p
            className="text-[14px] text-foreground leading-snug cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            {question}
          </p>
          <p className={`text-[13px] text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {answer}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-4 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {/* Status pill */}
            <span
              className="text-[11px] px-2 py-0.5 rounded-md"
              style={{ background: statusBgColor, color: statusTextColor }}
            >
              {statusLabel}
            </span>
            {/* Score chip */}
            <span
              className="text-[11px] px-2 py-0.5 rounded-md"
              style={{ background: scoreBgColor, color: scoreTextColor }}
            >
              {editorialScore} · {lowestDimension}
            </span>
            {/* AEO score chip */}
            {aeoScore && showAEO && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {aeoScore} AEO
              </span>
            )}
            {/* Warning icon */}
            {warnings.length > 0 && (
              <TriangleAlert size={14} strokeWidth={1.6} className="text-text-secondary" />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit(faq_id); }}
          >
            <Edit size={12} strokeWidth={1.6} className="mr-1" />
            Edit
          </Button>
        </div>

        {/* Inline score overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-b-[12px] p-4 z-10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-muted-foreground uppercase tracking-wide">Editorial score</span>
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => setShowOverlay(false)}
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {dimensions.map(dim => {
                  const { bg, text } = scoreBg(dim.score);
                  return (
                    <div key={dim.label} className="flex items-center gap-2">
                      <span className="text-[12px] text-foreground w-[130px] shrink-0">{dim.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${dim.score}%`, background: text }}
                        />
                      </div>
                      <span className="text-[11px] w-7 text-right" style={{ color: text }}>
                        {dim.score}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Compliance */}
              <div className="mt-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L2 3.5v3.5C2 9.93 4.24 12.22 7 13c2.76-.78 5-3.07 5-6V3.5L7 1z" stroke="#4CAE3D" strokeWidth="1.4" />
                  <path d="M4.5 7L6.5 9L9.5 5" stroke="#4CAE3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[12px]" style={{ color: STATUS_COLORS.ready.text }}>Compliance · Passed</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
