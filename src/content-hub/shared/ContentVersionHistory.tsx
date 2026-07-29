import { ArrowLeft, Check, AlertCircle, Video } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/contenthub-ui/utils';
import { Button } from '@/contenthub-ui/button';
import { ReadOnlyContentCard } from '@/content-hub/editor/EditorContentCard';
import type { ContentCardData } from '@/content-hub/editor/EditorContentCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/contenthub-ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type VersionId = 'v4' | 'v3' | 'v2' | 'v1';

interface Version {
  id: VersionId;
  date: string;
  author: string;
  initials: string;
  avatarColor: string;
  isCurrent: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  answerChanged?: boolean;
}

interface FAQVersionSection {
  title: string;
  items: FAQItem[];
}

interface BlogVersionBlock {
  type: 'hero-title' | 'hero-subtitle' | 'heading' | 'paragraph' | 'bullets';
  text?: string;
  items?: string[];
  changed?: boolean;
}

// Which card IDs changed in each project version (compared to the current)
type ProjectVersionChanges = Record<VersionId, Set<string>>;

// ── Mock data ─────────────────────────────────────────────────────────────────

const VERSIONS: Version[] = [
  {
    id: 'v4',
    date: 'Dec 10, 2025 10:11 AM',
    author: 'James Wilson',
    initials: 'JW',
    avatarColor: 'bg-[#1c2b3a] text-white',
    isCurrent: true,
  },
  {
    id: 'v3',
    date: 'Dec 04, 2025 11:24 AM',
    author: 'Sarah Mitchell',
    initials: 'SM',
    avatarColor: 'bg-[#bbf7d0] text-[#14532d]',
    isCurrent: false,
  },
  {
    id: 'v2',
    date: 'Nov 28, 2025 04:12 PM',
    author: 'David Parker',
    initials: 'DP',
    avatarColor: 'bg-[#e0d7ff] text-[#4c1d95]',
    isCurrent: false,
  },
  {
    id: 'v1',
    date: 'Nov 28, 2025 11:24 AM',
    author: 'Emily Johnson',
    initials: 'EJ',
    avatarColor: 'bg-[#fef3c7] text-[#78350f]',
    isCurrent: false,
  },
];

