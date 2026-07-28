import { type KeyboardEvent, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookMarked, CalendarDays, ChevronRight, Columns2, Copy, Eye, LayoutGrid, List, ListFilter, MoreVertical, Pencil, Search,
  FileText, Share2, Mail, MessageSquare, Monitor, Megaphone, MessageCircle, X, Check,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { Badge } from '@/contenthub-ui/badge';
import { Input } from '@/contenthub-ui/input';
import {
  type ProjectRow,
  type ProjectStatus,
  ProjectThumbnail,
  StatusCell,
  ChannelCell,
  RowActions,
  type ChannelId,
} from './projectShared';
import { TEMPLATES, type ContentType, type TemplateItem, TemplateThumbnail, TYPE_THUMB_BG, FAQ_DATA, BLOG_DATA } from './TemplateGallery';
import { CalendarView as ContentHubCalendarView } from './CalendarView';
import { DataTable, FilterPanel, CustomizeColumnsDrawer, Tabs, type Column as MYNAColumn, type ColumnOption, type FilterField, type SelectOption } from '../components';
import type { Tab } from '../components';

// ── Mock data ─────────────────────────────────────────────────────────────────

const PROJECTS: ProjectRow[] = [
  { id: 11, name: 'Lawn care FAQ',                     status: 'Published', channels: ['faq'],                                                        locations: 500, updated: 'Nov 07, 2025', createdBy: 'Noah P',    hue: 50  },
  { id: 12, name: 'Service & pricing FAQ',             status: 'Drafts',    channels: ['faq'],                                                        locations: 500, updated: 'Nov 07, 2025', createdBy: 'Olivia R',  hue: 300 },
  { id: 13, name: 'How to overseed your lawn',         status: 'Published', channels: ['blog'],                                                       locations: 500, updated: 'Nov 06, 2025', createdBy: 'Liam G',    hue: 110 },
  { id: 14, name: 'Native plant guide',                status: 'Scheduled', channels: ['blog'],                                                       locations: 500, updated: 'Nov 06, 2025', createdBy: 'Sophia L',  hue: 230 },
  { id: 1,  name: 'Spring garden cleanup',             status: 'Drafts',    channels: ['facebook','instagram','twitter','linkedin','youtube','web'],  locations: 500, updated: 'Nov 05, 2025', createdBy: 'Elijah M',  hue: 160 },
  { id: 2,  name: 'Sustainable lawn care launch 🌱',   status: 'Scheduled', channels: ['web','blog','email'],                                          locations: 500, updated: 'Nov 04, 2025', createdBy: 'Jacob K',   hue: 210 },
  { id: 3,  name: 'Before & after showcase',           status: 'Scheduled', channels: ['facebook','instagram','twitter','linkedin','youtube','email'], locations: 500, updated: 'Nov 03, 2025', createdBy: 'Ava T',     hue: 280 },
  { id: 4,  name: 'Summer backyard bliss ☀️',          status: 'Scheduled', channels: ['web','blog','email'],                                          locations: 500, updated: 'Nov 01, 2025', createdBy: 'Emily S',   hue: 40  },
  { id: 5,  name: 'Customer testimonial campaign',     status: 'Drafts',    channels: ['facebook','instagram','twitter','linkedin','youtube','web'],   locations: 500, updated: 'Sep 05, 2025', createdBy: 'William S', hue: 20  },
  { id: 6,  name: 'Fall planting season',              status: 'Published', channels: ['web','blog','email'],                                          locations: 500, updated: 'Sep 05, 2025', createdBy: 'James K',   hue: 90  },
  { id: 7,  name: 'Holiday outdoor lighting',          status: 'Published', channels: ['facebook','instagram','twitter','linkedin','youtube','email'], locations: 500, updated: 'Sep 05, 2025', createdBy: 'Emma W',    hue: 320 },
  { id: 8,  name: 'Local business partnership',        status: 'Published', channels: ['web','blog','email'],                                          locations: 500, updated: 'Sep 05, 2025', createdBy: 'Mia S',     hue: 190 },
  { id: 9,  name: 'Sustainable landscaping education', status: 'Published', channels: ['facebook','instagram','web','blog'],                           locations: 500, updated: 'Sep 05, 2025', createdBy: 'Mia S',     hue: 130 },
  { id: 10, name: 'Re-engagement offer',               status: 'Published', channels: ['web','blog','email'],                                          locations: 500, updated: 'Sep 05, 2025', createdBy: 'Mia S',     hue: 260 },
];

const TEMPLATE_CREATORS = ['BirdAI', 'Content team', 'Marketing team', 'SEO team'] as const;

const BRAND_BY_ID: Record<number, string> = {
  11: 'GreenPro™',  12: 'GreenPro™',  13: 'EcoLawn',    14: 'EcoLawn',
  1:  'BirdBrand',  2:  "Nature's Best", 3: 'BirdBrand', 4:  "Nature's Best",
  5:  'GreenScape', 6:  'GreenScape',  7:  'BirdBrand',  8:  'EcoLawn',
  9:  'GreenScape', 10: "Nature's Best",
};

function getChannelType(channels: ChannelId[]): string {
  if (channels.includes('faq'))  return 'FAQ';
  if (channels.includes('blog')) return 'Blog';
  const social = ['facebook','instagram','twitter','linkedin','youtube'];
  if (channels.some(c => social.includes(c))) return 'Social';
  return 'Landing page';
}

function getTemplateCreator(templateId: string) {
  const seed = templateId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TEMPLATE_CREATORS[seed % TEMPLATE_CREATORS.length];
}

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, onActivate: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onActivate();
}

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'saved' | 'library';
type ViewMode = 'list' | 'grid' | 'calendar';

