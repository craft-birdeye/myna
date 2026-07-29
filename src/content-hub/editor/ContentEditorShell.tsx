/**
 * ContentEditorShell
 *
 * The ONE unified shell for all content creation and editing.
 * Replaces: BlogEditor, EmailEditor, SocialEditor, FAQEditor,
 *           InfiniteCanvas, ProjectGenerationCanvas, UnifiedReviewCanvas,
 *           and the NewProjectBrief screen.
 *
 * Two levels:
 *  - level="project"  multi-content canvas (blog + social + email + FAQ + …)
 *  - level="item"     single-content deep editor (drill down from a card)
 *
 * Layout:
 *  ┌──────────────────────────────────────────────────────────────────┐
 *  │ Header: ← name  [Draft ▾]  brand · N locations  [Publish▾]  [⋮] │
 *  ├────────────┬─────────────────────────────────────┬───────────────┤
 *  │ Left panel │         Center canvas               │  Score panel  │
 *  │  280px     │  scrollable, flex-1                 │  272px (lazy) │
 *  └────────────┴─────────────────────────────────────┴───────────────┘
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { AIIcon } from '@/assets/icons/AIIcon';
import {
  ArrowLeft, ChevronDown, ChevronLeft, Sparkles, Edit2,
  FileText, Share2, Mail, MessageSquare, Monitor, Video, FolderPlus,
  Plus, ChevronUp, Grid, List, Calendar, ZoomIn, ZoomOut,
  Undo2, Redo2, ArrowDown, ArrowRight, CheckCircle2, MoreVertical,
  Activity, History, MessageCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/contenthub-ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/contenthub-ui/dialog';

import { cn } from '@/contenthub-ui/utils';
import { AiCopilot } from '../AiCopilot';
import { EditorContentCard, type ContentCardData, type CardStatus } from './EditorContentCard';
import { EditorScorePanel } from './EditorScorePanel';
import { ManualPanel } from './EditorLeftPanel';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import { BlockCanvas, type CanvasBlockInfo } from './BlockCanvas';
import { BlockEditorProvider } from './BlockEditorContext';
import { BlockLibraryPanel } from './BlockLibraryPanel';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { InlineCreationFlow } from '../inline/InlineCreationFlow';
import type { InlineFlowData } from '../inline/InlineCreationFlow';
import type { GenerationInfo } from '../wizard/wizardTypes';
import { FAQInlineCreationFlow } from '../faq/FAQInlineCreationFlow';
import type { FAQFlowData, FlowNavControls, FlowNavState } from '../faq/FAQInlineCreationFlow';
import { Button } from '@/contenthub-ui/button';
import { Badge } from '@/contenthub-ui/badge';
import { FAQSectionCanvas } from '../faq/FAQSectionCanvas';
import { FAQGenerationProgress } from '../faq/FAQGenerationProgress';
import { FAQPublishModal } from '../faq/FAQPublishModal';
import { FAQSendForApprovalModal } from '../faq/FAQSendForApprovalModal';
import { addSavedBlock } from '../shared/savedBlocksStore';
import { BlogPublishModal } from '../blog/BlogPublishModal';
import { BlogMetaPanel } from '../blog/BlogMetaPanel';
import { BlogInlineCreationFlow } from '../blog/BlogInlineCreationFlow';
import type { BlogFlowData } from '../blog/BlogInlineCreationFlow';
// ProjectInlineCreationFlow replaced by InlineCreationFlow mode="project"
import { BlogGenerationProgress } from '../blog/BlogGenerationProgress';
import { BlogSectionCanvas } from '../blog/BlogSectionCanvas';
import { ProjectGenerationProgress } from '../ProjectGenerationProgress';
import { ContentFlowStepper, type ContentFlowStep } from '../shared/ContentFlowControls';
import { CanvasEditorTopBar, ScoreProgressRing } from '../shared/CanvasEditorTopBar';
import { ContentShareModal } from '../shared/ContentShareModal';
import { ContentActivityDrawer } from '../shared/ContentActivityDrawer';
import { ContentVersionHistory } from '../shared/ContentVersionHistory';
import { CommentPanel } from './CommentPanel';
import { type Block as EditorBlock } from './blockTypes';
// Note: FAQCanvas is kept for the project review canvas path (UnifiedReviewCanvas)
import {
  type ContentMode,
  type ContentItemType,
  type EditorTemplate,
  type ScoreDimension,
  EDITOR_CONFIGS,
  ITEM_TYPE_LABEL,
  ITEM_TYPE_ICON,
} from './editorConfig';

/** Modes that use the block-based WYSIWYG canvas */
const BLOCK_MODES = new Set<ContentMode>(['blog', 'landing', 'faq']);

function scoreColorFor(value: number): ScoreDimension['color'] {
  if (value >= 80) return 'green';
  if (value >= 60) return 'orange';
  return 'red';
}

const BLOG_DIM_META: { label: string; description: string }[] = [
  { label: 'Intent Match',
    description: 'Measures how directly the content delivers on its title, topic, and the reader\'s search intent.' },
  { label: 'Search Visibility',
    description: 'Evaluates how well the content is optimized to be surfaced by Google and AI search engines, covering keyword integration, query coverage, and internal linking.' },
  { label: 'Content Depth',
    description: 'Assesses whether the content has real substance, a clear point of view, and brand-specific detail rather than generic filler.' },
  { label: 'Brand Alignment',
    description: 'Checks that tone, terminology, differentiators, and calls to action are consistent with your brand voice and positioning.' },
  { label: 'Publishing Readiness',
    description: 'A compliance gate that flags unsupported claims, missing disclaimers, and banned words. Scores below 70 block publishing regardless of other scores.' },
];

function buildBlogScoreDimensions(overallScore: number): ScoreDimension[] {
  const s = Math.max(0, Math.min(100, Math.round(overallScore)));
  const offsets = [1, -3, 2, 3, -4];
  return BLOG_DIM_META.map(({ label, description }, i) => {
    const v = Math.max(0, Math.min(100, s + offsets[i]));
    return { label, description, score: v, color: scoreColorFor(v) };
  });
}

const BRAND_KIT_LABELS: Record<string, string> = {
  'olive-garden':  'Olive Garden corporate',
  'birdeye-demo':  'Birdeye demo brand',
  'local-seo':     'Local SEO identity',
};
const CARD_CANVAS_GAP = 100;
const CARD_CANVAS_PADDING = 120;
const DEFAULT_CARD_WIDTH = 520;
const DEFAULT_CARD_HEIGHT = 520;
const CARD_MIN_WIDTH = 360;
const CARD_MIN_HEIGHT = 260;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContentEditorShellProps {
  /** Which mode was used to open the editor */
  mode: ContentMode;
  /** 'project' = multi-card canvas; 'item' = single-content editor */
  level?: 'project' | 'item';
  /** Back navigation callback */
  onBack: () => void;
  /** Skip the setup wizard and land directly on the generation loading screen (e.g. from Recommendations) */
  skipSetupPhase?: boolean;
  /** Override the default title shown in the editor header */
  initialTitle?: string;
  /** Pre-loaded FAQ Q&As from a recommendation — populates the FAQ canvas directly */
  preloadedFAQs?: { question: string; answer: string }[];
  /** Pre-loaded blog sections from the recommendation preview — populates the blog canvas directly */
  preloadedBlogSections?: { heading?: string; body?: string; listItems?: string[]; image?: string; imageAlt?: string }[];
  /** AEO score from the recommendation — seeds the content score in the editor */
  recAeoScore?: number;
  /** Hide brand/location context in the header for recommendation-driven review flows */
  hideHeaderContext?: boolean;
  /** Pre-populated blog flow data from CreateBlogPage — retained for settings edit */
  initialBlogFlowData?: Partial<BlogFlowData>;
}

interface CanvasCardLayout {
  x: number;
  y: number;
  width: number;
  height?: number;
}

type ResizeEdge = 'top' | 'right' | 'bottom' | 'left';

// ── Default FAQ flow data used when skipping the setup wizard ────────────────

const DEFAULT_REC_FAQ_FLOW_DATA: FAQFlowData = {
  contentName: '',
  brandKit: 'olive-garden',
  locations: ['loc-1001', 'loc-1002', 'loc-1003', 'loc-1004', 'loc-1005', 'loc-1006', 'loc-1007', 'loc-1008', 'loc-1009', 'loc-1010', 'loc-1011', 'loc-1012', 'loc-1013', 'loc-1014', 'loc-1015', 'loc-1016', 'loc-1017', 'loc-1018', 'loc-1019', 'loc-1020'],
  template: 'aeo',
  customAgent: 'on-demand',
  sourceUrl: '',
  additionalContext: '',
  questionCount: 14,
  signalSources: ['reviews', 'website'],
  attachments: [],
  sections: [
    { id: 'sec-rec-1', title: 'General questions',        description: '', count: 5 },
    { id: 'sec-rec-2', title: 'Pricing and appointments', description: '', count: 5 },
    { id: 'sec-rec-3', title: 'Special cases',            description: '', count: 4 },
  ],
};

const DEFAULT_REC_BLOG_FLOW_DATA: BlogFlowData = {
  contentName: '',
  brandKit: 'olive-garden',
  locations: ['loc-1001', 'loc-1002', 'loc-1003', 'loc-1004', 'loc-1005', 'loc-1006', 'loc-1007', 'loc-1008', 'loc-1009', 'loc-1010', 'loc-1011', 'loc-1012', 'loc-1013', 'loc-1014', 'loc-1015', 'loc-1016', 'loc-1017', 'loc-1018', 'loc-1019', 'loc-1020'],
  agentId: 'blog-default',
  topic: 'Are dental implants right for you?',
  keywords: ['dental implants', 'tooth replacement', 'implant candidacy', 'dental implant cost'],
  intent: 'agent',
  objective: 'agent',
  funnelStage: 'agent',
  length: 'long',
  signalSources: [],
  publishTo: [],
  attachments: [],
  blogCount: 1,
  sections: [
    { id: 'blog-sec-1', heading: 'What are dental implants?',             description: 'How implants work, what they are made of, and why they are the gold standard for tooth replacement', wordCount: 300 },
    { id: 'blog-sec-2', heading: 'Who is a good candidate?',              description: 'Bone density, gum health, medical history — what dentists assess before recommending implants', wordCount: 350 },
    { id: 'blog-sec-3', heading: 'The implant process step by step',      description: 'From consultation and bone grafting to placing the crown — a clear timeline patients can expect', wordCount: 400 },
    { id: 'blog-sec-4', heading: 'Implants vs bridges vs dentures',       description: 'Comparing long-term cost, comfort, maintenance, and aesthetics across the main replacement options', wordCount: 400 },
    { id: 'blog-sec-5', heading: 'Book a consultation',                   description: 'How to take the first step and what to expect at your initial implant assessment', wordCount: 300 },
  ],
};

