/**
 * FAQSectionCanvas
 *
 * Post-generation canvas for the FAQ flow.
 * Layout:
 *  ┌──────────────────────┬──────────────────────────────────────┬─────────┐
 *  │  Left panel (280px)  │  Center canvas (flex-1)              │  Score  │
 *  │  AI / Manual tabs    │  Floating toolbar (undo + zoom)      │  panel  │
 *  │                      │  Flat document editor                │ (280px) │
 *  │                      │    └─ numbered Q&A blocks            │         │
 *  └──────────────────────┴──────────────────────────────────────┴─────────┘
 */

import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { AIIcon } from '@/assets/icons/AIIcon';
import {
  GripVertical, GripHorizontal, ChevronDown, ChevronRight, Trash2, Plus,
  AlertTriangle, XCircle,
  ArrowUp, ArrowDown, Sparkles,
  Bookmark, MessageSquare, CircleHelp, Type,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { AiCopilot } from '../AiCopilot';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import { EditorScorePanel } from '../editor/EditorScorePanel';
import { CommentPanel } from '../editor/CommentPanel';
import { EDITOR_CONFIGS, type ScoreDimension } from '../editor/editorConfig';
import { CanvasEditorTopBar } from '../shared/CanvasEditorTopBar';
import { EditorChromeToolbar, type EditorToolbarPosition } from '../shared/EditorChromeToolbar';
import { ContentActivityDrawer } from '../shared/ContentActivityDrawer';
import type { FAQSection } from './FAQInlineCreationFlow';
import { FAQPublishModal } from './FAQPublishModal';
import { SaveToSavedModal } from './SaveToSavedModal';
import {
  addSavedBlock,
  type SavedBlock,
} from '../shared/savedBlocksStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionStatus = 'ready' | 'warning' | 'blocked';

export interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
  status: QuestionStatus;
  warningText?: string;
}

// Flat document model — a doc is an ordered list of title blocks and question blocks
export type FAQDocItem =
  | { kind: 'title'; id: string; text: string }
  | (FAQQuestion & { kind: 'question' });

// Legacy — kept for compatibility with external consumers
export interface FAQSectionData {
  id: string;
  title: string;
  questions: FAQQuestion[];
  collapsed: boolean;
  standalone?: boolean;
}

export interface FAQSectionCanvasProps {
  sections: FAQSection[];
  generationLabel?: string;
  onEditSettings?: () => void;
  onVersionHistory?: () => void;
  onGenerationComplete?: () => void;
  /** Pre-loaded Q&As from a recommendation — bypasses mock generation */
  initialQuestions?: { question: string; answer: string }[];
  /** AEO score from the recommendation — used as the starting content score */
  initialScore?: number;
  /** Story/demo hook for showing generation inside the document surface. */
  initialGenerating?: boolean;
  /** Override the derived page title shown at the top of the FAQ document. */
  initialTitle?: string;
  /** Called whenever the displayed score changes — used to hoist score to the shell header. */
  onScoreChange?: (score: number) => void;
  /** Controlled open state for the score panel (passed from shell header toggle). */
  scorePanelOpen?: boolean;
  /** Called when the score panel open state changes internally. */
  onScorePanelChange?: (open: boolean) => void;
}

// ── Derive a meaningful FAQ page title from section topics ────────────────────

function deriveFAQPageTitle(sections: FAQSection[]): string {
  const combined = sections.map(s => s.title.toLowerCase()).join(' ');
  if (combined.includes('restaurant') || combined.includes('menu') || combined.includes('dining')) {
    return 'Restaurant Frequently Asked Questions';
  }
  if (combined.includes('healthcare') || combined.includes('insurance') || combined.includes('patient')) {
    return 'Patient Frequently Asked Questions';
  }
  if (combined.includes('property') || combined.includes('real estate') || combined.includes('apprais')) {
    return 'Real Estate Frequently Asked Questions';
  }
  if (combined.includes('appointment') || combined.includes('pric') || combined.includes('book') || combined.includes('emergency')) {
    return 'Service Frequently Asked Questions';
  }
  return 'Frequently Asked Questions';
}

// ── Build section data from preloaded questions ───────────────────────────────