const FAQ_CONTENT: Record<VersionId, FAQVersionSection[]> = {
  v4: [
    {
      title: 'General questions',
      items: [
        {
          question: 'How quickly can you respond to an emergency?',
          answer: 'Our team is available 24/7 and typically responds to emergency calls within 30–60 minutes. We prioritize urgent situations to minimize disruption and ensure your safety.',
        },
        {
          question: 'Do you offer same-day service?',
          answer: 'Yes, we offer same-day service for most requests submitted before 2 PM local time. Availability may vary during peak periods or holidays.',
        },
        {
          question: 'Are you licensed and insured?',
          answer: 'We are fully licensed, bonded, and insured. Our technicians carry all required certifications and our work is backed by a 1-year service guarantee.',
        },
      ],
    },
    {
      title: 'Pricing and appointments',
      items: [
        {
          question: 'How do I book an appointment?',
          answer: 'You can book online at our website, call us directly, or use our app. Online bookings are available 24/7 and confirmed instantly.',
        },
        {
          question: 'How much does a standard service call cost?',
          answer: 'Standard service calls start at $85 for the first hour, with materials billed separately. We provide a detailed estimate before any work begins.',
        },
        {
          question: 'Can I reschedule or cancel my appointment?',
          answer: 'Yes, appointments can be rescheduled or cancelled up to 24 hours in advance at no charge. Same-day cancellations may incur a $25 fee.',
        },
      ],
    },
  ],
  v3: [
    {
      title: 'General questions',
      items: [
        {
          question: 'How quickly can you respond to an emergency?',
          answer: 'Our team responds to emergency calls as quickly as possible. We prioritize urgent situations to minimize disruption.',
          answerChanged: true,
        },
        {
          question: 'Do you offer same-day service?',
          answer: 'Yes, we offer same-day service for most requests submitted before 2 PM local time. Availability may vary during peak periods or holidays.',
        },
        {
          question: 'Are you licensed and insured?',
          answer: 'We are fully licensed and insured. Our technicians carry all required certifications.',
          answerChanged: true,
        },
      ],
    },
    {
      title: 'Pricing and appointments',
      items: [
        {
          question: 'How do I book an appointment?',
          answer: 'You can book online at our website or call us directly.',
          answerChanged: true,
        },
        {
          question: 'How much does a standard service call cost?',
          answer: 'Standard service calls start at $85 for the first hour, with materials billed separately. We provide a detailed estimate before any work begins.',
        },
        {
          question: 'Can I reschedule or cancel my appointment?',
          answer: 'Yes, appointments can be rescheduled or cancelled with advance notice.',
          answerChanged: true,
        },
      ],
    },
  ],
  v2: [
    {
      title: 'General questions',
      items: [
        {
          question: 'How quickly can you respond to an emergency?',
          answer: 'Our team responds to emergency calls as quickly as possible.',
          answerChanged: true,
        },
        {
          question: 'Do you offer same-day service?',
          answer: 'Same-day service may be available depending on schedule. Contact us to check.',
          answerChanged: true,
        },
        {
          question: 'Are you licensed and insured?',
          answer: 'We are fully licensed and insured.',
          answerChanged: true,
        },
      ],
    },
    {
      title: 'Pricing and appointments',
      items: [
        {
          question: 'How do I book an appointment?',
          answer: 'Call us or visit our website to schedule a service visit.',
          answerChanged: true,
        },
        {
          question: 'How much does a standard service call cost?',
          answer: 'Contact us for current pricing information.',
          answerChanged: true,
        },
      ],
    },
  ],
  v1: [
    {
      title: 'General questions',
      items: [
        {
          question: 'How quickly can you respond to an emergency?',
          answer: 'Contact us and we will get back to you as soon as possible.',
          answerChanged: true,
        },
        {
          question: 'Do you offer same-day service?',
          answer: 'Please call us to discuss availability.',
          answerChanged: true,
        },
      ],
    },
    {
      title: 'Pricing and appointments',
      items: [
        {
          question: 'How do I book an appointment?',
          answer: 'Call us or send us an email to schedule.',
          answerChanged: true,
        },
      ],
    },
  ],
};

const BLOG_CONTENT: Record<VersionId, BlogVersionBlock[]> = {
  v4: [
    { type: 'hero-title', text: 'The Complete Guide to Building Exceptional Customer Experiences' },
    { type: 'hero-subtitle', text: 'Proven strategies that leading brands use to turn every interaction into a loyalty-building moment' },
    { type: 'heading', text: 'Why customer experience is the ultimate differentiator' },
    { type: 'paragraph', text: 'In today\'s hyper-competitive landscape, the quality of your customer experience is the single greatest differentiator available to any business. Customers who feel genuinely valued don\'t just return — they become advocates.' },
    { type: 'heading', text: 'Five strategies that consistently work' },
    { type: 'bullets', items: ['Respond to every review within 24 hours', 'Personalise onboarding for each customer segment', 'Build a feedback loop that feeds directly into product', 'Empower front-line staff to resolve issues on the spot'] },
  ],
  v3: [
    { type: 'hero-title', text: 'The Complete Guide to Building Exceptional Customer Experiences' },
    { type: 'hero-subtitle', text: 'How leading brands create loyalty-building interactions', changed: true },
    { type: 'heading', text: 'Why customer experience matters', changed: true },
    { type: 'paragraph', text: 'Customer experience has become increasingly important for businesses. Customers who feel valued are more likely to return and recommend your brand.', changed: true },
    { type: 'heading', text: 'Key strategies for success', changed: true },
    { type: 'bullets', items: ['Respond to reviews promptly', 'Personalise the customer journey', 'Build a feedback loop', 'Empower your team'], changed: true },
  ],
  v2: [
    { type: 'hero-title', text: 'Building Better Customer Experiences', changed: true },
    { type: 'hero-subtitle', text: 'A practical guide for growing businesses', changed: true },
    { type: 'heading', text: 'Why customer experience matters' },
    { type: 'paragraph', text: 'Great customer experiences drive repeat business and referrals. Here are some tips to get started.', changed: true },
    { type: 'bullets', items: ['Reply to reviews', 'Personalise communications', 'Listen to feedback'], changed: true },
  ],
  v1: [
    { type: 'hero-title', text: 'How to Improve Customer Experience', changed: true },
    { type: 'paragraph', text: 'Customer experience is important for every business. This post covers the basics.', changed: true },
    { type: 'bullets', items: ['Be responsive', 'Be friendly', 'Follow up'], changed: true },
  ],
};