const DEFAULT_SEARCH_AI_BLOG_TITLE = 'Are dental implants right for you?';
const DEFAULT_SEARCH_AI_BLOG_HERO_IMAGE = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=80';
const DEFAULT_SEARCH_AI_BLOG_SECTIONS: NonNullable<ContentEditorShellProps['preloadedBlogSections']> = [
  {
    body: "Dental implants have transformed how dentists replace missing teeth — offering a permanent, natural-looking solution that preserves jaw bone and doesn't affect neighbouring teeth. But they aren't right for everyone, and understanding the process, costs, and candidacy requirements is essential before committing. This guide covers everything you need to know to make an informed decision.",
  },
  {
    heading: 'What Are Dental Implants?',
    body: 'A dental implant is a small titanium post surgically placed into the jaw bone, acting as an artificial tooth root. Once the implant integrates with the bone over several months, a custom crown is attached on top, creating a result that looks, feels, and functions like a natural tooth.',
    listItems: [
      'Titanium implants are biocompatible — the jaw bone fuses to them through a process called osseointegration',
      'A single implant can replace one tooth; implant-supported bridges or dentures can replace multiple teeth',
      'Implants preserve bone that would otherwise resorb after tooth loss, maintaining facial structure over time',
      'With proper care, the implant post can last a lifetime — only the crown may need replacing after 15–20 years',
    ],
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=80',
    imageAlt: 'Dental implant model showing titanium post and crown',
  },
  {
    heading: 'Who Is a Good Candidate for Dental Implants?',
    body: 'Most healthy adults are potential candidates, but successful implants depend on a few key factors your dentist will assess at a consultation. Some patients need preparatory treatment first — which adds time but does not rule out implants.',
    listItems: [
      'Sufficient jaw bone density is required to anchor the implant — a bone graft can address deficiencies if needed',
      'Healthy gums are essential — active gum disease must be treated and resolved before implant placement',
      'Non-smokers and well-controlled diabetics have significantly higher implant success rates',
      'Young patients whose jaw bone is still developing are generally not candidates until growth is complete',
    ],
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=80',
    imageAlt: 'Dentist reviewing dental x-ray with patient',
  },
  {
    heading: 'The Implant Process: What to Expect',
    body: 'Dental implant treatment is typically completed over several months, allowing time for the implant to integrate with the bone before the final crown is placed. Understanding each stage helps patients plan and commit to the timeline confidently.',
    listItems: [
      'Initial consultation: x-rays, bone assessment, and a full treatment plan with itemised costs',
      'Implant placement surgery: performed under local anaesthetic — most patients return to work the next day',
      'Healing period: osseointegration takes 3–6 months; a temporary crown may be placed during this time',
      'Crown placement: the permanent custom crown is fitted once integration is confirmed, completing the restoration',
    ],
  },
  {
    heading: 'Implants vs Bridges vs Dentures',
    body: 'Each tooth replacement option has different trade-offs around cost, comfort, longevity, and maintenance. Implants have the highest upfront cost but the lowest long-term maintenance and the best preservation of oral health.',
    listItems: [
      'Implants: highest upfront cost, longest lifespan, no impact on adjacent teeth, preserves bone',
      'Bridges: lower initial cost, faster treatment, but requires grinding down healthy neighbouring teeth',
      'Dentures: most affordable entry point, removable, but can shift over time and do not prevent bone loss',
      'Over 10–15 years, implants often prove the most cost-effective option when maintenance and replacements are factored in',
    ],
  },
  {
    heading: 'Book Your Implant Consultation',
    body: 'The best way to find out if dental implants are right for you is to book a consultation with our implant team. We will review your x-rays, assess your bone and gum health, and provide a clear treatment plan and cost estimate — with no obligation to proceed. Most patients leave knowing exactly what is involved and feeling confident about their next step.',
  },
  {
    heading: 'Frequently Asked Questions',
    body: '',
  },
  {
    heading: 'Am I a good candidate for dental implants?',
    body: 'Most adults in good general health with sufficient jaw bone density are candidates. Key factors include non-smoking status, controlled blood sugar, and healthy gums. Your dentist will assess bone volume and oral health at a consultation — some patients need a bone graft first, which adds time but does not rule out implants.',
  },
  {
    heading: 'How long do dental implants last?',
    body: 'With proper care, the titanium implant post can last a lifetime. The crown placed on top typically lasts 10–20 years before it may need replacing due to normal wear. Good brushing, flossing, and regular dental check-ups are the biggest factors in long-term implant success.',
  },
  {
    heading: 'Do dental implants hurt?',
    body: 'The procedure is performed under local anaesthetic, so you will not feel pain during surgery. Most patients report mild soreness and swelling for a few days afterwards, managed with over-the-counter pain relief. The discomfort is generally less than patients expect.',
  },
  {
    heading: 'How much do dental implants cost?',
    body: 'A single implant including the crown typically ranges from $3,000 to $6,500 in Australia depending on complexity and location. Some health funds offer partial cover under major dental extras. Your dentist will provide a detailed treatment plan and itemised quote at your consultation.',
  },
  {
    heading: 'How long does the full implant process take?',
    body: 'From initial consultation to final crown placement, most implant cases take 4–8 months. Cases requiring bone grafting may take longer. Your dentist will give you a personalised timeline at your first appointment so you can plan accordingly.',
  },
];

function isUsefulBlogTitle(title?: string) {
  if (!title) return false;
  const normalized = title.trim();
  if (!normalized || /^new blog post$/i.test(normalized)) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  return normalized.length >= 18 && words.length >= 3;
}

function createEditorBlock(
  id: string,
  type: EditorBlock['type'],
  content: Record<string, unknown>,
): EditorBlock {
  return {
    id,
    type,
    content,
    style: {},
    behavior: {},
    settings: {
      alignment: 'left',
      width: 'contained',
      visibility: { desktop: true, tablet: true, mobile: true },
    },
  };
}

function buildBlogEditorBlocks({
  title,
  sections,
  preloadedSections,
}: {
  title?: string;
  sections: BlogFlowData['sections'];
  preloadedSections?: ContentEditorShellProps['preloadedBlogSections'];
}): EditorBlock[] {
  const hasPreloadedSections = (preloadedSections?.length ?? 0) > 0;
  const articleTitle = isUsefulBlogTitle(title) ? title!.trim().split('\n')[0].trim() : DEFAULT_SEARCH_AI_BLOG_TITLE;
  const today = new Date().toISOString().split('T')[0];
  const contentSections = hasPreloadedSections ? preloadedSections! : DEFAULT_SEARCH_AI_BLOG_SECTIONS;

  // Article title as H1
  const blocks: EditorBlock[] = [
    createEditorBlock('blog-title', 'heading', { text: articleTitle, level: 'h1' }),
    createEditorBlock('blog-author', 'author-bar', {
      name: 'Birdeye AI',
      date: today,
      readingTime: '15 min read',
      tags: ['AI search', 'AEO'],
    }),
    createEditorBlock('blog-hero-image', 'image', {
      src: DEFAULT_SEARCH_AI_BLOG_HERO_IMAGE,
      alt: articleTitle,
      caption: '',
    }),
  ];

  // Split content sections from FAQ Q&As
  let inFaqSection = false;
  const faqSections: typeof contentSections = [];
  const bodySections: typeof contentSections = [];

  contentSections.forEach(section => {
    if (section.heading?.toLowerCase().includes('frequently asked question')) {
      inFaqSection = true;
      return;
    }
    if (inFaqSection) {
      faqSections.push(section);
    } else {
      bodySections.push(section);
    }
  });

  bodySections.forEach((section, index) => {
    const prefix = hasPreloadedSections ? 'blog-preloaded' : 'blog-search-preview';
    if (section.heading) {
      blocks.push(createEditorBlock(`${prefix}-heading-${index}`, 'heading', { text: section.heading, level: 'h2' }));
    }
    if (section.body) {
      blocks.push(createEditorBlock(`${prefix}-paragraph-${index}`, 'paragraph', { text: section.body }));
    }
    if (section.listItems && section.listItems.length > 0) {
      blocks.push(createEditorBlock(`${prefix}-list-${index}`, 'list', { items: section.listItems, ordered: false }));
    }
    if (section.image) {
      blocks.push(createEditorBlock(`${prefix}-image-${index}`, 'image', {
        src: section.image,
        alt: section.imageAlt ?? section.heading ?? '',
        caption: '',
      }));
    }
  });

  // FAQ section at the bottom
  const faqItems = faqSections.filter(s => s.heading && s.body);
  if (faqItems.length > 0) {
    blocks.push(createEditorBlock('blog-faq-heading', 'heading', { text: 'Frequently Asked Questions', level: 'h2' }));
    faqItems.forEach((section, index) => {
      blocks.push(createEditorBlock(`blog-faq-q-${index}`, 'heading', { text: section.heading!, level: 'h3' }));
      blocks.push(createEditorBlock(`blog-faq-a-${index}`, 'paragraph', { text: section.body! }));
    });
  }

  // Fallback FAQs when no preloaded FAQ data
  if (faqItems.length === 0) {
    blocks.push(createEditorBlock('blog-faq-heading', 'heading', { text: 'Frequently Asked Questions', level: 'h2' }));
    [
      { q: 'What is the difference between SEO and AI search optimization?', a: 'SEO improves your position in a ranked list of links. AI search optimization — often called AEO — focuses on being selected and cited in a single synthesized answer. The goal shifts from ranking on page one to being the source an AI platform trusts and cites.' },
      { q: 'Which AI platforms should I optimize for?', a: 'The three platforms with the highest query volume in 2026 are ChatGPT, Gemini, and Perplexity. Each uses slightly different citation signals, but the fundamentals — complete profiles, structured content, and consistent citations — apply to all three.' },
      { q: 'What content types perform best in AI search?', a: 'FAQ pages, location-specific service pages, pricing pages, and comparison content consistently outperform generic brand copy. Content written to directly answer customer questions is cited more often than promotional copy.' },
      { q: 'How do reviews influence AI-generated answers?', a: 'Reviews act as trust signals. LLMs analyze overall ratings, sentiment consistency, and the specificity of review content to validate brand recommendations. A business with a high volume of detailed, positive reviews is cited more often than one with sparse or mixed feedback.' },
    ].forEach(({ q, a }, i) => {
      blocks.push(createEditorBlock(`blog-faq-q-${i}`, 'heading', { text: q, level: 'h3' }));
      blocks.push(createEditorBlock(`blog-faq-a-${i}`, 'paragraph', { text: a }));
    });
  }

  return blocks;
}


// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  FolderPlus, FileText, Share2, Mail, MessageSquare, Monitor, Video,
};

const SETUP_STEPS_BY_MODE: Record<ContentMode, ContentFlowStep[]> = {
  project: [
    { id: 'brand-kit', label: 'Brand identity' },
    { id: 'setup', label: 'Project setup' },
    { id: 'content-brief', label: 'Content brief' },
  ],
  faq: [
    { id: 'brand-kit', label: 'Brand identity' },
    { id: 'setup', label: 'Content setup' },
  ],
  blog: [
    { id: 'brand-kit', label: 'Brand identity' },
    { id: 'setup', label: 'Blog setup' },
  ],
  landing: [
    { id: 'goal', label: 'Goal' },
    { id: 'template', label: 'Template' },
    { id: 'fine-tune', label: 'Fine-tune' },
    { id: 'content-brief', label: 'Content brief' },
  ],
  social: [],
  email: [],
  video: [],
};

// ── Left panel tab items ──────────────────────────────────────────────────────

const LEFT_TAB_ITEMS = [
  {
    value: 'ai'     as const,
    label: 'AI',
    icon:  <AIIcon size={20} />,
  },
  { value: 'manual' as const, label: 'Manual' },
];

// ── Mock seed data per content type ──────────────────────────────────────────

