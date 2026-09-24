/**
 * BlogSectionCanvas
 *
 * Post-generation canvas for the blog flow.
 * Layout mirrors FAQSectionCanvas exactly:
 *  ┌──────────────────────┬──────────────────────────────────────────────┬────────────┐
 *  │  Left panel (280px)  │  Center canvas (flex-1)                      │ Score panel│
 *  │  AI / Manual tabs    │  Floating toolbar (undo + zoom)              │ (300px)    │
 *  │                      │  Blog card (ONE container)                   │            │
 *  │                      │    ├─ Card header (identical to FAQ)         │            │
 *  │                      │    └─ Rich content blocks                    │            │
 *  └──────────────────────┴──────────────────────────────────────────────┴────────────┘
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AIIcon } from '@/assets/icons/AIIcon';
import {
  GripVertical, GripHorizontal, ChevronDown, Trash2, Plus,
  AlertTriangle, XCircle,
  ArrowUp, ArrowDown, Sparkles, Layers,
  FileText, Settings2, X as XIcon,
  AlignLeft, Type, List, Image as ImageIcon, Lightbulb, Quote,
  BookmarkX, HelpCircle, MousePointerClick, Minus, Star, Code2,
  Share2, PanelBottom, SquarePlay,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { AiCopilot } from '../AiCopilot';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import { EditorScorePanel } from '../editor/EditorScorePanel';
import { CommentPanel } from '../editor/CommentPanel';
import { EDITOR_CONFIGS } from '../editor/editorConfig';
import { EditorChromeToolbar, type EditorToolbarPosition } from '../shared/EditorChromeToolbar';
import { CanvasEditorTopBar } from '../shared/CanvasEditorTopBar';
import { ContentActivityDrawer } from '../shared/ContentActivityDrawer';
import {
  getSavedBlocks,
  removeSavedBlock,
  subscribeSavedBlocks,
  type SavedBlock,
} from '../shared/savedBlocksStore';
import type { BlogSection } from './BlogInlineCreationFlow';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlockType = 'hero' | 'heading' | 'paragraph' | 'bullets' | 'image' | 'callout' | 'quote' | 'faq-item' | 'cta-banner';

export interface FaqQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSectionData {
  id: string;
  title: string;
  questions: FaqQuestion[];
}

export interface BlogBlock {
  id: string;
  type: BlockType;
  // hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroTag?: string;
  heroAuthor?: string;
  heroReadTime?: number;
  heroImage?: string;
  // heading
  level?: 1 | 2 | 3;
  headingText?: string;
  // paragraph
  body?: string;
  // bullets
  items?: string[];
  // image
  src?: string;
  alt?: string;
  caption?: string;
  // callout
  calloutVariant?: 'info' | 'success' | 'warning';
  calloutText?: string;
  calloutTitle?: string;
  // quote
  quoteText?: string;
  quoteAuthor?: string;
  // faq-item
  faqQuestion?: string;
  faqAnswer?: string;
  // cta-banner
  ctaHeadline?: string;
  ctaBody?: string;
  ctaButtonText?: string;
  ctaBgColor?: string;
  // shared
  status?: 'ready' | 'warning' | 'blocked';
  warningText?: string;
}

type PreloadedSection = {
  heading?: string;
  body?: string;
  listItems?: string[];
  image?: string;
  imageAlt?: string;
};

export interface BlogSectionCanvasProps {
  sections: BlogSection[];
  generationLabel?: string;
  onEditSettings?: () => void;
  onVersionHistory?: () => void;
  /** AEO score from the recommendation — used as the starting content score */
  initialScore?: number;
  /** Pre-loaded blog sections from the recommendation preview — bypasses mock generation */
  preloadedBlogSections?: PreloadedSection[];
  /** Recommendation title — used as the hero heading */
  title?: string;
  /** Called whenever the computed content score changes — lets the parent show it in the outer header */
  onScoreChange?: (score: number) => void;
  /** Controlled score-panel open state (from outer header button) */
  scorePanelOpen?: boolean;
  /** Called when the panel open state changes internally */
  onScorePanelChange?: (open: boolean) => void;
}

// ── Block generation ──────────────────────────────────────────────────────────

let blockIdCounter = 2000;
function makeBlockId() { return `blk${blockIdCounter++}`; }

function buildBlogBlocksFromSections(heroTitle: string, sections: PreloadedSection[]): BlogBlock[] {
  const blocks: BlogBlock[] = [];

  // Article title as H1
  blocks.push({ id: makeBlockId(), type: 'heading', level: 1, headingText: heroTitle, status: 'ready' });

  // Hero image — use first section image or default
  const heroImg = sections.find(s => s.image)?.image
    ?? 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&q=80';
  blocks.push({ id: makeBlockId(), type: 'image', src: heroImg, alt: heroTitle, status: 'ready' });

  // Body sections — split content from FAQ Q&As
  let inFaqSection = false;
  const faqBlocks: BlogBlock[] = [];

  for (const s of sections) {
    if (s.heading?.toLowerCase().includes('frequently asked question')) {
      inFaqSection = true;
      continue;
    }
    if (inFaqSection) {
      if (s.heading && s.body) {
        faqBlocks.push({
          id: makeBlockId(), type: 'faq-item',
          faqQuestion: s.heading, faqAnswer: s.body, status: 'ready',
        });
      }
      continue;
    }
    if (s.heading) blocks.push({ id: makeBlockId(), type: 'heading', level: 2, headingText: s.heading, status: 'ready' });
    if (s.body)    blocks.push({ id: makeBlockId(), type: 'paragraph', body: s.body, status: 'ready' });
    if (s.listItems && s.listItems.length > 0) blocks.push({ id: makeBlockId(), type: 'bullets', items: s.listItems, status: 'ready' });
    if (s.image)   blocks.push({ id: makeBlockId(), type: 'image', src: s.image, alt: s.imageAlt ?? s.heading ?? '', status: 'ready' });
  }

  // FAQ section at the bottom
  if (faqBlocks.length > 0) {
    blocks.push({ id: makeBlockId(), type: 'heading', level: 2, headingText: 'Frequently Asked Questions', status: 'ready' });
    blocks.push(...faqBlocks);
  }

  return blocks;
}

