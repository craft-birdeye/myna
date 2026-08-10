/**
 * EditorContentCard
 *
 * Unified card shell used for every content piece in the canvas.
 *
 * Header (always the same chrome):
 *   [icon] [editable name]  [status badge]  [score pill ●]  [✓ approval]  [@ assign]  [⋮]
 *
 * Body:
 *   Type-specific inline preview renderer (blog excerpt, social preview,
 *   FAQ accordion, email, landing, video). Driven by `itemType`.
 *
 * Footer:
 *   Canva-style "Add another [type]" button — appears below the card.
 */

import React, { useState } from 'react';
import {
  FileText, Share2, Mail, MessageSquare, Monitor, Video,
  ChevronRight, Eye, Pencil, Trash2, Sparkles, Copy, MoreHorizontal,
  UserRound, Check, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/contenthub-ui/dropdown-menu';
import { cn } from '@/contenthub-ui/utils';
import { type ContentItemType, ITEM_TYPE_LABEL } from './editorConfig';
import { ScoreProgressRing } from '../shared/CanvasEditorTopBar';
import { scoreColor } from '../shared/scoreColors';

// ── Team members (mock) ───────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { id: '1', name: 'Sarah Mitchell', email: 'sarah.mitchell@birdeye.com', initials: 'SM', color: 'bg-primary'  },
  { id: '2', name: 'James Wilson',   email: 'james.wilson@birdeye.com',   initials: 'JW', color: 'bg-primary'   },
  { id: '3', name: 'David Parker',   email: 'david.parker@birdeye.com',   initials: 'DP', color: 'bg-primary' },
  { id: '4', name: 'Emily Johnson',  email: 'emily.johnson@birdeye.com',  initials: 'EJ', color: 'bg-rose-500'    },
  { id: '5', name: 'Michael Chen',   email: 'michael.chen@birdeye.com',   initials: 'MC', color: 'bg-violet-500'  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export type CardStatus = 'Draft' | 'Ready' | 'Needs work' | 'Approved';

export interface ContentCardData {
  id: string;
  itemType: ContentItemType;
  name: string;
  status: CardStatus;
  score: number;
  approved: boolean;
  assignee?: string;
}

interface EditorContentCardProps {
  card: ContentCardData;
  /** Called when user clicks the score ring — parent opens/closes right panel */
  onScoreClick: (cardId: string) => void;
  /** Whether THIS card's score panel is currently open */
  scoreActive: boolean;
  /** Called when user clicks Edit — drills down to item editor */
  onEdit: (cardId: string) => void;
  /** Called when user clicks Delete */
  onDelete?: (cardId: string) => void;
  /** Called when user clicks "Add another [type]" footer button */
  onAddAnother: (itemType: ContentItemType) => void;
  /** Show the "Add another" footer (last card in a type group, or always) */
  showAddAnother?: boolean;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ContentItemType, React.ElementType> = {
  blog:    FileText,
  social:  Share2,
  email:   Mail,
  faq:     MessageSquare,
  landing: Monitor,
  video:   Video,
};

// ── Inline content preview renderers ─────────────────────────────────────────
// When `changed` is true (version history only), specific text/image elements
// get an amber highlight — the rest of the card body stays unaffected.

const HL = 'bg-surface-hover/90 rounded-[3px] px-0.5'; // inline text highlight
const HL_IMG = 'ring-2 ring-amber-300';             // image/media area ring

function BlogPreview({ changed = false }: { changed?: boolean }) {
  return (
    <div className="px-6 py-5 space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="flex min-h-[180px] items-center justify-between gap-4 px-4 py-5">
          <div className="max-w-[58%] space-y-2">
            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
              Local SEO guide
            </span>
            <h2 className={cn('text-[20px] leading-tight text-foreground', changed && HL)}>
              How local businesses win with AI-powered review responses
            </h2>
            <p className={cn('text-[12px] leading-relaxed text-muted-foreground', changed && HL)}>
              A practical playbook for turning faster replies, stronger trust signals, and better service recovery into measurable growth.
            </p>
          </div>
          <div className={cn('flex h-[132px] flex-1 items-center justify-center rounded-xl bg-white/75 shadow-sm ring-1 ring-black/[0.05]', changed && HL_IMG)}>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
              <div className="h-12 w-16 rounded-lg bg-surface-hover" />
              <div className="h-12 w-16 rounded-lg bg-primary/10" />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-[18px] text-foreground leading-snug">
        How Local Businesses Are Winning With AI-Powered Review Responses
      </h2>
      <p className="text-[12px] text-muted-foreground">~167 words · ~1 min read</p>
      <p className={cn('text-[13px] text-foreground leading-relaxed', changed && HL)}>
        Online reviews shape purchasing decisions more than ever. According to a 2024 BrightLocal survey,
        93% of consumers read reviews before visiting a local business, and 89% say they're more likely to
        choose a business that responds to all reviews.
      </p>
      <h3 className="text-[15px] text-foreground">The AI Advantage</h3>
      <p className="text-[13px] text-foreground leading-relaxed">
        AI-powered response tools help local businesses respond faster and more consistently — without
        sacrificing personalization. Rather than copy-paste replies, modern AI can personalize each
        response based on the reviewer's specific feedback, match your brand voice, and escalate negative
        reviews to the right team member automatically.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          ['23%', 'more review volume'],
          ['4.6x', 'faster response time'],
          ['89%', 'trust public replies'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-lg border border-border bg-muted/30 p-2">
            <p className="text-[18px] text-foreground">{value}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-[15px] text-foreground">Implementation checklist</h3>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground">
          <li>Train reply guidance on your best historical responses and brand guardrails.</li>
          <li>Route low-score or sensitive reviews to a human reviewer before publishing.</li>
          <li>Measure response time, review velocity, and customer sentiment by location.</li>
        </ul>
      </div>
      <div className={cn('overflow-hidden rounded-xl border border-border bg-surface', changed && HL_IMG)}>
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
      <div className="rounded-xl bg-primary px-4 py-4 text-primary-foreground">
        <p className="text-[15px]">Ready to respond faster?</p>
        <p className="mt-1 text-[12px] leading-relaxed text-primary-foreground/80">
          Start with your top three review scenarios and build an approval workflow your team trusts.
        </p>
      </div>
    </div>
  );
}

function SocialPreview({ changed = false }: { changed?: boolean }) {
  return (
    <div className="px-6 py-4 flex justify-center">
      <div className="w-[280px] rounded-xl border border-border bg-background overflow-hidden shadow-sm">
        <div className={cn('h-[160px] bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center', changed && HL_IMG)}>
          <div className="size-16 rounded-xl bg-green-200/60 flex items-center justify-center">
            <div className="size-[34px] rounded-lg bg-green-400/50" />
          </div>
        </div>
        <div className="p-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] text-primary">OG</span>
            </div>
            <span className="text-[12px] text-foreground">Olive Garden</span>
          </div>
          <p className={cn('text-[12px] text-foreground leading-relaxed', changed && HL)}>
            Spring is here and so is our outdoor seating! Join us for fresh flavors under the open sky.
            Reserve your table today.
          </p>
          <p className="text-[11px] text-primary">#SpringDining #OutdoorSeating #LocalEats</p>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ changed = false }: { changed?: boolean }) {
  return (
    <div className="px-6 py-4 flex justify-center">
      <div className="w-full max-w-[480px] rounded-lg border border-border overflow-hidden bg-background shadow-sm">
        <div className="bg-primary/5 px-4 py-2 border-b border-border">
          <p className="text-[11px] text-muted-foreground">Subject</p>
          <p className={cn('text-[13px] text-foreground', changed && HL)}>
            Your table is waiting this spring
          </p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-[13px] text-foreground">Hi [First Name],</p>
          <p className="text-[13px] text-foreground leading-relaxed">
            Spring has arrived and we've got something special waiting for you. Come enjoy our seasonal
            menu in our newly expanded outdoor dining area.
          </p>
          <div className="flex justify-center pt-1">
            <span className={cn('bg-primary text-primary-foreground text-[12px] px-4 py-2 rounded-lg', changed && 'ring-2 ring-amber-400 ring-offset-1')}>
              Reserve your table
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQPreview({ changed = false }: { changed?: boolean }) {
  const questions = [
    { text: 'Are reservations required?', highlight: changed },
    { text: 'Do you offer vegan options?', highlight: false },
    { text: 'Is there outdoor seating?', highlight: changed },
    { text: 'What are your hours of operation?', highlight: false },
  ];
  return (
    <div className="flex flex-col border-t border-border/40">
      {questions.map((q, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 px-4 py-2 border-b border-border/30 last:border-0 transition-colors',
            q.highlight ? 'bg-surface-hover/60' : 'hover:bg-surface-hover',
          )}
        >
          <span className="text-[10px] font-mono text-muted-foreground/60 w-6 flex-shrink-0 select-none">Q{i + 1}</span>
          <span className="text-[12px] text-foreground flex-1 truncate">{q.text}</span>
          <ChevronRight size={11} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground/40 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function LandingPreview({ changed = false }: { changed?: boolean }) {
  return (
    <div className="space-y-5 px-6 py-5">
      <div className="overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-white to-emerald-50">
        <div className="px-6 py-7 text-center">
          <span className="text-[11px] uppercase tracking-wide text-primary">Spring campaign</span>
          <h2 className={cn('mx-auto mt-2 max-w-[420px] text-[24px] leading-tight text-foreground', changed && HL)}>
            Fresh ingredients. Local sourcing. Great service.
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-relaxed text-muted-foreground">
            Experience the Olive Garden difference with seasonal menus, refreshed patios, and local offers across every participating location.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <span className={cn('rounded-lg bg-primary px-4 py-2.5 text-[13px] text-primary-foreground', changed && 'ring-2 ring-amber-400 ring-offset-1')}>
              Book your table now
            </span>
            <span className="rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] text-foreground">
              View menu
            </span>
          </div>
        </div>
        <div className={cn('grid grid-cols-3 gap-2 border-t border-border bg-background/70 p-2', changed && HL_IMG)}>
          <div className="h-24 rounded-lg bg-primary/10" />
          <div className="h-24 rounded-lg bg-surface-hover" />
          <div className="h-24 rounded-lg bg-rose-100" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {['Seasonal dishes', 'Outdoor seating', 'Local offers'].map(label => (
          <div key={label} className="rounded-lg border border-border bg-background p-2 text-center">
            <div className="mx-auto mb-2 size-[34px] rounded-full bg-primary/10" />
            <p className="text-[12px] text-foreground">{label}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">Short supporting copy for the landing section.</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 rounded-xl border border-border bg-background p-4">
        <div>
          <h3 className="text-[16px] text-foreground">Why customers choose us</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Highlight fresh preparation, team hospitality, fast reservations, and location-specific proof points with scannable modules.
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px] text-foreground">
            <li>Same-day booking windows</li>
            <li>Menu options for every guest</li>
            <li>Family-friendly spaces</li>
          </ul>
        </div>
        <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-surface text-white">
          <Video size={22} strokeWidth={1.6} absoluteStrokeWidth />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-[15px] text-foreground">Customer quote module</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          "The patio launch made it easy for our family to plan dinner after work. The page showed the offer, menu, and booking options in one place."
        </p>
      </div>

      <div className="rounded-xl bg-primary px-4 py-4 text-center text-primary-foreground">
        <p className="text-[16px]">Reserve your spring dining experience</p>
        <p className="mt-1 text-[12px] text-primary-foreground/80">CTA section with booking link, location selector, and campaign tracking.</p>
      </div>
    </div>
  );
}

function VideoPreview({ changed = false }: { changed?: boolean }) {
  return (
    <div className="px-6 py-4 flex justify-center">
      <div className={cn('w-full max-w-[400px] rounded-xl overflow-hidden border border-border bg-surface shadow-sm', changed && HL_IMG)}>
        <div className="h-[180px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-800/60 to-emerald-900/60" />
          <div className="relative z-10 size-12 rounded-full bg-white/20 flex items-center justify-center">
            <Video size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-white ml-0.5" />
          </div>
        </div>
        <div className="px-2 py-2.5 bg-surface">
          <p className={cn('text-[12px] text-white', changed && 'bg-surface-hover/20 rounded-[3px] px-0.5')}>
            Behind the scenes — Olive Garden kitchen
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">2:34 · YouTube</p>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_MAP: Record<ContentItemType, React.FC<{ changed?: boolean }>> = {
  blog:    BlogPreview,
  social:  SocialPreview,
  email:   EmailPreview,
  faq:     FAQPreview,
  landing: LandingPreview,
  video:   VideoPreview,
};

// ── Read-only card (used in version history) ──────────────────────────────────

export function ReadOnlyContentCard({
  card,
  changed = false,
}: {
  card: ContentCardData;
  changed?: boolean;
}) {
  const Icon = TYPE_ICON[card.itemType];
  const Preview = PREVIEW_MAP[card.itemType];

  return (
    <div className={cn(
      'rounded-xl border bg-background',
      changed ? 'border-amber-300/80' : 'border-border',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="size-6 rounded-md bg-primary/[0.07] flex items-center justify-center flex-none">
            <Icon size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/70" />
          </div>
          <span className="text-[13px] text-foreground truncate">{ITEM_TYPE_LABEL[card.itemType]}</span>
        </div>
        {changed && (
          <span className="text-[11px] text-text-secondary bg-surface-hover px-2 py-0.5 rounded-full">
            Changed
          </span>
        )}
      </div>
      {/* Preview body */}
      <Preview changed={changed} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EditorContentCard({
  card,
  onScoreClick,
  scoreActive,
  onEdit,
  onDelete,
  onAddAnother,
  showAddAnother = true,
}: EditorContentCardProps) {
  const Icon = TYPE_ICON[card.itemType];
  const Preview = PREVIEW_MAP[card.itemType];

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const assignedUser = TEAM_MEMBERS.find(u => u.id === selectedUserId) ?? null;

  function handleAssignSend() {
    if (!assignedUser) return;
    const name = assignedUser.name;
    setAssignOpen(false);
    setSelectedUserId(null);
    toast.success(`Assigned to ${name}`);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Card */}
      <div className={cn(
        'rounded-xl border bg-background transition-shadow hover:shadow-sm',
        scoreActive ? 'border-primary/30 shadow-sm' : 'border-border',
      )}>

        {/* Card header — matches FAQ/blog canvas style */}
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border">

          {/* LEFT: icon + content type label */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="size-6 rounded-md bg-primary/[0.07] flex items-center justify-center flex-none">
              <Icon size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/70" />
            </div>
            <span className="text-[13px] text-foreground truncate">{ITEM_TYPE_LABEL[card.itemType]}</span>
          </div>

          {/* RIGHT: score ring + number | Edit (bordered) | Kebab */}
          <div className="flex items-center gap-1 flex-none">

            {/* Score ring + number */}
            <button
              type="button"
              onClick={() => onScoreClick(card.id)}
              aria-label={`Content score: ${card.score}`}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2 rounded transition-colors',
                scoreActive ? 'bg-muted' : 'hover:bg-surface-hover/60',
              )}
            >
              <ScoreProgressRing score={card.score} />
              <span
                className="text-[12px] tabular-nums leading-none"
                style={{ color: scoreColor(card.score).text }}
              >
                {card.score}
              </span>
            </button>

            {/* Assign to dropdown */}
            <DropdownMenu open={assignOpen} onOpenChange={setAssignOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Assign to"
                  className="flex items-center gap-1 h-7 px-2 rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  {assignedUser ? (
                    <div className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] text-white', assignedUser.color)}>
                      {assignedUser.initials}
                    </div>
                  ) : (
                    <UserRound size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  )}
                  <span className="text-[12px]">{assignedUser ? assignedUser.name.split(' ')[0] : 'Assign'}</span>
                  <ChevronDown size={10} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[272px] p-0 overflow-hidden">
                <div className="px-2 py-2.5 border-b border-border">
                  <p className="text-[12px] text-foreground">Assign to</p>
                </div>
                <div className="py-1 max-h-[220px] overflow-y-auto">
                  {TEAM_MEMBERS.map(member => (
                    <DropdownMenuItem
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-2.5 cursor-pointer"
                      onSelect={e => {
                        e.preventDefault();
                        setSelectedUserId(member.id === selectedUserId ? null : member.id);
                      }}
                    >
                      <div className={cn('flex size-[34px] shrink-0 items-center justify-center rounded-full text-[11px] text-white', member.color)}>
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground leading-none mb-0.5">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {selectedUserId === member.id && (
                        <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="border-t border-border p-2">
                  <button
                    type="button"
                    disabled={!assignedUser}
                    onClick={handleAssignSend}
                    className="w-full rounded-md bg-primary px-2 py-1.5 text-[13px] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Send
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit — bordered tile, navigates to item editor */}
            <button
              type="button"
              title="Edit"
              onClick={() => onEdit(card.id)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <Pencil size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </button>

            {/* Kebab — AI, Preview, Duplicate, Delete */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More options"
                  className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  <MoreHorizontal size={14} strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem className="gap-2">
                  <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  AI suggestions
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Eye size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2"
                  onSelect={() => onDelete?.(card.id)}
                >
                  <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Card body — content preview (view mode) */}
        <Preview />
      </div>

      {/* Canva-style "Add another" footer */}
      {showAddAnother && (
        <div className="flex items-center gap-2 py-1">
          <div className="flex-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => onAddAnother(card.itemType)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors group"
          >
            <span className="size-5 rounded-full border border-dashed border-border group-hover:border-primary/50 flex items-center justify-center transition-colors">
              <span className="text-[14px] leading-none">+</span>
            </span>
            Add another {ITEM_TYPE_LABEL[card.itemType].toLowerCase()}
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}
    </div>
  );
}