function makeMockCard(itemType: ContentItemType, idx: number): ContentCardData {
  const typeScore: Record<ContentItemType, number> = {
    blog: 87, social: 82, email: 85, faq: 79, landing: 76, video: 80,
  };
  const names: Record<ContentItemType, string> = {
    blog:    'How local businesses are winning with AI-powered review responses',
    social:  'Spring outdoor seating announcement',
    email:   'Your table is waiting this spring',
    faq:     'Frequently asked questions — Olive Garden',
    landing: 'Spring dining experience landing page',
    video:   'Behind the scenes — Olive Garden kitchen',
  };
  return {
    id: `${itemType}-${idx}`,
    itemType,
    name: idx === 0 ? names[itemType] : `${ITEM_TYPE_LABEL[itemType]} #${idx + 1}`,
    status: (idx === 0 ? 'Ready' : 'Draft') as CardStatus,
    score: typeScore[itemType] - (idx * 4),
    approved: false,
  };
}

function defaultCardSize(itemType: ContentItemType): Pick<CanvasCardLayout, 'width' | 'height'> {
  if (itemType === 'blog') return { width: 560, height: 640 };
  if (itemType === 'landing') return { width: 560, height: 680 };
  if (itemType === 'email') return { width: 560, height: 420 };
  if (itemType === 'social') return { width: 480, height: 560 };
  return { width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT };
}

function arrangeCardLayouts(
  cards: ContentCardData[],
  direction: 'vertical' | 'horizontal',
  existing: Record<string, CanvasCardLayout> = {},
  measuredHeights: Record<string, number> = {},
): Record<string, CanvasCardLayout> {
  let cursorX = CARD_CANVAS_PADDING;
  let cursorY = CARD_CANVAS_PADDING;

  return cards.reduce<Record<string, CanvasCardLayout>>((layouts, card) => {
    const size = existing[card.id] ?? defaultCardSize(card.itemType);
    const measuredHeight = measuredHeights[card.id] ?? defaultCardSize(card.itemType).height;
    layouts[card.id] = {
      x: cursorX,
      y: cursorY,
      width: size.width,
      height: existing[card.id]?.height,
    };

    if (direction === 'horizontal') cursorX += size.width + CARD_CANVAS_GAP;
    else cursorY += Math.max(existing[card.id]?.height ?? 0, measuredHeight) + CARD_CANVAS_GAP;

    return layouts;
  }, {});
}

/** For project mode, generate cards from selected content types */
function generateProjectCards(answers: Record<string, string | string[]>): ContentCardData[] {
  const selected = answers['content_types'];
  const typeMap: Record<string, ContentItemType> = {
    'Blog post': 'blog',
    'Social post': 'social',
    'Email campaign': 'email',
    'FAQ page': 'faq',
    'Landing page': 'landing',
    'Video post': 'video',
  };

  let types: ContentItemType[];
  if (Array.isArray(selected) && selected.length > 0) {
    types = selected.map(s => typeMap[s]).filter(Boolean) as ContentItemType[];
  } else {
    types = ['blog', 'social', 'email', 'faq'];
  }

  return types.map((type, i) => makeMockCard(type, i));
}

/** For single content-type modes, seed one card */
function seedSingleCard(mode: ContentMode): ContentCardData[] {
  if (mode === 'project') return [];
  return [makeMockCard(mode as ContentItemType, 0)];
}

// ── Left panel skeleton (shown while FAQ is generating) ──────────────────────

function LeftPanelSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-background" style={{ width: 300 }}>
      {/* Tab bar skeleton */}
      <div className="flex-none px-4 py-2 border-b border-border">
        <div className="flex gap-1 bg-muted rounded-lg p-1 animate-pulse">
          <div className="flex-1 h-7 rounded-md bg-background" />
          <div className="flex-1 h-7 rounded-md bg-muted/60" />
        </div>
      </div>

      {/* Chat messages skeleton */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 flex flex-col gap-4">
        {/* AI message */}
        <div className="flex gap-2 animate-pulse" style={{ animationDelay: '0s' }}>
          <div className="size-6 rounded-full bg-primary/20 flex-none mt-0.5" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 w-5/6 rounded-full bg-muted" />
            <div className="h-3 w-4/5 rounded-full bg-muted" />
            <div className="h-3 w-3/5 rounded-full bg-muted" />
          </div>
        </div>
        {/* User message */}
        <div className="flex gap-2 justify-end animate-pulse" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col gap-2 items-end" style={{ maxWidth: '80%' }}>
            <div className="h-[34px] w-full rounded-lg bg-muted" />
          </div>
          <div className="size-6 rounded-full bg-muted flex-none mt-0.5" />
        </div>
        {/* AI message 2 */}
        <div className="flex gap-2 animate-pulse" style={{ animationDelay: '0.2s' }}>
          <div className="size-6 rounded-full bg-primary/20 flex-none mt-0.5" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-4/6 rounded-full bg-muted" />
          </div>
        </div>
        {/* Typing indicator */}
        <div className="flex gap-2 animate-pulse" style={{ animationDelay: '0.3s' }}>
          <div className="size-6 rounded-full bg-primary/20 flex-none mt-0.5" />
          <div className="flex items-center gap-1 px-2 py-2 rounded-lg bg-muted h-[34px] w-16">
            <div className="size-1.5 rounded-full bg-muted-foreground/40" />
            <div className="size-1.5 rounded-full bg-muted-foreground/40" />
            <div className="size-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
      </div>

      {/* Prompt input skeleton */}
      <div className="flex-none px-4 py-2 border-t border-border animate-pulse">
        <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
          <div className="h-3 w-3/4 rounded-full bg-muted" />
          <div className="h-3 w-2/5 rounded-full bg-muted/60" />
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1.5">
              <div className="size-6 rounded-md bg-muted" />
              <div className="size-6 rounded-md bg-muted" />
              <div className="size-6 rounded-md bg-muted" />
            </div>
            <div className="size-6 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ScorePanelSkeleton() {
  return (
    <div className="flex h-full flex-none flex-col overflow-hidden rounded-xl border border-border/60 bg-background animate-pulse" style={{ width: 300 }}>
      <div className="flex-none border-b border-border px-4 py-4">
        <div className="h-4 w-32 rounded-full bg-muted" />
      </div>
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-14 w-28 rounded-lg bg-muted" />
            <div className="h-3 w-36 rounded-full bg-muted" />
            <div className="h-2 w-full rounded-full bg-muted" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="border-t border-border pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-4 w-28 rounded-full bg-muted" />
                  <div className="h-4 w-12 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded-full bg-muted" />
              <div className="h-4 w-10 rounded-full bg-muted" />
            </div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="h-4 w-36 rounded-full bg-muted" />
                  <div className="h-4 w-10 rounded-full bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-muted" />
                  <div className="h-3 w-4/5 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Canvas shimmer (used for quick rec→editor transitions) ───────────────────

function CanvasShimmer({ mode }: { mode: 'faq' | 'blog' }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--color-canvas,#F7F8FA)] flex items-start justify-center px-8 py-8">
      <div className="w-full max-w-[1040px] rounded-xl bg-background shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-[0.5px] ring-border/20 px-[30px] pt-[30px] pb-14 animate-pulse">
        {mode === 'faq' ? (
          <>
            {/* Info bar */}
            <div className="flex items-center gap-2 mb-8 pb-5 border-b border-border/40">
              <div className="h-3 w-48 rounded-full bg-muted" />
              <div className="h-3 w-24 rounded-full bg-muted/60" />
            </div>
            {/* FAQ rows */}
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-4 py-5 border-b border-border/30 last:border-0" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="h-7 w-7 rounded-full bg-muted flex-none mt-0.5" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="h-6 w-4/5 rounded-lg bg-muted" />
                  <div className="h-4 w-full rounded-full bg-muted/60" />
                  <div className="h-4 w-3/4 rounded-full bg-muted/50" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Blog title */}
            <div className="mb-8 pb-6 border-b border-border/40">
              <div className="h-[34px] w-2/3 rounded-lg bg-muted mb-3" />
              <div className="h-4 w-1/2 rounded-full bg-muted/60" />
            </div>
            {/* Blog sections */}
            {[0, 1, 2].map(i => (
              <div key={i} className="mb-8" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="h-6 w-1/3 rounded-lg bg-muted mb-4" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-full rounded-full bg-muted/60" />
                  <div className="h-4 w-11/12 rounded-full bg-muted/50" />
                  <div className="h-4 w-4/5 rounded-full bg-muted/40" />
                  <div className="h-4 w-full rounded-full bg-muted/60 mt-1" />
                  <div className="h-4 w-3/4 rounded-full bg-muted/50" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Generating skeleton ───────────────────────────────────────────────────────

function GeneratingSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-primary animate-pulse" />
        <span className="text-[13px] text-foreground">Generating your content…</span>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-background overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <div className="h-12 border-b border-border bg-muted/40 px-4 flex items-center gap-2">
            <div className="size-6 rounded-md bg-muted" />
            <div className="h-3 w-48 rounded-full bg-muted" />
          </div>
          <div className="px-6 py-6 space-y-3">
            <div className="h-4 w-3/4 rounded-full bg-muted" />
            <div className="h-3 w-full rounded-full bg-muted" />
            <div className="h-3 w-5/6 rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Editor mockup illustration ────────────────────────────────────────────────

function EditorIllustration() {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer card */}
      <rect x="4" y="4" width="212" height="152" rx="10" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1"/>
      {/* Left panel */}
      <rect x="12" y="12" width="68" height="136" rx="6" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.75"/>
      {/* AI+ badge in left panel */}
      <rect x="18" y="18" width="24" height="10" rx="3" fill="hsl(var(--primary) / 0.15)"/>
      <text x="30" y="26" textAnchor="middle" fontSize="6" fontWeight="700" fill="hsl(var(--primary))">AI+</text>
      {/* Left panel text lines */}
      <rect x="18" y="32" width="55" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.25)"/>
      <rect x="18" y="39" width="48" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.15)"/>
      {/* Chip buttons in left panel */}
      <rect x="18" y="48" width="52" height="10" rx="3" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.75"/>
      <rect x="18" y="62" width="42" height="10" rx="3" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.75"/>
      <rect x="18" y="76" width="48" height="10" rx="3" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.75"/>
      {/* Text input in left panel */}
      <rect x="18" y="116" width="56" height="26" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.75"/>
      <rect x="22" y="121" width="36" height="2.5" rx="1.25" fill="hsl(var(--muted-foreground) / 0.2)"/>
      <rect x="22" y="127" width="28" height="2.5" rx="1.25" fill="hsl(var(--muted-foreground) / 0.12)"/>
      {/* Right / canvas panel */}
      <rect x="88" y="12" width="124" height="136" rx="6" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="0.75"/>
      {/* Image placeholder */}
      <rect x="94" y="18" width="112" height="52" rx="4" fill="hsl(var(--primary) / 0.08)"/>
      <rect x="136" y="36" width="28" height="3" rx="1.5" fill="hsl(var(--primary) / 0.2)"/>
      <rect x="130" y="43" width="40" height="3" rx="1.5" fill="hsl(var(--primary) / 0.12)"/>
      {/* Content lines */}
      <rect x="94" y="78" width="112" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.2)"/>
      <rect x="94" y="85" width="96" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.14)"/>
      <rect x="94" y="92" width="104" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.1)"/>
      <rect x="94" y="104" width="112" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.2)"/>
      <rect x="94" y="111" width="80" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.14)"/>
      {/* Score pill */}
      <rect x="152" y="130" width="50" height="12" rx="6" fill="hsl(var(--primary))"/>
      <rect x="156" y="134" width="30" height="4" rx="2" fill="white" opacity="0.7"/>
    </svg>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onSelect,
}: {
  template: EditorTemplate;
  onSelect: (t: EditorTemplate) => void;
}) {
  // Muted, low-saturation tint for the header strip inside the white frame
  const headerBg = `hsl(${template.hue},30%,55%)`;
  const accentBg = `hsl(${template.hue},25%,92%)`;

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="flex flex-col rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 hover:shadow-card transition-all group text-left w-full"
    >
      {/* Gray container — 20px padding, white screenshot frame inside */}
      <div className="w-full bg-surface-hover p-5 relative overflow-hidden">
        <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm ring-1 ring-black/[0.07]" style={{ height: 120 }}>
          {/* Muted colored header strip */}
          <div className="h-[42px] w-full flex items-center gap-2 px-2.5" style={{ background: headerBg }}>
            {/* Logo circle */}
            <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center shrink-0 text-white" style={{ fontSize: 7 }}>
              {template.title[0]}
            </div>
            <div className="flex flex-col gap-[3px] flex-1">
              <div className="h-[2.5px] w-full bg-white/70 rounded-full" />
              <div className="h-[2px] w-3/4 bg-white/40 rounded-full" />
            </div>
            {/* Emoji top-right */}
            <div className="text-sm leading-none">{template.emoji}</div>
          </div>
          {/* Body lines */}
          <div className="px-2.5 pt-2 pb-1.5 flex flex-col gap-[5px]">
            <div className="h-[3px] w-full bg-border rounded-full" />
            <div className="h-[3px] w-4/5 bg-border rounded-full" />
            <div className="h-[10px] w-full rounded-[3px] mt-0.5" style={{ background: accentBg }} />
            <div className="h-[3px] w-full bg-surface-hover rounded-full" />
            <div className="h-[3px] w-2/3 bg-surface-hover rounded-full" />
          </div>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-surface/0 group-hover:bg-surface/45 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <span className="h-7 px-2 rounded-md bg-primary text-[11px] text-primary-foreground shadow-sm">
            Use template
          </span>
        </div>
      </div>
      {/* Footer */}
      <div className="px-2 py-2.5">
        <p className="text-[12.5px] text-foreground truncate group-hover:text-primary transition-colors">
          {template.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Types: {template.typesLabel}
        </p>
      </div>
    </button>
  );
}

