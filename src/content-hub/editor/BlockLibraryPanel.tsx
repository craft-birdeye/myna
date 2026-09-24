/**
 * BlockLibraryPanel
 *
 * Left-panel "Manual" tab content for block modes (blog, landing, FAQ).
 * Mirrors the Birdeye Campaigns editor: Basic | Pre-built | Saved sub-tabs,
 * with a 3-column block grid. Clicking a block inserts it after the currently
 * focused block (or at the end).
 */

import React, { useState, useEffect } from 'react';
import {
  Search, BookmarkX, GripHorizontal, GripVertical, Trash2, HelpCircle, MessageSquare,
  Type, Pilcrow, MousePointerClick, Image as ImageIcon, PlaySquare, List,
  Minus, Quote, Code2, GalleryHorizontal, Star, Megaphone, UserRound,
  ListTree, CheckSquare, Newspaper, Share2, Mail, SearchCode, LayoutTemplate,
  Grid3X3, BarChart3, Columns2, BadgeDollarSign, FormInput, Phone, MapPin,
  GitCompare, Workflow, Users, Bell, PanelBottom, Navigation, FileText,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { catalogForMode, type BlockEditorMode, type BlockType, BLOCK_CATALOG } from './blockTypes';
import { useBlockEditorContext } from './BlockEditorContext';
import {
  getSavedBlocks,
  removeSavedBlock,
  subscribeSavedBlocks,
  type SavedBlock,
} from '../shared/savedBlocksStore';

const BLOCK_ICON_MAP: Partial<Record<BlockType, React.ElementType>> = {
  heading: Type,
  paragraph: Pilcrow,
  cta: MousePointerClick,
  image: ImageIcon,
  'video-embed': PlaySquare,
  list: List,
  divider: Minus,
  spacer: Minus,
  'faq-section': HelpCircle,
  quote: Quote,
  'custom-embed': Code2,
  gallery: GalleryHorizontal,
  review: Star,
  'cta-section': Megaphone,
  'author-bar': UserRound,
  'table-of-contents': ListTree,
  'key-takeaways': CheckSquare,
  code: Code2,
  'related-posts': Newspaper,
  'social-share': Share2,
  'newsletter-signup': Mail,
  'seo-meta': SearchCode,
  'header-nav': Navigation,
  hero: LayoutTemplate,
  'feature-grid': Grid3X3,
  benefits: CheckSquare,
  'stats-row': BarChart3,
  'image-text': Columns2,
  'logo-strip': PanelBottom,
  'pricing-table': BadgeDollarSign,
  'lead-form': FormInput,
  'contact-block': Phone,
  'map-block': MapPin,
  testimonials: MessageSquare,
  'review-wall': Star,
  'comparison-table': GitCompare,
  'process-steps': Workflow,
  'team-grid': Users,
  'announcement-bar': Bell,
  footer: PanelBottom,
};

// ── Pre-built Birdeye-specific combinations ───────────────────────────────────

interface PrebuiltBlock {
  id: string;
  label: string;
  description: string;
  emoji: string;
  aiPowered?: boolean;
  score?: number;
  types: BlockType[];
}

const PREBUILT_BLOCKS: Record<BlockEditorMode, PrebuiltBlock[]> = {
  blog: [
    {
      id: 'review-summary',
      label: 'Review summary',
      description: 'AI summary of recent customer reviews',
      emoji: '⭐',
      aiPowered: true,
      score: 92,
      types: ['heading', 'paragraph', 'quote'],
    },
    {
      id: 'intro-with-author',
      label: 'Intro + author',
      description: 'Author bar followed by intro paragraph',
      emoji: '✍️',
      score: 88,
      types: ['author-bar', 'heading', 'paragraph'],
    },
    {
      id: 'cta-section',
      label: 'CTA section',
      description: 'Heading, description and button',
      emoji: '🎯',
      score: 86,
      types: ['heading', 'paragraph', 'cta'],
    },
    {
      id: 'image-story',
      label: 'Image story',
      description: 'Full-width image with heading and body',
      emoji: '🖼️',
      score: 90,
      types: ['image', 'heading', 'paragraph'],
    },
  ],
  landing: [
    {
      id: 'hero-features',
      label: 'Hero + features',
      description: 'Hero block followed by feature grid',
      emoji: '🚀',
      score: 91,
      types: ['hero', 'feature-grid'],
    },
    {
      id: 'social-proof',
      label: 'Social proof',
      description: 'Stats row and testimonials',
      emoji: '💬',
      score: 89,
      types: ['stats-row', 'testimonials'],
    },
    {
      id: 'review-wall',
      label: 'Review wall',
      description: 'AI-curated customer testimonials',
      emoji: '⭐',
      aiPowered: true,
      score: 92,
      types: ['heading', 'testimonials'],
    },
    {
      id: 'closing-cta',
      label: 'Closing CTA',
      description: 'Divider, headline, and action button',
      emoji: '🎯',
      score: 87,
      types: ['divider', 'heading', 'cta'],
    },
  ],
  faq: [
    {
      id: 'full-faq',
      label: 'Full FAQ section',
      description: 'Section header + 5 Q&A pairs',
      emoji: '📋',
      aiPowered: true,
      score: 92,
      types: ['faq-section'],
    },
    {
      id: 'top-questions',
      label: 'Top questions',
      description: 'AI-generated from your reviews',
      emoji: '🤖',
      aiPowered: true,
      score: 94,
      types: ['heading', 'faq-qa', 'faq-qa', 'faq-qa'],
    },
    {
      id: 'intro-faq',
      label: 'Intro + FAQ',
      description: 'Short intro paragraph before Q&As',
      emoji: '💡',
      score: 90,
      types: ['heading', 'paragraph', 'faq-section'],
    },
  ],
};

function describePrebuiltStructure(pb: PrebuiltBlock) {
  const labels = pb.types
    .slice(0, 4)
    .map(type => {
      const catalogItem = BLOCK_CATALOG.find(item => item.type === type);
      return (catalogItem?.label ?? type).toLowerCase();
    });

  return labels.join(' + ');
}

function PrebuiltTemplateCard({
  block,
  onInsert,
}: {
  block: PrebuiltBlock;
  onInsert: () => void;
}) {
  const score = block.score ?? (block.aiPowered ? 92 : 88);

  return (
    <button
      type="button"
      onClick={onInsert}
      className="w-full overflow-hidden rounded-xl border border-border bg-muted/35 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="p-4">
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <FileText size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
            </span>
            <span className="flex-1 text-[12px] text-foreground">Blog template</span>
            <span className="h-1.5 w-10 rounded-full bg-muted">
              <span className="block h-full w-[34px] rounded-full bg-primary" />
            </span>
            <span className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[11px] text-text-primary">
              {score}
            </span>
          </div>

          <div className="px-2 py-2">
            <p className="mb-2 text-[12px] text-foreground">{describePrebuiltStructure(block)}</p>
            <div className="space-y-2">
              <span className="block h-1 rounded-full bg-muted" />
              <span className="block h-1 w-4/5 rounded-full bg-muted" />
              <span className="block h-1 w-2/3 rounded-full bg-muted" />
              <span className="block h-1 w-11/12 rounded-full bg-muted" />
              <span className="block h-1 w-3/5 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-4">
        <p className="text-[15px] text-foreground">{block.label}</p>
      </div>
    </button>
  );
}

// ── SavedBlockCard ────────────────────────────────────────────────────────────

interface SavedBlockCardProps {
  block: SavedBlock;
  onInsert: () => void;
  onRemove: () => void;
}

function SavedBlockCard({ block, onInsert, onRemove }: SavedBlockCardProps) {
  const isFaq = block.sourceType === 'faq-section' || block.sourceType === 'faq-full';
  const Icon = block.sourceType === 'faq-full' ? MessageSquare : HelpCircle;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all group">
      {/* Drag handle row */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/30 border-b border-border">
        <GripVertical size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/30 cursor-grab" />
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="Remove from saved"
          className="p-0.5 rounded hover:bg-surface-hover hover:text-destructive text-muted-foreground/50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={11} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Preview area — click to insert */}
      <button
        type="button"
        onClick={onInsert}
        className="w-full text-left p-2"
      >
        {/* Mini preview thumbnail */}
        <div className="rounded-lg border border-border bg-muted/20 px-2 py-2 mb-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-none" />
            <span className="text-[11px] text-foreground truncate">{block.preview.title}</span>
          </div>
          {block.preview.snippets.slice(0, 2).map((q, i) => (
            <div key={i} className="flex items-start gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground flex-none mt-px">Q{i + 1}</span>
              <span className="text-[10px] text-foreground/60 leading-snug line-clamp-1">{q}</span>
            </div>
          ))}
        </div>

        {/* Name + attribution */}
        <p className="text-[12px] text-foreground truncate">{block.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Created by {block.createdBy}</p>
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type SubTab = 'basic' | 'prebuilt' | 'saved';

interface BlockLibraryPanelProps {
  mode: BlockEditorMode;
}

export function BlockLibraryPanel({ mode }: BlockLibraryPanelProps) {
  const [tab, setTab] = useState<SubTab>('basic');
  const [query, setQuery] = useState('');
  const { addBlock, focusedId, blocks } = useBlockEditorContext();

  // Live saved blocks — subscribe so the panel updates immediately after saving from FAQ canvas
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>(() => getSavedBlocks());
  useEffect(() => {
    return subscribeSavedBlocks(blocks => setSavedBlocks(blocks));
  }, []);

  const catalog = catalogForMode(mode);

  // Category labels
  const categoryLabel: Record<string, string> = {
    basic:   'Basic',
    text:    'Text',
    media:   'Media',
    layout:  'Layout',
    content: 'Content',
    conversion: 'Conversion',
    'social-proof': 'Social proof',
    blog: 'Blog',
    landing: 'Landing',
  };

  // Filter basic blocks by search
  const filtered = query
    ? catalog.filter(b =>
        b.label.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase()))
    : catalog;

  const groups = filtered.reduce<Record<string, typeof catalog>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  function insertBlock(type: BlockType) {
    // Insert after focused block, or at end
    const afterId = focusedId ?? blocks[blocks.length - 1]?.id ?? null;
    addBlock(type, afterId);
  }

  function insertPrebuilt(pb: PrebuiltBlock) {
    const afterId = focusedId ?? blocks[blocks.length - 1]?.id ?? null;
    // Insert all types in sequence
    pb.types.forEach((type, i) => {
      // Each subsequent block goes after the previous
      setTimeout(() => addBlock(type, afterId), i * 10);
    });
  }

  const prebuiltBlocks = PREBUILT_BLOCKS[mode] ?? [];

  // Blog editor hides the Pre-built tab; other modes keep it.
  const subTabs: SubTab[] = mode === 'blog' ? ['basic', 'saved'] : ['basic', 'prebuilt', 'saved'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex-none border-b border-border px-4 py-2">
        <div className="flex h-[var(--button-height)] rounded-md bg-surface-l2 p-[2px] dark:bg-[#262b35]">
        {subTabs.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-md px-2 text-[12px] capitalize transition-all duration-200',
              tab === t
                ? 'bg-background text-foreground dark:bg-[#333a47] dark:text-[#e4e4e4]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'prebuilt' ? 'Pre-built' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Basic ──────────────────────────────────────────────────────────── */}
        {tab === 'basic' && (
          <div className="p-2 space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2 border border-border rounded-lg px-2.5 py-1.5 bg-background">
              <Search size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search blocks…"
                className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-[12px] text-muted-foreground py-6">
                No blocks match "{query}"
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map(b => {
                  const Icon = BLOCK_ICON_MAP[b.type] ?? LayoutTemplate;
                  return (
                    <button
                      key={b.type}
                      type="button"
                      onClick={() => insertBlock(b.type)}
                      title={b.description}
                      className="group/blk flex aspect-square min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-background p-2 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
                    >
                      <GripHorizontal size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/30 transition-colors group-hover/blk:text-muted-foreground/60" />
                      <Icon size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground transition-colors group-hover/blk:text-primary" />
                      <span className="text-center text-[12px] leading-tight text-muted-foreground transition-colors group-hover/blk:text-foreground">
                        {b.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Pre-built ──────────────────────────────────────────────────────── */}
        {tab === 'prebuilt' && (
          <div className="p-4 space-y-4">
            {prebuiltBlocks.map(pb => (
              <PrebuiltTemplateCard
                key={pb.id}
                block={pb}
                onInsert={() => insertPrebuilt(pb)}
              />
            ))}
          </div>
        )}

        {/* ── Saved ────────────────────────────────────────────────────────── */}
        {tab === 'saved' && (
          savedBlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2 px-6 text-center py-10">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                <BookmarkX size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] text-foreground">No saved blocks yet</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Use the bookmark icon on any FAQ section to save it here for reuse.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-2">
              {savedBlocks.map(block => (
                <SavedBlockCard
                  key={block.id}
                  block={block}
                  onInsert={() => {
                    // Insert an faq-section block as a stand-in for the saved FAQ content
                    const afterId = focusedId ?? blocks[blocks.length - 1]?.id ?? null;
                    addBlock('faq-section', afterId);
                  }}
                  onRemove={() => removeSavedBlock(block.id)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