// Cards that match the live project canvas (same data, used in read-only version history)
const PROJECT_CANVAS_CARDS: ContentCardData[] = [
  { id: 'blog-1',   itemType: 'blog',   name: 'Blog post',   status: 'Ready', score: 78, approved: false },
  { id: 'social-1', itemType: 'social', name: 'Social post', status: 'Ready', score: 82, approved: false },
  { id: 'email-1',  itemType: 'email',  name: 'Email',       status: 'Draft', score: 65, approved: false },
  { id: 'faq-1',    itemType: 'faq',    name: 'FAQ page',    status: 'Ready', score: 88, approved: false },
];

// Which card IDs have changes in each historical version vs current
const PROJECT_CHANGED_IDS: ProjectVersionChanges = {
  v4: new Set([]),
  v3: new Set(['blog-1', 'social-1', 'faq-1']),
  v2: new Set(['blog-1', 'social-1', 'email-1']),
  v1: new Set(['blog-1', 'social-1', 'email-1', 'faq-1']),
};

// ── Read-only FAQ preview (matches FAQSectionCanvas visual style exactly) ─────

function FAQReadOnlyPreview({ versionId }: { versionId: VersionId }) {
  const sections = FAQ_CONTENT[versionId];
  return (
    <div className="mx-auto max-w-[1040px] rounded-lg bg-background px-[30px] pt-[30px] pb-14 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-[0.5px] ring-border/20">
      <div className="space-y-6">
        {sections.flatMap(section => section.items).map((item, qi) => (
          <div
            key={qi}
            className={cn(
              'group relative rounded-lg',
              item.answerChanged && 'bg-yellow-50/60',
            )}
          >
            <div className="flex items-start gap-4 px-4 py-4">
              <span className="mt-0.5 w-[34px] flex-shrink-0 select-none text-right text-[24px] leading-tight text-foreground">
                {qi + 1}.
              </span>
              <div className="flex-1 min-w-0 space-y-3">
                <p className="text-[24px] leading-tight text-foreground">
                  {item.question}
                </p>
                <p className={cn(
                  'text-[16px] leading-[1.55] text-foreground/90',
                  item.answerChanged && 'bg-yellow-100 rounded-[3px] px-1',
                )}>
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Read-only blog preview ─────────────────────────────────────────────────────
// Derives per-element amber highlights from the version's BLOG_CONTENT changed flags.

const BLOG_HL   = 'bg-yellow-100 rounded-[3px] px-1';
const BLOG_RING = 'ring-2 ring-yellow-300';

function BlogReadOnlyPreview({ versionId }: { versionId: VersionId }) {
  const blocks       = BLOG_CONTENT[versionId];
  const titleBlock   = blocks.find(b => b.type === 'hero-title');
  const subtitleBlock= blocks.find(b => b.type === 'hero-subtitle');
  const headingBlocks= blocks.filter(b => b.type === 'heading');
  const paraBlocks   = blocks.filter(b => b.type === 'paragraph');
  const bulletsBlock = blocks.find(b => b.type === 'bullets');

  const titleChanged    = titleBlock?.changed    ?? false;
  const subtitleChanged = subtitleBlock?.changed ?? false;
  const heading1Changed = headingBlocks[0]?.changed ?? false;
  const para1Changed    = paraBlocks[0]?.changed    ?? false;
  const bulletsChanged  = bulletsBlock?.changed  ?? false;
  // image / video / stats not tracked per-version — highlight only on v1 (initial draft)
  const mediaChanged    = versionId === 'v1';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">

      {/* Hero card */}
      <div className={cn(
        'overflow-hidden rounded-xl border border-border bg-gradient-to-br from-emerald-50 via-white to-blue-50',
        mediaChanged && BLOG_RING,
      )}>
        <div className="flex min-h-[180px] items-center justify-between gap-4 px-4 py-5">
          <div className="max-w-[58%] space-y-2">
            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
              Local SEO guide
            </span>
            <h2 className={cn('text-[20px] leading-tight text-foreground', titleChanged && BLOG_HL)}>
              {titleBlock?.text ?? 'The Complete Guide to Building Exceptional Customer Experiences'}
            </h2>
            <p className={cn('text-[12px] leading-relaxed text-muted-foreground', subtitleChanged && BLOG_HL)}>
              {subtitleBlock?.text ?? 'Proven strategies that leading brands use to turn every interaction into a loyalty-building moment'}
            </p>
          </div>
          <div className={cn(
            'flex h-[132px] flex-1 items-center justify-center rounded-xl bg-white/75 shadow-sm ring-1 ring-black/[0.05]',
            mediaChanged && BLOG_RING,
          )}>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
              <div className="h-12 w-16 rounded-lg bg-surface-hover" />
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Article heading */}
      <h2 className={cn('text-[18px] text-foreground leading-snug', heading1Changed && BLOG_HL)}>
        {headingBlocks[0]?.text ?? 'Why customer experience is the ultimate differentiator'}
      </h2>
      <p className="text-[12px] text-muted-foreground">~167 words · ~1 min read</p>

      {/* Body paragraph */}
      <p className={cn('text-[13px] text-foreground leading-relaxed', para1Changed && BLOG_HL)}>
        {paraBlocks[0]?.text ?? "In today's hyper-competitive landscape, the quality of your customer experience is the single greatest differentiator available to any business. Customers who feel genuinely valued don't just return — they become advocates."}
      </p>

      {/* Section heading 2 */}
      <h3 className="text-[15px] text-foreground">The AI Advantage</h3>
      <p className="text-[13px] text-foreground leading-relaxed">
        AI-powered response tools help local businesses respond faster and more consistently — without
        sacrificing personalisation. Rather than copy-paste replies, modern AI can personalise each
        response based on the reviewer's specific feedback and match your brand voice.
      </p>

      {/* Bullets */}
      {bulletsBlock?.items && (
        <ul className={cn('flex flex-col gap-1 pl-5', bulletsChanged && 'bg-yellow-50 rounded-lg px-4 py-2')}>
          {bulletsBlock.items.map((item, i) => (
            <li key={i} className="text-[13px] text-foreground list-disc">{item}</li>
          ))}
        </ul>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[['23%', 'more review volume'], ['4.6x', 'faster response time'], ['89%', 'trust public replies']].map(([val, lbl]) => (
          <div key={lbl} className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[18px] text-foreground">{val}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-[15px] text-foreground">Implementation checklist</h3>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground">
          <li>Train reply guidance on your best historical responses and brand guardrails.</li>
          <li>Route low-score or sensitive reviews to a human reviewer before publishing.</li>
          <li>Measure response time, review velocity, and customer sentiment by location.</li>
        </ul>
      </div>

      {/* Video embed */}
      <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', mediaChanged && BLOG_RING)}>
        <div className="flex h-[180px] items-center justify-center bg-gradient-to-br from-zinc-900 to-emerald-950">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/15 text-white">
            <Video size={22} strokeWidth={1.6} absoluteStrokeWidth />
          </div>
        </div>
        <div className="px-4 py-2">
          <p className="text-[12px] text-white">Video embed: responding to a difficult review</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">2:18 · Customer experience training clip</p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-primary px-4 py-4 text-primary-foreground">
        <p className="text-[15px]">Ready to respond faster?</p>
        <p className="mt-1 text-[12px] leading-relaxed text-primary-foreground/80">
          Start with your top three review scenarios and build an approval workflow your team trusts.
        </p>
      </div>

    </div>
  );
}

// ── Read-only project canvas (version history) ────────────────────────────────

function ProjectVersionCanvas({ versionId }: { versionId: VersionId }) {
  const changedIds = PROJECT_CHANGED_IDS[versionId];
  const isCurrent = versionId === 'v4';

  return (
    <div className="flex flex-col gap-4 max-w-[860px] mx-auto">
      {!isCurrent && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-hover border border-border/70">
          <AlertCircle size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary flex-none" />
          <p className="text-[12px] text-text-secondary">Cards highlighted in amber changed since the current version.</p>
        </div>
      )}
      {PROJECT_CANVAS_CARDS.map(card => (
        <ReadOnlyContentCard
          key={card.id}
          card={card}
          changed={changedIds.has(card.id)}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export interface ContentVersionHistoryProps {
  contentType: 'faq' | 'blog' | 'project';
  onClose: () => void;
}

export function ContentVersionHistory({ contentType, onClose }: ContentVersionHistoryProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<VersionId>('v4');
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  const selectedVersion = VERSIONS.find(v => v.id === selectedVersionId)!;
  const isCurrentVersion = selectedVersion.isCurrent;

  function handleRestoreConfirm() {
    setRestoreConfirmOpen(false);
    setSelectedVersionId('v4');
    onClose();
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 h-[52px] px-6 bg-background border-b border-border">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center size-[34px] rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <span className="text-[15px] text-foreground">Version history</span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={isCurrentVersion} onClick={() => setRestoreConfirmOpen(true)}>
            Restore
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-2 p-2 bg-[var(--color-canvas,#F7F8FA)]">
        {/* Read-only content preview */}
        <div className="flex-1 min-w-0 overflow-y-auto rounded-xl bg-background border border-border/60">
          <div className="px-8 py-6 pb-10">
            {contentType === 'project' ? (
              <ProjectVersionCanvas versionId={selectedVersionId} />
            ) : contentType === 'blog' ? (
              <BlogReadOnlyPreview versionId={selectedVersionId} />
            ) : (
              <FAQReadOnlyPreview versionId={selectedVersionId} />
            )}
          </div>
        </div>

        {/* Version list panel */}
        <div
          className="shrink-0 flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background"
          style={{ width: 300 }}
        >
          <div className="shrink-0 px-4 py-2 border-b border-border">
            <p className="text-[13px] text-foreground">All versions</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {VERSIONS.map(version => {
              const isSelected = selectedVersionId === version.id;
              const projectChangedCount = contentType === 'project'
                ? PROJECT_CHANGED_IDS[version.id].size
                : 0;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className={cn(
                    'w-full text-left px-4 py-4 flex flex-col gap-2 transition-colors',
                    isSelected ? 'bg-yellow-50' : 'hover:bg-surface-hover',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-foreground">{version.date}</span>
                    {isSelected && (
                      <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px]',
                      version.avatarColor,
                    )}>
                      {version.initials}
                    </div>
                    <span className="text-[12px] text-muted-foreground">{version.author}</span>
                  </div>
                  {contentType === 'project' && !version.isCurrent && projectChangedCount > 0 && (
                    <span className="text-[11px] text-text-secondary bg-surface-hover px-2 py-0.5 rounded-full w-fit">
                      {projectChangedCount} {projectChangedCount === 1 ? 'item' : 'items'} changed
                    </span>
                  )}
                  {version.isCurrent && (
                    <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                      Current version
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Restore confirmation dialog */}
      <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Restore this version?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground leading-relaxed -mt-1">
            This will replace your current content with the version from{' '}
            <span className="text-foreground">{selectedVersion.date}</span>.
            Your current version will remain accessible in version history.
          </p>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestoreConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRestoreConfirm}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
