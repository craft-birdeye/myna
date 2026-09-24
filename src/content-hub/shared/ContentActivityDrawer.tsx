import {
  ArrowDown,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  Share2,
  X,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

export type ContentActivityDrawerProps = {
  open: boolean;
  onClose: () => void;
  contentType?: 'blog' | 'faq';
};

type ActivityEntry =
  | {
      id: string;
      when: string;
      actor: string;
      action: string;
      kind: 'edit';
      label: string;
      before: string;
      after: string;
    }
  | {
      id: string;
      when: string;
      actor: string;
      action: string;
      kind: 'edit';
      label: string;
      note: string;
    }
  | {
      id: string;
      when: string;
      actor: string;
      action: string;
      kind: 'approval' | 'download' | 'share' | 'schedule';
    };

const CONTENT_ACTIVITY: Record<'faq' | 'blog', ActivityEntry[]> = {
  faq: [
    {
      id: 'faq-1',
      when: 'Just now',
      actor: 'Ana Perez',
      action: 'edited an answer',
      kind: 'edit',
      label: 'Answer',
      before: 'We serve the surrounding communities and can confirm availability when you call.',
      after: 'We serve Austin, Cedar Park, Round Rock, and nearby communities within a 40-mile radius. Call us to confirm same-day availability in your area.',
    },
    {
      id: 'faq-2',
      when: '28 mins ago',
      actor: 'Ray Chen',
      action: 'approved the FAQ',
      kind: 'approval',
    },
    {
      id: 'faq-3',
      when: 'Today, 9:10 AM',
      actor: 'Nina Patel',
      action: 'downloaded the FAQ',
      kind: 'download',
    },
    {
      id: 'faq-4',
      when: 'Today, 8:42 AM',
      actor: 'Nina Patel',
      action: 'added a question',
      kind: 'edit',
      label: 'Question',
      note: 'Do emergency visits cost extra?',
    },
    {
      id: 'faq-5',
      when: 'Yesterday, 5:24 PM',
      actor: 'Ana Perez',
      action: 'shared the FAQ',
      kind: 'share',
    },
    {
      id: 'faq-6',
      when: 'Yesterday, 3:10 PM',
      actor: 'Ray Chen',
      action: 'approved the FAQ',
      kind: 'approval',
    },
    {
      id: 'faq-7',
      when: 'May 10, 2026',
      actor: 'Ana Perez',
      action: 'created the draft',
      kind: 'schedule',
    },
  ],
  blog: [
    {
      id: 'blog-1',
      when: 'Just now',
      actor: 'Ana Perez',
      action: 'edited the introduction',
      kind: 'edit',
      label: 'Introduction',
      before: 'Learn how service businesses can improve their online visibility with better local content.',
      after: 'Local service brands can win more AI citations by pairing useful answers with city-specific proof points, FAQs, and service page links.',
    },
    {
      id: 'blog-2',
      when: '42 mins ago',
      actor: 'David Rodriguez',
      action: 'approved the blog',
      kind: 'approval',
    },
    {
      id: 'blog-3',
      when: 'Yesterday, 4:15 PM',
      actor: 'Nina Patel',
      action: 'downloaded the blog',
      kind: 'download',
    },
    {
      id: 'blog-4',
      when: 'Yesterday, 2:30 PM',
      actor: 'Nina Patel',
      action: 'edited a section',
      kind: 'edit',
      label: 'Section',
      note: 'Updated the conclusion with stronger local proof points and a direct call to action.',
    },
    {
      id: 'blog-5',
      when: 'Yesterday, 11:00 AM',
      actor: 'Ray Chen',
      action: 'shared the blog',
      kind: 'share',
    },
    {
      id: 'blog-6',
      when: 'May 10, 2026',
      actor: 'David Rodriguez',
      action: 'approved the outline',
      kind: 'approval',
    },
    {
      id: 'blog-7',
      when: 'May 9, 2026',
      actor: 'Ana Perez',
      action: 'created the draft',
      kind: 'schedule',
    },
  ],
};

function activityIcon(kind: string) {
  const iconProps = { size: 14, strokeWidth: 1.6, absoluteStrokeWidth: true } as const;
  if (kind === 'approval') return <CheckCircle2 {...iconProps} />;
  if (kind === 'schedule') return <CalendarClock {...iconProps} />;
  if (kind === 'download') return <Download {...iconProps} />;
  if (kind === 'share') return <Share2 {...iconProps} />;
  return <Edit3 {...iconProps} />;
}

function ActivityPanelContent({
  onClose,
  contentType,
}: {
  onClose: () => void;
  contentType: 'blog' | 'faq';
}) {
  const activities = CONTENT_ACTIVITY[contentType];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white px-4 py-2">
        <span className="text-[14px] text-foreground">Activity</span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Close activity"
        >
          <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Activity list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="divide-y divide-border">
          {activities.map(activity => (
            <div key={activity.id} className="flex gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {activityIcon(activity.kind)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground">{activity.when}</p>
                <p className="mt-0.5 text-[12px] leading-5 text-foreground">
                  <span>{activity.actor}</span>
                  {' '}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>

                {activity.kind === 'edit' && 'before' in activity && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2">
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <FileText size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      {activity.label}
                    </div>
                    <p className="text-[12px] leading-5 text-muted-foreground line-through">
                      {activity.before}
                    </p>
                    <div className="my-3 flex items-center gap-2 text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      <ArrowDown size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <p className="text-[12px] leading-5 text-foreground">
                      {activity.after}
                    </p>
                  </div>
                )}

                {activity.kind === 'edit' && 'note' in activity && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <FileText size={12} strokeWidth={1.6} absoluteStrokeWidth />
                      {activity.label}
                    </div>
                    <p className="text-[12px] leading-5 text-foreground">{activity.note}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContentActivityDrawer({
  open,
  onClose,
  contentType = 'faq',
}: ContentActivityDrawerProps) {
  return (
    <div
      className={cn(
        'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
        open ? 'w-[300px]' : 'w-0',
      )}
      aria-hidden={!open}
    >
      <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
        {open && (
          <ActivityPanelContent onClose={onClose} contentType={contentType} />
        )}
      </div>
    </div>
  );
}
