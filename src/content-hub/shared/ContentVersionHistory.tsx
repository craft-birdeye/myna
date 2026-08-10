import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
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
    { type: 'hero-title', text: 'Are Dental Implants Right for You? A Complete Guide' },
    { type: 'hero-subtitle', text: 'Everything you need to know about implants, candidacy, costs, and what to expect from the procedure' },
    { type: 'heading', text: 'Why dental implants are the gold standard for tooth replacement' },
    { type: 'paragraph', text: 'Dental implants are titanium posts surgically placed into the jawbone to act as artificial tooth roots. Once integrated, they support a crown, bridge, or denture — giving you a permanent, natural-looking solution that preserves bone and restores full chewing function.' },
    { type: 'heading', text: 'Am I a good candidate for implants?' },
    { type: 'bullets', items: ['Healthy gums with no active periodontal disease', 'Sufficient bone density to support the implant', 'Non-smoker or willing to quit during healing', 'Committed to good oral hygiene and follow-up care'] },
  ],
  v3: [
    { type: 'hero-title', text: 'Are Dental Implants Right for You? A Complete Guide' },
    { type: 'hero-subtitle', text: 'What patients need to know before choosing dental implants over other options', changed: true },
    { type: 'heading', text: 'What makes dental implants different from other options', changed: true },
    { type: 'paragraph', text: 'Unlike dentures or bridges, dental implants fuse with the jawbone through a process called osseointegration. This makes them the most stable and long-lasting tooth replacement option available today.', changed: true },
    { type: 'heading', text: 'Who is a good candidate?' },
    { type: 'bullets', items: ['Good overall and oral health', 'Adequate bone density in the jaw', 'No active gum disease', 'Realistic expectations about healing time'], changed: true },
  ],
  v2: [
    { type: 'hero-title', text: 'Dental Implants: What You Should Know', changed: true },
    { type: 'hero-subtitle', text: 'A guide to dental implants for patients considering tooth replacement', changed: true },
    { type: 'heading', text: 'What are dental implants?' },
    { type: 'paragraph', text: 'Dental implants replace missing teeth with a permanent solution. They look and feel like natural teeth and can last a lifetime with proper care.', changed: true },
    { type: 'bullets', items: ['Permanent tooth replacement', 'Looks and feels natural', 'Preserves jawbone'], changed: true },
  ],
  v1: [
    { type: 'hero-title', text: 'Are Dental Implants Right for You?', changed: true },
    { type: 'paragraph', text: 'Dental implants are a popular option for replacing missing teeth. Talk to your dentist to find out if they are right for you.', changed: true },
    { type: 'bullets', items: ['Long-lasting', 'Natural look', 'Requires surgery'], changed: true },
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
  const blocks        = BLOG_CONTENT[versionId];
  const titleBlock    = blocks.find(b => b.type === 'hero-title');
  const subtitleBlock = blocks.find(b => b.type === 'hero-subtitle');
  const headingBlocks = blocks.filter(b => b.type === 'heading');
  const paraBlocks    = blocks.filter(b => b.type === 'paragraph');
  const bulletsBlock  = blocks.find(b => b.type === 'bullets');

  const titleChanged    = titleBlock?.changed    ?? false;
  const subtitleChanged = subtitleBlock?.changed ?? false;
  const heading1Changed = headingBlocks[0]?.changed ?? false;
  const heading2Changed = headingBlocks[1]?.changed ?? false;
  const para1Changed    = paraBlocks[0]?.changed    ?? false;
  const bulletsChanged  = bulletsBlock?.changed  ?? false;
  const mediaChanged    = versionId === 'v1';

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-0">

      {/* Hero image */}
      <div className={cn('overflow-hidden rounded-t-xl', mediaChanged && BLOG_RING)}>
        <img
          src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=80"
          alt="Dental implants hero"
          className="w-full h-[220px] object-cover"
        />
      </div>

      {/* Article shell */}
      <div className="rounded-b-xl border border-t-0 border-border bg-background px-8 pt-6 pb-10 flex flex-col gap-5">

        {/* Tags + meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">Dental implants</span>
          <span className="inline-flex rounded-full bg-surface-hover px-2.5 py-1 text-[11px] text-muted-foreground">Patient education</span>
          <span className="ml-auto text-[11px] text-muted-foreground">5 min read · Dec 10, 2025</span>
        </div>

        {/* Title */}
        <h1 className={cn('text-[22px] leading-snug text-foreground', titleChanged && BLOG_HL)}>
          {titleBlock?.text ?? 'Are Dental Implants Right for You? A Complete Guide'}
        </h1>

        {/* Subtitle */}
        <p className={cn('text-[14px] leading-relaxed text-muted-foreground -mt-2', subtitleChanged && BLOG_HL)}>
          {subtitleBlock?.text ?? 'Everything you need to know about implants, candidacy, costs, and what to expect from the procedure'}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-2 border-y border-border py-3">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=64&h=64&fit=crop&q=80"
            alt="Dr. Sarah Chen"
            className="size-8 rounded-full object-cover"
          />
          <div>
            <p className="text-[12px] text-foreground">Dr. Sarah Chen, DDS</p>
            <p className="text-[11px] text-muted-foreground">Smile Dental Group · San Jose, CA</p>
          </div>
        </div>

        {/* Section heading 1 */}
        <h2 className={cn('text-[16px] text-foreground', heading1Changed && BLOG_HL)}>
          {headingBlocks[0]?.text ?? 'Why dental implants are the gold standard for tooth replacement'}
        </h2>

        {/* Body paragraph */}
        <p className={cn('text-[13px] text-foreground leading-relaxed', para1Changed && BLOG_HL)}>
          {paraBlocks[0]?.text ?? 'Dental implants are titanium posts surgically placed into the jawbone to act as artificial tooth roots. Once integrated, they support a crown, bridge, or denture — giving you a permanent, natural-looking solution that preserves bone and restores full chewing function.'}
        </p>

        {/* Callout box */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
          <p className="text-[13px] text-foreground leading-relaxed">
            <span className="text-primary">Did you know?</span> Dental implants have a 95–98% success rate over 10 years and are the only tooth-replacement option that stimulates natural bone growth.
          </p>
        </div>

        {/* Section heading 2 */}
        <h2 className={cn('text-[16px] text-foreground', heading2Changed && BLOG_HL)}>
          {headingBlocks[1]?.text ?? 'Am I a good candidate for implants?'}
        </h2>

        {/* Candidate checklist */}
        {bulletsBlock?.items && (
          <ul className={cn('flex flex-col gap-2', bulletsChanged && 'bg-yellow-50 rounded-xl px-4 py-3 border border-yellow-200')}>
            {bulletsBlock.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-foreground">
                <span className="mt-0.5 size-4 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[['95–98%', 'long-term success rate'], ['30 min', 'typical placement time'], ['15–25 yrs', 'average lifespan']].map(([val, lbl]) => (
            <div key={lbl} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
              <p className="text-[18px] text-primary">{val}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Inline image */}
        <div className={cn('overflow-hidden rounded-xl', mediaChanged && BLOG_RING)}>
          <img
            src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80"
            alt="Dental consultation"
            className="w-full h-[160px] object-cover"
          />
          <p className="bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
            A consultation with your dentist is the first step to determining implant candidacy.
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-primary px-5 py-4 text-primary-foreground flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px]">Ready to explore dental implants?</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-primary-foreground/75">
              Book a free consultation with our implant specialists today.
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] text-white">
            Book now
          </div>
        </div>

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
                    isSelected ? 'bg-primary/5' : 'hover:bg-surface-hover',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-foreground">{version.date}</span>
                    {isSelected && (
                      <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
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
