/**
 * BlockCanvas
 *
 * Main WYSIWYG block canvas for Blog, Landing, and FAQ.
 * - Reads/writes block state through BlockEditorContext
 * - Shows the shared editor chrome toolbar when a text element is focused
 * - Pinch-to-zoom (trackpad + Ctrl+scroll)
 * - Click-outside deselect
 * - Drag-to-reorder blocks
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { FileText, Layers, MessageSquare } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { type BlockEditorMode, type Block, type BlockComponentProps, type BlockType, BLOCK_CATALOG } from './blockTypes';
import { useBlockEditorContext } from './BlockEditorContext';
import { BlockShell } from './BlockShell';
import { BlockPicker } from './BlockPicker';
import { EditorChromeToolbar } from '../shared/EditorChromeToolbar';

// Block component registry
import { HeadingBlock }      from './blocks/HeadingBlock';
import { ParagraphBlock }    from './blocks/ParagraphBlock';
import { DividerBlock }      from './blocks/DividerBlock';
import { ListBlock }         from './blocks/ListBlock';
import { QuoteBlock }        from './blocks/QuoteBlock';
import { CTABlock }          from './blocks/CTABlock';
import { ImageBlock }        from './blocks/ImageBlock';
import { AuthorBarBlock }    from './blocks/AuthorBarBlock';
import { CodeBlock }         from './blocks/CodeBlock';
import { VideoEmbedBlock }   from './blocks/VideoEmbedBlock';
import { HeroBlock }         from './blocks/HeroBlock';
import { FeatureGridBlock }  from './blocks/FeatureGridBlock';
import { StatsRowBlock }     from './blocks/StatsRowBlock';
import { ImageTextBlock }    from './blocks/ImageTextBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { FAQQABlock }        from './blocks/FAQQABlock';
import { FAQSectionBlock }   from './blocks/FAQSectionBlock';

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function GenericMarketingBlock({
  type,
  content,
}: BlockComponentProps & { type: BlockType }) {
  if (type === 'spacer') {
    return (
      <div
        className="rounded-lg border border-dashed border-border bg-muted/20"
        style={{ height: Number(content.height ?? 48) }}
      />
    );
  }

  if (type === 'header-nav') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-6 py-4">
        <p className="text-[15px] text-foreground">{text(content.logo, 'Brand')}</p>
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          {list(content.links).map((item, index) => (
            <span key={index}>{String(item)}</span>
          ))}
        </div>
        <span className="rounded-md bg-primary px-4 py-2 text-[12px] text-primary-foreground">
          {text(content.ctaLabel, 'Book now')}
        </span>
      </div>
    );
  }

  if (type === 'lead-form') {
    return (
      <section className="rounded-lg border border-border bg-background p-6">
        <div className="space-y-2">
          <h2 className="text-[24px] text-foreground">{text(content.headline, 'Request a consultation')}</h2>
          <p className="text-[14px] leading-relaxed text-muted-foreground">{text(content.helperText, 'We will get back to you within one business day.')}</p>
        </div>
        <div className="mt-6 grid gap-2">
          {list(content.fields).map((field, index) => {
            const item = field as Record<string, unknown>;
            return (
              <div key={index} className="space-y-1">
                <p className="text-[12px] text-foreground">{text(item.label, `Field ${index + 1}`)}</p>
                <div className="h-10 rounded-lg border border-border bg-muted/30" />
              </div>
            );
          })}
          <div className="mt-2 inline-flex h-10 w-fit items-center rounded-md bg-primary px-4 text-[13px] text-primary-foreground">
            {text(content.buttonLabel, 'Submit')}
          </div>
        </div>
      </section>
    );
  }

  if (type === 'pricing-table') {
    return (
      <section className="space-y-4">
        <h2 className="text-[24px] text-foreground">{text(content.title, 'Pricing')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {list(content.plans).map((plan, index) => {
            const item = plan as Record<string, unknown>;
            return (
              <div key={index} className="rounded-lg border border-border bg-background p-4">
                <p className="text-[15px] text-foreground">{text(item.name, 'Plan')}</p>
                <p className="mt-2 text-[28px] text-foreground">{text(item.price, '$99')}</p>
                <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
                  {list(item.features).map((feature, featureIndex) => (
                    <li key={featureIndex}>{String(feature)}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-md bg-primary px-4 py-2 text-center text-[12px] text-primary-foreground">
                  {text(item.ctaLabel, 'Choose plan')}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (type === 'gallery') {
    return (
      <section className="grid gap-2 md:grid-cols-3">
        {list(content.images).map((image, index) => {
          const item = image as Record<string, unknown>;
          return (
            <div key={index} className="overflow-hidden rounded-lg border border-border bg-muted/30">
              {item.src ? (
                <img src={String(item.src)} alt={text(item.alt)} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center text-[12px] text-muted-foreground">Image</div>
              )}
              {item.caption ? <p className="px-2 py-2 text-[12px] text-muted-foreground">{String(item.caption)}</p> : null}
            </div>
          );
        })}
      </section>
    );
  }

  const title = text(content.title, text(content.headline, text(content.message, 'New block')));
  const body = text(content.body, text(content.description, text(content.helperText)));

  return (
    <section className="rounded-lg border border-border bg-background p-6">
      <div className="space-y-2">
        <p className="text-[11px] uppercase text-muted-foreground">{type.replaceAll('-', ' ')}</p>
        <h2 className="text-[24px] text-foreground">{title}</h2>
        {body ? <p className="text-[14px] leading-relaxed text-muted-foreground">{body}</p> : null}
      </div>
      {'ctaLabel' in content ? (
        <div className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13px] text-primary-foreground">
          {text(content.ctaLabel, 'Learn more')}
        </div>
      ) : null}
    </section>
  );
}

// ── Block renderer map ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOCK_COMPONENTS: Record<string, React.FC<any>> = {
  heading:       HeadingBlock,
  paragraph:     ParagraphBlock,
  divider:       DividerBlock,
  list:          ListBlock,
  quote:         QuoteBlock,
  cta:           CTABlock,
  image:         ImageBlock,
  'author-bar':  AuthorBarBlock,
  code:          CodeBlock,
  'video-embed': VideoEmbedBlock,
  hero:          HeroBlock,
  'feature-grid':FeatureGridBlock,
  'stats-row':   StatsRowBlock,
  'image-text':  ImageTextBlock,
  testimonials:  TestimonialsBlock,
  'faq-qa':      FAQQABlock,
  'faq-section': FAQSectionBlock,
  spacer:        GenericMarketingBlock,
  'header-nav':  GenericMarketingBlock,
  'custom-embed':GenericMarketingBlock,
  gallery:       GenericMarketingBlock,
  review:        GenericMarketingBlock,
  'cta-section': GenericMarketingBlock,
  'table-of-contents': GenericMarketingBlock,
  'key-takeaways': GenericMarketingBlock,
  'related-posts': GenericMarketingBlock,
  'social-share': GenericMarketingBlock,
  'newsletter-signup': GenericMarketingBlock,
  'seo-meta': GenericMarketingBlock,
  benefits: GenericMarketingBlock,
  'logo-strip': GenericMarketingBlock,
  'pricing-table': GenericMarketingBlock,
  'lead-form': GenericMarketingBlock,
  'contact-block': GenericMarketingBlock,
  'map-block': GenericMarketingBlock,
  'review-wall': GenericMarketingBlock,
  'comparison-table': GenericMarketingBlock,
  'process-steps': GenericMarketingBlock,
  'team-grid': GenericMarketingBlock,
  'announcement-bar': GenericMarketingBlock,
  footer: GenericMarketingBlock,
};

// ── Text block types — these show the rich text toolbar when focused ──────────

const TEXT_BLOCK_TYPES = new Set([
  'heading', 'paragraph', 'list', 'quote', 'hero',
  'feature-grid', 'image-text', 'faq-qa', 'faq-section',
  'testimonials', 'author-bar',
]);

// ── Empty state ───────────────────────────────────────────────────────────────

const MODE_META: Record<BlockEditorMode, { icon: React.ElementType; title: string; sub: string }> = {
  blog:    { icon: FileText,      title: 'Start building your blog post',   sub: 'Add a heading, write some text, or insert an image.' },
  landing: { icon: Layers,        title: 'Build your landing page',          sub: 'Start with a Hero block, then add features, stats, and a CTA.' },
  faq:     { icon: MessageSquare, title: 'Build your FAQ',                   sub: 'Add Q&A pairs or organise them into sections.' },
};

// ── Blog-mode semantic spacing ────────────────────────────────────────────────
// Mirrors how Gutenberg, Framer, and Notion handle block spacing:
// headings signal section breaks and get large top gaps; content within a
// section stays tight to its heading.
function getBlogBlockTopClass(block: Block, prevBlock: Block | null, idx: number): string {
  if (idx === 0 || !prevBlock) return '';

  const t = block.type;
  const pt = prevBlock.type;
  const level = String((block.content as Record<string, unknown>)?.level ?? '');
  const prevLevel = String((prevBlock.content as Record<string, unknown>)?.level ?? '');

  // H2 = new major section — large gap so sections feel distinct
  if (t === 'heading' && level === 'h2') return 'mt-10';
  // H3 = sub-section — medium gap
  if (t === 'heading' && level === 'h3') return 'mt-6';

  // Content right after H1 (author bar, etc.) — tight
  if (pt === 'heading' && prevLevel === 'h1') return 'mt-1';
  // Content right after any heading groups tightly with it
  if (pt === 'heading') return 'mt-0';

  // Images: generous breathing room before and after
  if (t === 'image') return 'mt-6';
  if (pt === 'image') return 'mt-6';

  // Author bar → hero image
  if (pt === 'author-bar') return 'mt-4';

  // List immediately after paragraph: tight grouping
  if (t === 'list' && pt === 'paragraph') return 'mt-1';
  // Paragraph after list: small gap
  if (t === 'paragraph' && pt === 'list') return 'mt-2';

  // Default body content (paragraph → paragraph, etc.)
  return 'mt-4';
}

function EmptyState({ mode, onAdd }: { mode: BlockEditorMode; onAdd: (type: import('./blockTypes').BlockType) => void }) {
  const meta = MODE_META[mode];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[480px] gap-6 px-8 text-center">
      <div className="size-16 rounded-xl bg-primary/8 flex items-center justify-center">
        <Icon size={28} strokeWidth={1.6} absoluteStrokeWidth className="text-primary/60" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[16px] text-foreground">{meta.title}</p>
        <p className="text-[13px] text-muted-foreground max-w-[340px] leading-relaxed">{meta.sub}</p>
      </div>
      <BlockPicker mode={mode} onAdd={onAdd} primary />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CanvasBlockInfo {
  id: string;
  type: BlockType;
  label: string;
}

interface BlockCanvasProps {
  mode: BlockEditorMode;
  /** Controlled zoom level from the parent toolbar */
  zoom?: number;
  /** Called when trackpad/Ctrl+scroll changes zoom */
  onZoomChange?: (zoom: number) => void;
  /** Called when a block is selected on the canvas, with block metadata */
  onBlockFocus?: (info: CanvasBlockInfo) => void;
  /** Section name whose blocks should display a shimmer overlay */
  shimmerSection?: string | null;
}

