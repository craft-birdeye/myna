import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Share2, FileText, HelpCircle, Mail, LayoutTemplate } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { mockScheduledItems, mockProjects, PROJECT_COLOR_MAP } from './calendarData';
import type { ScheduledItem } from './calendarData';

interface ListViewProps {
  currentDate: Date;
}

// ── Platform brand icons (matches PostCard.tsx) ───────────────────────────────

const PlatformDot: React.FC<{ platform: string }> = ({ platform }) => {
  const size = 16;
  if (platform === 'facebook') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="Facebook">
      <circle cx="10" cy="10" r="10" fill="#1877F2" />
      <path d="M13.5 10H11.5V16H9V10H7.5V8H9V6.5C9 5.1 9.9 4 11.5 4H13V6H12C11.4 6 11.5 6.3 11.5 6.8V8H13L13.5 10Z" fill="white" />
    </svg>
  );
  if (platform === 'instagram') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="Instagram">
      <rect width="20" height="20" rx="5" fill="url(#ig_lv)" />
      <circle cx="10" cy="10" r="3.5" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="14" cy="6" r="1" fill="white" />
      <defs>
        <linearGradient id="ig_lv" x1="0" y1="20" x2="20" y2="0">
          <stop stopColor="#F58529" />
          <stop offset="0.5" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
    </svg>
  );
  if (platform === 'linkedin') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="LinkedIn">
      <rect width="20" height="20" rx="3" fill="#0A66C2" />
      <path d="M5 8h2v7H5V8zm1-3a1 1 0 110 2 1 1 0 010-2zm3 3h2v1h.03C11.4 8.6 12.2 8 13.3 8c2.2 0 2.7 1.4 2.7 3.3V15h-2v-3.3c0-.8 0-1.7-1-1.7s-1.2.8-1.2 1.7V15H9V8z" fill="white" />
    </svg>
  );
  if (platform === 'twitter') return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="X / Twitter">
      <circle cx="10" cy="10" r="10" fill="#000" />
      <text x="10" y="14.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">X</text>
    </svg>
  );
  return null;
};

// ── Content type metadata ─────────────────────────────────────────────────────

const CONTENT_TYPE_ICON: Record<string, React.ReactNode> = {
  social:  <Share2         size={13} strokeWidth={1.6} absoluteStrokeWidth />,
  blog:    <FileText       size={13} strokeWidth={1.6} absoluteStrokeWidth />,
  faq:     <HelpCircle     size={13} strokeWidth={1.6} absoluteStrokeWidth />,
  email:   <Mail           size={13} strokeWidth={1.6} absoluteStrokeWidth />,
  landing: <LayoutTemplate size={13} strokeWidth={1.6} absoluteStrokeWidth />,
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  social:  'Social post',
  blog:    'Blog',
  faq:     'FAQ',
  email:   'Email',
  landing: 'Landing page',
};

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px]',
      status === 'Published' && 'bg-primary/5 text-text-primary',
      status === 'Draft'     && 'bg-border text-text-secondary',
      status === 'Scheduled' && 'bg-primary/5 text-primary',
    )}>
      {status}
    </span>
  );
}

// ── Date formatting ───────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtDateRange(start: Date, end: Date) {
  const s = `${MONTHS_LONG[start.getMonth()]} ${start.getDate()}`;
  const e = `${MONTHS_LONG[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${s} – ${e}`;
}

function fmtItemDate(date: Date) {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

// ── Row ───────────────────────────────────────────────────────────────────────

const ItemRow: React.FC<{ item: ScheduledItem }> = ({ item }) => (
  <div className="grid grid-cols-[96px_72px_152px_96px_1fr] items-center gap-4 px-4 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors cursor-pointer">
    {/* Date */}
    <span className="text-[12px] text-foreground">{fmtItemDate(item.date)}</span>

    {/* Time */}
    <span className="text-[12px] text-muted-foreground">{item.time}</span>

    {/* Type + platform */}
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{CONTENT_TYPE_ICON[item.contentType]}</span>
      <span className="text-[12px] text-foreground">{CONTENT_TYPE_LABEL[item.contentType]}</span>
      {item.contentType === 'social' && item.platform && (
        <>
          <span className="text-muted-foreground text-[10px]">/</span>
          <PlatformDot platform={item.platform} />
        </>
      )}
    </div>

    {/* Status */}
    <div><StatusBadge status={item.status} /></div>

    {/* Title / caption */}
    <p className="text-[12px] text-foreground truncate">
      {item.title || item.caption}
    </p>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const ListView: React.FC<ListViewProps> = () => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(mockProjects.map(p => p.id)),
  );

  const toggleProject = (id: string) =>
    setExpandedProjects(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const projectGroups = mockProjects
    .map(project => ({
      project,
      items: mockScheduledItems
        .filter(i => i.projectId === project.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-6">
          {projectGroups.map(({ project, items }) => {
            const colors    = PROJECT_COLOR_MAP[project.colorKey];
            const expanded  = expandedProjects.has(project.id);

            return (
              <div key={project.id}>
                {/* Project header */}
                <button
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 rounded-lg border transition-opacity hover:opacity-90 mb-2',
                    colors.bg, colors.text, colors.border,
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 text-left">
                    <span className="text-[13px] leading-snug">{project.name}</span>
                    <span className="opacity-50 text-[11px]">&middot;</span>
                    <span className="text-[11px] opacity-70 leading-snug">
                      {fmtDateRange(project.startDate, project.endDate)}
                    </span>
                    <span className="opacity-50 text-[11px]">&middot;</span>
                    <span className="text-[11px] opacity-70">{items.length} items</span>
                  </div>
                  {expanded
                    ? <ChevronUp   size={15} strokeWidth={1.6} absoluteStrokeWidth />
                    : <ChevronDown size={15} strokeWidth={1.6} absoluteStrokeWidth />
                  }
                </button>

                {/* Items */}
                {expanded && (
                  <div className="flex flex-col gap-1">
                    {/* Table header */}
                    <div className="grid grid-cols-[96px_72px_152px_96px_1fr] gap-4 px-4 py-1.5">
                      {['Date','Time','Type','Status','Title'].map(h => (
                        <span key={h} className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {h}
                        </span>
                      ))}
                    </div>

                    {/* Rows */}
                    {items.map(item => <ItemRow key={item.id} item={item} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
