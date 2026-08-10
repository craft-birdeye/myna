/**
 * Shared types, sub-components, and column cell helpers used by both
 * ProjectsView (full table) and ContentHome (recent-projects snapshot).
 *
 * Keep this file free of page-level state or navigation concerns —
 * it only contains pure UI pieces and data types.
 */

import React from 'react';
import { Globe, FileText, Mail, HelpCircle, Eye, MoreHorizontal, Copy, BookMarked, Trash2, Pencil } from 'lucide-react';
import thumbBlogAnnouncement from '@/assets/thumbnails/blog-announcement.png';
import thumbBlogWelcome from '@/assets/thumbnails/blog-welcome.png';
import thumbBlogNewDish from '@/assets/thumbnails/blog-new-dish.png';
import thumbBlogSurvey from '@/assets/thumbnails/blog-survey.png';
import thumbFaq from '@/assets/thumbnails/faq.png';
import { Badge } from '@/contenthub-ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/contenthub-ui/dropdown-menu';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'Draft' | 'Published';

export type ChannelId =
  | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube'
  | 'web' | 'blog' | 'email' | 'faq';

export interface ProjectRow {
  id: number;
  name: string;
  status: ProjectStatus;
  channels: ChannelId[];
  locations: number;
  updated: string;
  createdBy: string;
  /** Hue (0-360) for the deterministic mock thumbnail gradient. */
  hue: number;
}

// ── Status badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'Draft') {
    return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
  }
  return <Badge variant="success">Published</Badge>;
}

/** Clickable status cell — shows current status and a 2-item dropdown to switch. */
export function StatusCell({
  status,
  onChange,
}: {
  status: ProjectStatus;
  onChange?: (s: ProjectStatus) => void;
}) {
  if (!onChange) return <StatusBadge status={status} />;

  const other: ProjectStatus = status === 'Draft' ? 'Published' : 'Draft';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="cursor-pointer focus:outline-none">
          <StatusBadge status={status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={() => onChange(status)}
        >
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: status === 'Published' ? '#4cae3d' : '#9ca3af' }} />
          {status}
          <span className="ml-auto text-primary text-xs">✓</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={() => onChange(other)}
        >
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: other === 'Published' ? '#4cae3d' : '#9ca3af' }} />
          {other}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

// Cycle blog images deterministically based on row id
const BLOG_THUMBS = [thumbBlogAnnouncement, thumbBlogWelcome, thumbBlogNewDish, thumbBlogSurvey];