/** Derive a short display label from a block's content + type */
function getBlockDisplayLabel(block: Block): string {
  if (
    (block.type === 'heading' || block.type === 'paragraph') &&
    typeof block.content.text === 'string' &&
    block.content.text.trim()
  ) {
    const t = block.content.text.trim();
    return t.length > 35 ? t.slice(0, 35) + '…' : t;
  }
  return BLOCK_CATALOG.find(e => e.type === block.type)?.label ?? block.type;
}

function getShimmerBlockIds(blocks: Block[], section: string | null | undefined): Set<string> {
  if (!section) return new Set();
  const ids = blocks.map(b => b.id);
  if (section === 'Introduction') return new Set(ids.slice(0, Math.min(2, ids.length)));
  if (section === 'Call to action') {
    const ctaIdx = blocks.findIndex(b => b.type === 'cta');
    return ctaIdx >= 0 ? new Set([blocks[ctaIdx].id]) : new Set(ids.slice(-1));
  }
  if (section === 'Conclusion') return new Set(ids.slice(-2));
  if (section === 'Body') return new Set(ids.slice(1, Math.max(1, ids.length - 2)));
  // 'full' or any other string — shimmer everything
  return new Set(ids);
}

// ── Canvas ────────────────────────────────────────────────────────────────────