function generateBlogBlocks(sections: BlogSection[]): BlogBlock[] {
  const blocks: BlogBlock[] = [];

  // Article title as H1
  blocks.push({
    id: makeBlockId(),
    type: 'heading',
    level: 1,
    headingText: 'Are dental implants right for you?',
    status: 'ready',
  });

  // Hero image
  blocks.push({
    id: makeBlockId(),
    type: 'image',
    src: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=80',
    alt: 'Dental implant procedure',
    status: 'ready',
  });

  // Intro paragraph
  blocks.push({
    id: makeBlockId(),
    type: 'paragraph',
    body: 'Dental implants have transformed how dentists replace missing teeth — offering a permanent, natural-looking solution that preserves jaw bone and doesn\'t affect neighbouring teeth. But they aren\'t right for everyone, and understanding the process, costs, and candidacy requirements is essential before committing. This guide covers everything you need to know to make an informed decision.',
    status: 'ready',
  });

  // One block group per section: H2 + paragraph + bullets
  sections.forEach(section => {
    blocks.push({
      id: makeBlockId(),
      type: 'heading',
      level: 2,
      headingText: section.heading,
      status: 'ready',
    });
    blocks.push({
      id: makeBlockId(),
      type: 'paragraph',
      body: section.description.length > 60
        ? section.description + '. Getting this right is one of the highest-leverage improvements a multi-location brand can make to its AI search citation share.'
        : `${section.description}. Understanding this step can help you go into your implant consultation fully prepared.`,
      status: 'ready',
    });
    blocks.push({
      id: makeBlockId(),
      type: 'bullets',
      items: [
        'Schedule a consultation to assess bone density and gum health — both are essential for implant candidacy',
        'Ask your dentist about the full treatment timeline, including any bone grafting that may be needed beforehand',
        'Compare implants, bridges, and dentures on long-term cost, maintenance, and comfort — not just upfront price',
        'Check whether your health fund covers any portion of the implant procedure or related restorative work',
      ],
      status: 'ready',
    });
  });

  // FAQ section at the bottom
  blocks.push({
    id: makeBlockId(),
    type: 'heading',
    level: 2,
    headingText: 'Frequently Asked Questions',
    status: 'ready',
  });
  [
    { q: 'Am I a good candidate for dental implants?', a: 'Most adults in good general health with sufficient jaw bone density are candidates. Key factors include non-smoking status, controlled blood sugar levels, and healthy gums. Your dentist will assess bone volume and overall oral health at a consultation — some patients need a bone graft first, which adds time but doesn\'t rule out implants.' },
    { q: 'How long do dental implants last?', a: 'With proper care, the titanium implant post can last a lifetime. The crown placed on top typically lasts 10–20 years before it may need replacing due to normal wear. Good brushing, flossing, and regular dental check-ups are the biggest factors in long-term implant success.' },
    { q: 'Do dental implants hurt?', a: 'The procedure is performed under local anaesthetic, so you shouldn\'t feel pain during surgery. Most patients report mild soreness and swelling for a few days afterwards, which is managed with over-the-counter pain relief. The discomfort is generally less than patients expect and well within normal tolerance.' },
    { q: 'How much do dental implants cost?', a: 'A single implant including the crown typically ranges from $3,000 to $6,500 in Australia depending on complexity and location. Some health funds offer partial cover under major dental extras. Your dentist will provide a detailed treatment plan and itemised quote at your consultation.' },
  ].forEach(({ q, a }) => blocks.push({
    id: makeBlockId(),
    type: 'faq-item',
    faqQuestion: q,
    faqAnswer: a,
    status: 'ready',
  }));

  return blocks;
}

// ── Left panel tab items ──────────────────────────────────────────────────────

const LEFT_TAB_ITEMS = [
  {
    value: 'ai' as const,
    label: 'AI',
    icon: <AIIcon size={20} />,
  },
  { value: 'manual' as const, label: 'Manual' },
];

// ── Manual panel (blog-specific) ──────────────────────────────────────────────

type BlogManualTab = 'basic' | 'prebuilt' | 'saved';

const BLOCK_PALETTE = [
  { type: 'hero' as BlockType, label: 'Header', Icon: PanelBottom },
  { type: 'heading' as BlockType, label: 'Title', Icon: Type },
  { type: 'paragraph' as BlockType, label: 'Text', Icon: AlignLeft },
  { type: 'callout' as BlockType, label: 'Button', Icon: MousePointerClick },
  { type: 'image' as BlockType, label: 'Image', Icon: ImageIcon },
  { type: 'image' as BlockType, label: 'Video', Icon: SquarePlay },
  { type: 'bullets' as BlockType, label: 'Bullet list', Icon: List },
  { type: 'paragraph' as BlockType, label: 'Divider', Icon: Minus },
  { type: 'paragraph' as BlockType, label: 'Spacer', Icon: Minus },
  { type: 'faq-item' as BlockType, label: 'FAQ', Icon: HelpCircle },
  { type: 'quote' as BlockType, label: 'Review', Icon: Star },
  { type: 'callout' as BlockType, label: 'Callout', Icon: Lightbulb },
  { type: 'callout' as BlockType, label: 'Footer', Icon: PanelBottom },
  { type: 'paragraph' as BlockType, label: 'HTML', Icon: Code2 },
  { type: 'callout' as BlockType, label: 'Social links', Icon: Share2 },
];

const BLOG_PREBUILT_TEMPLATES = [
  {
    id: 'blog-template-how-to',
    title: 'How-to article',
    description: 'Intro, steps, proof point, and closing CTA',
    types: ['heading', 'paragraph', 'bullets', 'callout'] as BlockType[],
  },
  {
    id: 'blog-template-local-seo',
    title: 'Local SEO post',
    description: 'Location intro, services, FAQs, and internal links',
    types: ['heading', 'paragraph', 'bullets', 'faq-item'] as BlockType[],
  },
  {
    id: 'blog-template-thought-leadership',
    title: 'Thought leadership',
    description: 'Strong POV, customer proof, quote, and takeaway list',
    types: ['heading', 'paragraph', 'quote', 'bullets'] as BlockType[],
  },
  {
    id: 'blog-template-media-story',
    title: 'Image-led story',
    description: 'Hero image, section heading, supporting copy, and CTA',
    types: ['image', 'heading', 'paragraph', 'callout'] as BlockType[],
  },
];

