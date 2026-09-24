/**
 * ContentCard — Universal content card for every content type.
 *
 * Structure mirrors FAQReviewCard.tsx exactly. Do not add type-specific UI blocks.
 * Only `primaryText`, `secondaryText`, and `dimensions` differ between types.
 */

import React, { useState, useRef } from 'react';
import {
  MessageSquare, Share2, Mail, Newspaper, Star,
  Edit2, Sparkles, Calendar, Download, RotateCcw, Copy, Trash2,
  TriangleAlert, ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/contenthub-ui/button';
import { MiniScoreRing } from '../faq/MiniScoreRing';
import { scoreColor, scoreStrokeColor, STATUS_COLORS } from './scoreColors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = 'faq' | 'social' | 'email' | 'blog' | 'response';
export type ContentPlatform = 'instagram' | 'facebook' | 'linkedin' | 'twitter';

export interface ContentDimension {
  label: string;
  score: number;
}

/** Default dimension labels per content type. Scores are derived at the call site. */
export const DIMENSIONS_BY_TYPE: Record<ContentType, string[]> = {
  faq:      ['Brand voice', 'Factual accuracy', 'Content readability', 'Originality'],
  social:   ['Brand voice', 'Engagement potential', 'Content relevance', 'Visual alignment'],
  email:    ['Brand voice', 'Subject strength', 'Content readability', 'Personalization'],
  blog:     ['Brand voice', 'Factual accuracy', 'SEO optimization', 'Content depth'],
  response: ['Brand voice', 'Tone appropriateness', 'Factual accuracy', 'Empathy'],
};

export interface ContentCardProps {
  contentId: string;
  type: ContentType;
  platform?: ContentPlatform;
  primaryText: string;
  secondaryText: string;
  editorialScore: number;
  lowestDimension: string;
  /** AEO score (faq/blog), reach score (social), open rate (email). Omit for response. */
  secondaryScore?: number;
  dimensions: ContentDimension[];
  status: 'generating' | 'ready' | 'needs-work' | 'blocked' | 'published';
  warnings: string[];
  hardBlock: boolean;
  position: { x: number; y: number };
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onEdit: (id: string) => void;
  onRegenerate: (id: string) => void;
  onSchedule: (id: string) => void;
  onExport: (id: string) => void;
  onComment: (id: string) => void;
  onHistory: (id: string) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<ContentPlatform, string> = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  linkedin:  'LinkedIn',
  twitter:   'X (Twitter)',
};

const TYPE_ICON: Record<ContentType, React.ReactNode> = {
  faq:      <MessageSquare size={12} strokeWidth={1.6} absoluteStrokeWidth />,
  social:   <Share2        size={12} strokeWidth={1.6} absoluteStrokeWidth />,
  email:    <Mail          size={12} strokeWidth={1.6} absoluteStrokeWidth />,
  blog:     <Newspaper     size={12} strokeWidth={1.6} absoluteStrokeWidth />,
  response: <Star          size={12} strokeWidth={1.6} absoluteStrokeWidth />,
};

const TYPE_LABEL: Record<ContentType, string> = {
  faq:      'FAQ',
  social:   'Social post',
  email:    'Email',
  blog:     'Blog post',
  response: 'Review response',
};

function secondaryScoreLabel(type: ContentType, score: number): string {
  if (type === 'faq' || type === 'blog') return `${score} AEO`;
  if (type === 'social')                 return `${score} Reach`;
  if (type === 'email')                  return `${score}% Open rate`;
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ContentCard: React.FC<ContentCardProps> = ({
  contentId,
  type,
  platform,
  primaryText,
  secondaryText,
  editorialScore,
  lowestDimension,
  secondaryScore,
  dimensions,
  status,
  warnings,
  hardBlock,
  position,
  selected,
  onSelect,
  onEdit,
  onRegenerate,
  onSchedule,
  onExport,
  onComment,
  onHistory,
  onClone,
  onDelete,
  onPositionChange,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const [isDragging, setIsDragging]   = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const isGenerating = status === 'generating';

  const { bg: scoreBg, text: scoreText } = scoreColor(editorialScore);

  // Status chip style — generating + published fall back to muted
  const statusDisplay = (() => {
    if (status === 'published')  return { bg: STATUS_COLORS.ready.bg,         text: STATUS_COLORS.ready.text,         label: 'Published' };
    if (status === 'generating') return { bg: '#F3F4F6',                       text: '#6B7280',                        label: 'Generating' };
    return STATUS_COLORS[status as 'ready' | 'needs-work' | 'blocked'] ?? STATUS_COLORS['needs-work'];
  })();

  // Type chip label — append platform for social only
  const typeChipLabel = type === 'social' && platform
    ? `${TYPE_LABEL[type]} · ${PLATFORM_LABELS[platform]}`
    : TYPE_LABEL[type];

  // Left border accent for needs-work / blocked
  const leftAccent = status === 'needs-work'
    ? '4px solid #D97706'
    : (status === 'blocked' || hardBlock)
    ? '4px solid #DC2626'
    : undefined;

  // Drag logic — identical to FAQReviewCard
  const handleDragStart = (e: React.MouseEvent) => {
    if (isGenerating) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    const onMove = (ev: MouseEvent) =>
      onPositionChange(contentId, { x: ev.clientX - dragStart.current.x, y: ev.clientY - dragStart.current.y });
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Toolbar button definitions
  const toolbarButtons = [
    { icon: <Edit2         size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Edit',       action: () => onEdit(contentId) },
    { icon: <Sparkles      size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Regenerate', action: () => onRegenerate(contentId) },
    { icon: <Calendar      size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Schedule',   action: () => onSchedule(contentId) },
    { icon: <Download      size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Export',     action: () => onExport(contentId) },
    { icon: <MessageSquare size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Comment',    action: () => onComment(contentId) },
    { icon: <RotateCcw     size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'History',    action: () => onHistory(contentId) },
    { icon: <Copy          size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Clone',      action: () => onClone(contentId) },
    { icon: <Trash2        size={16} strokeWidth={1.6} absoluteStrokeWidth />, label: 'Delete',     action: () => onDelete(contentId), destructive: true },
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
      {/* ── Toolbar — floats above card on selection ── */}
      {selected && !isGenerating && (
        <div
          className="absolute -top-[52px] left-0 z-30 flex items-center px-2 py-1.5 gap-0.5"
          style={{
            background: 'var(--background)',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {toolbarButtons.map((btn) => (
            <button
              key={btn.label}
              title={btn.label}
              onClick={(e) => { e.stopPropagation(); btn.action(); }}
              className={[
                'size-[34px] rounded-md flex items-center justify-center cursor-pointer transition-colors text-muted-foreground',
                btn.destructive
                  ? 'hover:text-destructive hover:bg-destructive/10'
                  : 'hover:bg-surface-hover hover:text-foreground',
              ].join(' ')}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      )}

      {/* ── Card shell ── */}
      <div
        className="bg-white rounded-lg relative overflow-visible"
        style={{
          border: selected
            ? '2px solid #1976D2'
            : (status === 'blocked' || hardBlock)
            ? '1px solid #DC2626'
            : '1px solid #eaeaea',
          boxShadow: selected ? '0 0 0 3px rgba(25,118,210,0.12)' : 'none',
          borderLeft: leftAccent,
        }}
      >
        {/* ── Header (drag handle) ── */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
        >
          {/* Left: checkbox + type chip */}
          <div className="flex items-center gap-2">
            {/* Checkbox — SVG to match FAQReviewCard */}
            <div
              className="size-[16px] cursor-pointer shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onSelect(contentId, e.shiftKey || e.metaKey || e.ctrlKey); }}
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

            {/* Type chip */}
            <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
              {TYPE_ICON[type]}
              <span className="text-[11px]">{typeChipLabel}</span>
            </div>
          </div>

          {/* Right: score ring — hidden when generating */}
          {!isGenerating && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowOverlay((v) => !v); }}
              title="View content score"
            >
              <MiniScoreRing key={editorialScore} score={editorialScore} />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        {isGenerating ? (
          /* Skeleton state */
          <div className="px-4 pb-4 flex flex-col gap-2">
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted/60 rounded w-full mt-1" />
              <div className="h-3 bg-muted/60 rounded w-11/12" />
              <div className="h-3 bg-muted/60 rounded w-3/4" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
              <div className="w-3 h-3 rounded-full border-[1.5px] border-primary border-t-transparent animate-spin shrink-0" />
              Generating content…
            </div>
          </div>
        ) : type === 'faq' ? (
          /* FAQ body — numbered Q-rows matching the FAQGroupCard style */
          <div className="flex flex-col border-t border-border/40">
            {[
              primaryText,
              'How much does this cost in the local area?',
              'How long does the process typically take?',
              'What should I prepare before getting started?',
            ].map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 border-b border-border/30 last:border-0 hover:bg-surface-hover transition-colors"
              >
                <span className="text-[10px] font-mono text-muted-foreground/60 w-6 flex-shrink-0 select-none">
                  Q{i + 1}
                </span>
                <span className="text-[12px] text-foreground flex-1 truncate">{q}</span>
                <ChevronRight size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/40 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          /* Content body — text preview for non-FAQ types */
          <div className="px-4 pb-3 flex flex-col gap-2">
            <p
              className="text-[14px] text-foreground leading-snug cursor-pointer"
              onClick={() => setExpanded((v) => !v)}
            >
              {primaryText}
            </p>
            <p className={`text-[13px] text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
              {secondaryText}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        {!isGenerating && (
          <div className="flex items-center justify-between px-4 pb-4 border-t border-border pt-3">
            {/* Left cluster: status + score chips + warning */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: statusDisplay.bg, color: statusDisplay.text }}
              >
                {statusDisplay.label}
              </span>

              <span
                className="text-[11px] px-2 py-0.5 rounded-md"
                style={{ background: scoreBg, color: scoreText }}
              >
                {editorialScore} · {lowestDimension}
              </span>

              {secondaryScore !== undefined && type !== 'response' && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {secondaryScoreLabel(type, secondaryScore)}
                </span>
              )}

              {warnings.length > 0 && (
                <TriangleAlert size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary" />
              )}
            </div>

            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEdit(contentId); }}
            >
              <Edit2 size={12} strokeWidth={1.6} absoluteStrokeWidth className="mr-1" />
              Edit
            </Button>
          </div>
        )}

        {/* ── Score overlay (AnimatePresence — identical to FAQReviewCard) ── */}
        <AnimatePresence>
          {showOverlay && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-b-[12px] p-4 z-10"
            >
              {/* Overlay header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-muted-foreground uppercase tracking-wide">
                  Editorial score
                </span>
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowOverlay(false)}
                >
                  ✕ Close
                </button>
              </div>

              {/* Dimension bars */}
              <div className="flex flex-col gap-2">
                {dimensions.map((dim) => {
                  const dimStroke = scoreStrokeColor(dim.score);
                  return (
                    <div key={dim.label} className="flex items-center gap-2">
                      <span className="text-[12px] text-foreground w-[140px] shrink-0">{dim.label}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${dim.score}%`, background: dimStroke }}
                        />
                      </div>
                      <span className="text-[11px] w-7 text-right" style={{ color: dimStroke }}>
                        {dim.score}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Compliance row */}
              <div className="mt-3 flex items-center gap-2">
                {hardBlock ? (
                  <>
                    <TriangleAlert size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-destructive" />
                    <span className="text-[12px] text-destructive">Compliance · Blocked</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L2 3.5v3.5C2 9.93 4.24 12.22 7 13c2.76-.78 5-3.07 5-6V3.5L7 1z"
                        stroke="#4CAE3D" strokeWidth="1.4" />
                      <path d="M4.5 7L6.5 9L9.5 5"
                        stroke="#4CAE3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[12px]" style={{ color: STATUS_COLORS.ready.text }}>
                      Compliance · Passed
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