const TABS: Tab[] = [
  { id: 'saved',   label: 'Saved',   count: 50 },
  { id: 'library', label: 'Library', count: 40 },
];

// ── Template type colours + icons ─────────────────────────────────────────────

const TYPE_LABEL: Record<ContentType, string> = {
  faq: 'FAQ', social: 'Social', email: 'Email',
  blog: 'Blog', response: 'Review response', ads: 'Ads',
};

const TYPE_BADGE_VARIANT: Record<ContentType, 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'purple'> = {
  faq:      'outline',
  social:   'purple',
  email:    'default',
  blog:     'secondary',
  response: 'outline',
  ads:      'secondary',
};

// ── Library table row ─────────────────────────────────────────────────────────

type LibraryRow = Record<string, unknown> & {
  id: string;
  name: string;
  contentType: ContentType;
  score: number;
  brand: string;
  lastUpdated: string;
  createdBy: string;
  tmpl: TemplateItem;
};

const LIBRARY_COLUMNS: import('../components').Column<LibraryRow>[] = [
  {
    key: 'name',
    label: 'Name',
    width: 320,
    sortable: true,
    render: (_v, row) => (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[80px] h-[60px] rounded-lg flex-shrink-0 overflow-hidden border border-black/[0.07] bg-surface-hover p-[5px] flex">
          <div className="w-full h-full rounded-[4px] overflow-hidden">
            <TemplateThumbnail template={row.tmpl} />
          </div>
        </div>
        <span className="truncate text-body text-text-primary group-hover/row:text-text-action transition-colors">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'contentType',
    label: 'Content type',
    width: 140,
    sortable: true,
    render: (_v, row) => (
      <span className="text-body text-text-primary">{row.contentType === 'faq' ? 'FAQ' : 'Blog'}</span>
    ),
  },
  {
    key: 'score',
    label: 'Content score',
    width: 160,
    sortable: true,
    render: (_v, row) => (
      <span className="text-body tabular-nums" style={{ color: row.score >= 90 ? '#377e2c' : 'var(--color-text-secondary)' }}>
        {row.score}/100
      </span>
    ),
  },
  { key: 'brand',       label: 'Brand identity', width: 180, sortable: true },
  { key: 'lastUpdated', label: 'Last updated',   width: 160, sortable: true },
  { key: 'createdBy',   label: 'Created by',     width: 140, sortable: true },
];

const TYPE_THUMB: Record<ContentType, { iconBg: string; iconColor: string; Icon: React.ElementType }> = {
  faq:      { iconBg: 'bg-primary/10',   iconColor: 'text-primary',   Icon: MessageSquare },
  social:   { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', Icon: Share2        },
  email:    { iconBg: 'bg-primary/10', iconColor: 'text-primary', Icon: Mail          },
  blog:     { iconBg: 'bg-slate-200',  iconColor: 'text-slate-600',  Icon: FileText      },
  response: { iconBg: 'bg-green-100',  iconColor: 'text-text-primary',  Icon: MessageCircle },
  ads:      { iconBg: 'bg-surface-hover',  iconColor: 'text-text-secondary',  Icon: Megaphone     },
};

const CONTENT_TYPE_OPTIONS = ['All', ...Object.values(TYPE_LABEL)];
const PROJECT_CHANNEL_OPTIONS = ['All channels', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Web', 'Blog', 'Email'];
const PROJECT_CREATOR_OPTIONS = ['All creators', ...Array.from(new Set(PROJECTS.map(project => project.createdBy)))];
const PROJECT_STATUS_OPTIONS = ['All statuses', 'Drafts', 'Scheduled', 'Published'];
const TEMPLATE_TAG_OPTIONS = ['All tags', ...Array.from(new Set(TEMPLATES.flatMap(template => template.useCases))).sort()];
const TEMPLATE_CREATOR_OPTIONS = ['All creators', ...TEMPLATE_CREATORS];

function toSelectOptions(options: string[]): SelectOption[] {
  return options.map(o => ({ value: o, label: o }));
}

const SAVED_FILTER_FIELDS: FilterField[] = [
  { id: 'status',    label: 'Status',       options: toSelectOptions(PROJECT_STATUS_OPTIONS),    multi: false },
  { id: 'channel',   label: 'Channel',      options: toSelectOptions(PROJECT_CHANNEL_OPTIONS),   multi: false },
  { id: 'creator',   label: 'Created by',   options: toSelectOptions(PROJECT_CREATOR_OPTIONS),   multi: false },
  { id: 'locations', label: 'Locations',    options: toSelectOptions(['Any locations', '1-100', '101-500', '500+']), multi: false },
];

const LIBRARY_FILTER_FIELDS: FilterField[] = [
  { id: 'contentType', label: 'Content type', options: toSelectOptions(CONTENT_TYPE_OPTIONS),    multi: false },
  { id: 'tag',         label: 'Tags',          options: toSelectOptions(TEMPLATE_TAG_OPTIONS),    multi: false },
  { id: 'creator',     label: 'Creator',       options: toSelectOptions(TEMPLATE_CREATOR_OPTIONS), multi: false },
  { id: 'goal',        label: 'Goal',          options: toSelectOptions(['Any goal', 'Search visibility', 'Customer education', 'Promotion', 'Retention', 'Reputation']), multi: false },
];

// ── Template preview modal ────────────────────────────────────────────────────

const SUBSCORE_DESCRIPTIONS: Record<string, string> = {
  'Intent Match':         'Measures how closely the content aligns with the intent behind user search queries, ensuring the page answers what people are actually looking for.',
  'Search Visibility':    'Evaluates how well the content is optimized to be surfaced by Google and AI search engines, covering keyword integration, query coverage, and internal linking.',
  'Content Depth':        'Assesses whether the content covers the topic thoroughly enough to satisfy both readers and search algorithms, including breadth of subtopics and word count.',
  'Brand Alignment':      'Checks that the tone, terminology, and messaging are consistent with your brand guidelines and voice across the entire piece.',
  'Publishing Readiness': 'Verifies that all structural and technical requirements are met before publishing, such as metadata completeness, heading hierarchy, and image alt text.',
};

const BLOG_SUBSCORES = [
  { name: 'Intent Match',         you: 89, warnings: 0 },
  { name: 'Search Visibility',    you: 94, warnings: 2 },
  { name: 'Content Depth',        you: 91, warnings: 1 },
  { name: 'Brand Alignment',      you: 88, warnings: 0 },
  { name: 'Publishing Readiness', you: 91, warnings: 0 },
];

const FAQ_SUBSCORES = [
  { name: 'Intent Match',         you: 96, warnings: 0 },
  { name: 'Search Visibility',    you: 95, warnings: 1 },
  { name: 'Content Depth',        you: 94, warnings: 0 },
  { name: 'Brand Alignment',      you: 93, warnings: 0 },
  { name: 'Publishing Readiness', you: 92, warnings: 0 },
];

const BLOG_SECTIONS: Record<string, { heroImage: string; sections: { heading?: string; body?: string; listItems?: string[] }[] }> = {
  'bl-1': {
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
    sections: [
      { body: "Choosing the right service provider can make or break your project. Whether you need plumbing, electrical, HVAC, or landscaping, this guide walks you through exactly how to evaluate your options and make a confident decision." },
      { heading: 'Step 1 — Define your scope before searching', body: "Before reaching out to any provider, write down exactly what you need. A clear scope helps you get accurate quotes and prevents scope creep once work begins." },
      { heading: 'Step 2 — Verify licences and insurance', body: "Always confirm that the provider holds the required licences for your state or region, and carries both general liability and workers' compensation insurance." },
      { heading: 'What to check', listItems: ['Active trade licence', 'General liability insurance (min $1M)', "Workers' compensation cover", 'References from recent jobs'] },
      { heading: 'Step 3 — Get at least three quotes', body: "Never accept the first quote. Getting three comparable quotes gives you market context and negotiating power — and often reveals wide variation in how providers scope the same job." },
      { heading: 'Step 4 — Read reviews on multiple platforms', body: "Check Google, Yelp, and any industry-specific platforms relevant to the trade. Look for patterns across reviews, not just the overall star rating." },
    ],
  },
  'bl-2': {
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    sections: [
      { body: "Finding reliable HVAC services in Austin has never been more important, with record-breaking summers pushing cooling systems to their limits. Here's everything local homeowners and businesses need to know." },
      { heading: 'Why local expertise matters', body: "Austin's climate is unique — extreme summer heat, mild winters, and high humidity all affect how HVAC systems are sized and maintained. Local providers understand these conditions better than national chains." },
      { heading: 'Top services offered in Austin', listItems: ['Central AC installation and replacement', 'Air duct cleaning and sealing', 'Ductless mini-split systems', 'Preventative maintenance plans', '24/7 emergency repair'] },
      { heading: 'Seasonal maintenance tips', body: "Schedule a tune-up each spring before the summer heat peaks and again in autumn before cooler weather sets in. Regular filter changes every 30–60 days are one of the most cost-effective steps you can take." },
    ],
  },
  'bl-3': {
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80',
    sections: [
      { body: "You don't need a big budget to make meaningful improvements to your home. These 10 changes will boost your comfort, curb appeal, and property value without breaking the bank." },
      { heading: '1. Repaint interior walls', body: "A fresh coat of paint is the highest-ROI home improvement you can make. Neutral tones like warm greige or off-white make rooms feel larger and more modern." },
      { heading: '2. Upgrade cabinet hardware', body: "Swapping out dated knobs and pulls in kitchens and bathrooms can transform the feel of a room for under $100 in materials." },
      { heading: '3–10 quick wins', listItems: ['Install LED lighting throughout', 'Replace worn weather stripping on doors', 'Deep-clean and re-caulk bathroom tiles', 'Add smart thermostat for energy savings', 'Plant low-maintenance native shrubs at entry', 'Install a new letterbox and house numbers', 'Power-wash driveway and walkways', 'Replace old window screens'] },
    ],
  },
  'bl-4': {
    heroImage: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=900&q=80',
    sections: [
      { body: "ABC Plumbing had a solid reputation built on word of mouth, but they were nearly invisible online. In just six months, a focused review strategy transformed their digital presence and drove a 340% increase in verified reviews." },
      { heading: 'The challenge', body: "Despite 18 years of operation and hundreds of satisfied customers, ABC Plumbing had fewer than 40 Google reviews — making them appear less established than newer competitors." },
      { heading: 'The approach', listItems: ['Automated SMS review requests sent within 2 hours of job completion', 'Staff trained to verbally mention reviews on-site', 'Negative feedback intercepted via internal survey before going public', 'Monthly performance tracking against local competitors'] },
      { heading: 'The results after 6 months', body: "Review count grew from 38 to 167. Average star rating moved from 4.1 to 4.7. Website traffic from organic search increased by 62%." },
    ],
  },
};

const FAQ_ANSWERS: Record<string, string> = {
  "What's included in the new product?": "Our new product includes full access to the core feature set, priority support, and a dedicated onboarding session at no extra cost.",
  'When does early access open?': "Early access opens on the first Monday of next month. Sign up now to lock in your spot and receive a launch-day discount.",
  'Is there a free trial available?': "Yes — we offer a 14-day free trial with no credit card required. You get full access to every feature from day one.",
  'Can I upgrade my plan later?': "Absolutely. You can upgrade at any time directly from your account dashboard, and your billing will be prorated automatically.",
  'What are your business hours?': "We are open Monday through Friday from 8 AM to 6 PM, and Saturday from 9 AM to 2 PM. Emergency support is available 24/7.",
  'Is parking available on-site?': "Yes, free parking is available in our dedicated lot directly behind the building. Accessible spaces are located closest to the main entrance.",
  'Do you offer same-day service?': "Same-day service is available for most requests submitted before noon. Contact us first thing in the morning to confirm availability.",
  'How do I book an appointment?': "You can book online via our website, call us directly, or walk in during business hours. Online booking is available around the clock.",
  'How much does the service cost?': "Pricing depends on the scope of work. We offer a free 15-minute consultation to assess your needs and provide an accurate, itemised quote.",
  'Do you offer a money-back guarantee?': "Yes — we offer a 30-day satisfaction guarantee. If you are not satisfied for any reason, we will make it right or issue a full refund.",
  'What happens after I sign up?': "You will receive a welcome email with next steps and be assigned a dedicated account manager within 24 hours of signing up.",
  'Are there any hidden fees?': "None. All costs are clearly outlined upfront before you commit. The price you are quoted is the price you pay.",
  'Who is the best provider near me?': "We serve your area and are consistently rated #1 by local customers on Google and Yelp. Check our reviews page to see what neighbours are saying.",
  'How fast can I get a response?': "Our team typically responds within 1 business hour during operating hours. After-hours enquiries are actioned first thing the next morning.",
  'What makes you different?': "We combine deep industry expertise with a personalised approach. Every client gets a tailored solution built around their specific needs — never a template.",
  'Do you serve my area?': "We currently serve all major metro areas. Enter your zip code on our website to confirm coverage and see available service windows in your area.",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
    >
      {copied
        ? <Check size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        : <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />}
    </button>
  );
}

const TEMPLATE_DATES: Record<string, string> = {
  'bl-1': 'Nov 03, 2025', 'bl-2': 'Nov 04, 2025', 'bl-3': 'Nov 05, 2025', 'bl-4': 'Nov 06, 2025',
  'fq-1': 'Nov 03, 2025', 'fq-2': 'Nov 04, 2025', 'fq-3': 'Nov 05, 2025', 'fq-4': 'Nov 06, 2025',
};

const TEMPLATE_BRAND: Record<string, string> = {
  'bl-1': 'Birdeye', 'bl-2': 'Aspen Dental', 'bl-3': 'Birdeye', 'bl-4': 'AutoNation',
  'fq-1': 'Birdeye', 'fq-2': 'Aspen Dental', 'fq-3': 'Birdeye', 'fq-4': 'AutoNation',
};

function TemplatePreviewModal({ tmpl, onClose, onUse }: { tmpl: TemplateItem | null; onClose: () => void; onUse: (t: TemplateItem) => void }) {
  if (!tmpl) return null;
  const isBlog = tmpl.type === 'blog';
  const blogData = BLOG_SECTIONS[tmpl.id];
  const faqData = FAQ_DATA[tmpl.id];
  const subScores = isBlog ? BLOG_SUBSCORES : FAQ_SUBSCORES;
  const aeoScore = isBlog ? 92 : 95;
  const slug = tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const [openScore, setOpenScore] = useState<string | null>(null);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(33,33,33,0.64)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-lg shadow-modal flex flex-col overflow-hidden mt-12 mb-12"
        style={{ width: 1200, maxWidth: 'calc(100vw - 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background rounded-t-lg">
          <span className="text-[16px] text-foreground">Preview {isBlog ? 'blog' : 'FAQ'}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUse(tmpl)}
              className="h-9 rounded-md bg-primary px-4 text-[14px] text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Use content
            </button>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors">
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body: two bordered cards */}
        <div className="flex gap-5 px-5 pb-5 pt-5 min-h-0" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          {/* Left card: AEO score panel + metadata */}
          <div className="w-[320px] shrink-0 border border-border rounded-lg overflow-y-auto bg-background">
            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Big score */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-[44px] leading-none" style={{ color: '#377e2c' }}>{aeoScore}</span>
                <span className="text-[15px] text-muted-foreground">/ 100</span>
              </div>
              {/* Label */}
              <div className="flex items-center gap-1.5 -mt-2">
                <span className="text-[14px] text-muted-foreground">AEO Content score</span>
                <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40">
                  <span className="text-[10px] text-muted-foreground leading-none">?</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${aeoScore}%`, backgroundColor: '#377e2c' }} />
              </div>
              {/* Sub-scores */}
              <div className="flex flex-col">
                {subScores.map(sub => (
                  <div key={sub.name}>
                    <button
                      className="flex w-full items-center gap-1.5 py-2.5 text-left hover:bg-muted/40 transition-colors rounded"
                      onClick={() => setOpenScore(openScore === sub.name ? null : sub.name)}
                    >
                      <ChevronRight
                        size={14} strokeWidth={1.6} absoluteStrokeWidth
                        className={cn('shrink-0 text-muted-foreground transition-transform', openScore === sub.name && 'rotate-90')}
                      />
                      <span className="flex-1 text-[13px] text-foreground">{sub.name}</span>
                      <span className="text-[13px] text-foreground tabular-nums">{sub.you}</span>
                    </button>
                    {openScore === sub.name && (
                      <div className="pb-3 pl-5 pr-1">
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                          {SUBSCORE_DESCRIPTIONS[sub.name]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Metadata */}
              <div className="flex flex-col gap-4 pt-1 border-t border-border">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Topic</p>
                  <p className="text-[13px] text-foreground leading-relaxed">{tmpl.description}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Brand identity</p>
                  <p className="text-[13px] text-foreground">{TEMPLATE_BRAND[tmpl.id] ?? 'Birdeye'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Created by</p>
                  <p className="text-[13px] text-foreground">{getTemplateCreator(tmpl.id)} on {TEMPLATE_DATES[tmpl.id] ?? 'Nov 05, 2025'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Content type</p>
                  <p className="text-[13px] text-foreground">{tmpl.type === 'blog' ? 'Blog' : 'FAQ'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right card: full content preview */}
          <div className="flex-1 min-w-0 border border-border rounded-lg overflow-y-auto flex flex-col">
            {isBlog && blogData ? (
              <>
                {/* Article header */}
                <div className="px-10 pt-8 pb-5 shrink-0">
                  <h1 className="text-[24px] leading-tight tracking-tight text-foreground mb-4">
                    {BLOG_DATA[tmpl.id]?.title ?? tmpl.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">AI</div>
                    <span className="text-sm text-foreground">Birdeye AI</span>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-sm text-muted-foreground">15 min read</span>
                  </div>
                </div>
                {/* Hero image */}
                <div className="px-10 pb-6 shrink-0">
                  <img src={blogData.heroImage} alt={tmpl.name} className="w-full h-[220px] object-cover rounded-xl" />
                </div>
                {/* Article body */}
                <article className="flex flex-col flex-1 px-10 pb-8">
                  {blogData.sections.map((s, i) => (
                    <div key={i} className={s.heading ? 'mt-6' : 'mt-2'}>
                      {s.heading && <h2 className="mb-2 text-[18px] text-foreground">{s.heading}</h2>}
                      {s.body && <p className="text-[14px] text-foreground leading-relaxed">{s.body}</p>}
                      {s.listItems && s.listItems.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {s.listItems.map((item, j) => (
                            <li key={j} className="flex items-start gap-2.5 text-[14px] text-foreground leading-relaxed">
                              <span className="mt-2 w-1 h-1 rounded-full bg-primary shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </article>
                {/* SEO metadata */}
                <div className="border-t border-border px-8 py-5 shrink-0 flex flex-col gap-3 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">SEO metadata</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Meta title', value: BLOG_DATA[tmpl.id]?.title ?? tmpl.name },
                      { label: 'Meta description', value: tmpl.description },
                      { label: 'Slug', value: slug, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between gap-2 bg-background border border-border rounded px-3 py-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                          <span className={cn('text-[13px] text-foreground leading-snug mt-1', mono && 'font-mono text-muted-foreground')}>{value}</span>
                        </div>
                        <CopyButton text={value} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : faqData ? (
              <>
                {/* FAQ header */}
                <div className="px-10 pt-8 pb-5 shrink-0">
                  <h1 className="text-[24px] leading-tight tracking-tight text-foreground mb-2">{tmpl.name}</h1>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{tmpl.description}</p>
                </div>
                {/* FAQ Q&A */}
                <div className="flex flex-col flex-1 px-10 pb-8 divide-y divide-border">
                  {faqData.items.map((item, i) => (
                    <div key={i} className="py-5">
                      <p className="text-[15px] text-foreground mb-2">{item.q}</p>
                      <p className="text-[14px] text-foreground leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {FAQ_ANSWERS[item.q] ?? "Our team is happy to answer this — reach out and we will respond within one business day."}
                      </p>
                    </div>
                  ))}
                </div>
                {/* SEO metadata */}
                <div className="border-t border-border px-8 py-5 shrink-0 flex flex-col gap-3 bg-muted/30">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">SEO metadata</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Meta title', value: tmpl.name },
                      { label: 'Meta description', value: tmpl.description },
                      { label: 'Slug', value: slug, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-start justify-between gap-2 bg-background border border-border rounded px-3 py-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                          <span className={cn('text-[13px] text-foreground leading-snug mt-1', mono && 'font-mono text-muted-foreground')}>{value}</span>
                        </div>
                        <CopyButton text={value} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ tmpl, onUse, onPreview }: { tmpl: TemplateItem; onUse: (t: TemplateItem) => void; onPreview: (t: TemplateItem) => void }) {
  return (
    <div
      onKeyDown={(event) => handleCardKeyDown(event, () => onUse(tmpl))}
      role="button"
      tabIndex={0}
      className="bg-white border border-border rounded-xl overflow-hidden cursor-pointer transition-all group hover:shadow-card hover:border-primary/30 flex flex-col"
    >
      {/* Thumbnail area */}
      <div
        className="relative overflow-hidden"
        style={{ height: 178, background: TYPE_THUMB_BG[tmpl.type] }}
      >
        {/* Rich content thumbnail */}
        <div className="absolute inset-0 p-3">
          <div className="w-full h-full rounded-md overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.10)' }}>
            <TemplateThumbnail template={tmpl} />
          </div>
        </div>

        {/* Type chip — top right, white outlined pill matching Figma */}
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center h-5 px-2 rounded text-[10px] text-text-primary bg-white/95 border border-border shadow-sm">
            {TYPE_LABEL[tmpl.type]}
          </span>
        </div>

        {/* Hover overlay — two CTAs */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 pointer-events-none group-hover:pointer-events-auto"
          style={{ background: 'rgba(0,0,0,0.42)' }}
        >
          <button
            onClick={e => { e.stopPropagation(); onUse(tmpl); }}
            className="h-8 rounded-md bg-primary text-white text-[12px] transition-colors hover:bg-primary/90"
            style={{ width: 126 }}
          >
            Use content
          </button>
          <button
            onClick={e => { e.stopPropagation(); onPreview(tmpl); }}
            className="h-8 rounded-md text-foreground text-[12px] transition-colors hover:bg-white/90"
            style={{ width: 126, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.5)' }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Footer — name + author only */}
      <div className="px-3 py-2.5">
        <p className="text-[12px] text-foreground leading-snug truncate">{tmpl.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Created by Birdeye</p>
      </div>
    </div>
  );
}

function getProjectContentType(project: ProjectRow): ContentType {
  if (project.channels.includes('faq')) return 'faq';
  if (project.channels.includes('blog')) return 'blog';
  if (project.channels.includes('email')) return 'email';
  if (project.channels.includes('web')) return 'faq';
  return 'social';
}

const SAVED_STATUS_VARIANT: Record<ProjectStatus, 'secondary' | 'outline' | 'success'> = {
  Drafts:    'secondary',
  Scheduled: 'outline',
  Published: 'success',
};

function SavedContentGridCard({ project, onOpen }: { project: ProjectRow; onOpen: () => void }) {
  const type = getProjectContentType(project);
  const thumb = TYPE_THUMB[type];
  const { Icon } = thumb;
  const previewQuestions = [
    project.name,
    'Audience and channel plan',
    'Review checklist',
    'Publishing notes',
    'Performance goal',
  ];

  return (
    <div
      onClick={onOpen}
      onKeyDown={(event) => handleCardKeyDown(event, onOpen)}
      role="button"
      tabIndex={0}
      className="group border border-border rounded-md bg-background transition-all cursor-pointer flex flex-col overflow-hidden hover:border-primary/30"
    >
      <div className="relative h-[160px] overflow-hidden border-b border-border bg-surface-hover">
        <div className="absolute inset-0 p-6">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex h-[34px] items-center gap-2 border-b border-zinc-100 px-2">
              <div className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-[4px]', thumb.iconBg)}>
                <Icon size={10} strokeWidth={1.6} absoluteStrokeWidth className={thumb.iconColor} />
              </div>
              <span className="flex-1 text-[6px] text-text-secondary">{TYPE_LABEL[type]}</span>
              <div className="flex items-center gap-1">
                <div className="h-[3px] w-[34px] overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full w-4/5 rounded-full bg-primary" />
                </div>
                <span className="rounded-[2px] bg-primary/5 px-1 text-[5px] text-text-primary">78</span>
              </div>
            </div>
            <div className="border-b border-zinc-100 bg-surface-hover px-2 py-2">
              <span className="text-[6px] font-normal text-text-secondary">
                {type === 'faq' ? 'General questions' : `${TYPE_LABEL[type]} brief`}
              </span>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden px-2 py-1">
              {previewQuestions.map((line, index) => (
                <div key={line} className="border-b border-zinc-50 py-0.5 last:border-b-0">
                  <span className="block truncate text-[6px] text-text-secondary">
                    {line}
                  </span>
                  <div
                    className="mt-0.5 h-[2px] rounded-full bg-surface-hover"
                    style={{ width: `${index % 2 === 0 ? 82 : 66}%` }}
                  />
                </div>
              ))}
              <div className="mt-1 flex flex-col gap-0.5">
                <div className="h-[2px] w-11/12 rounded-full bg-surface-hover" />
                <div className="h-[2px] w-7/12 rounded-full bg-surface-hover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <ChannelCell channels={project.channels} />
          <Badge variant={SAVED_STATUS_VARIANT[project.status]}>{project.status}</Badge>
        </div>
        <p className="text-[12px] text-foreground leading-snug line-clamp-2">{project.name}</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          {project.locations.toLocaleString()} locations · Updated {project.updated} · Created by {project.createdBy}
        </p>
        <div className="mt-auto flex items-center gap-1 pt-1 text-muted-foreground">
          <button type="button" aria-label="Edit" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="flex size-7 items-center justify-center rounded hover:bg-surface-hover hover:text-foreground">
            <Pencil size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button type="button" aria-label="Duplicate" onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded hover:bg-surface-hover hover:text-foreground">
            <Copy size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button type="button" aria-label="Add to library" onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded hover:bg-surface-hover hover:text-foreground">
            <BookMarked size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <button type="button" aria-label="More options" onClick={(e) => e.stopPropagation()} className="flex size-7 items-center justify-center rounded hover:bg-surface-hover hover:text-foreground">
            <MoreVertical size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

function isAllFilter(value: string | undefined, allLabel: string) {
  return value === undefined || value === allLabel;
}

const ALL_COL_OPTIONS: ColumnOption[] = [
  { key: 'name',      label: 'Name',         locked: true },
  { key: 'status',    label: 'Status'   },
  { key: 'channels',  label: 'Channel type' },
  { key: 'hue',       label: 'Brand identity' },
  { key: 'updated',   label: 'Last updated' },
  { key: 'createdBy', label: 'Created by' },
];

const ALL_COLUMNS: MYNAColumn<ProjectRow>[] = [
  {
    key: 'name', label: 'Name', width: 300, sortable: true,
    render: (_, row) => (
      <div className="flex items-center gap-2 min-w-0">
        <ProjectThumbnail hue={row.hue} />
        <span className="truncate text-body text-text-primary group-hover/row:text-primary transition-colors">
          {row.name}
        </span>
      </div>
    ),
  },
  {
    key: 'status', label: 'Status', width: 120, sortable: true,
    render: (_, row) => <StatusCell status={row.status as ProjectStatus} />,
  },
  {
    key: 'channels', label: 'Channel type', width: 130, sortable: true,
    render: (_, row) => (
      <span className="text-body text-text-primary">{getChannelType(row.channels)}</span>
    ),
  },
  {
    key: 'hue', label: 'Brand identity', width: 160, sortable: false,
    render: (_, row) => <span className="text-body text-text-primary">{BRAND_BY_ID[row.id] ?? '—'}</span>,
  },
  {
    key: 'updated', label: 'Last updated', width: 150, sortable: true,
    render: (_, row) => <span className="text-body text-text-primary">{row.updated}</span>,
  },
  {
    key: 'createdBy', label: 'Created by', width: 160, sortable: true,
    render: (_, row) => <span className="text-body text-text-primary">{row.createdBy}</span>,
  },
];

// ── View ──────────────────────────────────────────────────────────────────────

export const ProjectsView = ({
  initialTab = 'saved',
  initialViewMode = 'list',
  onNavigate,
}: {
  initialTab?: TabId;
  initialViewMode?: ViewMode;
  onNavigate: (view: 'content-hub-create') => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [libQuery, setLibQuery] = useState('');
  const [libSearchOpen, setLibSearchOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [savedSelections, setSavedSelections] = useState<Record<string, string[]>>({});
  const [librarySelections, setLibrarySelections] = useState<Record<string, string[]>>({});
  const [visibleColKeys, setVisibleColKeys] = useState<string[]>(ALL_COL_OPTIONS.map(c => c.key));
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [libViewMode, setLibViewMode] = useState<'grid' | 'list'>('grid');
  const [columnSheetOpen, setColumnSheetOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

  const tableData = useMemo(() => {
    const status    = savedSelections['status']?.[0];
    const channel   = savedSelections['channel']?.[0];
    const creator   = savedSelections['creator']?.[0];
    const locations = savedSelections['locations']?.[0];
    return PROJECTS.filter(project => {
      const matchesStatus    = isAllFilter(status, 'All statuses')  || project.status === status;
      const matchesChannel   = isAllFilter(channel, 'All channels') || project.channels.includes(channel!.toLowerCase() as ProjectRow['channels'][number]);
      const matchesCreator   = isAllFilter(creator, 'All creators') || project.createdBy === creator;
      const matchesLocations =
        isAllFilter(locations, 'Any locations') ||
        (locations === '1-100'   && project.locations <= 100) ||
        (locations === '101-500' && project.locations > 100 && project.locations <= 500) ||
        (locations === '500+' && project.locations > 500);
      return matchesStatus && matchesChannel && matchesCreator && matchesLocations;
    });
  }, [savedSelections]);

  const filteredTemplates = useMemo(() => {
    const q = libQuery.toLowerCase();
    const contentType = librarySelections['contentType']?.[0];
    const tag         = librarySelections['tag']?.[0];
    const creator     = librarySelections['creator']?.[0];
    const goal        = librarySelections['goal']?.[0];

    return TEMPLATES.filter(t => {
      // Library tab only shows blog and FAQ types
      if (t.type !== 'blog' && t.type !== 'faq') return false;

      const matchesQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchesType =
        isAllFilter(contentType, 'All') ||
        isAllFilter(contentType, 'All content types') ||
        TYPE_LABEL[t.type] === contentType;
      const matchesTag = isAllFilter(tag, 'All tags') || t.useCases.includes(tag!);
      const matchesCreator = isAllFilter(creator, 'All creators') || getTemplateCreator(t.id) === creator;
      const matchesGoal =
        isAllFilter(goal, 'Any goal') ||
        t.useCases.some(useCase => useCase.toLowerCase().includes(goal!.split(' ')[0].toLowerCase())) ||
        t.description.toLowerCase().includes(goal!.split(' ')[0].toLowerCase());

      return matchesQ && matchesType && matchesTag && matchesCreator && matchesGoal;
    });
  }, [libQuery, librarySelections]);

  const libraryRows = useMemo<LibraryRow[]>(() => {
    const brands = ['Aspen dental', 'Oakwood Services', 'Olive Garden'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return filteredTemplates.map(tmpl => {
      const seed = tmpl.id.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0xffff, 0);
      return {
        id: tmpl.id,
        name: tmpl.name,
        contentType: tmpl.type,
        score: [87,88,89,90,91,92,93,94,95,96][seed % 10],
        brand: brands[seed % brands.length],
        lastUpdated: `${months[seed % 12]} ${String((seed % 28) + 1).padStart(2,'0')}, 2025`,
        createdBy: 'Birdeye',
        tmpl,
      };
    });
  }, [filteredTemplates]);

  const visibleColumns = ALL_COLUMNS.filter(c => visibleColKeys.includes(String(c.key)));

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-surface">
      <div className="flex min-w-0 flex-1 flex-col">

      {/* Header band */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
        <h1 className="text-h3 text-text-primary">View all contents</h1>
        <div className="flex items-center gap-sm">
          {activeTab === 'saved' && (
            <>
              <button type="button" aria-label="Search contents" className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <Search className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <div className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-sm">
                {([
                  { value: 'list'     as ViewMode, label: 'List view',      LI: List        },
                  { value: 'grid'     as ViewMode, label: 'Grid view',      LI: LayoutGrid  },
                  { value: 'calendar' as ViewMode, label: 'Calendar view',  LI: CalendarDays },
                ] as Array<{ value: ViewMode; label: string; LI: React.ElementType }>).map(item => (
                  <button
                    key={item.value}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => setViewMode(item.value)}
                    className={`flex size-6 items-center justify-center rounded-sm transition-colors ${viewMode === item.value ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-black/[0.04]'}`}
                  >
                    <item.LI className="size-[18px]" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                ))}
              </div>
              <button type="button" aria-label="Customize columns" onClick={() => setColumnSheetOpen(true)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <Columns2 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button type="button" aria-label="Filters" onClick={() => setFilterPanelOpen(o => !o)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </>
          )}

          {activeTab === 'library' && (
            <>
              {libSearchOpen || libQuery ? (
                <div className="relative h-[34px] w-[240px]">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-icon">
                    <Search className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                  </span>
                  <Input
                    type="search"
                    value={libQuery}
                    onChange={e => setLibQuery(e.target.value)}
                    onBlur={() => { if (!libQuery) setLibSearchOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setLibQuery(''); setLibSearchOpen(false); }
                    }}
                    autoFocus
                    placeholder="Search templates"
                    className="h-full rounded-sm border-border-selected bg-surface pl-8 pr-2 text-body text-text-primary placeholder:text-text-tertiary"
                    aria-label="Search templates"
                  />
                </div>
              ) : (
                <button type="button" aria-label="Open template search" title="Search templates" onClick={() => setLibSearchOpen(true)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                  <Search className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              )}
              <div className="flex h-[34px] items-center gap-xs rounded-md border border-border-selected bg-surface px-sm">
                {([
                  { value: 'grid' as const, label: 'Grid view', LI: LayoutGrid },
                  { value: 'list' as const, label: 'List view', LI: List       },
                ] as Array<{ value: 'grid' | 'list'; label: string; LI: React.ElementType }>).map(item => (
                  <button
                    key={item.value}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => setLibViewMode(item.value)}
                    className={`flex size-6 items-center justify-center rounded-sm transition-colors ${libViewMode === item.value ? 'bg-surface-selected text-text-primary' : 'text-text-icon hover:bg-black/[0.04]'}`}
                  >
                    <item.LI className="size-[18px]" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                ))}
              </div>
              {libViewMode === 'list' && (
                <button type="button" aria-label="Customize columns" onClick={() => setColumnSheetOpen(true)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                  <Columns2 className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              )}
              <button type="button" aria-label="Filters" onClick={() => setFilterPanelOpen(o => !o)} className="flex size-[34px] items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2">
                <ListFilter className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-2xl">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      </div>

      {/* Saved tab — table */}
      {activeTab === 'saved' && viewMode === 'list' && (
        <div className="min-h-0 flex-1 overflow-auto px-6">
          <DataTable<ProjectRow & Record<string, unknown>>
            data={tableData as (ProjectRow & Record<string, unknown>)[]}
            columns={visibleColumns as unknown as MYNAColumn<ProjectRow & Record<string, unknown>>[]}
            rowHeight={72}
            onRowClick={() => onNavigate('content-hub-create')}
            rowMenuItems={[
              { label: 'Edit',             onClick: () => onNavigate('content-hub-create') },
              { label: 'Duplicate',        onClick: () => {} },
              { label: 'Add to library',   onClick: () => {} },
              { label: 'Delete',           onClick: () => {}, variant: 'danger' },
            ]}
          />
        </div>
      )}

      {/* Saved tab — grid */}
      {activeTab === 'saved' && viewMode === 'grid' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {tableData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-muted-foreground">
              No content matches your filters.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {tableData.map(project => (
                <SavedContentGridCard
                  key={project.id}
                  project={project}
                  onOpen={() => onNavigate('content-hub-create')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved tab — calendar */}
      {activeTab === 'saved' && viewMode === 'calendar' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ContentHubCalendarView embedded />
        </div>
      )}

      {/* Library tab — template cards */}
      {activeTab === 'library' && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[13px] text-muted-foreground">
                No templates match your search.
              </div>
            ) : libViewMode === 'grid' ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {filteredTemplates.map(tmpl => (
                  <TemplateCard
                    key={tmpl.id}
                    tmpl={tmpl}
                    onUse={() => onNavigate('content-hub-create')}
                    onPreview={() => setPreviewTemplate(tmpl)}
                  />
                ))}
              </div>
            ) : (
              <DataTable<LibraryRow>
                columns={LIBRARY_COLUMNS}
                data={libraryRows}
                rowHeight={76}
                rowActions={[{
                  iconElement: <Eye size={13} strokeWidth={1.6} absoluteStrokeWidth />,
                  label: 'Preview',
                  onClick: row => setPreviewTemplate(row.tmpl),
                }]}
                rowMenuItems={[
                  { label: 'Preview',      onClick: row => setPreviewTemplate(row.tmpl) },
                  { label: 'Use template', onClick: () => onNavigate('content-hub-create') },
                ]}
              />
            )}
          </div>
        </div>
      )}

      {/* Template preview modal */}
      <TemplatePreviewModal
        tmpl={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={() => { setPreviewTemplate(null); onNavigate('content-hub-create'); }}
      />
      </div>

      <CustomizeColumnsDrawer
        open={columnSheetOpen}
        options={ALL_COL_OPTIONS}
        visibleKeys={visibleColKeys}
        onClose={() => setColumnSheetOpen(false)}
        onSave={(_, visible) => setVisibleColKeys(visible)}
        onRestoreDefault={() => setVisibleColKeys(ALL_COL_OPTIONS.map(c => c.key))}
      />
      <FilterPanel
        open={filterPanelOpen}
        fields={activeTab === 'library' ? LIBRARY_FILTER_FIELDS : SAVED_FILTER_FIELDS}
        selections={activeTab === 'library' ? librarySelections : savedSelections}
        onSelectionsChange={activeTab === 'library' ? setLibrarySelections : setSavedSelections}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  );
};