export function ProjectThumbnail({ hue, channels, id }: { hue: number; channels?: ChannelId[]; id?: number }) {
  const ch = channels ?? [];
  const isFaq    = ch.includes('faq');
  const isBlog   = ch.includes('blog') && !isFaq;
  const hasSocial = ch.some(c => ['facebook','instagram','twitter','linkedin','youtube'].includes(c));

  let src: string | null = null;
  if (isFaq) {
    src = thumbFaq;
  } else if (isBlog) {
    src = BLOG_THUMBS[(id ?? hue) % BLOG_THUMBS.length];
  } else if (hasSocial) {
    src = BLOG_THUMBS[(id ?? hue) % BLOG_THUMBS.length];
  }

  return (
    <div className="w-[80px] h-[60px] rounded-lg flex-shrink-0 border border-black/[0.07] bg-[#E5E9F0] p-[5px]">
      {src ? (
        <img src={src} alt="" draggable={false} className="w-full h-full object-cover object-top rounded-[4px]" />
      ) : (
        /* fallback: generic document mini-preview */
        <div className="w-full h-full bg-white flex flex-col border border-zinc-200 rounded-[4px] overflow-hidden">
          <div className="flex items-center gap-[3px] px-[4px] py-[2.5px] border-b border-zinc-100">
            <div className="w-[7px] h-[7px] rounded-[1.5px] bg-surface-hover border border-zinc-200 shrink-0" />
            <div className="h-[2px] w-[22px] bg-border rounded-full" />
            <div className="ml-auto h-[2.5px] w-[10px] rounded-full" style={{ backgroundColor: '#1D9E75' }} />
          </div>
          <div className="px-[4px] pt-[2px] flex flex-col gap-[2px] flex-1">
            <div className="h-[2px] w-full bg-border rounded-full" />
            <div className="h-[2px] bg-surface-hover rounded-full" style={{ width: '80%' }} />
            <div className="h-[2px] w-full bg-border rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Channel chips ─────────────────────────────────────────────────────────────

// Brand-accurate SVG logo paths
function FbLogo()  { return <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"/></svg>; }
function IgLogo()  { return <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>; }
function LiLogo()  { return <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
function YtLogo()  { return <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>; }

export function ChannelChip({ id }: { id: ChannelId }) {
  if (id === 'twitter')   return null;
  if (id === 'facebook')  return <div className="size-[22px] rounded-full shrink-0 flex items-center justify-center" style={{ background: '#1877F2' }}><FbLogo /></div>;
  if (id === 'instagram') return <div className="size-[22px] rounded-full shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}><IgLogo /></div>;
  if (id === 'linkedin')  return <div className="size-[22px] rounded-full shrink-0 flex items-center justify-center" style={{ background: '#0A66C2' }}><LiLogo /></div>;
  if (id === 'youtube')   return <div className="size-[22px] rounded-full shrink-0 flex items-center justify-center bg-[#FF0000]"><YtLogo /></div>;
  const Icon = id === 'web' ? Globe : id === 'blog' ? FileText : id === 'faq' ? HelpCircle : Mail;
  return (
    <div className="size-[22px] rounded-full shrink-0 bg-muted flex items-center justify-center">
      <Icon size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
    </div>
  );
}

const MAX_VISIBLE_CHANNELS = 3;

const CHANNEL_LABEL: Record<ChannelId, string> = {
  facebook: 'Facebook', instagram: 'Instagram', twitter: 'X (Twitter)',
  linkedin: 'LinkedIn', youtube: 'YouTube',
  web: 'Web', blog: 'Blog', email: 'Email', faq: 'FAQ',
};

export function ChannelCell({ channels }: { channels: ChannelId[] }) {
  const filtered = channels.filter(id => id !== 'twitter');
  const visible  = filtered.slice(0, MAX_VISIBLE_CHANNELS);
  const overflow = filtered.slice(MAX_VISIBLE_CHANNELS);
  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      {visible.map(id => <ChannelChip key={id} id={id} />)}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-[22px] min-w-[36px] rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground hover:bg-surface-hover/80 transition-colors leading-none flex items-center justify-center"
            >
              +{overflow.length} more
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[150px]">
            {overflow.map(id => (
              <DropdownMenuItem key={id} className="flex items-center gap-2 pointer-events-none">
                <ChannelChip id={id} />
                <span className="text-[12px] text-foreground">{CHANNEL_LABEL[id]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ── Row hover actions ─────────────────────────────────────────────────────────

export function RowActions({ onPreview, onEdit, onDuplicate, onAddToLibrary, onDelete }: {
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onAddToLibrary: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-0.5 opacity-0 group-hover/table-row:opacity-100 transition-opacity duration-150 pointer-events-none group-hover/table-row:pointer-events-auto"
      onClick={e => e.stopPropagation()}
    >
      <button type="button" aria-label="Preview" onClick={onPreview}
        className="flex items-center justify-center size-[34px] rounded hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground">
        <Eye size={15} strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="More options"
            className="flex items-center justify-center size-[34px] rounded hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground">
            <MoreHorizontal size={15} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[168px]">
          <DropdownMenuItem onClick={onEdit}          className="gap-2"><Pencil     size={13} strokeWidth={1.6} absoluteStrokeWidth />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}     className="gap-2"><Copy       size={13} strokeWidth={1.6} absoluteStrokeWidth />Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={onAddToLibrary}  className="gap-2"><BookMarked size={13} strokeWidth={1.6} absoluteStrokeWidth />Add to library</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete} className="gap-2"><Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
