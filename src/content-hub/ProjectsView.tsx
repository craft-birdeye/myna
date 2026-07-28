import { type KeyboardEvent, useMemo, useState } from 'react';
import {
  BookMarked, CalendarDays, Columns2, Copy, LayoutGrid, List, ListFilter, MoreVertical, Pencil, Search,
  FileText, Share2, Mail, MessageSquare, Monitor, Megaphone, MessageCircle, X,
  TrendingUp, Eye, AlignLeft, Award, CheckCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/contenthub-ui/dialog';
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
import { TEMPLATES, type ContentType, type TemplateItem, TemplateThumbnail, TYPE_THUMB_BG } from './TemplateGallery';
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

const SCORE_ITEMS = [
  { label: 'Intent match',        score: 96, Icon: TrendingUp   },
  { label: 'Search visibility',   score: 96, Icon: Eye          },
  { label: 'Content depth',       score: 96, Icon: AlignLeft    },
  { label: 'Brand alignment',     score: 96, Icon: Award        },
  { label: 'Publishing readiness',score: 96, Icon: CheckCircle  },
];

function TemplatePreviewModal({ tmpl, onClose, onUse }: { tmpl: TemplateItem | null; onClose: () => void; onUse: (t: TemplateItem) => void }) {
  if (!tmpl) return null;
  const thumb = TYPE_THUMB[tmpl.type];
  const { Icon } = thumb;
  const isBlog = tmpl.type === 'blog';
  const isSocial = tmpl.type === 'social';
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <Dialog open={!!tmpl} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="w-[1000px] sm:max-w-[1000px] max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-[15px] text-foreground">Preview of {tmpl.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUse(tmpl)}
              className="h-[34px] rounded-md bg-primary px-4 text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Use content
            </button>
            <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground">
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: score + metadata */}
          <div className="w-[280px] shrink-0 flex flex-col overflow-y-auto border-r border-border px-4 py-5 gap-4">
            {/* Score */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[44px] leading-none" style={{ color: '#1D9E75' }}>92</span>
                <span className="text-[14px] text-muted-foreground">/ 100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: '92%', background: '#1D9E75' }} />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="flex flex-col gap-0.5">
              {SCORE_ITEMS.map(item => (
                <div key={item.label}>
                  <button
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-surface-hover/60 transition-colors text-left"
                    onClick={() => setOpenItem(openItem === item.label ? null : item.label)}
                  >
                    <span className="text-[13px] text-foreground">{item.label}</span>
                    <span className="text-[13px] text-foreground tabular-nums">{item.score}</span>
                  </button>
                  {openItem === item.label && (
                    <div className="px-2 pb-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Topic</p>
                <p className="text-[13px] text-foreground leading-relaxed">{tmpl.description}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Brand identity</p>
                <p className="text-[13px] text-foreground">Birdeye</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Created by</p>
                <p className="text-[13px] text-foreground">{getTemplateCreator(tmpl.id)}</p>
              </div>
            </div>
          </div>

          {/* Right: content preview */}
          <div className="flex-1 min-w-0 overflow-y-auto bg-surface-hover p-8">
            <div className="mx-auto max-w-[560px] rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              {/* Mini topbar */}
              <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
                <div className={cn('flex size-[22px] shrink-0 items-center justify-center rounded-[5px]', thumb.iconBg)}>
                  <Icon size={11} strokeWidth={1.6} absoluteStrokeWidth className={thumb.iconColor} />
                </div>
                <span className="text-[11px] text-text-secondary">{TYPE_LABEL[tmpl.type]}</span>
                {isSocial && <span className="text-[11px] text-purple-600">· Post</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full w-[92%] rounded-full bg-primary" />
                  </div>
                  <span className="text-[11px] text-text-primary">92</span>
                </div>
              </div>

              {/* Blog hero */}
              {isBlog && (
                <div className="relative h-[120px] overflow-hidden border-b border-zinc-100">
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-emerald-100" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-primary" />
                  <div className="absolute bottom-10 left-8 h-16 w-12 rounded-t-full bg-primary" />
                  <div className="absolute bottom-10 right-12 h-14 w-10 rounded-t-full bg-primary/70" />
                  <div className="absolute right-20 top-6 size-5 rounded-full bg-surface-hover" />
                </div>
              )}

              {/* Content body */}
              <div className="px-6 py-5 flex flex-col gap-2">
                {isBlog && (
                  <>
                    <h3 className="text-[16px] leading-snug text-text-primary">{tmpl.name}</h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{tmpl.description}</p>
                    <div className="my-2 rounded-lg border-l-4 border-emerald-500 bg-surface-hover px-4 py-2">
                      <p className="text-[13px] italic text-text-secondary">"We've got to be courageous and really lean in… That's the only way you're going to innovate"</p>
                      <p className="mt-1 text-[11px] text-text-secondary">– Alex Craddock</p>
                    </div>
                  </>
                )}
                {!isBlog && (
                  <>
                    <div className="flex gap-1.5">
                      <Badge variant={TYPE_BADGE_VARIANT[tmpl.type]}>{TYPE_LABEL[tmpl.type]}</Badge>
                      {isSocial && <Badge variant="purple">Post</Badge>}
                    </div>
                    <h3 className="text-[16px] leading-snug text-text-primary">{tmpl.name}</h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{tmpl.description}</p>
                  </>
                )}
                {/* Filler lines */}
                <div className="flex flex-col gap-2 pt-2">
                  {tmpl.previewLines.map((w, i) => (
                    <div key={i} className="h-[6px] rounded-full bg-surface-hover" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
              /* Table view — matches Figma node 9234-77733 */
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {['Name', 'Content type', 'Content score', 'Brand identity', 'Last updated', 'Created by'].map(col => (
                      <th key={col} className="py-2.5 pr-6 text-[11px] text-muted-foreground font-normal whitespace-nowrap">{col}</th>
                    ))}
                    <th className="w-14" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTemplates.map(tmpl => {
                    const seed = tmpl.id.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0xffff, 0);
                    const score = [87,88,89,90,91,92,93,94,95,96][seed % 10];
                    const brands = ['Aspen dental', 'Oakwood Services', 'Olive Garden'];
                    const brand = brands[seed % brands.length];
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const date = `${months[seed % 12]} ${String((seed % 28) + 1).padStart(2,'0')}, 2025`;
                    const scoreColor = score >= 90 ? '#1D9E75' : '#94a3b8';
                    return (
                      <tr key={tmpl.id} className="group transition-colors hover:bg-surface-hover/40">
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded overflow-hidden shrink-0 border border-border/60" style={{ background: TYPE_THUMB_BG[tmpl.type] }}>
                              <TemplateThumbnail template={tmpl} />
                            </div>
                            <button className="text-[13px] text-primary hover:underline text-left" onClick={() => setPreviewTemplate(tmpl)}>
                              {tmpl.name}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pr-6">
                          <Badge variant={TYPE_BADGE_VARIANT[tmpl.type]}>{TYPE_LABEL[tmpl.type]}</Badge>
                        </td>
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
                            </div>
                            <span className="text-[12px] text-foreground whitespace-nowrap">{score}/100</span>
                          </div>
                        </td>
                        <td className="py-3 pr-6"><span className="text-[12px] text-foreground">{brand}</span></td>
                        <td className="py-3 pr-6"><span className="text-[12px] text-muted-foreground">{date}</span></td>
                        <td className="py-3 pr-6"><span className="text-[12px] text-foreground">Birdeye</span></td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setPreviewTemplate(tmpl)} className="flex size-7 items-center justify-center rounded hover:bg-surface-hover transition-colors">
                              <Eye size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                            </button>
                            <button className="flex size-7 items-center justify-center rounded hover:bg-surface-hover transition-colors">
                              <MoreVertical size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