const LIBRARY_FAQ_SECTIONS: FaqSectionData[] = [
  {
    id: 'lib-sec-1',
    title: 'AI search basics',
    questions: [
      { id: 'lq1', question: 'What is the difference between SEO and AI search optimization?', answer: 'SEO improves your position in a ranked list of links. AI search optimization — often called AEO — focuses on being selected and cited in a single synthesized answer. The goal shifts from ranking on page one to being the trusted source an AI platform cites.' },
      { id: 'lq2', question: 'Which AI platforms should I optimize for?', answer: 'The three platforms with the highest query volume in 2026 are ChatGPT, Gemini, and Perplexity. Each uses slightly different citation signals, but the fundamentals — complete profiles, structured content, and consistent citations — apply to all three.' },
      { id: 'lq3', question: 'How do I know if my brand is being cited in AI search?', answer: 'Traditional analytics tools do not capture AI citation data. You need dedicated AI visibility monitoring that tracks answer presence across AI platforms at the query and location level. Birdeye Search AI provides this visibility across all your locations.' },
    ],
  },
  {
    id: 'lib-sec-2',
    title: 'Content and optimization',
    questions: [
      { id: 'lq4', question: 'What content types perform best in AI search?', answer: 'FAQ pages, location-specific service pages, pricing pages, and comparison content consistently outperform generic brand copy. Content written to directly answer customer questions — in the language customers use — is cited more often than promotional copy.' },
      { id: 'lq5', question: 'How important is location-level content for multi-location brands?', answer: 'Critical. AI platforms respond to local intent and require detailed, location-specific information to cite a business for geographic queries. A generic national page does not satisfy a local query — a location-specific page with accurate details does.' },
      { id: 'lq6', question: 'How often should I update my content to stay visible in AI search?', answer: 'AI platforms factor in content freshness when selecting citations. Review your high-priority location pages and FAQ sections at least quarterly. Update any information that has changed, and add new questions as customer behavior evolves.' },
    ],
  },
  {
    id: 'lib-sec-3',
    title: 'Reviews and trust signals',
    questions: [
      { id: 'lq7', question: 'How do reviews influence AI-generated answers?', answer: 'Reviews act as trust signals. LLMs analyze overall ratings, sentiment consistency, and the specificity of review content to validate brand recommendations. A business with a high volume of detailed, positive reviews is cited more reliably than one with sparse or mixed feedback.' },
      { id: 'lq8', question: 'Does my Google Business Profile affect AI search visibility?', answer: 'Yes. Google Business Profile is one of the primary data sources AI platforms use to verify business information. An incomplete or inconsistent profile reduces citation confidence and lowers the likelihood that AI platforms will cite your business.' },
    ],
  },
];

interface BlogManualContentProps {
  onAddBlock: (type: BlockType) => void;
  onDropFaqSection: (section: FaqSectionData) => void;
  onInsertSavedBlock: (block: SavedBlock) => void;
}

function BlogTemplatePreview({
  label,
  title,
  score = 92,
}: {
  label: string;
  title: string;
  score?: number;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText size={11} strokeWidth={1.6} absoluteStrokeWidth />
        </div>
        <span className="min-w-0 flex-1 truncate text-[8px] text-foreground">{label}</span>
        <div className="h-1 w-[34px] overflow-hidden rounded-full bg-muted">
          <div className="h-full w-4/5 rounded-full bg-[#1D9E75]" />
        </div>
        <span className="rounded bg-[#1D9E75]/10 px-1 text-[7px] text-text-primary">{score}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 py-2">
        <p className="truncate text-[8px] text-foreground">{title}</p>
        <div className="h-1 w-full rounded-full bg-muted" />
        <div className="h-1 w-10/12 rounded-full bg-muted" />
        <div className="h-1 w-[34px]/12 rounded-full bg-muted" />
        <div className="mt-1 h-1 w-11/12 rounded-full bg-muted" />
        <div className="h-1 w-7/12 rounded-full bg-muted" />
      </div>
    </div>
  );
}