export function BlockCanvas({ mode, zoom = 1, onZoomChange, onBlockFocus, shimmerSection }: BlockCanvasProps) {
  const {
    blocks, focusedId,
    addBlock, updateBlock, removeBlock,
    focusBlock, moveUp, moveDown, duplicate, reorder,
  } = useBlockEditorContext();

  // Rich text toolbar visibility
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragSrcIdx = useRef<number | null>(null);
  const editorToolbarMode = mode === 'faq' ? 'faq' : 'blog';

  // ── Track contentEditable focus for rich text toolbar
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    function onFocusIn(e: FocusEvent) {
      const el = e.target as HTMLElement;
      if (el.isContentEditable) setToolbarVisible(true);
    }
    function onFocusOut(e: FocusEvent) {
      const related = (e as FocusEvent & { relatedTarget: Element | null }).relatedTarget;
      // Hide toolbar only if focus left the canvas entirely
      if (!container.contains(related as Node)) setToolbarVisible(false);
    }

    container.addEventListener('focusin', onFocusIn);
    container.addEventListener('focusout', onFocusOut);
    return () => {
      container.removeEventListener('focusin', onFocusIn);
      container.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // ── Pinch-to-zoom / Ctrl+Scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if ((e.ctrlKey || e.metaKey) && onZoomChange) {
      e.preventDefault();
      const delta = e.deltaY * -0.004;
      const next = Math.max(0.25, Math.min(3, parseFloat((zoom + delta).toFixed(2))));
      onZoomChange(next);
    }
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange?.(Math.max(0.25, +(zoom - 0.1).toFixed(2)));
  }, [zoom, onZoomChange]);

  const handleZoomIn = useCallback(() => {
    onZoomChange?.(Math.min(3, +(zoom + 0.1).toFixed(2)));
  }, [zoom, onZoomChange]);

  // ── Drag-and-drop
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = dragSrcIdx.current;
    if (fromIdx !== null && fromIdx !== toIdx) reorder(fromIdx, toIdx);
    dragSrcIdx.current = null;
  }, [reorder]);

  const handleDragEnd = useCallback(() => { dragSrcIdx.current = null; }, []);

  // ── Click outside blocks to deselect
  function handleCanvasClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-block-id]')) focusBlock(null);
  }

  return (
    <div
      ref={canvasRef}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      onWheel={handleWheel}
    >
      {toolbarVisible && (
        <div className="flex-none">
          <EditorChromeToolbar
            canUndo={false}
            canRedo={false}
            onUndo={() => {}}
            onRedo={() => {}}
            zoom={zoom}
            onZoomOut={handleZoomOut}
            onZoomIn={handleZoomIn}
            richTextVisible
            canvasPosition={{ top: 0, left: 0 }}
            inlineMode
            mode={editorToolbarMode}
          />
        </div>
      )}

      {/* Scrollable canvas body */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--color-canvas,#F7F8FA)]"
        onClick={handleCanvasClick}
      >
        {blocks.length === 0 ? (
          <EmptyState mode={mode} onAdd={type => addBlock(type, null)} />
        ) : (
          <div
            className={cn(
              'mx-auto px-12 py-8',
              mode === 'blog' ? 'max-w-[1040px]' : 'max-w-[760px]',
            )}
            style={{ zoom }}
          >
            <div className={cn(
              mode === 'blog' && 'rounded-xl bg-background px-[30px] py-[30px] shadow-sm ring-[0.5px] ring-border/20',
            )}>
            {(() => {
              const shimmerIds = getShimmerBlockIds(blocks, shimmerSection);
              return blocks.map((block: Block, idx: number) => {
              const BlockComponent = BLOCK_COMPONENTS[block.type];
              const isFocused = focusedId === block.id;
              const prevBlock = idx > 0 ? blocks[idx - 1] : null;
              const topClass = mode === 'blog' ? getBlogBlockTopClass(block, prevBlock, idx) : '';
              const isShimmering = shimmerIds.has(block.id);

              return (
                <div key={block.id} className={topClass}>
                  {/* Insertion point above this block */}
                  <BlockPicker
                    mode={mode}
                    onAdd={type => addBlock(type, idx === 0 ? null : blocks[idx - 1].id)}
                  />

                  <BlockShell
                    blockId={block.id}
                    focused={isFocused}
                    onFocus={() => {
                      onBlockFocus?.({ id: block.id, type: block.type, label: getBlockDisplayLabel(block) });
                      focusBlock(block.id);
                    }}
                    onBlur={() => {}}
                    onMoveUp={() => moveUp(block.id)}
                    onMoveDown={() => moveDown(block.id)}
                    onDuplicate={() => duplicate(block.id)}
                    onRemove={() => removeBlock(block.id)}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                    surface={mode === 'blog' ? 'page' : 'card'}
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    isShimmering={isShimmering}
                  >
                    {BlockComponent && (
                      <BlockComponent
                        blockId={block.id}
                        content={block.content}
                        style={block.style}
                        behavior={block.behavior}
                        settings={block.settings}
                        focused={isFocused}
                        type={block.type}
                        onChange={(patch: Record<string, unknown>) => updateBlock(block.id, patch)}
                      />
                    )}
                  </BlockShell>
                </div>
              );
            });
            })()}

            {/* Final insertion point */}
            <BlockPicker
              mode={mode}
              onAdd={type => addBlock(type, blocks[blocks.length - 1]?.id ?? null)}
            />
            </div>

            {/* Bottom breathing room */}
            <div className="h-24" />
          </div>
        )}
      </div>
    </div>
  );
}
