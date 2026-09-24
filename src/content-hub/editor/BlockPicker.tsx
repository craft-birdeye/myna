/**
 * BlockPicker
 *
 * The "+" insertion button that appears between blocks (and at the bottom).
 * Opens a popover with a searchable, categorised list of block types.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, Type, Pilcrow, MousePointerClick, Image as ImageIcon,
  PlaySquare, List, Minus, Quote, Code2, GalleryHorizontal, Star, Megaphone,
  UserRound, ListTree, CheckSquare, Newspaper, Share2, Mail, SearchCode,
  LayoutTemplate, Grid3X3, BarChart3, Columns2, BadgeDollarSign, FormInput,
  Phone, MapPin, GitCompare, Workflow, Users, Bell, PanelBottom, Navigation,
  HelpCircle, MessageSquare,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { type BlockEditorMode, type BlockType, BLOCK_CATALOG, catalogForMode } from './blockTypes';

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

interface BlockPickerProps {
  mode: BlockEditorMode;
  onAdd: (type: BlockType) => void;
  /** Show as the empty-canvas primary CTA (bigger) */
  primary?: boolean;
}

export function BlockPicker({ mode, onAdd, primary = false }: BlockPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const catalog = catalogForMode(mode);

  // Filter by search query
  const filtered = query
    ? catalog.filter(b =>
        b.label.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase()))
    : catalog;

  // Group by category
  const groups = filtered.reduce<Record<string, typeof catalog>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  const categoryLabel: Record<string, string> = {
    text:    'Text',
    media:   'Media',
    layout:  'Layout',
    content: 'Content blocks',
  };

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleAdd(type: BlockType) {
    onAdd(type);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative flex justify-center">
      {primary ? (
        /* Empty canvas CTA */
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={15} strokeWidth={1.6} absoluteStrokeWidth />
          Add your first block
        </button>
      ) : (
        /* Left-anchored insertion point — 6px visual height, button floats left */
        <div className="group/ins relative h-1.5 w-full overflow-visible">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className={cn(
              'absolute -left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-5 rounded-full border bg-background transition-all',
              open
                ? 'border-primary text-primary opacity-100'
                : 'border-border text-muted-foreground opacity-0 group-hover/ins:opacity-100 hover:border-primary hover:text-primary',
            )}
            aria-label="Add block"
          >
            <Plus size={11} strokeWidth={1.6} />
          </button>
        </div>
      )}

      {/* Popover */}
      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30 w-[320px] bg-background rounded-xl border border-border shadow-modal overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-2 py-2.5 border-b border-border">
            <Search size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search blocks…"
              className="flex-1 text-[13px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Block groups */}
          <div className="overflow-y-auto max-h-[320px] py-2">
            {Object.entries(groups).length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-muted-foreground text-center">No blocks match "{query}"</p>
            ) : (
              Object.entries(groups).map(([category, blocks]) => (
                <div key={category}>
                  <p className="px-2 pt-2 pb-1 text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                    {categoryLabel[category] ?? category}
                  </p>
                  {blocks.map(b => {
                    const Icon = BLOCK_ICON_MAP[b.type] ?? LayoutTemplate;
                    return (
                      <button
                        key={b.type}
                        type="button"
                        onClick={() => handleAdd(b.type)}
                        className="flex w-full items-center gap-2 px-2 py-2 text-left transition-colors hover:bg-surface-hover/60"
                      >
                        <span className="flex size-[34px] flex-none items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon size={16} strokeWidth={1.6} absoluteStrokeWidth />
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="text-[13px] text-foreground">{b.label}</span>
                          <span className="truncate text-[11px] text-muted-foreground">{b.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