function SuggestedStyleCard({
  label,
  title,
  description: _description,
  onClick,
  onRemove,
  previewTitle,
}: {
  label: string;
  title: string;
  description?: string;
  onClick: () => void;
  onRemove?: () => void;
  previewTitle?: string;
}) {
  return (
    <div className="group overflow-hidden rounded-md border border-border bg-background transition-colors hover:border-primary/30">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="relative border-b border-border bg-muted/60 p-4 transition-colors group-hover:bg-surface-hover/80">
          <div className="h-[116px]">
            <BlogTemplatePreview label={label} title={previewTitle ?? title} />
          </div>
          {/* Insert overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground shadow-sm">
              Insert
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[13px] leading-snug text-foreground">{title}</p>
        </div>
      </button>
      {onRemove && (
        <div className="border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-muted-foreground transition-colors hover:text-destructive"
          >
            Remove saved block
          </button>
        </div>
      )}
    </div>
  );
}

function BlogManualContent({ onAddBlock, onDropFaqSection, onInsertSavedBlock }: BlogManualContentProps) {
  const [manualTab, setManualTab] = useState<BlogManualTab>('basic');
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>(() => getSavedBlocks());

  useEffect(() => subscribeSavedBlocks(setSavedBlocks), []);

  const manualTabs: { value: BlogManualTab; label: string }[] = [
    { value: 'basic', label: 'Basic' },
    { value: 'prebuilt', label: 'Pre-built' },
    { value: 'saved', label: 'Saved' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex-none p-4">
        <div className="flex rounded-lg border border-border bg-background p-1">
          {manualTabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setManualTab(tab.value)}
              className={cn(
                'h-[34px] flex-1 rounded-md text-[12px] transition-colors',
                manualTab === tab.value
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {manualTab === 'basic' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_PALETTE.map(({ type, label, Icon }) => (
              <button
                key={label}
                type="button"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('application/blog-add-block', type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onAddBlock(type)}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.03] group cursor-grab active:cursor-grabbing"
              >
                <GripHorizontal size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/50" />
                <div className="text-muted-foreground transition-colors group-hover:text-primary">
                  <Icon size={18} strokeWidth={1.6} absoluteStrokeWidth />
                </div>
                <span className="text-[12px] leading-tight text-foreground transition-colors group-hover:text-primary">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {manualTab === 'prebuilt' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-1 pb-4 space-y-2">
          {BLOG_PREBUILT_TEMPLATES.map(template => (
            <SuggestedStyleCard
              key={template.id}
              label="Blog template"
              title={template.title}
              description={template.description}
              previewTitle={template.types.map(type => type.replace('-', ' ')).join(' + ')}
              onClick={() => template.types.forEach(type => {
                if (type === 'faq-item') {
                  onDropFaqSection(LIBRARY_FAQ_SECTIONS[0]);
                  return;
                }
                onAddBlock(type);
              })}
            />
          ))}
        </div>
      )}

      {manualTab === 'saved' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {savedBlocks.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <BookmarkX size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] text-foreground">No saved blocks yet</p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Save FAQ sections and reuse them inside this blog.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedBlocks.map(block => (
                <SuggestedStyleCard
                  key={block.id}
                  label="Saved block"
                  title={block.name}
                  description={`${block.preview.snippets.length} saved questions from ${block.preview.title}.`}
                  previewTitle={block.preview.title}
                  onClick={() => onInsertSavedBlock(block)}
                  onRemove={() => removeSavedBlock(block.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual block renderers ────────────────────────────────────────────────

function shouldCloseTextEditor(_event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return true;
}

interface BlockRowProps {
  block: BlogBlock;
  index: number;
  total: number;
  faqIndex?: number;
  onUpdate: (patch: Partial<BlogBlock>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  fixingAll?: boolean;
  entranceDelay?: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onOpenHeroSettings?: () => void;
}

function BlockRow({ block, index, total, faqIndex, onUpdate, onDelete, onMoveUp, onMoveDown, fixingAll, entranceDelay = 0, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, onOpenHeroSettings }: BlockRowProps) {
  const [fixing, setFixing] = useState(false);
  const isBeingFixed = fixing || (!!fixingAll && block.status !== 'ready');

  function handleFixThis() {
    setFixing(true);
    setTimeout(() => {
      if (block.type === 'paragraph' || block.type === 'heading') {
        onUpdate({
          status: 'ready',
          warningText: undefined,
          body: block.body
            ? block.body + ' Supporting data: according to a 2024 CX Benchmarks report, businesses implementing structured follow-up programs see a 34% increase in customer satisfaction scores within six months.'
            : block.body,
        });
      } else if (block.type === 'bullets') {
        onUpdate({ status: 'ready', warningText: undefined });
      } else if (block.type === 'quote') {
        onUpdate({
          status: 'ready',
          warningText: undefined,
          quoteText: block.quoteText,
          quoteAuthor: 'Bill Gates, co-founder of Microsoft',
        });
      } else {
        onUpdate({ status: 'ready', warningText: undefined });
      }
      setFixing(false);
    }, 1600);
  }

  const statusRing = cn(
    'rounded-xl overflow-hidden transition-all',
    block.status === 'blocked' && 'ring-1 ring-destructive/30 bg-destructive/[0.02]',
    block.status === 'warning' && 'ring-1 ring-amber-300/60 bg-surface-hover/40',
  );

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/blog-block-id', block.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('application/blog-block-id')) onDragOver?.(e);
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative animate-in fade-in slide-in-from-bottom-3 fill-mode-both',
        statusRing,
        isDragging && 'opacity-40',
        isDragOver && 'ring-2 ring-inset ring-primary/50 bg-primary/[0.02]',
      )}
      style={{ animationDuration: '380ms', animationDelay: `${entranceDelay}ms` }}
    >
      {/* Drag handle + actions overlay */}
      <div className="absolute left-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col gap-1">
        <GripVertical size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/40 cursor-grab" />
      </div>
      <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 bg-background/90 rounded-lg border border-border px-1.5 py-1 shadow-sm">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
          className="p-0.5 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
        >
          <ArrowUp size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
          className="p-0.5 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
        >
          <ArrowDown size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Delete block"
          className="p-0.5 rounded hover:bg-surface-hover hover:text-destructive transition-colors text-muted-foreground"
        >
          <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Block content */}
      <div className="pl-6 pr-8">
        {renderBlockContent(block, onUpdate, isBeingFixed, faqIndex, onOpenHeroSettings)}
      </div>

      {/* Warning / blocked inline feedback */}
      {block.warningText && !isBeingFixed && (
        <div className={cn(
          'mx-6 mb-3 flex items-start gap-1.5',
          block.status === 'warning' && 'text-text-secondary',
          block.status === 'blocked' && 'text-destructive',
        )}>
          {block.status === 'warning'
            ? <AlertTriangle size={12} strokeWidth={1.6} absoluteStrokeWidth className="mt-0.5 flex-shrink-0" />
            : <XCircle size={12} strokeWidth={1.6} absoluteStrokeWidth className="mt-0.5 flex-shrink-0" />
          }
          <span className="text-[12px] leading-relaxed">
            {block.warningText}{' '}
            <button
              type="button"
              onClick={handleFixThis}
              className="text-primary hover:underline"
            >
              Fix this
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

function renderBlockContent(
  block: BlogBlock,
  onUpdate: (patch: Partial<BlogBlock>) => void,
  isBeingFixed: boolean,
  faqIndex?: number,
  onOpenHeroSettings?: () => void,
) {
  if (isBeingFixed) {
    return (
      <div className="py-4 space-y-2 animate-pulse">
        <div className="h-2.5 w-full rounded-full bg-muted" />
        <div className="h-2.5 w-5/6 rounded-full bg-muted" />
        <div className="h-2.5 w-4/5 rounded-full bg-muted" />
      </div>
    );
  }

  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} onUpdate={onUpdate} onOpenSettings={onOpenHeroSettings ?? (() => {})} />;
    case 'heading':
      return <HeadingBlock block={block} onUpdate={onUpdate} />;
    case 'paragraph':
      return <ParagraphBlock block={block} onUpdate={onUpdate} />;
    case 'bullets':
      return <BulletsBlock block={block} onUpdate={onUpdate} />;
    case 'image':
      return <ImageBlock block={block} onUpdate={onUpdate} />;
    case 'callout':
      return <CalloutBlock block={block} onUpdate={onUpdate} />;
    case 'quote':
      return <QuoteBlock block={block} onUpdate={onUpdate} />;
    case 'faq-item':
      return <FaqItemBlock block={block} faqIndex={faqIndex ?? 0} onUpdate={onUpdate} />;
    case 'cta-banner':
      return <CtaBannerBlock block={block} onUpdate={onUpdate} />;
    default:
      return null;
  }
}

// ── FAQ item block (one editable Q/A row, free-flowing in the canvas) ─────────

function FaqItemBlock({
  block,
  faqIndex,
  onUpdate,
}: {
  block: BlogBlock;
  faqIndex: number;
  onUpdate: (patch: Partial<BlogBlock>) => void;
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="mt-0.5 w-[34px] flex-shrink-0 select-none text-right text-[24px] leading-tight text-foreground">
        {faqIndex + 1}.
      </span>
      <div className="flex-1 min-w-0 space-y-3">
        <AutoGrowTextarea
          value={block.faqQuestion ?? ''}
          onChange={value => onUpdate({ faqQuestion: value })}
          placeholder="Question"
          className="w-full bg-transparent text-[24px] leading-tight text-foreground outline-none resize-none border-b border-transparent focus:border-primary transition-colors"
        />
        <AutoGrowTextarea
          value={block.faqAnswer ?? ''}
          onChange={value => onUpdate({ faqAnswer: value })}
          placeholder="Answer"
          className="w-full bg-transparent text-[16px] leading-[1.55] text-foreground/90 outline-none resize-none border-b border-transparent focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

// ── Hero block ────────────────────────────────────────────────────────────────

interface HeroBlockProps {
  block: BlogBlock;
  onUpdate: (p: Partial<BlogBlock>) => void;
  onOpenSettings: () => void;
}

function HeroBlock({ block, onUpdate, onOpenSettings }: HeroBlockProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <div className="relative px-6 pb-6 pt-6 group">
      {/* Settings button */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        title="Hero settings"
      >
        <Settings2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </button>

      {/* Title */}
      {editingTitle ? (
        <input
          autoFocus
          className="mb-3 w-full border-0 border-b border-border bg-transparent pb-1 text-[26px] leading-tight tracking-tight text-foreground outline-none"
          value={block.heroTitle ?? ''}
          onChange={e => onUpdate({ heroTitle: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditingTitle(false); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
        />
      ) : (
        <h1
          className="mb-3 cursor-text text-[26px] leading-tight tracking-tight text-foreground hover:text-foreground/80 transition-colors"
          onClick={() => setEditingTitle(true)}
        >
          {block.heroTitle || 'Add a title'}
        </h1>
      )}

      {/* Author row */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
          {(block.heroAuthor ?? 'A').slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm text-foreground">{block.heroAuthor ?? 'Birdeye AI'}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">{block.heroReadTime ?? 15} min read</span>
      </div>

      {/* Hero image */}
      {block.heroImage ? (
        <img
          src={block.heroImage}
          alt={block.heroTitle ?? 'Hero'}
          className="h-[260px] w-full rounded-xl object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-[260px] w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:border-primary/40 hover:bg-surface-hover transition-colors"
        >
          <ImageIcon size={16} strokeWidth={1.6} absoluteStrokeWidth className="mr-2" />
          Add hero image
        </button>
      )}
    </div>
  );
}

// ── Hero settings panel ───────────────────────────────────────────────────────

function HeroSettingsPanel({
  block,
  onUpdate,
  onClose,
}: {
  block: BlogBlock;
  onUpdate: (p: Partial<BlogBlock>) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l border-border bg-background transition-all">
      <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
        <span className="text-sm text-foreground">Hero settings</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <XIcon size={14} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Title</label>
            <textarea
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
              value={block.heroTitle ?? ''}
              onChange={e => onUpdate({ heroTitle: e.target.value })}
              placeholder="Enter article title"
            />
          </div>

          {/* Author */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Author</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
              value={block.heroAuthor ?? ''}
              onChange={e => onUpdate({ heroAuthor: e.target.value })}
              placeholder="e.g. Birdeye AI"
            />
          </div>

          {/* Read time */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Read time (minutes)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
              value={block.heroReadTime ?? 15}
              onChange={e => onUpdate({ heroReadTime: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          {/* Hero image URL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Hero image URL</label>
            <input
              type="url"
              className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary/60 transition-colors"
              value={block.heroImage ?? ''}
              onChange={e => onUpdate({ heroImage: e.target.value })}
              placeholder="https://..."
            />
            {block.heroImage && (
              <img
                src={block.heroImage}
                alt="Hero preview"
                className="mt-2 h-24 w-full rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Heading block ─────────────────────────────────────────────────────────────

function HeadingBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editing, setEditing] = useState(false);
  const [richStyle, setRichStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const level = block.level ?? 2;

  const textClass = level === 1
    ? 'text-[26px] tracking-tight leading-tight text-foreground'
    : level === 2
      ? 'text-[18px] tracking-tight text-foreground'
      : 'text-[15px] text-foreground';

  const topPad = level === 1 ? 'pt-6 pb-4' : 'pt-6 pb-2';

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      setRichStyle(prev => ({ ...prev, ...(e as CustomEvent<React.CSSProperties>).detail }));
    };
    el.addEventListener('richstylechange', handler);
    return () => el.removeEventListener('richstylechange', handler);
  }, [editing]);

  return (
    <div className={topPad}>
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          style={richStyle}
          className={cn('w-full bg-transparent border-b border-primary outline-none', textClass)}
          value={block.headingText ?? ''}
          onChange={e => onUpdate({ headingText: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
        />
      ) : (
        <p
          style={richStyle}
          className={cn('cursor-text hover:text-primary transition-colors', textClass)}
          onClick={() => setEditing(true)}
        >
          {block.headingText}
        </p>
      )}
    </div>
  );
}

// ── Paragraph block ───────────────────────────────────────────────────────────

function ParagraphBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editing, setEditing] = useState(false);
  const [richStyle, setRichStyle] = useState<React.CSSProperties>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      setRichStyle(prev => ({ ...prev, ...(e as CustomEvent<React.CSSProperties>).detail }));
    };
    el.addEventListener('richstylechange', handler);
    return () => el.removeEventListener('richstylechange', handler);
  }, [editing]);

  return (
    <div className="py-2">
      {editing ? (
        <textarea
          ref={textareaRef}
          autoFocus
          rows={5}
          style={richStyle}
          className="w-full text-[14px] leading-relaxed text-foreground bg-transparent border border-border rounded-lg p-2 outline-none resize-none focus:border-primary"
          value={block.body ?? ''}
          onChange={e => onUpdate({ body: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditing(false); }}
        />
      ) : (
        <p
          style={richStyle}
          className="text-[14px] leading-relaxed text-foreground cursor-text hover:text-foreground/90 transition-colors"
          onClick={() => setEditing(true)}
        >
          {block.body}
        </p>
      )}
    </div>
  );
}

// ── Bullets block ─────────────────────────────────────────────────────────────

function BulletsBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const items = block.items ?? [];

  const updateItem = (idx: number, value: string) => {
    const next = [...items];
    next[idx] = value;
    onUpdate({ items: next });
  };

  const deleteItem = (idx: number) => {
    onUpdate({ items: items.filter((_, i) => i !== idx) });
  };

  const addItem = () => {
    onUpdate({ items: [...items, 'New bullet point'] });
  };

  return (
    <div className="py-2 space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="group/item flex items-start gap-2">
          <span className="mt-[5px] text-primary flex-shrink-0 text-[10px]">&#x25CF;</span>
          <input
            className="flex-1 text-[14px] leading-relaxed text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none transition-colors"
            value={item}
            onChange={e => updateItem(idx, e.target.value)}
          />
          <button
            type="button"
            onClick={() => deleteItem(idx)}
            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 rounded hover:bg-surface-hover hover:text-destructive text-muted-foreground flex-shrink-0 mt-0.5"
          >
            <Trash2 size={11} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors mt-1"
      >
        <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
        Add item
      </button>
    </div>
  );
}

// ── Image block ───────────────────────────────────────────────────────────────

const IMAGE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function ImageBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editingCaption, setEditingCaption] = useState(false);
  const gradientIndex = parseInt(block.id.replace(/\D/g, ''), 10) % IMAGE_GRADIENTS.length;
  const gradient = IMAGE_GRADIENTS[gradientIndex];

  return (
    <div className="py-2 space-y-2">
      {block.src ? (
        <div className="h-52 rounded-xl overflow-hidden">
          <img src={block.src} alt={block.alt ?? ''} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-52 rounded-xl flex items-center justify-center" style={{ background: gradient }}>
          <div className="flex flex-col items-center gap-2">
            <ImageIcon size={36} strokeWidth={1.6} absoluteStrokeWidth className="text-white/40" />
            <span className="text-[12px] text-white/60">{block.alt ?? 'Image placeholder'}</span>
          </div>
        </div>
      )}
      {editingCaption ? (
        <input
          autoFocus
          className="w-full text-[12px] text-muted-foreground text-center bg-transparent border-b border-primary outline-none"
          value={block.caption ?? ''}
          onChange={e => onUpdate({ caption: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditingCaption(false); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingCaption(false); }}
        />
      ) : (
        <p
          className="text-[12px] text-muted-foreground text-center cursor-text hover:text-foreground transition-colors"
          onClick={() => setEditingCaption(true)}
        >
          {block.caption ?? 'Add a caption'}
        </p>
      )}
    </div>
  );
}

// ── Callout block ─────────────────────────────────────────────────────────────

const CALLOUT_STYLES: Record<NonNullable<BlogBlock['calloutVariant']>, string> = {
  info:    'bg-primary/5 border-primary/30 text-text-primary',
  success: 'bg-primary/5 border-primary/20 text-text-primary',
  warning: 'bg-surface-hover border-border text-text-secondary',
};

function CalloutBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editingText, setEditingText] = useState(false);
  const variant = block.calloutVariant ?? 'info';
  const styleClass = CALLOUT_STYLES[variant];

  return (
    <div className={cn('my-3 rounded-xl border p-4', styleClass)}>
      {block.calloutTitle && (
        <p className="text-[13px] mb-1.5">{block.calloutTitle}</p>
      )}
      {editingText ? (
        <textarea
          autoFocus
          rows={3}
          className="w-full text-[13px] bg-transparent outline-none resize-none"
          value={block.calloutText ?? ''}
          onChange={e => onUpdate({ calloutText: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditingText(false); }}
        />
      ) : (
        <p
          className="text-[13px] leading-relaxed cursor-text"
          onClick={() => setEditingText(true)}
        >
          {block.calloutText}
        </p>
      )}
    </div>
  );
}

// ── Quote block ───────────────────────────────────────────────────────────────

function QuoteBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editingQuote, setEditingQuote] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(false);

  return (
    <div className="my-4 pl-5 border-l-4 border-primary/30 space-y-2">
      {editingQuote ? (
        <textarea
          autoFocus
          rows={3}
          className="w-full text-[14px] italic text-foreground/80 bg-transparent border border-border rounded-lg p-2 outline-none resize-none focus:border-primary"
          value={block.quoteText ?? ''}
          onChange={e => onUpdate({ quoteText: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditingQuote(false); }}
        />
      ) : (
        <p
          className="text-[14px] italic text-foreground/80 leading-relaxed cursor-text hover:text-foreground/90 transition-colors"
          onClick={() => setEditingQuote(true)}
        >
          &ldquo;{block.quoteText}&rdquo;
        </p>
      )}
      {editingAuthor ? (
        <input
          autoFocus
          className="text-[12px] text-muted-foreground bg-transparent border-b border-primary outline-none"
          value={block.quoteAuthor ?? ''}
          onChange={e => onUpdate({ quoteAuthor: e.target.value })}
          onBlur={e => { if (shouldCloseTextEditor(e)) setEditingAuthor(false); }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingAuthor(false); }}
        />
      ) : (
        <p
          className="text-[12px] text-muted-foreground cursor-text hover:text-foreground transition-colors"
          onClick={() => setEditingAuthor(true)}
        >
          &mdash; {block.quoteAuthor}
        </p>
      )}
    </div>
  );
}

// ── CTA banner block ──────────────────────────────────────────────────────────

function CtaBannerBlock({ block, onUpdate }: { block: BlogBlock; onUpdate: (p: Partial<BlogBlock>) => void }) {
  const [editingHeadline, setEditingHeadline] = useState(false);
  const bg = block.ctaBgColor ?? 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)';

  return (
    <div className="my-4 overflow-hidden rounded-xl" style={{ background: bg }}>
      <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
        {editingHeadline ? (
          <input
            autoFocus
            className="w-full text-center text-[22px] text-white bg-transparent border-b border-white/40 outline-none pb-1"
            value={block.ctaHeadline ?? ''}
            onChange={e => onUpdate({ ctaHeadline: e.target.value })}
            onBlur={() => setEditingHeadline(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingHeadline(false); }}
          />
        ) : (
          <h2
            className="text-[22px] text-white leading-tight cursor-text hover:opacity-80 transition-opacity"
            onClick={() => setEditingHeadline(true)}
          >
            {block.ctaHeadline ?? 'Ready to get started?'}
          </h2>
        )}
        <p className="text-[14px] text-white/80 max-w-md leading-relaxed">
          {block.ctaBody ?? 'Join thousands of businesses using our platform to deliver exceptional customer experiences.'}
        </p>
        <button
          type="button"
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-6 text-[13px] text-text-primary transition-opacity hover:opacity-90"
        >
          {block.ctaButtonText ?? 'Get started free'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BlogSectionCanvas({ sections, generationLabel, onVersionHistory, initialScore, preloadedBlogSections, title, onScoreChange, scorePanelOpen: externalScorePanelOpen, onScorePanelChange }: BlogSectionCanvasProps) {
  const [blocks, setBlocksState] = useState<BlogBlock[]>(() => {
    if (preloadedBlogSections && preloadedBlogSections.length > 0) {
      return buildBlogBlocksFromSections(title ?? 'Blog post', preloadedBlogSections);
    }
    const generated = generateBlogBlocks(sections);
    if (title) {
      const heroIdx = generated.findIndex(b => b.type === 'hero');
      if (heroIdx >= 0) generated[heroIdx] = { ...generated[heroIdx], heroTitle: title };
    }
    return generated;
  });
  const [leftTab, setLeftTab] = useState<'ai' | 'manual'>('ai');
  const [zoom, setZoom] = useState(0.85);
  const [internalScorePanelOpen, setInternalScorePanelOpen] = useState(true);
  const scorePanelOpen = externalScorePanelOpen !== undefined ? externalScorePanelOpen : internalScorePanelOpen;
  const setScorePanelOpen = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(scorePanelOpen) : v;
    setInternalScorePanelOpen(next);
    onScorePanelChange?.(next);
  }, [scorePanelOpen, onScorePanelChange]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);
  const [panelBump, setPanelBump] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [heroSettingsOpen, setHeroSettingsOpen] = useState(false);
  const heroBlock = blocks.find(b => b.type === 'hero') ?? null;

  useEffect(() => {
    if (scorePanelOpen) {
      setActivityOpen(false);
      setCommentsOpen(false);
    }
  }, [scorePanelOpen]);

  const [richTextVisible, setRichTextVisible] = useState(false);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const [canvasToolbarPosition, setCanvasToolbarPosition] = useState<EditorToolbarPosition>({ top: 96, left: 640 });
  const [richTextPosition, setRichTextPosition] = useState<EditorToolbarPosition | undefined>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeTextTargetRef = useRef<HTMLElement | null>(null);

  // Pinch-to-zoom via trackpad (ctrl+wheel)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(z => {
        const next = z - e.deltaY * 0.004;
        return Math.min(2, Math.max(0.5, +next.toFixed(2)));
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const updateCanvasToolbarPosition = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCanvasToolbarPosition({
      top: Math.max(64, rect.top + 16),
      left: rect.left + rect.width / 2,
    });
  }, []);

  const updateRichTextPosition = useCallback((target?: HTMLElement | null) => {
    const activeTarget = target ?? activeTextTargetRef.current;
    if (!activeTarget) return;
    const selection = window.getSelection();
    const selectionRect = selection && selection.rangeCount > 0 && !selection.isCollapsed
      ? selection.getRangeAt(0).getBoundingClientRect()
      : null;
    const rect = selectionRect && selectionRect.width > 0
      ? selectionRect
      : activeTarget.getBoundingClientRect();
    setRichTextPosition({
      top: Math.max(64, rect.top - 56),
      left: rect.left + rect.width / 2,
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function isTextEditor(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isTextEditor(event.target)) return;
      activeTextTargetRef.current = event.target as HTMLElement;
      updateRichTextPosition(event.target as HTMLElement);
      setRichTextVisible(true);
    }

    function handleFocusOut() {
      window.setTimeout(() => {
        if (isTextEditor(document.activeElement)) return;
        activeTextTargetRef.current = null;
        setRichTextVisible(false);
      }, 0);
    }

    function handleSelectionChange() {
      if (!isTextEditor(document.activeElement)) return;
      updateRichTextPosition(document.activeElement as HTMLElement);
    }

    function handleScrollOrResize() {
      updateCanvasToolbarPosition();
      if (isTextEditor(document.activeElement)) {
        updateRichTextPosition(document.activeElement as HTMLElement);
      }
    }

    updateCanvasToolbarPosition();
    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut);
    el.addEventListener('scroll', handleScrollOrResize);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut);
      el.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateCanvasToolbarPosition, updateRichTextPosition]);

  // ── Undo / redo history ────────────────────────────────────────────────────
  const historyRef    = useRef<BlogBlock[][]>([]);
  const historyIdxRef = useRef(-1);
  const [, setHistoryVersion] = useState(0);
  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  const pushHistory = useCallback((snapshot: BlogBlock[]) => {
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snapshot);
    historyIdxRef.current = historyRef.current.length - 1;
    setHistoryVersion(v => v + 1);
  }, []);

  const setBlocks = useCallback((updater: BlogBlock[] | ((prev: BlogBlock[]) => BlogBlock[])) => {
    setBlocksState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    setBlocksState(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    setBlocksState(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  // ── Derived score ──────────────────────────────────────────────────────────
  const totalBlocks  = blocks.length;
  const readyBlocks  = blocks.filter(b => b.status === 'ready').length;
  const canvasScore  = Math.round((readyBlocks / Math.max(1, totalBlocks)) * 78);
  const finalScore   = Math.min(100, (initialScore !== undefined ? initialScore : canvasScore) + panelBump);

  useEffect(() => { onScoreChange?.(finalScore); }, [finalScore, onScoreChange]);

  const blogConfig = EDITOR_CONFIGS['blog'];

  // ── Block CRUD ─────────────────────────────────────────────────────────────
  const updateBlock = useCallback((id: string, patch: Partial<BlogBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, [setBlocks]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, [setBlocks]);

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, [setBlocks]);

  const addFaqSection = useCallback((section: FaqSectionData) => {
    const items: BlogBlock[] = section.questions.map(q => ({
      id: makeBlockId(),
      type: 'faq-item',
      faqQuestion: q.question,
      faqAnswer: q.answer,
      status: 'ready',
    }));
    setBlocks(prev => [...prev, ...items]);
  }, [setBlocks]);

  const addBlock = useCallback((type: BlockType) => {
    if (type === 'faq-item') {
      addFaqSection(LIBRARY_FAQ_SECTIONS[0]);
      return;
    }
    const base: BlogBlock = { id: makeBlockId(), type, status: 'warning', warningText: 'New block added — review and edit content.' };
    switch (type) {
      case 'hero':       Object.assign(base, { heroTag: 'Blog post', heroTitle: 'New blog header', heroSubtitle: 'Add a clear summary for this article.' }); break;
      case 'heading':    Object.assign(base, { level: 2, headingText: 'New section heading' }); break;
      case 'paragraph':  Object.assign(base, { body: 'Write your paragraph content here.' }); break;
      case 'bullets':    Object.assign(base, { items: ['First point', 'Second point', 'Third point'] }); break;
      case 'image':      Object.assign(base, { alt: 'Image', caption: 'Add a caption for this image' }); break;
      case 'callout':    Object.assign(base, { calloutVariant: 'info', calloutTitle: 'Key point', calloutText: 'Add your callout content here.' }); break;
      case 'quote':      Object.assign(base, { quoteText: 'Add a compelling quote here.', quoteAuthor: 'Source' }); break;
      default: break;
    }
    setBlocks(prev => [...prev, base]);
  }, [setBlocks, addFaqSection]);

  const insertSavedBlock = useCallback((block: SavedBlock) => {
    const section: FaqSectionData = {
      id: `${block.id}-${Date.now()}`,
      title: block.preview.title || block.name,
      questions: block.preview.snippets.map((question, index) => ({
        id: `saved-q-${Date.now()}-${index}`,
        question,
        answer: 'Review and update this saved answer for the current blog post.',
      })),
    };
    addFaqSection(section);
  }, [addFaqSection]);

  const handleReorderBlocks = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setBlocks(prev => {
      const fromIdx = prev.findIndex(b => b.id === draggedId);
      const toIdx = prev.findIndex(b => b.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
    setDraggingBlockId(null);
    setDragOverBlockId(null);
  }, [setBlocks]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('application/blog-add-block') as BlockType | '';
    if (blockType) addBlock(blockType);
  }, [addBlock]);

  const handleItemFixed = useCallback((bump: number) => {
    setPanelBump(p => p + bump);
  }, []);

  const handleFixAll = useCallback(() => {
    setFixingAll(true);
    setTimeout(() => {
      setBlocks(prev => prev.map(b =>
        b.status !== 'ready'
          ? { ...b, status: 'ready' as const, warningText: undefined }
          : b,
      ));
      setFixingAll(false);
    }, 1800);
  }, [setBlocks]);

  return (
    <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2 animate-in fade-in duration-150">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background animate-in fade-in slide-in-from-left-6 fill-mode-both"
        style={{ width: 300, animationDuration: '400ms', animationDelay: '0ms' }}
      >
        <div className="flex-none px-4 py-2 border-b border-border">
          <SegmentedToggle
            ariaLabel="Blog panel mode"
            items={LEFT_TAB_ITEMS}
            value={leftTab}
            onChange={setLeftTab}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {leftTab === 'ai' ? (
            <AiCopilot
              editorContext="editing"
              initialContentType="blog"
              wizardSummary={generationLabel}
            />
          ) : (
            <BlogManualContent
              onAddBlock={addBlock}
              onDropFaqSection={addFaqSection}
              onInsertSavedBlock={insertSavedBlock}
            />
          )}
        </div>
      </div>

      {/* ── Center canvas ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-w-0 flex-col gap-2">
        <div
          className="animate-in fade-in slide-in-from-top-2 fill-mode-both"
          style={{ animationDuration: '300ms', animationDelay: '80ms' }}
        >
          <CanvasEditorTopBar
            score={finalScore}
            scoreLabel="Content score"
            hideScore
            scorePanelOpen={scorePanelOpen}
            onScoreClick={() => { setScorePanelOpen(v => !v); setCommentsOpen(false); }}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomChange={setZoom}
            onVersionHistory={onVersionHistory}
            onActivity={() => { setActivityOpen(v => !v); setScorePanelOpen(false); setCommentsOpen(false); }}
            onChat={() => { setCommentsOpen(v => !v); setScorePanelOpen(false); setActivityOpen(false); }}
          />
        </div>

        {richTextVisible && (
          <div className="relative z-10 animate-in fade-in slide-in-from-top-1 duration-150 fill-mode-both">
            <EditorChromeToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              zoom={zoom}
              onZoomOut={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              onZoomIn={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))}
              richTextVisible={true}
              canvasPosition={canvasToolbarPosition}
              richTextPosition={richTextPosition}
              inlineMode
              mode="blog"
            />
          </div>
        )}

        <div
          ref={canvasRef}
          className="relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-transparent"
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={handleCanvasDrop}
        >

          {/* Blog card container — padding stays fixed, only the card scales */}
          <div className="px-8 py-6 pb-10">
            <div style={{ zoom }}>
              <div
                className="rounded-xl bg-background animate-in fade-in zoom-in-95 fill-mode-both"
                style={{ animationDuration: '380ms', animationDelay: '160ms' }}
              >

                {/* Block list */}
                <div>
                  {(() => {
                    let runningFaqIndex = 0;
                    return blocks.map((block, idx) => {
                      const faqIndex = block.type === 'faq-item' ? runningFaqIndex++ : undefined;
                      return (
                        <BlockRow
                          key={block.id}
                          block={block}
                          index={idx}
                          total={blocks.length}
                          faqIndex={faqIndex}
                          onUpdate={patch => updateBlock(block.id, patch)}
                          onDelete={() => deleteBlock(block.id)}
                          onMoveUp={() => moveBlock(block.id, 'up')}
                          onMoveDown={() => moveBlock(block.id, 'down')}
                          fixingAll={fixingAll}
                          entranceDelay={260 + idx * 60}
                          isDragging={draggingBlockId === block.id}
                          isDragOver={dragOverBlockId === block.id}
                          onDragStart={() => setDraggingBlockId(block.id)}
                          onDragOver={e => { e.preventDefault(); setDragOverBlockId(block.id); }}
                          onDrop={e => {
                            e.stopPropagation();
                            const draggedId = e.dataTransfer.getData('application/blog-block-id');
                            if (draggedId) handleReorderBlocks(draggedId, block.id);
                          }}
                          onDragEnd={() => { setDraggingBlockId(null); setDragOverBlockId(null); }}
                          onOpenHeroSettings={block.type === 'hero' ? () => { setHeroSettingsOpen(true); setScorePanelOpen(false); } : undefined}
                        />
                      );
                    });
                  })()}
                </div>

                {/* Add block footer */}
                <div className="px-6 py-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => addBlock('paragraph')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-surface-hover/20 transition-colors"
                  >
                    <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth />
                    Add block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right score panel ─────────────────────────────────────────── */}
      <EditorScorePanel
        open={scorePanelOpen}
        onClose={() => setScorePanelOpen(false)}
        config={blogConfig}
        dimensions={blogConfig.scoreDimensions.map(d =>
          d.label === 'Search Visibility' ? { ...d, score: initialScore ?? d.score } : d
        )}
        score={finalScore}
        onItemFixed={handleItemFixed}
        onFixAll={handleFixAll}
        maxImprovements={initialScore !== undefined ? 1 : undefined}
        improvementSet="blog"
      />

      {/* ── Hero settings panel ───────────────────────────────────────── */}
      {heroSettingsOpen && heroBlock && (
        <HeroSettingsPanel
          block={heroBlock}
          onUpdate={patch => updateBlock(heroBlock.id, patch)}
          onClose={() => setHeroSettingsOpen(false)}
        />
      )}

      {/* ── Comment panel ─────────────────────────────────────────────── */}
      <CommentPanel
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* ── Activity panel ────────────────────────────────────────────── */}
      <ContentActivityDrawer
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        contentType="blog"
      />
    </div>
  );
}