// ── Empty canvas state ────────────────────────────────────────────────────────

const INITIAL_SHOW = 5;

function EmptyCanvas({
  mode,
  onAddCard,
  onSelectTemplate,
}: {
  mode: ContentMode;
  onAddCard: (t: ContentItemType) => void;
  onSelectTemplate: (t: EditorTemplate) => void;
}) {
  const config = EDITOR_CONFIGS[mode];
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const visibleTemplates = showAll ? config.templates : config.templates.slice(0, INITIAL_SHOW);

  return (
    <div className="flex flex-col items-center px-8 py-10 gap-6 min-h-full">
      {/* Illustration */}
      <EditorIllustration />

      {/* Prompt text */}
      <div className="text-center space-y-1">
        <p className="text-[14px] text-foreground">
          Chat with our AI Copilot to generate content for your {mode === 'project' ? 'project' : config.label.toLowerCase()}
        </p>
        <p className="text-[13px] text-muted-foreground">or</p>
        <button
          type="button"
          onClick={() => setLibraryOpen(v => !v)}
          className="text-[13px] text-primary hover:underline flex items-center gap-1 mx-auto"
        >
          Select from library
          {libraryOpen
            ? <ChevronUp size={13} strokeWidth={1.6} absoluteStrokeWidth />
            : <ChevronDown size={13} strokeWidth={1.6} absoluteStrokeWidth />
          }
        </button>
      </div>

      {/* Template cards — 5-column grid */}
      {libraryOpen && (
        <div className="w-full">
          <div className="grid grid-cols-5 gap-2">
            {visibleTemplates.map(t => (
              <TemplateCard key={t.id} template={t} onSelect={onSelectTemplate} />
            ))}
          </div>
          {!showAll && config.templates.length > INITIAL_SHOW && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 text-[13px] text-primary hover:underline mx-auto block"
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add content button (between groups) ──────────────────────────────────────

function AddContentButton({ mode, onAdd }: { mode: ContentMode; onAdd: (t: ContentItemType) => void }) {
  const addable = EDITOR_CONFIGS[mode].addableTypes ?? [];
  if (addable.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 h-[34px] px-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-surface-hover transition-colors text-[12.5px] text-muted-foreground hover:text-foreground mx-auto"
        >
          <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth />
          Add content
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[200px]">
        {addable.map(type => {
          const IconEl = ICON_MAP[ITEM_TYPE_ICON[type]] ?? FileText;
          return (
            <DropdownMenuItem key={type} onClick={() => onAdd(type)} className="gap-2">
              <div className="size-6 rounded-md bg-primary/[0.07] flex items-center justify-center flex-none">
                <IconEl size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/70" />
              </div>
              {ITEM_TYPE_LABEL[type]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export function ContentEditorShell({ mode, level = 'project', onBack, skipSetupPhase = false, initialTitle, preloadedFAQs, preloadedBlogSections, recAeoScore, hideHeaderContext = false, initialBlogFlowData }: ContentEditorShellProps) {
  const config = EDITOR_CONFIGS[mode];

  // ── Header state
  const [title, setTitle] = useState(
    initialTitle ?? (mode === 'project' ? 'New project' : `New ${config.label.toLowerCase()}`)
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // ── Left panel tab state
  const [leftTab, setLeftTab] = useState<'ai' | 'manual'>('ai');
  // ── Left panel collapsed state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // ── Setup phase state (inline flow instead of modal)
  // 'setup'      → InlineCreationFlow fills the canvas, left pane is hidden
  // 'generating' → shimmer cards
  // 'done'       → normal canvas + left pane visible
  const needsSetup = !skipSetupPhase && (BLOCK_MODES.has(mode) || mode === 'project');
  const hasPreloadedContent = (preloadedFAQs?.length ?? 0) > 0 || (preloadedBlogSections?.length ?? 0) > 0;
  type SetupPhase = 'setup' | 'generating' | 'done';
  const [setupPhase, setSetupPhase] = useState<SetupPhase>(
    skipSetupPhase && (mode === 'faq' || mode === 'blog') && !hasPreloadedContent
      ? 'generating'
      : (needsSetup ? 'setup' : 'done')
  );
  // Quick shimmer for rec-to-editor transitions: show skeleton briefly then reveal canvas
  const [isQuickShimmering, setIsQuickShimmering] = useState(skipSetupPhase && hasPreloadedContent);
  useEffect(() => {
    if (!isQuickShimmering) return;
    const t = window.setTimeout(() => setIsQuickShimmering(false), 1000);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [flowData, setFlowData]         = useState<InlineFlowData | null>(null);
  const [generationInfo, setGenerationInfo] = useState<GenerationInfo | null>(
    skipSetupPhase && mode === 'faq'
      ? { label: 'AEO optimized · 14 FAQs · 3 sections', wizardData: null as unknown as import('../wizard/wizardTypes').WizardData }
      : skipSetupPhase && mode === 'blog'
      ? { label: 'SEO + AEO optimized · 1,200 words · 5 sections', wizardData: null as unknown as import('../wizard/wizardTypes').WizardData }
      : null
  );
  const [faqFlowData, setFaqFlowData] = useState<FAQFlowData | null>(
    skipSetupPhase && mode === 'faq' ? DEFAULT_REC_FAQ_FLOW_DATA : null
  );
  const [blogFlowData, setBlogFlowData] = useState<BlogFlowData | null>(
    skipSetupPhase && mode === 'blog'
      ? initialBlogFlowData
        ? { ...DEFAULT_REC_BLOG_FLOW_DATA, ...initialBlogFlowData }
        : DEFAULT_REC_BLOG_FLOW_DATA
      : null
  );
  // projectFlowData removed — project flow now uses flowData (InlineFlowData) via InlineCreationFlow
  const initialBlogEditorBlocks = useMemo(
    () => blogFlowData
      ? buildBlogEditorBlocks({
        title: initialTitle ?? blogFlowData.topic,
        sections: blogFlowData.sections,
        preloadedSections: preloadedBlogSections,
      })
      : [],
    [blogFlowData, initialTitle, preloadedBlogSections],
  );

  // ── Wizard navigation state (drives the setup-phase header)
  const flowNavRef = useRef<FlowNavControls | null>(null);
  const [wizardNavState, setWizardNavState] = useState<FlowNavState>({
    step: 0,
    totalSteps: SETUP_STEPS_BY_MODE[mode].length || 1,
    canAdvance: true,
  });

  // Derive brand identity display label from whichever flow produced the content
  const activeBrandKitId = faqFlowData?.brandKit ?? blogFlowData?.brandKit ?? flowData?.brandKit;
  const brandKitLabel = activeBrandKitId
    ? (BRAND_KIT_LABELS[activeBrandKitId] ?? activeBrandKitId)
    : 'Olive Garden corporate';

  // True when the user clicks "Edit settings" on an already-generated canvas
  const isEditingSettings = generationInfo !== null && setupPhase === 'setup';
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [shimmerSection, setShimmerSection] = useState<string | null>(null);
  const [isRegenProgress, setIsRegenProgress] = useState(false);
  const [selectedCanvasBlock, setSelectedCanvasBlock] = useState<CanvasBlockInfo | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInitialTab, setShareInitialTab] = useState<'collaborate' | 'download'>('collaborate');
  const [sendForApprovalOpen, setSendForApprovalOpen] = useState(false);
  const [blogSendForApprovalOpen, setBlogSendForApprovalOpen] = useState(false);

  const handleSaveFaq = useCallback(() => {
    toast.success('FAQ content saved to project', {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
    });
    onBack();
  }, [onBack]);

  const handleSaveAndAddToLibrary = useCallback(() => {
    const snippets = (preloadedFAQs ?? []).map(f => f.question).slice(0, 3);
    addSavedBlock({
      name: title || 'FAQ content',
      createdBy: 'Haresh R.',
      sourceType: 'faq-full',
      preview: { title: title || 'FAQ content', snippets },
    });
    toast.success('FAQ saved to library', {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
    });
    onBack();
  }, [preloadedFAQs, title, onBack]);

  const handleSendForApprovalSubmit = useCallback(
    ({ approvalWorkflow, scheduleDate }: { approvalWorkflow: string; scheduleDate?: Date }) => {
      const when = scheduleDate
        ? ` · scheduled for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(scheduleDate)}`
        : '';
      toast.success(`FAQ sent to ${approvalWorkflow}${when}`, {
        icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
      });
      setSendForApprovalOpen(false);
      onBack();
    },
    [onBack],
  );

  const handleBlogSendForApprovalSubmit = useCallback(
    ({ approvalWorkflow, scheduleDate }: { approvalWorkflow: string; scheduleDate?: Date }) => {
      const when = scheduleDate
        ? ` · scheduled for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(scheduleDate)}`
        : '';
      toast.success(`Blog post sent to ${approvalWorkflow}${when}`, {
        icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
      });
      setBlogSendForApprovalOpen(false);
    },
    [],
  );

  const handleBlogSaveAndAddToLibrary = useCallback(() => {
    addSavedBlock({
      name: title || 'Blog post',
      createdBy: 'Haresh R.',
      sourceType: 'blog',
      preview: { title: title || 'Blog post', snippets: [] },
    });
    toast.success('Blog post saved to library', {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
    });
  }, [title]);

  const [faqScore, setFaqScore] = useState(0);
  const [faqScorePanelOpen, setFaqScorePanelOpen] = useState(true);
  const [blogScore, setBlogScore] = useState(mode === 'blog' ? (recAeoScore ?? 92) : 0);
  const [blogScorePanelOpen, setBlogScorePanelOpen] = useState(true);
  // Brief shimmer over the blog canvas while a score fix is being applied.
  const [blogFixShimmer, setBlogFixShimmer] = useState(false);
  // Score staleness and recalculation state.
  const [isScoreStale, setIsScoreStale] = useState(false);
  const [isScoreRecalculating, setIsScoreRecalculating] = useState(false);

  const handleRecalculate = useCallback(() => {
    setIsScoreStale(false);
    setIsScoreRecalculating(true);
    // After all 5 steps complete (5 * 1200ms + 600ms grace)
    setTimeout(() => {
      setIsScoreRecalculating(false);
    }, 6600);
  }, []);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [blogMetaOpen, setBlogMetaOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const setupHeaderTitle = isEditingSettings
    ? (mode === 'blog' ? 'Blog settings' : mode === 'faq' ? 'FAQ settings' : 'Content settings')
    : mode === 'project' ? 'Create project'
    : mode === 'faq' ? "Create FAQ's"
    : mode === 'blog' ? 'Create Blog post'
    : `Create ${config.label.toLowerCase()}`;

  function buildGenerationLabel(data: InlineFlowData): string {
    const goalLabel: Record<string, string> = {
      seo: 'SEO traffic', authority: 'Thought leadership', education: 'Product education',
      story: 'Customer story', leads: 'Lead generation', showcase: 'Product showcase',
      event: 'Event registration', service: 'Service promotion',
      bookings: 'Drive bookings', reviews: 'Generate reviews', product: 'Product promotion',
      awareness: 'Brand awareness',
    };
    if (data.mode === 'faq') {
      const goal = goalLabel[data.goal ?? 'seo'] ?? 'FAQ';
      return `${goal} · ${data.tone ?? 'Professional'} · ${data.count ?? 12} FAQs`;
    }
    if (data.mode === 'project') {
      const typeLabels: Record<string, string> = {
        campaign: 'Campaign pack', location: 'Location rollout',
        product: 'Product launch', reviews: 'Review series', custom: 'Custom',
      };
      return `${typeLabels[data.projectType ?? 'campaign']} · ${data.tone ?? 'Professional'}`;
    }
    return `${goalLabel[data.goal ?? 'seo'] ?? data.goal ?? 'Content'} · ${data.tone ?? 'Professional'} · ${data.length ?? 'medium'}`;
  }

  function handleInlineFlowComplete(data: InlineFlowData) {
    setFlowData(data);
    const label = buildGenerationLabel(data);
    setGenerationInfo({ label, wizardData: null as unknown as import('../wizard/wizardTypes').WizardData });

    const SOCIAL_PLATFORM_IDS = new Set(['fb-post', 'fb-reel', 'ig-post', 'ig-reel', 'li-post', 'yt-short', 'tt-video']);
    const VALID_ITEM_TYPES = new Set<ContentItemType>(['blog', 'social', 'email', 'faq', 'landing', 'video']);
    function toItemType(raw: string): ContentItemType {
      if (SOCIAL_PLATFORM_IDS.has(raw)) return 'social';
      return VALID_ITEM_TYPES.has(raw as ContentItemType) ? (raw as ContentItemType) : 'blog';
    }

    // Determine cards to generate from the ideas in the flow data
    const newCards: ContentCardData[] = data.ideas && data.ideas.length > 0
      ? data.ideas.map((idea, i) => ({
          id: `${idea.type}-${i}`,
          itemType: toItemType(idea.type),
          name: idea.title,
          status: 'Draft' as CardStatus,
          score: 84 - (i * 3),
          approved: false,
        }))
      : mode === 'project'
        ? generateProjectCards({})
        : [makeMockCard(mode as ContentItemType, 0)];

    if (data.mode === 'project') {
      // Store cards in ref; ProjectGenerationProgress will call handleProjectGenerationComplete
      pendingProjectCardsRef.current = newCards;
      setSetupPhase('generating');
      setCards([]);
      setGenerateCount(newCards.length);
    } else {
      setSetupPhase('generating');
      setCards([]);
      setGenerateCount(newCards.length);
      setTimeout(() => {
        setSetupPhase('done');
        setCards(newCards);
      }, newCards.length * 420 + 900);
    }
  }

  function handleProjectGenerationComplete() {
    setSetupPhase('done');
    setCards(pendingProjectCardsRef.current);
  }

  function handleFAQFlowComplete(data: FAQFlowData) {
    setFaqFlowData(data);
    const totalQ = data.sections.reduce((s, sec) => s + sec.count, 0);
    const label = `AEO optimized · ${totalQ} FAQs · ${data.sections.length} sections`;
    setGenerationInfo({ label, wizardData: null as unknown as import('../wizard/wizardTypes').WizardData });
    setSetupPhase('generating');
  }

  const [faqGenerationExiting, setFaqGenerationExiting] = useState(false);

  function handleFAQGenerationComplete() {
    setFaqGenerationExiting(true);
    window.setTimeout(() => {
      setSetupPhase('done');
      setFaqGenerationExiting(false);
    }, 360);
  }

  function handleBlogFlowComplete(data: BlogFlowData) {
    setBlogFlowData(data);
    const totalWords = data.sections.reduce((s, sec) => s + sec.wordCount, 0);
    const label = `${data.length ?? 'medium'} · ${totalWords} words · ${data.sections.length} sections`;
    setGenerationInfo({ label, wizardData: null as unknown as import('../wizard/wizardTypes').WizardData });
    setSetupPhase('generating');
  }

  // handleProjectFlowComplete removed — project flow now uses handleInlineFlowComplete

  const [blogGenerationExiting, setBlogGenerationExiting] = useState(false);

  function handleBlogGenerationComplete() {
    setBlogGenerationExiting(true);
    window.setTimeout(() => {
      setSetupPhase('done');
      setBlogGenerationExiting(false);
    }, 360);
  }

  const [projectGenerationExiting, setProjectGenerationExiting] = useState(false);

  function handleProjectGenerationCompleteWithExit() {
    setProjectGenerationExiting(true);
    window.setTimeout(() => {
      handleProjectGenerationComplete();
      setProjectGenerationExiting(false);
    }, 360);
  }

  function handleEditSettings() {
    setSetupPhase('setup');
  }

  // ── Canvas state
  const [cards, setCards] = useState<ContentCardData[]>(() => needsSetup ? [] : seedSingleCard(mode));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(4);
  const pendingProjectCardsRef = useRef<ContentCardData[]>([]);

  // ── Floating toolbar state (canvas)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [zoom, setZoom] = useState(0.85);
  const [layoutDirection, setLayoutDirection] = useState<'vertical' | 'horizontal'>('horizontal');
  const [cardLayouts, setCardLayouts] = useState<Record<string, CanvasCardLayout>>({});
  const [measuredCardHeights, setMeasuredCardHeights] = useState<Record<string, number>>({});
  const cardResizeObserverRef = useRef<ResizeObserver | null>(null);
  const cardElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStateRef = useRef<{
    type: 'move' | 'resize';
    cardId: string;
    edge?: ResizeEdge;
    startX: number;
    startY: number;
    initial: CanvasCardLayout;
    initialHeight: number;
  } | null>(null);

  // ── Undo / redo history (tracks card list snapshots)
  const historyRef = useRef<ContentCardData[][]>([]);
  const historyIdxRef = useRef(-1);
  const pushHistory = useCallback((snapshot: ContentCardData[]) => {
    // Trim any forward history then push
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snapshot);
    historyIdxRef.current = historyRef.current.length - 1;
  }, []);
  const [historyVersion, setHistoryVersion] = useState(0); // triggers re-render on history change
  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    setCards(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    setCards(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  useEffect(() => {
    if (cards.length === 0) {
      setCardLayouts({});
      return;
    }

    setCardLayouts(prev => {
      let changed = false;
      const next: Record<string, CanvasCardLayout> = {};
      const fallback = arrangeCardLayouts(cards, layoutDirection, prev, measuredCardHeights);

      cards.forEach(card => {
        if (prev[card.id]) next[card.id] = prev[card.id];
        else {
          next[card.id] = fallback[card.id];
          changed = true;
        }
      });

      if (Object.keys(prev).length !== cards.length) changed = true;
      return changed ? next : prev;
    });
  }, [cards, layoutDirection, measuredCardHeights]);

  useEffect(() => () => {
    cardResizeObserverRef.current?.disconnect();
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragStateRef.current;
      if (!drag) return;

      event.preventDefault();
      const dx = (event.clientX - drag.startX) / zoom;
      const dy = (event.clientY - drag.startY) / zoom;

      setCardLayouts(prev => {
        const current = prev[drag.cardId] ?? drag.initial;
        if (drag.type === 'resize') {
          const nextLayout = { ...current };
          if (drag.edge === 'right') {
            nextLayout.width = Math.max(CARD_MIN_WIDTH, drag.initial.width + dx);
          }
          if (drag.edge === 'left') {
            const nextWidth = Math.max(CARD_MIN_WIDTH, drag.initial.width - dx);
            nextLayout.width = nextWidth;
            nextLayout.x = drag.initial.x + (drag.initial.width - nextWidth);
          }
          if (drag.edge === 'bottom') {
            nextLayout.height = Math.max(CARD_MIN_HEIGHT, drag.initialHeight + dy);
          }
          if (drag.edge === 'top') {
            const nextHeight = Math.max(CARD_MIN_HEIGHT, drag.initialHeight - dy);
            nextLayout.height = nextHeight;
            nextLayout.y = Math.max(0, drag.initial.y + (drag.initialHeight - nextHeight));
          }

          return {
            ...prev,
            [drag.cardId]: nextLayout,
          };
        }

        return {
          ...prev,
          [drag.cardId]: {
            ...current,
            x: Math.max(0, drag.initial.x + dx),
            y: Math.max(0, drag.initial.y + dy),
          },
        };
      });
    }

    function handlePointerUp() {
      dragStateRef.current = null;
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [zoom]);

  // Wrap setCards so every mutation is recorded in history
  const setCardsWithHistory = useCallback((updater: ContentCardData[] | ((prev: ContentCardData[]) => ContentCardData[])) => {
    setCards(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      setHistoryVersion(v => v + 1);
      return next;
    });
  }, [pushHistory]);

  // ── Score panel state
  const [activeScoreCardId, setActiveScoreCardId] = useState<string | null>(null);
  const [editingCardItemType, setEditingCardItemType] = useState<'blog' | 'faq' | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // ── Handlers

  const handleGenerate = useCallback((answers: Record<string, string | string[]>) => {
    // Project: generate cards from selected types; single: show one card
    const newCards = mode === 'project'
      ? generateProjectCards(answers)
      : [makeMockCard(mode as ContentItemType, 0)];

    setGenerateCount(newCards.length);
    setIsGenerating(true);
    setCards([]);

    // Mock generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setCards(newCards);
    }, newCards.length * 400 + 800);
  }, [mode]);

  const handleAddCard = useCallback((itemType: ContentItemType) => {
    setCards(prev => [...prev, makeMockCard(itemType, prev.filter(c => c.itemType === itemType).length)]);
  }, []);

  const handleAddAnother = useCallback((itemType: ContentItemType) => {
    setCards(prev => [...prev, makeMockCard(itemType, prev.filter(c => c.itemType === itemType).length)]);
  }, []);

  const handleScoreClick = useCallback((cardId: string) => {
    setActiveScoreCardId(prev => prev === cardId ? null : cardId);
    setCommentsOpen(false);
  }, []);

  const handleEdit = useCallback((cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    if (card.itemType === 'blog' || card.itemType === 'faq') {
      setEditingCardItemType(card.itemType);
      setEditingCardId(cardId);
    }
  }, [cards]);

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setActiveScoreCardId(prev => prev === cardId ? null : prev);
  }, []);

  const handleSelectTemplate = useCallback((template: EditorTemplate) => {
    // Seed a card for each type implied by the template
    // For now: add a single card matching the mode, named after the template
    const itemType = mode === 'project' ? 'blog' : mode as ContentItemType;
    const card = makeMockCard(itemType, 0);
    setCards([{ ...card, name: template.title }]);
  }, [mode]);

  const handleArrangeCards = useCallback((direction: 'vertical' | 'horizontal') => {
    setLayoutDirection(direction);
    setCardLayouts(prev => arrangeCardLayouts(cards, direction, prev, measuredCardHeights));
  }, [cards, measuredCardHeights]);

  const handleCanvasWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const nextZoom = zoom - event.deltaY * 0.002;
    setZoom(Math.min(2, Math.max(0.5, +nextZoom.toFixed(2))));
  }, [zoom]);

  const handleCardPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, cardId: string) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button,input,textarea,select,a,[role="menuitem"],[data-no-card-drag="true"],[data-card-resize-edge]')) return;

    const layout = cardLayouts[cardId];
    if (!layout) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      type: 'move',
      cardId,
      startX: event.clientX,
      startY: event.clientY,
      initial: layout,
      initialHeight: measuredCardHeights[cardId] ?? layout.height ?? CARD_MIN_HEIGHT,
    };
  }, [cardLayouts, measuredCardHeights]);

  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>, cardId: string, edge: ResizeEdge) => {
    event.preventDefault();
    event.stopPropagation();
    const layout = cardLayouts[cardId];
    if (!layout) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      type: 'resize',
      cardId,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      initial: layout,
      initialHeight: measuredCardHeights[cardId] ?? layout.height ?? CARD_MIN_HEIGHT,
    };
  }, [cardLayouts, measuredCardHeights]);

  const handleCardMeasureRef = useCallback((cardId: string, node: HTMLDivElement | null) => {
    const previousNode = cardElementRefs.current[cardId];
    if (previousNode && previousNode !== node) {
      cardResizeObserverRef.current?.unobserve(previousNode);
    }

    cardElementRefs.current[cardId] = node;
    if (!node) return;

    if (!cardResizeObserverRef.current) {
      cardResizeObserverRef.current = new ResizeObserver(entries => {
        setMeasuredCardHeights(prev => {
          let changed = false;
          const next = { ...prev };

          entries.forEach(entry => {
            const id = (entry.target as HTMLElement).dataset.cardId;
            if (!id) return;
            const height = Math.ceil(entry.contentRect.height);
            if (next[id] !== height) {
              next[id] = height;
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      });
    }

    node.dataset.cardId = cardId;
    cardResizeObserverRef.current.observe(node);
  }, []);

  const canvasBounds = cards.reduce(
    (bounds, card) => {
      const layout = cardLayouts[card.id];
      if (!layout) return bounds;
      const measuredHeight = measuredCardHeights[card.id] ?? defaultCardSize(card.itemType).height;
      const cardHeight = Math.max(layout.height ?? 0, measuredHeight);
      return {
        width: Math.max(bounds.width, layout.x + layout.width + CARD_CANVAS_PADDING),
        height: Math.max(bounds.height, layout.y + cardHeight + CARD_CANVAS_PADDING),
      };
    },
    { width: 1800, height: 1200 },
  );

  // ── Active card config for score panel
  const activeCard = cards.find(c => c.id === activeScoreCardId);
  const scorePanelConfig = activeCard
    ? EDITOR_CONFIGS[activeCard.itemType as ContentMode] ?? config
    : config;

  // Editing a card from the project canvas — drill into the same full single-item
  // editor, nested here so the project canvas underneath stays mounted and its
  // cards/layout survive the round trip when the user goes back.
  if (editingCardItemType) {
    return (
      <ContentEditorShell
        mode={editingCardItemType}
        skipSetupPhase
        preloadedBlogSections={editingCardItemType === 'blog' ? DEFAULT_SEARCH_AI_BLOG_SECTIONS : undefined}
        onBack={() => { setEditingCardItemType(null); setEditingCardId(null); }}
      />
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-background">

      {/* ── Header — shared by setup, generation, and editor states ── */}
      <div
        className={cn(
          'w-full bg-background flex items-center justify-between px-6 py-[9px] flex-shrink-0 sticky top-0 z-40',
          setupPhase !== 'setup' && 'border-b border-border',
        )}
      >

          {/* Left cluster: back + title */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={isEditingSettings ? () => setSetupPhase('done') : onBack}
              aria-label="Go back"
              className="flex items-center justify-center size-[34px] rounded hover:bg-surface-hover/60 text-muted-foreground hover:text-foreground transition-colors flex-none"
            >
              <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
            </button>

            <div className="flex flex-col">
              {setupPhase === 'setup' ? (
                <span className="text-[16px] text-foreground leading-tight truncate max-w-[240px]">
                  {setupHeaderTitle}
                </span>
              ) : (
                <>
                  {/* Title row: text + pencil + Draft pill */}
                  <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                      <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditingTitle(false); }}
                        className={cn(
                          'text-[16px] text-foreground bg-transparent border-b border-primary outline-none leading-tight min-w-[120px]',
                          mode === 'faq' ? 'max-w-none' : 'max-w-[260px]',
                        )}
                      />
                    ) : (
                      <span className={cn(
                        'text-[16px] text-foreground leading-tight',
                        mode !== 'faq' && 'truncate max-w-[240px]',
                      )}>
                        {title}
                      </span>
                    )}
                    {!isEditingTitle && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(true)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={14} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    )}
                    {mode !== 'faq' && <Badge variant="secondary">Draft</Badge>}
                  </div>
                  {!hideHeaderContext && (
                    <button
                      type="button"
                      onClick={handleEditSettings}
                      className="text-xs text-primary hover:underline text-left"
                    >
                      {brandKitLabel} · 10 locations
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right cluster: setup navigation or editor actions */}
          <div className="flex items-center gap-2">
            {setupPhase === 'setup' ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={isEditingSettings ? () => setSetupPhase('done') : onBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => flowNavRef.current?.back()}
                  disabled={wizardNavState.step === 0}
                >
                  Back
                </Button>
                {isEditingSettings && wizardNavState.step === wizardNavState.totalSteps - 1 ? (
                  <Button
                    onClick={() => setRegenConfirmOpen(true)}
                    disabled={!wizardNavState.canAdvance}
                  >
                    Regenerate
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const isLast = wizardNavState.step === wizardNavState.totalSteps - 1;
                      if (isLast) flowNavRef.current?.generate();
                      else flowNavRef.current?.advance();
                    }}
                    disabled={!wizardNavState.canAdvance}
                  >
                    {wizardNavState.step === wizardNavState.totalSteps - 1 ? 'Generate' : 'Continue'}
                  </Button>
                )}
              </>
            ) : setupPhase === 'done' ? (
              <>
                {mode === 'faq' && faqScore > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFaqScorePanelOpen(v => !v); setActivityOpen(false); setCommentsOpen(false); setActiveScoreCardId(null); }}
                    className={cn(
                      'flex h-[34px] items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-surface-hover/60',
                      faqScorePanelOpen ? 'bg-muted text-foreground' : 'border border-border',
                    )}
                  >
                    <ScoreProgressRing score={faqScore} />
                    <span className="text-foreground">{faqScore}</span>
                    <span>/ 100 Content score</span>
                  </button>
                )}

                {mode === 'blog' && blogScore > 0 && (
                  <button
                    type="button"
                    onClick={() => { setBlogScorePanelOpen(v => !v); setActivityOpen(false); setCommentsOpen(false); setActiveScoreCardId(null); }}
                    className={cn(
                      'flex h-[34px] items-center gap-2 rounded-md px-2 text-[13px] text-muted-foreground transition-colors hover:bg-surface-hover/60',
                      blogScorePanelOpen ? 'bg-muted text-foreground' : 'border border-border',
                    )}
                  >
                    {isScoreRecalculating ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <span className="text-foreground">Recalculating score</span>
                      </>
                    ) : (
                      <>
                        <ScoreProgressRing score={blogScore} />
                        <span className="text-foreground">{blogScore}</span>
                        <span>/ 100 Content score</span>
                      </>
                    )}
                  </button>
                )}

                {mode === 'blog' ? (
                  <div className="inline-flex items-center gap-2">
                    <div className="inline-flex">
                      <Button
                        type="button"
                        className="rounded-r-none"
                        onClick={() => setExportOpen(true)}
                      >
                        Publish
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            aria-label="More publish options"
                            className="rounded-l-none border-l border-primary-foreground/20 px-2"
                          >
                            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[220px]">
                          <DropdownMenuItem onClick={() => setBlogSendForApprovalOpen(true)}>
                            Send for approval
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBlogSaveAndAddToLibrary}>
                            Save and add to library
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="More actions"
                          className="flex h-[var(--button-height)] w-[var(--button-height)] items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                        >
                          <MoreVertical size={16} strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem onClick={() => { setShareInitialTab('collaborate'); setShareOpen(true); }}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setShareInitialTab('download'); setShareOpen(true); }}>
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <div className="inline-flex">
                      <Button
                        type="button"
                        onClick={handleSaveFaq}
                        className="rounded-r-none"
                      >
                        Save
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            aria-label="Save options"
                            className="rounded-l-none border-l border-primary-foreground/20 px-2"
                          >
                            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[220px]">
                          <DropdownMenuItem onClick={() => setSendForApprovalOpen(true)}>
                            Send for approval
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSaveAndAddToLibrary}>
                            Save and add to library
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="More actions"
                          className="flex h-[var(--button-height)] w-[var(--button-height)] items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                        >
                          <MoreVertical size={16} strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem onClick={() => { setShareInitialTab('collaborate'); setShareOpen(true); }}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setShareInitialTab('download'); setShareOpen(true); }}>
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

              </>
            ) : null}
          </div>
        </div>

      {/* ── Inline creation flow — same shell as the editor, with stepper in the left pane ─────────── */}
      {setupPhase === 'setup' && (
        <div className="flex-1 min-h-0 flex">
          <aside className="flex-shrink-0 bg-background" style={{ width: 250 }}>
            <div className="px-4 py-4">
              <ContentFlowStepper
                steps={SETUP_STEPS_BY_MODE[mode]}
                currentStep={wizardNavState.step}
                onStepChange={nextStep => flowNavRef.current?.goTo?.(nextStep)}
              />
            </div>
          </aside>
          <div className="flex-1 min-w-0 min-h-0 bg-background rounded-[8px] overflow-hidden">
            {mode === 'faq' ? (
              <FAQInlineCreationFlow
                onComplete={handleFAQFlowComplete}
                onCancel={isEditingSettings ? () => setSetupPhase('done') : onBack}
                controlRef={flowNavRef}
                onNavStateChange={setWizardNavState}
                hideProgress
                initialData={isEditingSettings && faqFlowData ? faqFlowData : undefined}
              />
            ) : mode === 'blog' ? (
              <BlogInlineCreationFlow
                onComplete={handleBlogFlowComplete}
                onCancel={isEditingSettings ? () => setSetupPhase('done') : onBack}
                controlRef={flowNavRef}
                onNavStateChange={setWizardNavState}
                hideProgress
                initialData={isEditingSettings && blogFlowData ? blogFlowData : undefined}
              />
            ) : mode === 'project' ? (
              <InlineCreationFlow
                mode="project"
                onComplete={handleInlineFlowComplete}
                onCancel={isEditingSettings ? () => setSetupPhase('done') : onBack}
                controlRef={flowNavRef}
                onNavStateChange={setWizardNavState}
                hideProgress
              />
            ) : (
              <InlineCreationFlow
                mode={BLOCK_MODES.has(mode) ? mode as 'faq' | 'blog' | 'landing' : 'project'}
                onComplete={handleInlineFlowComplete}
                onCancel={onBack}
                controlRef={flowNavRef}
                onNavStateChange={setWizardNavState}
                hideProgress
              />
            )}
          </div>
        </div>
      )}

      {/* ── FAQ generation progress (generating phase) ─────────────────── */}
      {setupPhase === 'generating' && mode === 'faq' && faqFlowData && (
        <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
          <LeftPanelSkeleton />
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <FAQGenerationProgress
              sections={faqFlowData.sections}
              brandKit={faqFlowData.brandKit}
              sourceUrl={faqFlowData.sourceUrl}
              onComplete={handleFAQGenerationComplete}
              isExiting={faqGenerationExiting}
            />
          </div>
          <ScorePanelSkeleton />
        </div>
      )}

      {/* ── FAQ section canvas (done phase) ──────────────────────────────── */}
      {setupPhase === 'done' && mode === 'faq' && faqFlowData && (
        isQuickShimmering
          ? (
            <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
              <LeftPanelSkeleton />
              <CanvasShimmer mode="faq" />
              <ScorePanelSkeleton />
            </div>
          )
          : (
            <FAQSectionCanvas
              sections={faqFlowData.sections}
              generationLabel={generationInfo?.label}
              onEditSettings={handleEditSettings}
              onVersionHistory={() => setVersionHistoryOpen(true)}
              initialQuestions={preloadedFAQs}
              initialScore={recAeoScore}
              onScoreChange={setFaqScore}
              scorePanelOpen={faqScorePanelOpen}
              onScorePanelChange={setFaqScorePanelOpen}
            />
          )
      )}
      {setupPhase === 'generating' && mode === 'blog' && blogFlowData && (
        <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
          <LeftPanelSkeleton />
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <BlogGenerationProgress
              sections={blogFlowData.sections}
              brandKit={blogFlowData.brandKit}
              topic={blogFlowData.topic}
              onComplete={handleBlogGenerationComplete}
              isExiting={blogGenerationExiting}
            />
          </div>
          <ScorePanelSkeleton />
        </div>
      )}
      {setupPhase === 'generating' && mode === 'project' && flowData && (
        <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
          <LeftPanelSkeleton />
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <ProjectGenerationProgress
              flowData={flowData}
              onComplete={handleProjectGenerationCompleteWithExit}
              isExiting={projectGenerationExiting}
            />
          </div>
          <ScorePanelSkeleton />
        </div>
      )}
      {setupPhase === 'generating' && mode !== 'faq' && mode !== 'blog' && mode !== 'project' && (
        <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--color-canvas,#F7F8FA)]">
          <GeneratingSkeleton count={generateCount} />
        </div>
      )}

      {setupPhase === 'done' && mode === 'blog' && blogFlowData && isQuickShimmering && (
        <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
          <LeftPanelSkeleton />
          <CanvasShimmer mode="blog" />
          <ScorePanelSkeleton />
        </div>
      )}

      {/* ── Body (left + center + right) — block editor modes ── */}
      {setupPhase === 'done' && mode !== 'faq' && !(mode === 'blog' && isQuickShimmering) && (BLOCK_MODES.has(mode) ? (
        /* ── Block editor — wraps all 3 panels in a shared store context ── */
        <BlockEditorProvider initialBlocks={mode === 'blog' ? initialBlogEditorBlocks : []}>
          <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
            {/* Left panel — collapsible (mirrors EditorScorePanel w-0 / w-[300px] pattern) */}
            <div
              className={cn(
                'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
                leftPanelOpen ? 'w-[300px]' : 'w-0',
              )}
              aria-hidden={!leftPanelOpen}
            >
              <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
                <div className="flex-none px-3 py-2 border-b border-border flex items-center gap-2">
                  <SegmentedToggle ariaLabel="Create mode" items={LEFT_TAB_ITEMS} value={leftTab} onChange={setLeftTab} />
                  <button
                    type="button"
                    aria-label="Collapse AI panel"
                    onClick={() => setLeftPanelOpen(false)}
                    className="ml-auto flex size-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {leftTab === 'ai' ? (
                    <AiCopilot
                      editorContext="editing"
                      initialContentType={mode === 'blog' ? 'blog' : undefined}
                      wizardSummary={generationInfo?.label}
                      onRegen={() => {
                        setIsRegenProgress(true);
                        setIsScoreStale(false);
                        flowNavRef.current?.generate();
                      }}
                      onSectionEditStart={section => setShimmerSection(section)}
                      onSectionEditEnd={() => { setShimmerSection(null); setIsScoreStale(true); }}
                      selectedBlock={selectedCanvasBlock}
                      onClearSelectedBlock={() => setSelectedCanvasBlock(null)}
                    />
                  ) : (
                    <BlockLibraryPanel mode={mode as 'blog' | 'landing' | 'faq'} />
                  )}
                </div>
              </div>
            </div>

            {/* Center — block canvas with zoom toolbar */}
            <div className="flex flex-1 min-w-0 flex-col gap-2 overflow-hidden">
              {/* Toolbar row: AI FAB (when collapsed) + top bar */}
              <div className="flex items-center gap-2">
                {!leftPanelOpen && (
                  <button
                    type="button"
                    aria-label="Open AI panel"
                    onClick={() => setLeftPanelOpen(true)}
                    className="flex-none flex size-[48px] items-center justify-center rounded-lg border border-border/60 bg-background shadow-sm text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground hover:shadow-md"
                  >
                    <AIIcon size={18} />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <CanvasEditorTopBar
                score={mode === 'blog' ? blogScore : cards[0]?.score ?? 40}
                scoreLabel="Content score"
                hideScore={mode === 'blog'}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                zoom={zoom}
                onZoomChange={setZoom}
                onVersionHistory={() => setVersionHistoryOpen(true)}
                onActivity={() => { setActivityOpen(v => !v); setCommentsOpen(false); setBlogMetaOpen(false); setFaqScorePanelOpen(false); setBlogScorePanelOpen(false); setActiveScoreCardId(null); }}
                onChat={() => { setCommentsOpen(v => !v); setActivityOpen(false); setBlogMetaOpen(false); setFaqScorePanelOpen(false); setBlogScorePanelOpen(false); setActiveScoreCardId(null); }}
                onBlogMeta={mode === 'blog' ? () => { setBlogMetaOpen(v => !v); setCommentsOpen(false); setActivityOpen(false); setBlogScorePanelOpen(false); } : undefined}
                blogMetaOpen={blogMetaOpen}
              />
                </div>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl">
                {isRegenProgress ? (
                  <div className="min-h-0 flex-1 overflow-hidden rounded-xl h-full">
                    <BlogGenerationProgress
                      sections={blogFlowData?.sections ?? [{ id: 'regen', heading: '', description: '', wordCount: 1200 }]}
                      brandKit={blogFlowData?.brandKit}
                      topic={blogFlowData?.topic}
                      isRegen={true}
                      onComplete={() => { setIsRegenProgress(false); handleRecalculate(); }}
                      isExiting={false}
                    />
                  </div>
                ) : (
                  <BlockCanvas
                    mode={mode as 'blog' | 'landing' | 'faq'}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onBlockFocus={(info) => {
                      if (mode === 'blog') setBlogScorePanelOpen(false);
                      setSelectedCanvasBlock(info);
                    }}
                    shimmerSection={shimmerSection}
                  />
                )}
                {/* Fix-in-progress shimmer — signals the canvas is updating */}
                {blogFixShimmer && (
                  <div className="absolute inset-0 z-20 flex items-start justify-center bg-background/45 backdrop-blur-[1px]">
                    <div className="mt-8 flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 shadow-sm">
                      <Sparkles size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary animate-pulse" />
                      <span className="text-[12px] text-foreground">Applying fix…</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right — blog score panel or block settings panel */}
            {mode === 'blog' && (
              <EditorScorePanel
                open={blogScorePanelOpen}
                onClose={() => setBlogScorePanelOpen(false)}
                config={EDITOR_CONFIGS.blog}
                dimensions={buildBlogScoreDimensions(blogScore)}
                score={blogScore}
                scoreLabel="Content score"
                improvementSet="blog"
                isStale={isScoreStale}
                onRecalculate={handleRecalculate}
                isRecalculating={isScoreRecalculating}
                isRegenerating={isRegenProgress}
                onItemFixing={() => setBlogFixShimmer(true)}
                onFixAll={() => { setBlogFixShimmer(true); setIsScoreStale(true); }}
                onItemFixed={() => { setBlogFixShimmer(false); setIsScoreStale(true); }}
              />
            )}
            {!(mode === 'blog' && blogScorePanelOpen) && !commentsOpen && <BlockSettingsPanel />}

            {/* Comment panel — slides in from right when comments toggle is active */}
            <CommentPanel
              open={commentsOpen}
              onClose={() => setCommentsOpen(false)}
            />

            {/* Blog metadata panel */}
            {mode === 'blog' && (
              <BlogMetaPanel
                open={blogMetaOpen}
                onClose={() => setBlogMetaOpen(false)}
              />
            )}

            {/* Activity panel */}
            <ContentActivityDrawer
              open={activityOpen}
              onClose={() => setActivityOpen(false)}
              contentType={mode === 'blog' ? 'blog' : 'faq'}
            />
          </div>
        </BlockEditorProvider>
      ) : (
        /* ── Card-based modes — social / email / video / project ── */
        <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
          {/* Left panel — collapsible (mirrors EditorScorePanel w-0 / w-[300px] pattern) */}
          <div
            className={cn(
              'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
              leftPanelOpen ? 'w-[300px]' : 'w-0',
            )}
            aria-hidden={!leftPanelOpen}
          >
            <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
              <div className="flex-none px-3 py-2 border-b border-border flex items-center gap-2">
                <SegmentedToggle ariaLabel="Create mode" items={LEFT_TAB_ITEMS} value={leftTab} onChange={setLeftTab} />
                <button
                  type="button"
                  aria-label="Collapse AI panel"
                  onClick={() => setLeftPanelOpen(false)}
                  className="ml-auto flex size-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  <ChevronLeft size={13} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {leftTab === 'ai' ? (
                  <AiCopilot
                    onStartGenerating={() => setIsGenerating(true)}
                    onGenerationComplete={() => {
                      const newCards = mode === 'project'
                        ? generateProjectCards({})
                        : [makeMockCard(mode as ContentItemType, 0)];
                      setGenerateCount(newCards.length);
                      setIsGenerating(false);
                      setCards(newCards);
                    }}
                    initialContentType={mode === 'project' ? 'project' : mode as 'faq' | 'social' | 'email' | 'blog'}
                    editorContext={cards.length > 0 ? 'editing' : 'setup'}
                  />
                ) : (
                  <ManualPanel mode={mode} onAddCard={handleAddCard} />
                )}
              </div>
            </div>
          </div>

          {/* ── Center canvas ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
            {/* Toolbar row: AI FAB (when collapsed) + card toolbar */}
            {!isGenerating && cards.length > 0 && (
              <div className="flex items-center gap-2">
                {!leftPanelOpen && (
                  <button
                    type="button"
                    aria-label="Open AI panel"
                    onClick={() => setLeftPanelOpen(true)}
                    className="flex-none flex size-[48px] items-center justify-center rounded-lg border border-border/60 bg-background shadow-sm text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground hover:shadow-md"
                  >
                    <AIIcon size={18} />
                  </button>
                )}
              <div className="flex flex-1 h-[48px] flex-none items-center rounded-lg border border-border/60 bg-background px-2">

                  <div className="flex-1" />

                  {/* Center: view switcher + layout direction switcher (project only) */}
                  <div className="flex items-center gap-1">
                    {([
                      { value: 'grid' as const, label: 'Grid view', Icon: Grid },
                      { value: 'list' as const, label: 'List view', Icon: List },
                      { value: 'calendar' as const, label: 'Calendar view', Icon: Calendar },
                    ]).map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        title={label}
                        aria-label={label}
                        aria-pressed={viewMode === value}
                        onClick={() => setViewMode(value)}
                        className={cn(
                          'flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 transition-colors',
                          viewMode === value
                            ? 'bg-muted text-foreground'
                            : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon size={14} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    ))}
                    {mode === 'project' && (
                      <>
                        <div className="mx-1 h-4 w-px bg-border" />
                        {([
                          { value: 'vertical' as const, label: 'Arrange vertically', Icon: ArrowDown },
                          { value: 'horizontal' as const, label: 'Arrange horizontally', Icon: ArrowRight },
                        ]).map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            title={label}
                            aria-label={label}
                            aria-pressed={layoutDirection === value}
                            onClick={() => handleArrangeCards(value)}
                            className={cn(
                              'flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 transition-colors',
                              layoutDirection === value
                                ? 'bg-muted text-foreground'
                                : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            <Icon size={14} strokeWidth={1.6} absoluteStrokeWidth />
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Right: all other controls */}
                  <div className="flex flex-1 items-center justify-end gap-1">

                    {/* Undo */}
                    <button type="button" title="Undo" onClick={handleUndo}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 bg-background transition-colors hover:bg-surface-hover">
                      <Undo2 size={14} strokeWidth={1.6} absoluteStrokeWidth className={cn('text-muted-foreground transition-opacity', !canUndo && 'opacity-30')} />
                    </button>

                    {/* Redo */}
                    <button type="button" title="Redo" onClick={handleRedo}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 bg-background transition-colors hover:bg-surface-hover">
                      <Redo2 size={14} strokeWidth={1.6} absoluteStrokeWidth className={cn('text-muted-foreground transition-opacity', !canRedo && 'opacity-30')} />
                    </button>

                    {/* Zoom dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button"
                          className="flex h-[30px] items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 text-[12px] text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
                          <span className="tabular-nums min-w-[28px] text-center">{Math.round(zoom * 100)}%</span>
                          <ChevronDown size={11} strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[80px]">
                        {[0.5, 0.75, 0.85, 1.0, 1.25, 1.5, 2.0].map(p => (
                          <DropdownMenuItem key={p} onClick={() => setZoom(p)} className="justify-center text-[13px]">
                            {Math.round(p * 100)}%
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Version history */}
                    <button type="button" title="Version history"
                      onClick={() => setVersionHistoryOpen(true)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
                      <History size={14} strokeWidth={1.6} absoluteStrokeWidth />
                    </button>

                    {/* Activity */}
                    <button type="button" title="Activity"
                      onClick={() => { setActivityOpen(v => !v); setCommentsOpen(false); }}
                      className={cn(
                        'flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 bg-background transition-colors',
                        activityOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                      )}>
                      <Activity size={14} strokeWidth={1.6} absoluteStrokeWidth />
                    </button>

                    {/* Comments */}
                    <button type="button" title="Comments"
                      onClick={() => { setCommentsOpen(v => !v); setActivityOpen(false); }}
                      className={cn(
                        'flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border/70 bg-background transition-colors',
                        commentsOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                      )}>
                      <MessageCircle size={14} strokeWidth={1.6} absoluteStrokeWidth />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable canvas */}
            <div
                className="flex-1 min-h-0 rounded-xl bg-[var(--color-canvas,#F7F8FA)] relative overflow-auto"
                onWheel={handleCanvasWheel}
              >
                {isGenerating ? (
                  <GeneratingSkeleton count={generateCount} />
                ) : cards.length === 0 ? (
                  <EmptyCanvas mode={mode} onAddCard={handleAddCard} onSelectTemplate={handleSelectTemplate} />
                ) : (
                  <div
                    className="relative"
                    style={{
                      width: canvasBounds.width,
                      height: canvasBounds.height,
                      minWidth: '100%',
                      minHeight: '100%',
                      zoom,
                    }}
                  >
                    {cards.map((card, idx) => (
                      <div
                        key={card.id}
                        onPointerDown={event => handleCardPointerDown(event, card.id)}
                        className={cn(
                          'absolute group/card select-none',
                          dragStateRef.current?.cardId === card.id && 'cursor-grabbing',
                        )}
                        style={{
                          left: cardLayouts[card.id]?.x ?? CARD_CANVAS_PADDING,
                          top: cardLayouts[card.id]?.y ?? CARD_CANVAS_PADDING,
                          width: cardLayouts[card.id]?.width ?? defaultCardSize(card.itemType).width,
                          minHeight: cardLayouts[card.id]?.height,
                        }}
                      >
                        <div
                          ref={node => handleCardMeasureRef(card.id, node)}
                          className="rounded-xl"
                          style={{ minHeight: cardLayouts[card.id]?.height }}
                        >
                          <EditorContentCard
                            card={card}
                            onScoreClick={handleScoreClick}
                            scoreActive={activeScoreCardId === card.id}
                            onEdit={handleEdit}
                            onDelete={handleDeleteCard}
                            onAddAnother={handleAddAnother}
                            showAddAnother={idx === cards.length - 1}
                          />
                        </div>
                        {(['top', 'right', 'bottom', 'left'] as ResizeEdge[]).map(edge => (
                          <div
                            key={edge}
                            aria-label={`Resize ${card.name} from ${edge}`}
                            role="button"
                            tabIndex={-1}
                            data-card-resize-edge={edge}
                            onPointerDown={event => handleResizePointerDown(event, card.id, edge)}
                            className={cn(
                              'absolute z-10',
                              edge === 'top' && '-top-1 left-2 right-2 h-2 cursor-ns-resize',
                              edge === 'right' && 'bottom-2 -right-1 top-2 w-2 cursor-ew-resize',
                              edge === 'bottom' && '-bottom-1 left-2 right-2 h-2 cursor-ns-resize',
                              edge === 'left' && 'bottom-2 -left-1 top-2 w-2 cursor-ew-resize',
                            )}
                          />
                        ))}
                      </div>
                    ))}
                    {/* Add more content button */}
                    <div
                      className="absolute"
                      style={{
                        left: CARD_CANVAS_PADDING,
                        top: Math.max(...cards.map(card => {
                          const layout = cardLayouts[card.id];
                          if (!layout) return 0;
                          const measuredHeight = measuredCardHeights[card.id] ?? defaultCardSize(card.itemType).height;
                          return layout.y + Math.max(layout.height ?? 0, measuredHeight);
                        }), CARD_CANVAS_PADDING) + CARD_CANVAS_GAP,
                      }}
                    >
                      <AddContentButton mode={mode} onAdd={handleAddCard} />
                    </div>
                  </div>
                )}
              </div>
          </div>

            {/* Right score panel — slides in on card score click */}
            <EditorScorePanel
              open={activeScoreCardId !== null}
              onClose={() => setActiveScoreCardId(null)}
              config={scorePanelConfig}
              score={activeCard?.score ?? 87}
              isStale={isScoreStale}
              onRecalculate={handleRecalculate}
              isRecalculating={isScoreRecalculating}
            />

            {/* Comment panel — slides in from right when comments toggle is active */}
            <CommentPanel
              open={commentsOpen}
              onClose={() => setCommentsOpen(false)}
            />

            {/* Activity drawer — slides in from right when activity toggle is active */}
            <ContentActivityDrawer
              open={activityOpen}
              onClose={() => setActivityOpen(false)}
              contentType="blog"
            />
          </div>
      ))}

      {/* ── Regenerate confirmation dialog ───────────────────────────── */}
      <Dialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{mode === 'blog' ? 'Regenerate blog post?' : 'Regenerate FAQ set?'}</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground leading-relaxed -mt-1">
            {mode === 'blog'
              ? 'A new version will be created based on your updated settings. Your existing blog content will be replaced and cannot be recovered.'
              : 'A new version will be created based on your updated settings. Your existing FAQ content will be replaced and cannot be recovered.'}
          </p>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegenConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setRegenConfirmOpen(false);
                setIsRegenProgress(true);
                flowNavRef.current?.generate();
              }}
            >
              Yes, regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export / publish modal */}
      {mode === 'blog' ? (
        <BlogPublishModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
        />
      ) : (
        <FAQPublishModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          faqs={[]}
          overallScore={72}
        />
      )}
      <ContentShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        contentTitle={title}
        initialTab={shareInitialTab}
        projectItems={mode === 'project' && cards.length > 0
          ? cards.map(c => ({ id: c.id, itemType: c.itemType, label: ITEM_TYPE_LABEL[c.itemType] }))
          : undefined
        }
      />
      <FAQSendForApprovalModal
        open={sendForApprovalOpen}
        onClose={() => setSendForApprovalOpen(false)}
        onSubmit={handleSendForApprovalSubmit}
      />
      <FAQSendForApprovalModal
        open={blogSendForApprovalOpen}
        onClose={() => setBlogSendForApprovalOpen(false)}
        onSubmit={handleBlogSendForApprovalSubmit}
      />
      {/* Version history — full-screen overlay covering the entire editor */}
      {versionHistoryOpen && (
        <div className="absolute inset-0 z-50">
          <ContentVersionHistory
            contentType={mode === 'blog' ? 'blog' : mode === 'project' ? 'project' : 'faq'}
            onClose={() => setVersionHistoryOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
