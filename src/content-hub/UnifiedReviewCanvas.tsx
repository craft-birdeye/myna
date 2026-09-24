/**
 * UnifiedReviewCanvas — review screen for all content types in a project.
 * Uses ContentCard universally for every type. Tab bar switches between types.
 */
import React, { useState, useCallback } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';
import {
  ContentCard,
  DIMENSIONS_BY_TYPE,
  type ContentType,
  type ContentCardProps,
} from './shared/ContentCard';
import { STATUS_COLORS } from './shared/scoreColors';
import type { ProjectBrief } from './NewProjectBrief';
import { MOCK_FAQS } from './faq/FAQReviewScreen';
import { type ContentCardType } from './shared/GenericSkeletonCard';

// ── Mock content for social & email ──────────────────────────────────────────

interface ReviewItem {
  id: string;
  type: ContentType;
  primaryText: string;
  secondaryText: string;
  editorialScore: number;
  lowestDimension: string;
  secondaryScore?: number;
  status: 'ready' | 'needs-work' | 'blocked';
  warnings: string[];
}

const MOCK_SOCIAL: ReviewItem[] = [
  { id: 'sp-1', type: 'social', primaryText: 'Transform your outdoor space this season 🌿 Our design team is ready to bring your vision to life — from drought-resistant gardens to full yard makeovers.', secondaryText: '#Landscaping #OutdoorLiving #GardenDesign #SustainableLandscaping', editorialScore: 89, lowestDimension: 'Visual alignment', secondaryScore: 79, status: 'ready', warnings: [] },
  { id: 'sp-2', type: 'social', primaryText: 'Smart irrigation can cut your water usage by up to 40%. We install custom systems for your property.', secondaryText: '#SmartGarden #WaterConservation #HomeImprovement', editorialScore: 72, lowestDimension: 'Engagement potential', secondaryScore: 61, status: 'needs-work', warnings: ['Hashtag count low'] },
  { id: 'sp-3', type: 'social', primaryText: 'Proud to complete 50+ commercial landscaping projects this quarter. Eco-friendly design that enhances curb appeal.', secondaryText: '#CommercialLandscaping #Sustainability #PropertyManagement', editorialScore: 86, lowestDimension: 'Brand voice', secondaryScore: 74, status: 'ready', warnings: [] },
  { id: 'sp-4', type: 'social', primaryText: 'Spring is here. Your yard shouldn\'t look like it\'s still in February. 🌸 Let\'s fix that.', secondaryText: '#SpringLandscaping #YardGoals', editorialScore: 91, lowestDimension: 'Content relevance', secondaryScore: 83, status: 'ready', warnings: [] },
];

const MOCK_EMAIL: ReviewItem[] = [
  { id: 'em-1', type: 'email', primaryText: 'Your Q2 reputation report is ready — here\'s what changed', secondaryText: 'Hi {{first_name}}, your review volume is up 18% this quarter. See which locations are outperforming and where you can improve.', editorialScore: 86, lowestDimension: 'Personalization', secondaryScore: 38, status: 'ready', warnings: [] },
  { id: 'em-2', type: 'email', primaryText: 'We miss you, {{first_name}} — come back to a greener yard', secondaryText: 'It\'s been 6 months since your last visit. We\'d love to help you get things looking their best again. 15% off your first service back.', editorialScore: 68, lowestDimension: 'Subject strength', secondaryScore: 24, status: 'needs-work', warnings: ['Open rate below benchmark'] },
];

const MOCK_BLOG: ReviewItem[] = [
  { id: 'bl-1', type: 'blog', primaryText: 'How Local Businesses Are Winning With AI-Powered Review Responses', secondaryText: '93% of consumers read reviews before purchasing. Speed and quality of your responses can make or break your reputation. Learn how AI is helping local businesses respond smarter.', editorialScore: 89, lowestDimension: 'SEO optimization', secondaryScore: 77, status: 'ready', warnings: [] },
  { id: 'bl-2', type: 'blog', primaryText: '5 Ways to Improve Your Google Maps Ranking in 2025', secondaryText: 'Google Maps ranking is determined by relevance, distance, and prominence. Here\'s how to optimize each factor for your local business to outrank competitors.', editorialScore: 84, lowestDimension: 'Content depth', secondaryScore: 71, status: 'ready', warnings: [] },
];

// ── Layout helpers ─────────────────────────────────────────────────────────────

const CARD_W   = 500;
const CARD_H   = 210;
const COL_GAP  = 32;
const ROW_GAP  = 24;
const ORIGIN_X = 48;
const ORIGIN_Y = 48;
const COLS     = 2;

function gridPosition(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: ORIGIN_X + col * (CARD_W + COL_GAP),
    y: ORIGIN_Y + row * (CARD_H + ROW_GAP),
  };
}

function canvasSize(count: number) {
  const rows = Math.ceil(count / COLS);
  return {
    width:  ORIGIN_X * 2 + CARD_W * COLS + COL_GAP,
    height: Math.max(ORIGIN_Y + rows * (CARD_H + ROW_GAP), 500),
  };
}

function makeDimensions(type: ContentType, score: number) {
  const labels = DIMENSIONS_BY_TYPE[type];
  const offsets = [5, -3, 2, -4];
  return labels.map((label, i) => ({
    label,
    score: Math.min(100, Math.max(0, score + offsets[i])),
  }));
}