function buildDocItemsFromQuestions(questions: { question: string; answer: string }[]): FAQDocItem[] {
  return questions.map(q => ({
    kind: 'question' as const,
    id: makeQId(),
    question: q.question,
    answer: q.answer,
    expanded: true,
    status: 'ready' as QuestionStatus,
  }));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function buildFAQScoreDimensions(overallScore: number): ScoreDimension[] {
  const s = clampScore(Math.round(overallScore));
  const offsets = [2, -4, 1, -1, 2];
  const values = offsets.map(o => clampScore(s + o));
  const labels = ['Intent Match', 'Search Visibility', 'Content Depth', 'Brand Alignment', 'Publishing Readiness'];
  return labels.map((label, i) => ({
    label,
    score: values[i],
    color: values[i] >= 80 ? 'green' : values[i] >= 60 ? 'orange' : 'red',
  }));
}

// ── Mock FAQ generation ───────────────────────────────────────────────────────

const MOCK_QA: Record<string, { question: string; answer: string; status: QuestionStatus; warningText?: string }[]> = {
  default: [
    {
      question: 'What is the first step in buying a property in Dubbo?',
      answer: 'The best starting point is getting pre-approved for finance so you know your budget, then booking a free consultation with one of our Dubbo sales agents. We\'ll walk you through the current market, shortlist properties that match your criteria, and guide you through every step from inspection to settlement.',
      status: 'ready',
    },
    {
      question: 'How long does it typically take to sell a property in Dubbo?',
      answer: 'Most residential properties in Dubbo sell within 30–60 days of listing, depending on price point, location, and presentation. Our team uses targeted digital marketing and local buyer networks to achieve strong results efficiently. We\'ll give you a realistic timeline during your appraisal.',
      status: 'ready',
    },
    {
      question: 'What management fees do you charge for rental properties in Dubbo?',
      answer: 'Our property management fees are competitive and transparent — there are no hidden charges. Contact us for a fee schedule specific to your property type and location. We\'ll explain every fee upfront so you can make an informed decision before signing a management agreement.',
      status: 'warning',
      warningText: 'Add specific fee percentage for stronger AEO performance.',
    },
    {
      question: 'Which areas of Dubbo do you service for property management?',
      answer: 'We manage properties across all Dubbo suburbs including Central Dubbo, South Dubbo, West Dubbo, East Dubbo, North Dubbo, Delroy Park, Keswick Estate, Grangewood, Brocklehurst, Wongarbon, and surrounding communities. Contact us if you\'re unsure whether your property falls within our service area.',
      status: 'ready',
    },
    {
      question: 'Do you handle both property sales and rental management in Dubbo?',
      answer: 'Yes — Raine & Horne Dubbo offers a full range of real estate services including residential sales, rental property management, sales and rental appraisals, and landlord advisory. Whether you\'re selling, investing, or both, our team can support you with specialist knowledge of the local Dubbo market.',
      status: 'ready',
    },
  ],
  appointments: [
    {
      question: 'How do I book a free property appraisal in Dubbo?',
      answer: 'You can request a free appraisal through our website, by calling our Dubbo office directly, or by submitting an enquiry form. We typically confirm appraisal appointments within one business day and can accommodate most property types, including rentals, residential sales, and investment properties.',
      status: 'ready',
    },
    {
      question: 'How much does property management cost for a Dubbo rental?',
      answer: 'Our property management fees cover rent collection, routine inspections, maintenance coordination, and tenant communication. We offer clear fee structures with no surprises — request a management proposal and we\'ll provide a complete cost breakdown tailored to your property.',
      status: 'ready',
    },
    {
      question: 'Do you offer free rental appraisals in Dubbo?',
      answer: 'Yes, we offer obligation-free rental appraisals for landlords considering leasing their property. Our appraisers assess comparable rental listings, local demand, and your property\'s condition to provide a realistic and competitive rent estimate.',
      status: 'ready',
    },
    {
      question: 'How are property management fees collected?',
      answer: 'Management fees are deducted directly from rental income each month before funds are disbursed to the landlord. You\'ll receive a monthly statement showing all income and disbursements. We use a trust account in line with NSW Fair Trading requirements.',
      status: 'ready',
    },
    {
      question: 'Can I get a property appraisal outside business hours?',
      answer: 'We try to accommodate flexible appraisal times, including early evenings, to suit working owners. Contact our Dubbo office to arrange a time that works for you — we\'ll do our best to find an appointment that fits your schedule.',
      status: 'warning',
      warningText: 'Consider adding a direct booking link for better AEO performance.',
    },
  ],
  special: [
    {
      question: 'Do you manage commercial and investment properties in Dubbo?',
      answer: 'Yes, we manage both residential investment properties and selected commercial properties in the Dubbo region. For investment portfolios, we offer tailored reporting, periodic market rent reviews, and proactive maintenance scheduling to protect and grow asset value.',
      status: 'ready',
    },
    {
      question: 'Can you manage a large residential portfolio or multiple Dubbo properties?',
      answer: 'Absolutely. We regularly manage portfolios for investors with multiple Dubbo properties. You\'ll have a dedicated property manager as your point of contact, and we can provide consolidated reporting across all properties to simplify your record-keeping.',
      status: 'ready',
    },
    {
      question: 'What happens if a tenant damages my rental property?',
      answer: 'We conduct detailed ingoing and outgoing condition reports to document property condition. If damage occurs beyond fair wear and tear, we manage the bond claim process on your behalf and coordinate repairs through our trusted local trades network. Landlord insurance is recommended — we can advise on suitable providers.',
      status: 'ready',
    },
    {
      question: 'Do you provide written property management agreements in Dubbo?',
      answer: 'Yes, all property management arrangements are formalised with a written management authority agreement that clearly outlines our obligations, your rights, fees, and notice periods. We\'ll walk you through the agreement before signing so you understand exactly what\'s included.',
      status: 'blocked',
      warningText: 'Consider adding: specific agreement term length and exit notice period for stronger AEO trust signals.',
    },
  ],
};

function getQAPool(sectionTitle: string): typeof MOCK_QA['default'] {
  const lower = sectionTitle.toLowerCase();
  if (lower.includes('appoint') || lower.includes('cost') || lower.includes('pric') || lower.includes('book')) {
    return MOCK_QA['appointments'];
  }
  if (lower.includes('special') || lower.includes('case') || lower.includes('complex') || lower.includes('large')) {
    return MOCK_QA['special'];
  }
  return MOCK_QA['default'];
}

let qIdCounter = 1000;
function makeQId() { return `q${qIdCounter++}`; }

function createNewFAQQuestion(): FAQQuestion {
  return {
    id: makeQId(),
    question: 'New question',
    answer: 'Write your answer here.',
    expanded: true,
    status: 'warning',
    warningText: 'This question needs a proper answer.',
  };
}

function generateDocItems(sections: FAQSection[]): FAQDocItem[] {
  return sections.flatMap(section => {
    const pool = getQAPool(section.title);
    return Array.from({ length: section.count }, (_, i) => {
      const qa = pool[i % pool.length];
      return {
        kind: 'question' as const,
        id: makeQId(),
        question: qa.question,
        answer: qa.answer,
        expanded: true,
        status: qa.status,
        warningText: qa.warningText,
      };
    });
  });
}

// ── FAQ canvas template definitions ──────────────────────────────────────────

interface FAQCanvasTemplate {
  id: string;
  title: string;
  description: string;
  hue: number;
  sections: FAQSection[];
}

const FAQ_CANVAS_TEMPLATES: FAQCanvasTemplate[] = [
  {
    id: 'general',
    title: 'General business',
    description: 'Common questions any local business gets asked',
    hue: 210,
    sections: [
      { id: 'gen-1', title: 'General questions', description: '', count: 5 },
      { id: 'gen-2', title: 'Pricing and appointments', description: '', count: 4 },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Menu, hours, reservations, dietary options',
    hue: 30,
    sections: [
      { id: 'rest-1', title: 'Menu and dining', description: '', count: 5 },
      { id: 'rest-2', title: 'Reservations and hours', description: '', count: 4 },
    ],
  },
  {
    id: 'home-services',
    title: 'Home services',
    description: 'Service area, availability, pricing, guarantees',
    hue: 145,
    sections: [
      { id: 'hs-1', title: 'General questions', description: '', count: 5 },
      { id: 'hs-2', title: 'Special cases', description: '', count: 4 },
    ],
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    description: 'Appointments, insurance, new patient info',
    hue: 180,
    sections: [
      { id: 'hc-1', title: 'Appointments and booking', description: '', count: 5 },
      { id: 'hc-2', title: 'Pricing and appointments', description: '', count: 4 },
    ],
  },
  {
    id: 'real-estate',
    title: 'Real estate',
    description: 'Buying, selling, listings, and market info',
    hue: 280,
    sections: [
      { id: 're-1', title: 'Buying and selling', description: '', count: 5 },
      { id: 're-2', title: 'Pricing and appointments', description: '', count: 4 },
    ],
  },
];

// ── Empty-canvas helper components ────────────────────────────────────────────

function FAQTemplateCard({
  template,
  onSelect,
}: {
  template: FAQCanvasTemplate;
  onSelect: (id: string) => void;
}) {
  const headerBg = `hsl(${template.hue}, 28%, 52%)`;
  const accentBg = `hsl(${template.hue}, 25%, 92%)`;

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="flex flex-col rounded-xl border border-border bg-background overflow-hidden hover:border-primary/40 hover:shadow-card transition-all group text-left"
    >
      <div className="relative w-full bg-surface-hover p-4">
        <div
          className="w-full bg-white rounded-lg overflow-hidden shadow-sm ring-1 ring-black/[0.07]"
          style={{ height: 90 }}
        >
          <div className="h-7 w-full flex items-center gap-2 px-2" style={{ background: headerBg }}>
            <div className="size-3.5 rounded bg-white/30 shrink-0" />
            <div className="flex flex-col gap-[2px] flex-1">
              <div className="h-[2px] w-full bg-white/70 rounded-full" />
              <div className="h-[2px] w-2/3 bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="px-2 py-1.5 flex flex-col gap-[4px]">
            <div className="h-[2.5px] w-full rounded-full bg-border" />
            <div className="h-[5px] rounded-[2px] w-full" style={{ background: accentBg }} />
            <div className="h-[2.5px] w-4/5 rounded-full bg-border" />
            <div className="h-[5px] rounded-[2px] w-full" style={{ background: accentBg }} />
          </div>
        </div>
        <div className="absolute inset-0 bg-surface/0 group-hover:bg-surface/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-t-xl">
          <span className="h-7 px-2 rounded-md bg-primary text-[11px] text-primary-foreground shadow-sm">
            Use template
          </span>
        </div>
      </div>
      <div className="px-2 py-2">
        <p className="text-[12px] text-foreground truncate group-hover:text-primary transition-colors">
          {template.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
      </div>
    </button>
  );
}

function EmptyFAQCanvasState({ onSelectTemplate }: { onSelectTemplate: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-8 px-8 py-10">
      <div className="text-center space-y-2">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
          <MessageSquare size={22} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        </div>
        <p className="text-[15px] text-foreground">Your FAQ canvas is ready</p>
        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
          Use the AI Copilot on the left to generate FAQs, or start from a template below.
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted-foreground shrink-0">or choose a template</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {FAQ_CANVAS_TEMPLATES.map(tmpl => (
            <FAQTemplateCard key={tmpl.id} template={tmpl} onSelect={onSelectTemplate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQGeneratingState() {
  return (
    <div className="px-8 py-6 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-primary animate-pulse" />
        <span className="text-[13px] text-foreground">Generating your FAQs…</span>
      </div>
      {Array.from({ length: 3 }).map((_, si) => (
        <div
          key={si}
          className="rounded-xl border border-border/60 bg-background overflow-hidden"
        >
          <div
            className="h-10 border-b border-border bg-muted/30 px-4 flex items-center gap-2 animate-pulse"
            style={{ animationDelay: `${si * 0.1}s` }}
          >
            <div className="size-5 rounded-md bg-muted" />
            <div className="h-3 w-40 rounded-full bg-muted" />
          </div>
          {Array.from({ length: 3 }).map((_, qi) => (
            <div
              key={qi}
              className="border-b border-border last:border-b-0 px-6 py-2 animate-pulse"
              style={{ animationDelay: `${(si * 3 + qi) * 0.08}s` }}
            >
              <div className="h-3 w-2/3 rounded-full bg-muted mb-2" />
              <div className="h-2.5 w-full rounded-full bg-muted/60" />
              <div className="h-2.5 w-4/5 rounded-full bg-muted/60 mt-1" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FAQDocumentGenerationStrip({ totalQuestions }: { totalQuestions: number }) {
  const count = Math.max(1, totalQuestions);

  return (
    <div className="mb-8 overflow-hidden rounded-lg bg-muted/45 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-6 flex-none items-center justify-center rounded-full bg-primary/10">
            <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
            <span className="absolute inset-0 rounded-full border border-primary/25 animate-ping" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] text-foreground">Writing {count} FAQ answers</p>
            <p className="text-[12px] text-muted-foreground">Questions will settle into the document as they finish.</p>
          </div>
        </div>
        <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-background/80 sm:block">
          <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function FAQDocumentSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: Math.max(1, count) }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="h-7 w-[34px] rounded-md bg-muted" />
            <div className="h-7 w-[min(560px,70%)] rounded-md bg-muted" />
          </div>
          <div className="ml-11 space-y-2.5">
            <div className="h-4 w-full rounded-full bg-muted/70" />
            <div className="h-4 w-[92%] rounded-full bg-muted/70" />
            <div className="h-4 w-[74%] rounded-full bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
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

// ── FAQ Manual panel ──────────────────────────────────────────────────────────

const FAQ_PREBUILT_SECTIONS = [
  {
    id: 'faq-prebuilt-emergency',
    title: 'Rental maintenance and emergencies',
    description: 'Urgent repairs, after-hours issues, and maintenance response',
    questions: [
      {
        question: 'How do you handle urgent maintenance requests for rental properties?',
        answer: 'We have a 24/7 emergency maintenance line for tenants. For genuine emergencies — like burst pipes, electrical faults, or security issues — we contact approved trades immediately and notify the landlord as soon as possible.',
      },
      {
        question: 'How quickly are routine maintenance requests actioned?',
        answer: 'Routine maintenance requests are acknowledged within one business day. We obtain owner approval for repairs above the agreed limit and coordinate with qualified local tradespeople to complete work efficiently.',
      },
    ],
  },
  {
    id: 'faq-prebuilt-pricing',
    title: 'Fees and appraisals',
    description: 'Management fees, rental appraisals, and cost transparency',
    questions: [
      {
        question: 'How do I get a rental appraisal for my Dubbo property?',
        answer: 'Contact our Dubbo office to arrange a free, obligation-free rental appraisal. We\'ll assess your property, review comparable rentals in the area, and provide a realistic rent estimate backed by current market data.',
      },
      {
        question: 'Are there any fees beyond the management percentage?',
        answer: 'We provide a full fee schedule upfront. Common additional fees may include letting fees, lease renewal fees, and maintenance coordination. Everything is disclosed in your management agreement before you sign.',
      },
    ],
  },
  {
    id: 'faq-prebuilt-local',
    title: 'Dubbo coverage and local expertise',
    description: 'Service areas, local knowledge, and suburb coverage',
    questions: [
      {
        question: 'Which Dubbo suburbs do you cover for property management?',
        answer: 'We cover all Dubbo suburbs and surrounding communities including South Dubbo, West Dubbo, Delroy Park, Keswick Estate, Grangewood, Brocklehurst, Wongarbon, and more. Contact us to confirm availability for your address.',
      },
      {
        question: 'How long has Raine & Horne been managing properties in Dubbo?',
        answer: 'Raine & Horne has been part of the Dubbo community for decades, with deep local market knowledge and established relationships with trusted local tradespeople, tenants, and investors throughout the region.',
      },
    ],
  },
];


function FAQManualActionCard({
  label,
  icon,
  onClick,
  dragType,
  dragPayload,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  dragType?: string;
  dragPayload?: string;
}) {
  return (
    <button
      type="button"
      draggable={!!dragType}
      onDragStart={dragType ? e => {
        e.dataTransfer.setData(dragType, dragPayload ?? 'true');
        e.dataTransfer.effectAllowed = 'copy';
      } : undefined}
      onClick={onClick}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition-colors hover:border-primary/40 hover:bg-surface-selected cursor-grab active:cursor-grabbing"
    >
      <GripHorizontal size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/50" />
      <div className="text-muted-foreground">
        {icon}
      </div>
      <p className="text-[12px] text-foreground">{label}</p>
    </button>
  );
}

function FAQTemplatePreview({
  title,
  questions,
  score = 95,
}: {
  title: string;
  questions: string[];
  score?: number;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-2 py-1">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MessageSquare size={11} strokeWidth={1.6} absoluteStrokeWidth />
        </div>
        <span className="min-w-0 flex-1 truncate text-[8px] text-foreground">FAQ page</span>
        <div className="h-1 w-[34px] overflow-hidden rounded-full bg-muted">
          <div className="h-full w-4/5 rounded-full bg-[#1D9E75]" />
        </div>
        <span className="rounded bg-[#1D9E75]/10 px-1 text-[7px] text-text-primary">{score}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 py-2">
        <p className="truncate text-[8px] text-foreground">{title}</p>
        {questions.slice(0, 4).map((question, index) => (
          <div key={`${question}-${index}`} className="space-y-1">
            <p className="truncate text-[7px] text-foreground/70">{question}</p>
            <div className="h-1 w-11/12 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQSuggestedStyleCard({
  label,
  title,
  description,
  questions,
  onClick,
  onRemove,
  dragType,
  dragPayload,
}: {
  label: string;
  title: string;
  description: string;
  questions: string[];
  onClick: () => void;
  onRemove?: () => void;
  dragType?: string;
  dragPayload?: string;
}) {
  return (
    <div
      draggable={!!dragType}
      onDragStart={dragType ? e => {
        e.dataTransfer.setData(dragType, dragPayload ?? 'true');
        e.dataTransfer.effectAllowed = 'copy';
      } : undefined}
      className="overflow-hidden rounded-md border border-border bg-background transition-colors hover:border-primary/30 cursor-grab active:cursor-grabbing"
    >
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="border-b border-border bg-muted/60 p-4">
          <div className="h-[116px]">
            <FAQTemplatePreview title={title} questions={questions} />
          </div>
        </div>
        <div className="space-y-1 p-4">
          <p className="text-[13px] leading-snug text-foreground">{title}</p>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
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

function FAQManualContent({
  onAddQuestion,
  onAddTitle,
}: {
  onAddQuestion: () => void;
  onAddTitle: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <FAQManualActionCard
            label="Title"
            icon={<Type size={20} strokeWidth={1.6} absoluteStrokeWidth />}
            onClick={onAddTitle}
            dragType="application/faq-add-title"
            dragPayload="new"
          />
          <FAQManualActionCard
            label="Question"
            icon={<CircleHelp size={20} strokeWidth={1.6} absoluteStrokeWidth />}
            onClick={onAddQuestion}
            dragType="application/faq-add-question"
            dragPayload="new"
          />
        </div>
      </div>
    </div>
  );
}

// ── Inline title block ────────────────────────────────────────────────────────

function FAQDocTitleBlock({
  text,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  text: string;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="group relative mt-8 mb-2 flex items-start gap-2">
      <GripVertical
        size={14}
        strokeWidth={1.6}
        absoluteStrokeWidth
        className="absolute -left-5 top-2 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <input
        type="text"
        value={text}
        onChange={e => onUpdate(e.target.value)}
        placeholder="Section title…"
        className="flex-1 min-w-0 bg-transparent text-[22px] text-foreground border-b border-transparent outline-none hover:border-border/40 focus:border-primary/40 pb-1 transition-colors placeholder:text-muted-foreground/30"
      />
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          title="Move up"
          className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
        >
          <ArrowUp size={13} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          title="Move down"
          className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
        >
          <ArrowDown size={13} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Remove title"
          className="p-1 rounded hover:bg-surface-hover hover:text-destructive transition-colors text-muted-foreground"
        >
          <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>
    </div>
  );
}

// ── Question row ──────────────────────────────────────────────────────────────

function shouldCloseTextEditor(_event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  return true;
}

function EditableFAQField({
  value,
  onChange,
  editing,
  onEditingChange,
  variant,
}: {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  variant: 'question' | 'answer';
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const placedCaretRef = useRef(false);
  const isQuestion = variant === 'question';
  const textClass = isQuestion
    ? 'text-[24px] leading-tight text-foreground'
    : 'text-[16px] leading-[1.55] text-foreground/90';
  const sharedClass = cn(
    'w-full border-b bg-transparent px-0 py-0.5 text-left tracking-normal transition-colors',
    textClass,
  );

  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!editing) {
      placedCaretRef.current = false;
      return;
    }
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
    if (!placedCaretRef.current) {
      node.focus();
      node.setSelectionRange(value.length, value.length);
      placedCaretRef.current = true;
    }
  }, [editing, value]);

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        rows={1}
        className={cn(
          sharedClass,
          'overflow-hidden border-primary outline-none resize-none',
        )}
        value={value}
        onChange={event => onChange(event.target.value)}
        onBlur={event => { if (shouldCloseTextEditor(event)) onEditingChange(false); }}
        onKeyDown={event => {
          if (event.key === 'Escape' || (isQuestion && event.key === 'Enter' && !event.shiftKey)) {
            event.preventDefault();
            onEditingChange(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onEditingChange(true)}
      className={cn(
        sharedClass,
        'border-transparent hover:border-border/60 focus-visible:border-primary focus-visible:outline-none',
      )}
    >
      {value}
    </button>
  );
}

interface QuestionRowProps {
  question: FAQQuestion;
  index: number;
  totalInSection: number;
  onUpdate: (patch: Partial<FAQQuestion>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  fixingAll?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isImprovementPreviewing?: boolean;
}

function QuestionRow({ question, index, totalInSection, onUpdate, onDelete, onMoveUp, onMoveDown, fixingAll, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, isImprovementPreviewing }: QuestionRowProps) {
  const [editingQ, setEditingQ] = useState(false);
  const [editingA, setEditingA] = useState(false);
  const [fixing, setFixing] = useState(false);

  const isBeingFixed = fixing || isImprovementPreviewing || (!!fixingAll && question.status !== 'ready');

  function handleFixThis() {
    setFixing(true);
    setTimeout(() => {
      let improved = question.answer;
      if (question.warningText?.includes('location')) {
        improved = 'We serve Austin, Cedar Park, Round Rock, and surrounding communities within a 40-mile radius. Visit our website or call us to confirm same-day availability in your area.';
      } else if (question.warningText?.includes('booking')) {
        improved = question.answer.replace(/\.$/, '') + '. Book directly at our website or call (512) 555-0100 — same-day slots available.';
      } else if (question.warningText?.includes('warranty')) {
        improved = 'Yes, all work comes with a written 1-year warranty covering parts and labor. For specialized services, extended warranties of up to 3 years are available — ask your technician at time of service.';
      } else {
        improved = question.answer + ' For further details, contact our team directly.';
      }
      onUpdate({ answer: improved, status: 'ready', warningText: undefined });
      setFixing(false);
    }, 1600);
  }

  return (
    <div
      draggable={!editingQ && !editingA}
      onDragStart={e => {
        e.dataTransfer.setData('application/faq-question-id', question.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('application/faq-question-id')) onDragOver?.(e);
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative rounded-lg transition-colors hover:bg-surface-hover/35',
        question.status === 'blocked' && 'bg-destructive/[0.025]',
        question.status === 'warning' && 'bg-surface-hover/35',
        isDragging && 'opacity-40',
        isDragOver && 'ring-2 ring-inset ring-primary/50 bg-surface-selected',
      )}
    >
      {/* Drag handle */}
      <GripVertical
        size={14}
        strokeWidth={1.6}
        absoluteStrokeWidth
        className="absolute -left-5 top-5 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="flex items-start gap-2 py-4">
        {/* Number */}
        <span className="mt-0.5 w-7 flex-none select-none text-right text-[22px] leading-tight text-foreground">
          {index + 1}.
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {isImprovementPreviewing ? (
            <div className="space-y-3 py-1 animate-pulse" aria-label="Updating question and answer">
              <div className="h-6 w-3/4 rounded-full bg-muted" />
              <div className="space-y-2.5">
                <div className="h-4 w-full rounded-full bg-muted" />
                <div className="h-4 w-5/6 rounded-full bg-muted" />
                <div className="h-4 w-4/5 rounded-full bg-muted" />
              </div>
            </div>
          ) : (
            <>
              <EditableFAQField
                value={question.question}
                onChange={value => onUpdate({ question: value })}
                editing={editingQ}
                onEditingChange={setEditingQ}
                variant="question"
              />

              {/* Answer — shimmer while fixing, editable otherwise */}
              <div>
                {isBeingFixed ? (
                  <div className="space-y-2.5 py-1 animate-pulse">
                    <div className="h-4 w-full rounded-full bg-muted" />
                    <div className="h-4 w-5/6 rounded-full bg-muted" />
                    <div className="h-4 w-4/5 rounded-full bg-muted" />
                  </div>
                ) : (
                  <EditableFAQField
                    value={question.answer}
                    onChange={value => onUpdate({ answer: value })}
                    editing={editingA}
                    onEditingChange={setEditingA}
                    variant="answer"
                  />
                )}
              </div>
            </>
          )}

          {/* Warning / blocked — inline text + "Fix this" blue link */}
          {question.warningText && !isBeingFixed && (
            <div className={cn(
              'flex items-start gap-1.5',
              question.status === 'warning' && 'text-text-secondary',
              question.status === 'blocked' && 'text-destructive',
            )}>
              {question.status === 'warning'
                ? <AlertTriangle size={12} strokeWidth={1.6} absoluteStrokeWidth className="mt-0.5 flex-shrink-0" />
                : <XCircle size={12} strokeWidth={1.6} absoluteStrokeWidth className="mt-0.5 flex-shrink-0" />
              }
              <span className="text-[12px] leading-relaxed">
                {question.warningText}{' '}
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

        {/* Right side actions */}
        <div className="flex flex-shrink-0 items-center gap-1 rounded-md bg-background/95 p-1 opacity-0 shadow-sm ring-1 ring-border/60 transition-opacity group-hover:opacity-100 mt-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
            className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
          >
            <ArrowUp size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalInSection - 1}
            title="Move down"
            className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
          >
            <ArrowDown size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="p-1 rounded hover:bg-surface-hover hover:text-destructive transition-colors text-muted-foreground"
          >
            <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

interface SectionBlockProps {
  section: FAQSectionData;
  sectionIndex: number;
  totalSections: number;
  onUpdate: (patch: Partial<FAQSectionData>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddQuestion: () => void;
  onSaveToSaved: () => void;
  fixingAll?: boolean;
  entranceDelay?: number;
}

function SectionBlock({
  section, sectionIndex, totalSections,
  onUpdate, onDelete, onMoveUp, onMoveDown, onAddQuestion, onSaveToSaved, fixingAll,
  entranceDelay = 0,
}: SectionBlockProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  const readyCount   = section.questions.filter(q => q.status === 'ready').length;
  const blockedCount = section.questions.filter(q => q.status === 'blocked').length;
  const warnCount    = section.questions.filter(q => q.status === 'warning').length;

  const updateQuestion = useCallback((qId: string, patch: Partial<FAQQuestion>) => {
    onUpdate({
      questions: section.questions.map(q => q.id === qId ? { ...q, ...patch } : q),
    });
  }, [section.questions, onUpdate]);

  const deleteQuestion = useCallback((qId: string) => {
    onUpdate({ questions: section.questions.filter(q => q.id !== qId) });
  }, [section.questions, onUpdate]);

  const moveQuestion = useCallback((qId: string, dir: 'up' | 'down') => {
    const idx = section.questions.findIndex(q => q.id === qId);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === section.questions.length - 1) return;
    const next = [...section.questions];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onUpdate({ questions: next });
  }, [section.questions, onUpdate]);

  return (
    <div
      className="rounded-xl border border-border/60 bg-background overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDuration: '400ms', animationDelay: `${entranceDelay}ms` }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
        <GripVertical
          size={14}
          strokeWidth={1.6}
          absoluteStrokeWidth
          className="text-muted-foreground/30 flex-shrink-0 cursor-grab"
        />

        {/* Editable title + inline issue chips */}
        {editingTitle ? (
          <input
            autoFocus
            className="flex-1 min-w-0 text-[13px] text-foreground bg-transparent border-b border-primary outline-none"
            value={section.title}
            onChange={e => onUpdate({ title: e.target.value })}
            onBlur={e => { if (shouldCloseTextEditor(e)) setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-left text-[13px] text-foreground hover:text-primary transition-colors truncate"
            >
              {section.title}
            </button>
            {warnCount > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-surface-hover flex-shrink-0">
                <AlertTriangle size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary" />
                <span className="text-[11px] text-text-secondary">{warnCount}</span>
              </div>
            )}
            {blockedCount > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-destructive/10 flex-shrink-0">
                <XCircle size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-destructive" />
                <span className="text-[11px] text-destructive">{blockedCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Move / collapse / delete */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={sectionIndex === 0}
            title="Move section up"
            className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
          >
            <ArrowUp size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={sectionIndex === totalSections - 1}
            title="Move section down"
            className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground disabled:opacity-25"
          >
            <ArrowDown size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ collapsed: !section.collapsed })}
            title={section.collapsed ? 'Expand section' : 'Collapse section'}
            className="p-1 rounded hover:bg-surface-hover transition-colors text-muted-foreground"
          >
            {section.collapsed
              ? <ChevronRight size={13} strokeWidth={1.6} absoluteStrokeWidth />
              : <ChevronDown size={13} strokeWidth={1.6} absoluteStrokeWidth />
            }
          </button>
          <button
            type="button"
            onClick={onSaveToSaved}
            title="Save section to Saved"
            className="p-1 rounded hover:bg-surface-hover hover:text-primary transition-colors text-muted-foreground"
          >
            <Bookmark size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete section"
            className="p-1 rounded hover:bg-surface-hover hover:text-destructive transition-colors text-muted-foreground"
          >
            <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>

      {/* Questions list */}
      {!section.collapsed && (
        <>
          {section.questions.map((q, qi) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={qi}
              totalInSection={section.questions.length}
              onUpdate={patch => updateQuestion(q.id, patch)}
              onDelete={() => deleteQuestion(q.id)}
              onMoveUp={() => moveQuestion(q.id, 'up')}
              onMoveDown={() => moveQuestion(q.id, 'down')}
              fixingAll={fixingAll}
            />
          ))}

          {/* Add question — clearly inside this section */}
          <button
            type="button"
            onClick={onAddQuestion}
            className="w-full flex items-center gap-2 px-6 py-2.5 text-[12.5px] text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
            Add question
          </button>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FAQSectionCanvas({ sections, generationLabel, onVersionHistory, onGenerationComplete, initialQuestions, initialScore, initialGenerating = false, initialTitle, onScoreChange, scorePanelOpen: externalScorePanelOpen, onScorePanelChange }: FAQSectionCanvasProps) {
  const [docItems, setDocItems] = useState<FAQDocItem[]>(() =>
    initialQuestions && initialQuestions.length > 0
      ? buildDocItemsFromQuestions(initialQuestions)
      : generateDocItems(sections)
  );
  const [pageTitle, setPageTitle] = useState(() => initialTitle ?? deriveFAQPageTitle(sections));
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [leftTab, setLeftTab] = useState<'ai' | 'manual'>('ai');
  const [zoom, setZoom] = useState(0.85);
  const [internalScorePanelOpen, setInternalScorePanelOpen] = useState(false);
  const scorePanelOpen = externalScorePanelOpen !== undefined ? externalScorePanelOpen : internalScorePanelOpen;
  const setScorePanelOpen = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(scorePanelOpen) : v;
    setInternalScorePanelOpen(next);
    onScorePanelChange?.(next);
  }, [scorePanelOpen, onScorePanelChange]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);
  const [previewingScoreImprovement, setPreviewingScoreImprovement] = useState(false);
  const previewingScoreImprovementTimerRef = useRef<number | null>(null);
  const [panelBump, setPanelBump] = useState(0);
  const baseScore = initialScore;
  const [isGeneratingFromCopilot, setIsGeneratingFromCopilot] = useState(initialGenerating);
  const [isRevealingGeneratedContent, setIsRevealingGeneratedContent] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    if (scorePanelOpen) {
      setActivityOpen(false);
      setCommentsOpen(false);
    }
  }, [scorePanelOpen]);

  useEffect(() => () => {
    if (previewingScoreImprovementTimerRef.current !== null) {
      window.clearTimeout(previewingScoreImprovementTimerRef.current);
    }
  }, []);

  const [richTextVisible, setRichTextVisible] = useState(false);
  const [draggingQId, setDraggingQId] = useState<string | null>(null);
  const [dragOverQId, setDragOverQId] = useState<string | null>(null);
  const [canvasToolbarPosition, setCanvasToolbarPosition] = useState<EditorToolbarPosition>({ top: 96, left: 640 });
  const [richTextPosition, setRichTextPosition] = useState<EditorToolbarPosition | undefined>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeTextTargetRef = useRef<HTMLElement | null>(null);
  const generationCompleteRef = useRef(onGenerationComplete);

  // Card metadata state
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const [savingTarget, setSavingTarget] = useState<'all' | null>(null);

  useEffect(() => {
    generationCompleteRef.current = onGenerationComplete;
  }, [onGenerationComplete]);

  useEffect(() => {
    if (!initialGenerating) return;

    setIsGeneratingFromCopilot(true);
    setIsRevealingGeneratedContent(false);
    setScorePanelOpen(false);
    setCommentsOpen(false);
    setActivityOpen(false);

    const revealTimer = window.setTimeout(() => {
      setIsRevealingGeneratedContent(true);
    }, 3200);
    const settleTimer = window.setTimeout(() => {
      setIsGeneratingFromCopilot(false);
    }, 3660);
    const completeTimer = window.setTimeout(() => {
      setIsRevealingGeneratedContent(false);
      generationCompleteRef.current?.();
    }, 3960);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(completeTimer);
    };
  }, [initialGenerating]);

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
  const historyRef    = useRef<FAQDocItem[][]>([]);
  const historyIdxRef = useRef(-1);
  const [, setHistoryVersion] = useState(0);
  const canUndo = historyIdxRef.current > 0;
  const canRedo = historyIdxRef.current < historyRef.current.length - 1;

  const pushHistory = useCallback((snapshot: FAQDocItem[]) => {
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(snapshot);
    historyIdxRef.current = historyRef.current.length - 1;
    setHistoryVersion(v => v + 1);
  }, []);

  const setData = useCallback((updater: FAQDocItem[] | ((prev: FAQDocItem[]) => FAQDocItem[])) => {
    setDocItems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    setDocItems(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    setDocItems(historyRef.current[historyIdxRef.current]);
    setHistoryVersion(v => v + 1);
  }, []);

  // Derived stats
  const questionItems = docItems.filter((i): i is FAQQuestion & { kind: 'question' } => i.kind === 'question');
  const totalQuestions = questionItems.length;
  const readyCount     = questionItems.filter(q => q.status === 'ready').length;
  const canvasScore  = Math.round((readyCount / Math.max(1, totalQuestions)) * 78);
  const setScore     = Math.min(100, (baseScore !== undefined ? baseScore : canvasScore) + panelBump);

  useEffect(() => { onScoreChange?.(setScore); }, [setScore, onScoreChange]);

  const faqConfig = EDITOR_CONFIGS['faq'];
  const generationQuestionCount = Math.max(
    1,
    totalQuestions || sections.reduce((sum, section) => sum + section.count, 0) || 10,
  );

  // ── Flat-list operations ──────────────────────────────────────────────────

  const updateDocItem = useCallback((id: string, patch: Partial<FAQQuestion>) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, [setData]);

  const deleteDocItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  }, [setData]);

  const moveDocItem = useCallback((id: string, dir: 'up' | 'down') => {
    setData(prev => {
      const idx = prev.findIndex(item => item.id === id);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, [setData]);

  const updateTitleText = useCallback((id: string, text: string) => {
    setData(prev => prev.map(item => item.id === id && item.kind === 'title' ? { ...item, text } : item));
  }, [setData]);

  const handleItemFixed = useCallback((bump: number) => {
    setPanelBump(p => p + bump);
  }, []);

  const handleItemFixing = useCallback(() => {
    if (previewingScoreImprovementTimerRef.current !== null) {
      window.clearTimeout(previewingScoreImprovementTimerRef.current);
    }
    setPreviewingScoreImprovement(true);
    previewingScoreImprovementTimerRef.current = window.setTimeout(() => {
      setPreviewingScoreImprovement(false);
      previewingScoreImprovementTimerRef.current = null;
    }, 1200);
  }, []);

  const handleFixAll = useCallback(() => {
    if (previewingScoreImprovementTimerRef.current !== null) {
      window.clearTimeout(previewingScoreImprovementTimerRef.current);
      previewingScoreImprovementTimerRef.current = null;
    }
    setFixingAll(true);
    setPreviewingScoreImprovement(true);
    setTimeout(() => {
      setData(prev => prev.map(item =>
        item.kind === 'question' && item.status !== 'ready'
          ? { ...item, status: 'ready' as QuestionStatus, warningText: undefined }
          : item
      ));
      setFixingAll(false);
      setPreviewingScoreImprovement(false);
    }, 1800);
  }, [setData]);

  const handleManualAddTitle = useCallback(() => {
    setData(prev => [
      ...prev,
      { kind: 'title' as const, id: makeQId(), text: '' },
    ]);
  }, [setData]);

  const handleManualAddQuestion = useCallback(() => {
    const newQ = createNewFAQQuestion();
    setData(prev => [...prev, { kind: 'question' as const, ...newQ }]);
  }, [setData]);

  const handleAddPrebuiltSection = useCallback((template: typeof FAQ_PREBUILT_SECTIONS[number]) => {
    setData(prev => [
      ...prev,
      ...template.questions.map(item => ({
        kind: 'question' as const,
        id: makeQId(),
        question: item.question,
        answer: item.answer,
        expanded: true,
        status: 'ready' as QuestionStatus,
      })),
    ]);
  }, [setData]);

  const handleInsertSavedBlock = useCallback((block: SavedBlock) => {
    setData(prev => [
      ...prev,
      ...block.preview.snippets.map((question, index) => ({
        kind: 'question' as const,
        id: makeQId(),
        question,
        answer: 'Review and update this saved answer for the current page.',
        expanded: true,
        status: index === 0 ? 'warning' as QuestionStatus : 'ready' as QuestionStatus,
        warningText: index === 0 ? 'Saved block inserted — review answer for this page.' : undefined,
      })),
    ]);
  }, [setData]);

  const handleSelectTemplate = useCallback((templateId: string) => {
    const tmpl = FAQ_CANVAS_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    setDocItems(generateDocItems(tmpl.sections));
  }, []);

  const handleReorderItems = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    setData(prev => {
      const fromIdx = prev.findIndex(item => item.id === draggedId);
      const toIdx = prev.findIndex(item => item.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
    setDraggingQId(null);
    setDragOverQId(null);
  }, [setData]);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.getData('application/faq-add-question') === 'new') {
      handleManualAddQuestion();
      return;
    }
    if (e.dataTransfer.getData('application/faq-add-title') === 'new') {
      handleManualAddTitle();
      return;
    }
    const sectionJson = e.dataTransfer.getData('application/faq-add-section');
    if (sectionJson) {
      try {
        const template = JSON.parse(sectionJson);
        handleAddPrebuiltSection(template);
      } catch { /* invalid JSON — ignore */ }
    }
  }, [handleManualAddQuestion, handleManualAddTitle, handleAddPrebuiltSection]);

  const handleCopilotStartGenerating = useCallback(() => {
    setIsGeneratingFromCopilot(true);
    setIsRevealingGeneratedContent(false);
    setScorePanelOpen(false);
    setCommentsOpen(false);
    setActivityOpen(false);
    window.setTimeout(() => {
      const copilotSections: FAQSection[] = [
        { id: `ai-${Date.now()}-1`, title: 'General questions', description: '', count: 5 },
        { id: `ai-${Date.now()}-2`, title: 'Pricing and appointments', description: '', count: 5 },
        { id: `ai-${Date.now()}-3`, title: 'Special cases', description: '', count: 4 },
      ];
      setDocItems(generateDocItems(copilotSections));
      setIsRevealingGeneratedContent(true);
      window.setTimeout(() => {
        setIsGeneratingFromCopilot(false);
      }, 460);
      window.setTimeout(() => {
        setIsRevealingGeneratedContent(false);
      }, 760);
    }, 3200);
  }, []);

  const showGenerationLayer = isGeneratingFromCopilot || isRevealingGeneratedContent;
  const showDocumentContent = docItems.length > 0 && (!isGeneratingFromCopilot || isRevealingGeneratedContent);
  const showStarterContent = !showGenerationLayer && !showDocumentContent;

  return (
    <div className="flex flex-1 min-h-0 gap-2 bg-[var(--color-canvas,#F7F8FA)] p-2">
      {/* ── Left panel ───────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background animate-in fade-in slide-in-from-left-6 fill-mode-both"
        style={{ width: 300, animationDuration: '400ms', animationDelay: '0ms' }}
      >
        <div className="flex-none px-4 py-2 border-b border-border">
          <SegmentedToggle
            ariaLabel="FAQ panel mode"
            items={LEFT_TAB_ITEMS}
            value={leftTab}
            onChange={setLeftTab}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {leftTab === 'ai' ? (
            docItems.length === 0 ? (
              <AiCopilot
                editorContext="setup"
                initialContentType="faq"
                onStartGenerating={handleCopilotStartGenerating}
              />
            ) : (
              <AiCopilot
                editorContext="editing"
                wizardSummary={generationLabel}
              />
            )
          ) : (
            <FAQManualContent
              onAddQuestion={handleManualAddQuestion}
              onAddTitle={handleManualAddTitle}
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
            score={setScore}
            hideScore
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            zoom={zoom}
            onZoomChange={setZoom}
            onVersionHistory={onVersionHistory}
            onActivity={() => { setActivityOpen(v => !v); setScorePanelOpen(false); setCommentsOpen(false); }}
            onSave={() => setSavingTarget('all')}
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
              mode="faq"
            />
          </div>
        )}

        <div
          ref={canvasRef}
          className="relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-transparent"
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
          onDrop={handleCanvasDrop}
        >
          {/* Document container — padding stays fixed, only the page scales */}
          <div className="px-8 py-6 pb-10">
            <div style={{ zoom }}>
            <div className="mx-auto min-h-[calc(100vh-160px)] max-w-[1040px] rounded-lg bg-background px-[30px] pt-[30px] pb-14 shadow-[0_2px_12px_rgba(15,23,42,0.06)] ring-[0.5px] ring-border/20">
              {/* Page title */}
              <input
                ref={titleInputRef}
                type="text"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
                placeholder="Add a page title…"
                className="mb-8 w-full border-b border-transparent bg-transparent pb-2 text-[32px] leading-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground/30 hover:border-border/40 focus:border-primary/40"
              />
              <div className="grid min-h-[640px]">
                <div
                  aria-hidden={!showGenerationLayer}
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity duration-500 ease-out',
                    showGenerationLayer && !isRevealingGeneratedContent
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0',
                  )}
                >
                  <FAQDocumentGenerationStrip totalQuestions={generationQuestionCount} />
                  <FAQDocumentSkeleton count={generationQuestionCount} />
                </div>

                <div
                  aria-hidden={!showDocumentContent}
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity duration-500 ease-out',
                    showDocumentContent
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0',
                  )}
                >
                  {(() => {
                    let qIndex = 0;
                    return docItems.map((item, idx) => {
                      if (item.kind === 'title') {
                        return (
                          <FAQDocTitleBlock
                            key={item.id}
                            text={item.text}
                            onUpdate={text => updateTitleText(item.id, text)}
                            onDelete={() => deleteDocItem(item.id)}
                            onMoveUp={() => moveDocItem(item.id, 'up')}
                            onMoveDown={() => moveDocItem(item.id, 'down')}
                            isFirst={idx === 0}
                            isLast={idx === docItems.length - 1}
                          />
                        );
                      }
                      const questionIndex = qIndex++;
                      return (
                        <QuestionRow
                          key={item.id}
                          question={item}
                          index={questionIndex}
                          totalInSection={totalQuestions}
                          onUpdate={patch => updateDocItem(item.id, patch)}
                          onDelete={() => deleteDocItem(item.id)}
                          onMoveUp={() => moveDocItem(item.id, 'up')}
                          onMoveDown={() => moveDocItem(item.id, 'down')}
                          fixingAll={fixingAll}
                          isDragging={draggingQId === item.id}
                          isDragOver={dragOverQId === item.id}
                          isImprovementPreviewing={previewingScoreImprovement && questionIndex < 2}
                          onDragStart={() => setDraggingQId(item.id)}
                          onDragOver={e => { e.preventDefault(); setDragOverQId(item.id); }}
                          onDrop={e => {
                            e.stopPropagation();
                            const draggedId = e.dataTransfer.getData('application/faq-question-id');
                            if (draggedId) handleReorderItems(draggedId, item.id);
                          }}
                          onDragEnd={() => { setDraggingQId(null); setDragOverQId(null); }}
                        />
                      );
                    });
                  })()}
                </div>

                <div
                  aria-hidden={!showStarterContent}
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity duration-300 ease-out',
                    showStarterContent
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0',
                  )}
                >
                  <EmptyFAQCanvasState onSelectTemplate={handleSelectTemplate} />
                </div>
              </div>

            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right score panel ─────────────────────────────────────────── */}
      <EditorScorePanel
        open={scorePanelOpen && docItems.length > 0 && !isGeneratingFromCopilot}
        onClose={() => setScorePanelOpen(false)}
        config={faqConfig}
        dimensions={buildFAQScoreDimensions(setScore)}
        score={setScore}
        onItemFixed={handleItemFixed}
        onItemFixing={handleItemFixing}
        onFixAll={handleFixAll}
        scoreLabel="Content score"
        maxImprovements={baseScore !== undefined ? 1 : undefined}
      />

      {/* ── Comment panel ─────────────────────────────────────────────── */}
      <CommentPanel
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* ── Activity panel ────────────────────────────────────────────── */}
      <ContentActivityDrawer
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        contentType="faq"
      />

      {/* ── Save to Saved modal ──────────────────────────────────────── */}
      {savingTarget !== null && (() => {
        const snippets = questionItems.map(q => q.question).slice(0, 3);
        return (
          <SaveToSavedModal
            open
            onClose={() => setSavingTarget(null)}
            defaultName="FAQ content"
            previewSnippets={snippets}
            onSave={name => {
              addSavedBlock({
                name,
                createdBy: 'Haresh R.',
                sourceType: 'faq-full',
                preview: { title: 'Full FAQ page', snippets },
              });
              setSavingTarget(null);
            }}
          />
        );
      })()}

      {/* ── Publish / Export modal ────────────────────────────────────── */}
      <FAQPublishModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        faqs={questionItems.map(q => ({
          faq_id: q.id,
          question: q.question,
          answer: q.answer,
          intent: 'informational' as const,
          funnel_stage: 'awareness' as const,
          editorialScore: q.status === 'ready' ? 82 : 45,
          lowestDimension: q.status === 'ready' ? '' : 'Answer depth',
          status: q.status === 'ready' ? 'ready' : ('needs-work' as const),
          warnings: q.warningText ? [q.warningText] : [],
          hardBlock: q.status === 'blocked',
        }))}
        overallScore={setScore}
      />
    </div>
  );
}