// ── Single FAQ summary card for the project canvas ───────────────────────────
// One card represents the full FAQ set. Clicking Edit opens FAQCanvas.

function faqsToReviewItems(): ReviewItem[] {
  const firstQuestion = MOCK_FAQS[0]?.question ?? 'What is AEO and why does it matter?';
  return [{
    id:              'faq-set-1',
    type:            'faq' as ContentType,
    primaryText:     firstQuestion,
    secondaryText:   '',
    editorialScore:  88,
    lowestDimension: 'Originality',
    secondaryScore:  74,
    status:          'ready' as const,
    warnings:        [],
  }];
}

// ── Tab config ────────────────────────────────────────────────────────────────

interface TabDef {
  id: ContentCardType;
  label: string;
  items: ReviewItem[];
}

function buildTabs(types: ContentCardType[]): TabDef[] {
  return types.map((t) => {
    if (t === 'faq')    return { id: t, label: 'FAQ',        items: faqsToReviewItems() };
    if (t === 'social') return { id: t, label: 'Social',     items: MOCK_SOCIAL };
    if (t === 'email')  return { id: t, label: 'Email',      items: MOCK_EMAIL };
    if (t === 'blog')   return { id: t, label: 'Blog',       items: MOCK_BLOG };
    return { id: t, label: t.charAt(0).toUpperCase() + t.slice(1), items: [] };
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UnifiedReviewCanvasProps {
  brief: ProjectBrief;
  contentTypes: ContentCardType[];
  onPublish: () => void;
  /** Called when user clicks Edit on any card — routes to the matching single content editor */
  onEdit?: (id: string, type: ContentType) => void;
  /** Tab to restore on mount (when returning from an editor) */
  initialTab?: ContentCardType;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const UnifiedReviewCanvas = ({
  brief,
  contentTypes,
  onPublish,
  onEdit,
  initialTab,
}: UnifiedReviewCanvasProps) => {
  const tabs = React.useMemo(() => buildTabs(contentTypes), [contentTypes]);

  const [activeTab, setActiveTab] = useState<ContentCardType>(
    initialTab ?? contentTypes[0] ?? 'faq',
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (prev.has(id) && multi) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePositionChange = useCallback((id: string, pos: { x: number; y: number }) => {
    setPositions((prev) => ({ ...prev, [id]: pos }));
  }, []);

  const noop = useCallback(() => {}, []);

  const activeItems = tabs.find((t) => t.id === activeTab)?.items ?? [];
  const totalItems = tabs.reduce((s, t) => s + t.items.length, 0);
  const totalReady = tabs.reduce((s, t) => s + t.items.filter((i) => i.status === 'ready').length, 0);
  const allReady = totalReady === totalItems && totalItems > 0;

  const size = canvasSize(activeItems.length);

  return (
    <div className="flex flex-col h-full w-full bg-muted/20">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 py-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[13px] text-foreground">
            Reviewing content for "{brief.name}"
          </span>
          <span className="text-[11px] text-muted-foreground">
            {totalReady} of {totalItems} pieces ready · {brief.locations.length} location{brief.locations.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={!allReady}
            className="rounded-r-none"
            onClick={onPublish}
          >
            {allReady ? (
              <>
                <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="mr-1" />
                Publish all
              </>
            ) : (
              `Publish (${totalReady}/${totalItems} ready)`
            )}
          </Button>
          <Button variant="default" size="icon" className="rounded-l-none h-[var(--button-height-sm)] w-[34px]">
            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </Button>
        </div>
      </div>

      {/* Content type tabs */}
      <div className="flex-shrink-0 bg-background border-b border-border px-6 flex items-end gap-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const readyCount = tab.items.filter((i) => i.status === 'ready').length;
          const pct = tab.items.length > 0 ? Math.round((readyCount / tab.items.length) * 100) : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-[13px] border-b-2 transition-all',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full"
                style={
                  pct === 100
                    ? { background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }
                    : pct >= 50
                    ? { background: STATUS_COLORS['needs-work'].bg, color: STATUS_COLORS['needs-work'].text }
                    : { background: '#F3F4F6', color: '#6B7280' }
                }
              >
                {readyCount}/{tab.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="flex-grow overflow-auto">
        <div
          style={{
            position: 'relative',
            width: size.width,
            height: size.height,
            minWidth: '100%',
          }}
        >
          {activeItems.map((item, idx) => {
            const pos = positions[item.id] ?? gridPosition(idx);
            const dims = makeDimensions(item.type, item.editorialScore);

            const props: ContentCardProps = {
              contentId:       item.id,
              type:            item.type,
              primaryText:     item.primaryText,
              secondaryText:   item.secondaryText,
              editorialScore:  item.editorialScore,
              lowestDimension: item.lowestDimension,
              secondaryScore:  item.secondaryScore,
              dimensions:      dims,
              status:          item.status,
              warnings:        item.warnings,
              hardBlock:       item.status === 'blocked',
              position:        pos,
              selected:        selectedIds.has(item.id),
              onSelect:        handleSelect,
              onEdit:          (id) => { onEdit?.(id, item.type); },
              onRegenerate:    noop,
              onSchedule:      noop,
              onExport:        noop,
              onComment:       noop,
              onHistory:       noop,
              onClone:         noop,
              onDelete:        noop,
              onPositionChange: handlePositionChange,
            };

            return <ContentCard key={item.id} {...props} />;
          })}
        </div>
      </div>
    </div>
  );
};
