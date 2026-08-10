import svgPaths from './imports/svg-q05k7ytov1';
import { imgHelp, imgEdit } from './imports/svg-ss3mz';
import { POST_DATA } from './data/postData';
import { useState, useRef, useEffect } from 'react';

interface CalendarViewProps {
  onPostClick: (postId: string) => void;
  onActivityClick: (postId: string) => void;
  onViewExpiredPosts?: () => void;
  highlightedPostId?: string | null;
  toastMessage?: string | null;
}

type StatusType = 'published' | 'draft' | 'rejected' | 'awaiting' | 'scheduled' | 'ai-suggested' | 'expired';
type ActionType = 'simple' | 'workflow';

interface PostCardProps {
  postId: string;
  status: StatusType;
  platforms: ('facebook' | 'instagram' | 'linkedin')[];
  time: string;
  caption: string;
  image: string;
  actionType: ActionType;
  hasOuterBorder?: boolean;    // awaiting approval — use highlighted border
  locationCount?: number;      // e.g. "8 pages"
  expiryDate?: string;         // ISO — show expiry label when set
  highlighted?: boolean;       // newly created post — ring highlight
  onActivityClick: (postId: string) => void;
  onPostClick: (postId: string) => void;
  isPast?: boolean;
}

// ─── Status chip Tailwind classes (light + dark) ──────────────────────────────
const statusChipClasses: Record<StatusType, string> = {
  published:      'bg-[#edf8ef] text-[#377e2c]         ',
  draft:          'bg-[#e9e9eb] text-[#555555]         ',
  rejected:       'bg-[#fef6f5] text-[#de1b0c]         ',
  awaiting:       'bg-[#fef3d6] text-[#c69204]         ',
  scheduled:      'bg-[#ecf5fd] text-[#1565b4]         ',
  'ai-suggested': 'bg-[#ede6f8] text-[#6834b7]         ',
  expired:        'bg-[#e9e9eb] text-[#888888]         ',
};

const statusLabels: Record<StatusType, string> = {
  published:      'Published',
  draft:          'Draft',
  rejected:       'Rejected',
  awaiting:       'Awaiting approval',
  scheduled:      'Scheduled',
  'ai-suggested': 'AI-suggested',
  expired:        'Expired',
};


function FacebookIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute bg-[#337fff] inset-[0_-0.01%_0_0.01%] rounded-[10.591px]" />
      <div className="absolute inset-[25.11%_35.93%_24.84%_36.99%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.41425 10.0089">
          <path d={svgPaths.p3dc9c800} fill="white" />
        </svg>
      </div>
    </div>
  );
}

function InstagramIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute inset-0 rounded-[12px]" style={{ backgroundImage: 'linear-gradient(-45deg, rgb(251, 225, 138) 0.96099%, rgb(252, 187, 69) 21.961%, rgb(247, 82, 116) 38.961%, rgb(213, 54, 146) 52.961%, rgb(143, 57, 206) 74.961%, rgb(91, 79, 233) 100.96%)' }}>
        <div className="absolute bottom-[24.85%] left-1/4 right-[24.97%] top-[25.11%]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0056 10.0089">
            <path d={svgPaths.p3e5d3500} fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute bg-[#0a66c2] inset-0 rounded-[12px]" />
      <div className="absolute inset-[30.22%_29.15%_29.74%_29%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.36943 8.00711">
          <path d={svgPaths.p36823500} fill="white" />
        </svg>
      </div>
    </div>
  );
}

function SimpleActionIcons({ postId, onActivityClick, showActivity }: { postId?: string; onActivityClick?: (id: string) => void; showActivity?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      {/* edit */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[14.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-2.333px_-2.333px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.3333 11.3333">
            <path d={svgPaths.p3a0fd900} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* content_copy */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[12.08%_18.13%_14.17%_18.13%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-2.9px_-1.933px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.1999 11.7999">
            <path d={svgPaths.p2f932100} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* tag/sell */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[12.08%_12.06%_12.04%_12.08%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.933px_-1.933px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.1365 12.1397">
            <path d={svgPaths.p3daf9600} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* delete */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[17.56%_22.08%_17.08%_22.08%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-3.533px_-2.81px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.9333 10.4564">
            <path d={svgPaths.p382a4d00} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* more_vert with Activity dropdown — shown for non-AI posts */}
      {showActivity && postId && onActivityClick && (
        <div
          className="relative shrink-0 size-[16px] cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          ref={menuRef}
        >
          <div className="absolute inset-[23.05%_44.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.133px_-3.687px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.7333 8.62557">
              <path d={svgPaths.p21a73580} fill="var(--s-icon-fill)" />
            </svg>
          </div>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-[4px] shadow-lg z-50 min-w-[120px]">
              <div
                className="px-[12px] py-[8px] hover:bg-muted cursor-pointer font-normal text-[14px] text-foreground whitespace-nowrap"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onActivityClick(postId); }}
              >
                Activity
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowActionIcons({ postId, onActivityClick }: { postId: string; onActivityClick: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0">
      {/* edit */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[14.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-2.333px_-2.333px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.3333 11.3333">
            <path d={svgPaths.p3a0fd900} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* calendar_month */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[11.6%_17.08%_12.08%_17.08%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-2.733px_-1.856px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5333 12.2102">
            <path d={svgPaths.pfa3b200} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* paper-plane */}
      <div className="relative shrink-0 size-[16px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <path d={svgPaths.p3f801a00} fill="var(--s-icon-fill)" stroke="var(--s-icon-fill)" strokeWidth="0.117857" />
        </svg>
      </div>
      {/* tag/sell */}
      <div className="relative shrink-0 size-[16px]">
        <div className="absolute inset-[12.08%_12.06%_12.04%_12.08%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.933px_-1.933px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.1365 12.1397">
            <path d={svgPaths.p3daf9600} fill="var(--s-icon-fill)" />
          </svg>
        </div>
      </div>
      {/* more_vert with dropdown */}
      <div
        className="relative shrink-0 size-[16px] cursor-pointer"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        ref={menuRef}
      >
        <div className="absolute inset-[23.05%_44.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.133px_-3.687px] mask-size-[16px_16px]" style={{ maskImage: `url('${imgEdit}')` }}>
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.7333 8.62557">
            <path d={svgPaths.p21a73580} fill="var(--s-icon-fill)" />
          </svg>
        </div>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-[4px] shadow-lg z-50 min-w-[120px]">
            <div
              className="px-[12px] py-[8px] hover:bg-muted cursor-pointer font-normal text-[14px] text-foreground whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onActivityClick(postId); }}
            >
              Activity
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ postId, status, platforms, time, caption, image, actionType, hasOuterBorder = false, locationCount, expiryDate, highlighted = false, isPast = false, onActivityClick, onPostClick }: PostCardProps) {
  const isExpired = status === 'expired';

  const fmtExpiry = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const cardClasses = highlighted
    ? 'border-2 border-[var(--s-blue)] shadow-[0_0_0_3px_rgba(25,118,210,0.15)]'
    : hasOuterBorder
      ? 'border border-[var(--s-border-subtle)]'
      : isPast
        ? 'border border-transparent'
        : 'border border-[var(--s-border)]';

const bgClass = isPast ? 'bg-[#f1f3f6] dark:bg-[#252a35]' : 'bg-background';
  return (
    <div
      className={`relative rounded-[8px] shrink-0 w-full cursor-pointer overflow-hidden ${bgClass} transition-colors duration-300 ${cardClasses}`}
      style={{ opacity: isExpired ? 0.6 : 1 }}
      onClick={() => onPostClick(postId)}
    >
      <div className="flex flex-col gap-[8px] items-start p-[8px] w-full">

        {/* Row 1: Status chip + page count */}
        <div className="flex items-center justify-between w-full gap-2">
          <span
            className={`inline-flex items-center rounded-[5px] px-[7px] py-[3px] text-[11px] font-medium leading-[16px] tracking-[-0.15px] whitespace-nowrap shrink-0 ${statusChipClasses[status]}`}
          >
            {statusLabels[status]}
          </span>
          {locationCount !== undefined && (
            <p
              className="font-normal text-[11px] text-muted-foreground tracking-[-0.22px] shrink-0"
            >
              {locationCount} pages
            </p>
          )}
        </div>

        {/* Row 2: Compact platform chips + time */}
        <div className="flex flex-wrap gap-[4px] items-center shrink-0">
          {platforms.map((platform) => (
            <span
              key={platform}
              className="inline-flex items-center justify-center rounded-[5px] border border-border bg-background p-[2px] overflow-hidden"
            >
              {platform === 'facebook' && <FacebookIcon />}
              {platform === 'instagram' && <InstagramIcon />}
              {platform === 'linkedin' && <LinkedInIcon />}
            </span>
          ))}
          <p
            className="font-normal leading-[18px] text-muted-foreground text-[11px] tracking-[-0.22px] ml-0.5"
          >
            {time}
          </p>
        </div>

        {/* Expiry row — shown when expiryDate is set */}
        {expiryDate && (
          <p
            className="font-normal text-[10px] tracking-[-0.2px]"
            style={{ color: isExpired ? 'var(--s-text-muted)' : '#c69204' }}
          >
            {isExpired ? 'Expired' : 'Expires'} {fmtExpiry(expiryDate)}
          </p>
        )}

        {/* Caption preview — 2 lines max */}
        <p
          className="font-normal leading-[1.4] text-foreground text-[11px] line-clamp-2 w-full"
        >
          {caption}
        </p>

        {/* Image */}
        <div className="h-[110px] relative rounded-[4px] shrink-0 w-full overflow-hidden">
          <img alt="" className="absolute inset-0 w-full h-full object-cover" src={image} />
        </div>

        {/* Action icons */}
        {actionType === 'simple' ? (
          <SimpleActionIcons
            postId={postId}
            onActivityClick={onActivityClick}
            showActivity={status !== 'ai-suggested'}
          />
        ) : (
          <WorkflowActionIcons postId={postId} onActivityClick={onActivityClick} />
        )}
      </div>
    </div>
  );
}

// Captions and images are now driven from POST_DATA
export function CalendarView({ onPostClick, onActivityClick, onViewExpiredPosts, highlightedPostId, toastMessage }: CalendarViewProps) {
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightedPostId && highlightedPostId.startsWith('post-new')) {
      setCreatedPostId(highlightedPostId);
    }
  }, [highlightedPostId]);
  const [calMoreOpen, setCalMoreOpen] = useState(false);
  const calMoreRef = useRef<HTMLDivElement>(null);
  const [visibleToast, setVisibleToast] = useState<string | null>(null);

  // Show toast from prop and auto-dismiss after 4s
  useEffect(() => {
    if (toastMessage) {
      setVisibleToast(toastMessage);
      setTimeout(() => setVisibleToast(null), 4000);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (!calMoreOpen) return;
    const handler = (e: MouseEvent) => {
      if (calMoreRef.current && !calMoreRef.current.contains(e.target as Node)) setCalMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [calMoreOpen]);

  const newPostId = createdPostId;
  const newPost = newPostId ? POST_DATA[newPostId] : null;

  return (
    <div className="bg-background relative w-full overflow-auto transition-colors duration-300">

      {/* ── Toast notification ── */}
      {visibleToast && (
        <div
          className="fixed top-[72px] left-1/2 z-50 flex items-center gap-[10px] px-[16px] py-[12px] rounded-[6px] shadow-lg"
          style={{ transform: 'translateX(-50%)', backgroundColor: 'var(--s-bg-primary)', minWidth: 280, pointerEvents: 'none', border: '1px solid var(--s-border)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="#4caf50" />
            <path d="M7 12.5l3.5 3.5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-foreground text-[14px]">
            {visibleToast}
          </p>
        </div>
      )}

      {/* Calendar Header (64px) */}
      <div className="bg-background h-[64px] relative shrink-0 w-full sticky top-0 z-10">
        <div aria-hidden="true" className="absolute border-border border-b border-solid inset-0 pointer-events-none" />
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[8px] items-center px-[24px] py-[8px] relative size-full">
            {/* Left: Month Navigation */}
            <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-h-px min-w-px relative">
              <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  {/* chevron_left */}
                  <div className="content-stretch flex items-center justify-center p-[8px] relative rounded-md shrink-0 size-[32px] cursor-pointer">
                    <div className="relative shrink-0 size-[20px]">
                      <div className="absolute inset-[27.44%_37.11%_27.42%_37.8%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.561px_-5.488px] mask-size-[20px_20px]" style={{ maskImage: `url('${imgHelp}')` }}>
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.0176 9.02811">
                          <path d={svgPaths.p186700} fill="var(--s-icon-fill)" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="font-normal leading-[26px] relative shrink-0 text-foreground text-[18px] tracking-[-0.36px] whitespace-nowrap">
                    March 2026
                  </p>
                  {/* chevron_right */}
                  <div className="content-stretch flex h-[32px] items-center justify-center p-[8px] relative rounded-md shrink-0 w-[33px] cursor-pointer">
                    <div className="relative shrink-0 size-[20px]">
                      <div className="absolute inset-[27.42%_37.8%_27.49%_37.13%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-7.425px_-5.484px] mask-size-[20px_20px]" style={{ maskImage: `url('${imgHelp}')` }}>
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.01367 9.01782">
                          <path d={svgPaths.p1b9e6f00} fill="var(--s-icon-fill)" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Today */}
                  <div className="content-stretch flex gap-[8px] h-[36px] items-center justify-center px-[12px] py-[8px] relative rounded-md shrink-0 cursor-pointer">
                    <p className="font-normal leading-[20px] relative shrink-0 text-primary text-[14px] tracking-[-0.28px] whitespace-nowrap">
                      Today
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
              {/* List/Week/Month toggle */}
              <div className="content-stretch flex gap-[4px] h-[36px] items-center px-[8px] py-[6px] relative rounded-md shrink-0">
                <div aria-hidden="true" className="absolute border-border border-[0.943px] border-solid inset-0 pointer-events-none rounded-md" />
                <div className="content-stretch flex h-[24px] items-center justify-center px-[8px] relative rounded-[4px] shrink-0 cursor-pointer">
                  <p className="font-normal leading-[20px] relative shrink-0 text-foreground text-[14px] tracking-[-0.28px] whitespace-nowrap">
                    List
                  </p>
                </div>
                <div className="bg-[#e5e9f0] content-stretch flex h-[24px] items-center justify-center overflow-clip px-[8px] relative rounded-[4px] shrink-0 cursor-pointer">
                  <p className="font-normal leading-[20px] relative shrink-0 text-foreground text-[14px] tracking-[-0.28px] whitespace-nowrap">
                    Week
                  </p>
                </div>
                <div className="content-stretch flex h-[24px] items-center justify-center px-[8px] relative rounded-[4px] shrink-0 cursor-pointer">
                  <p className="font-normal leading-[20px] relative shrink-0 text-foreground text-[14px] tracking-[-0.28px] whitespace-nowrap">
                    Month
                  </p>
                </div>
              </div>

              {/* AI button */}
              <div className="content-stretch flex items-center justify-center p-[8px] relative rounded-md shrink-0 size-[36px] cursor-pointer">
                <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-md" />
                <div className="relative shrink-0 size-[20px]">
                  <div className="absolute inset-[0_-0.15%_25.87%_16.67%]">
                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.6975 14.8252">
                      <path d={svgPaths.p33170700} fill="#6834B7" />
                      <path d={svgPaths.p2d8f3b80} fill="#6834B7" />
                      <path clipRule="evenodd" d={svgPaths.p1692000} fill="#6834B7" fillRule="evenodd" />
                      <path d={svgPaths.p4cf0c70} fill="#6834B7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* More (dots) button — with dropdown */}
              <div className="relative" ref={calMoreRef}>
                <div
                  className={`content-stretch flex items-center justify-center p-[8px] relative rounded-md shrink-0 size-[36px] cursor-pointer ${calMoreOpen ? 'bg-muted' : ''}`}
                  onClick={() => setCalMoreOpen(v => !v)}
                >
                  <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-md" />
                  <div className="relative shrink-0 size-[20px]">
                    <div className="absolute inset-[23.05%_44.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-8.917px_-4.609px] mask-size-[20px_20px]" style={{ maskImage: `url('${imgHelp}')` }}>
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.16663 10.782">
                        <path d={svgPaths.p1b297900} fill="var(--s-icon-fill)" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Dropdown */}
                {calMoreOpen && (
                  <div
                    className="absolute right-0 bg-background z-30"
                    style={{ top: 'calc(100% + 4px)', minWidth: 200, border: '1px solid var(--s-border)', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  >
                    <button
                      className="w-full text-left px-[14px] py-[9px] hover:bg-muted transition-colors flex items-center gap-[8px]"
                      style={{ fontSize: 13, color: 'var(--s-text-primary)' }}
                      onClick={() => { setCalMoreOpen(false); onViewExpiredPosts?.(); }}
                    >
                      {/* Clock-off / expired icon */}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="9" stroke="#666" strokeWidth="1.8"/>
                        <path d="M12 7v5l3 3" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 4l16 16" stroke="#de1b0c" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      View expired posts
                    </button>
                  </div>
                )}
              </div>

              {/* Filter button */}
              <div className="content-stretch flex items-start relative shrink-0">
                <div className="content-stretch flex items-center justify-center p-[8px] relative rounded-md shrink-0 size-[36px] cursor-pointer">
                  <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-md" />
                  <div className="relative shrink-0 size-[20px]">
                    <div className="absolute inset-[27.08%_14.58%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-2.917px_-5.417px] mask-size-[20px_20px]" style={{ maskImage: `url('${imgHelp}')` }}>
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.1667 9.16667">
                        <path d={svgPaths.p32d18bf0} fill="var(--s-icon-fill)" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Headers (45px) */}
      <div className="bg-muted content-stretch flex h-[45px] items-center relative shrink-0 w-full">
        {/* Sun 1 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Sun 1</p>
        </div>
        {/* Mon 2 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Mon 2</p>
        </div>
        {/* Tue 3 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Tue 3</p>
        </div>
        {/* Wed 4 - today */}
        <div className="bg-background h-full relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <div className="flex flex-row items-center justify-center size-full">
            <div className="content-stretch flex items-center justify-center p-[9.426px] relative size-full">
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                <p className="font-normal leading-[normal] relative shrink-0 text-primary text-[12.844px] text-center whitespace-nowrap">
                  Wed
                </p>
                <div className="bg-primary overflow-clip relative rounded-[47.131px] shrink-0 size-[18.852px]">
                  <p className="-translate-x-1/2 absolute font-medium leading-[15.591px] left-[calc(50%+0.07px)] text-[11.26px] text-center text-white top-[calc(50%-7.54px)] whitespace-nowrap">
                    4
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Thu 5 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Thu 5</p>
        </div>
        {/* Fri 6 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Fri 6</p>
        </div>
        {/* Sat 7 */}
        <div className="bg-background content-stretch flex h-[45px] items-center justify-center p-[9.426px] relative shrink-0 flex-1">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-solid inset-0 pointer-events-none" />
          <p className="font-normal leading-[normal] relative shrink-0 text-muted-foreground text-[12.254px] text-center whitespace-nowrap">Sat 7</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="content-stretch flex relative w-full">

        {/* Sun 1 — empty */}
        <div className="bg-[#f9fafb] dark:bg-[#181b22] flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId="post-3"
                isPast
                status="published"
                platforms={POST_DATA['post-3'].platforms}
                time="9:00 AM"
                caption={POST_DATA['post-3'].caption}
                image={POST_DATA['post-3'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-r border-solid inset-0 pointer-events-none" />
        </div>

        {/* Mon 2 — Published */}
        <div className="bg-[#f9fafb] dark:bg-[#181b22] flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId="post-1"
                isPast
                status="published"
                platforms={POST_DATA['post-1'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-1'].caption}
                image={POST_DATA['post-1'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-r border-solid inset-0 pointer-events-none" />
        </div>

        {/* Tue 3 — Draft + Rejected */}
        <div className="bg-[#f9fafb] dark:bg-[#181b22] flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId="post-2"
                isPast
                status="draft"
                platforms={POST_DATA['post-2'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-2'].caption}
                image={POST_DATA['post-2'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              <PostCard
                postId="post-3"
                isPast
                status="rejected"
                platforms={POST_DATA['post-3'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-3'].caption}
                image={POST_DATA['post-3'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-r border-solid inset-0 pointer-events-none" />
        </div>

        {/* Wed 4 — 3 approval scenarios + Rejected */}
        <div className="bg-background flex-[1_0_0] min-h-[976px] min-w-px relative">
          <div className="overflow-clip rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              {/* Scenario A: Fresh — step 1 of 2, your action needed */}
              <PostCard
                postId="post-4"
                status="awaiting"
                platforms={POST_DATA['post-4'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-4'].caption}
                image={POST_DATA['post-4'].image}
                actionType="workflow"
                hasOuterBorder
                locationCount={8}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              {/* Scenario B: Step 2 of 2 — waiting on you specifically */}
              <PostCard
                postId="post-5"
                status="awaiting"
                platforms={POST_DATA['post-5'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-5'].caption}
                image={POST_DATA['post-5'].image}
                actionType="workflow"
                hasOuterBorder
                locationCount={5}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              {/* Scenario C: Enterprise — step 5 of 10, mid-workflow */}
              <PostCard
                postId="post-10"
                status="awaiting"
                platforms={POST_DATA['post-10'].platforms}
                time="2:00 PM"
                caption={POST_DATA['post-10'].caption}
                image={POST_DATA['post-10'].image}
                actionType="workflow"
                hasOuterBorder
                locationCount={12}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              {/* Rejected from approval */}
              <PostCard
                postId="post-9"
                status="rejected"
                platforms={POST_DATA['post-9'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-9'].caption}
                image={POST_DATA['post-9'].image}
                actionType="simple"
                locationCount={3}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-r-[0.943px] border-solid inset-0 pointer-events-none" />
        </div>

        {/* Thu 5 — AI-suggested + Scheduled */}
        <div className="bg-background flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div className="overflow-clip relative rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId="post-6"
                status="ai-suggested"
                platforms={POST_DATA['post-6'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-6'].caption}
                image={POST_DATA['post-6'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              <PostCard
                postId="post-7"
                status="scheduled"
                platforms={POST_DATA['post-7'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-7'].caption}
                expiryDate={POST_DATA['post-7'].expiryDate}
                highlighted={highlightedPostId === 'post-7'}
                image={POST_DATA['post-7'].image}
                actionType="workflow"
                locationCount={10}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-r-[0.943px] border-solid inset-0 pointer-events-none" />
        </div>

        {/* Fri 6 — AI-suggested + Awaiting step 2/3 */}
        <div className="bg-background flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div className="overflow-clip relative rounded-[inherit] size-full">
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId="post-8"
                status="ai-suggested"
                platforms={POST_DATA['post-8'].platforms}
                time="10:00 AM"
                caption={POST_DATA['post-8'].caption}
                image={POST_DATA['post-8'].image}
                actionType="simple"
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
              {/* Scenario D: 3-step workflow at step 2 — standard regional review */}
              <PostCard
                postId="post-11"
                status="awaiting"
                platforms={POST_DATA['post-11'].platforms}
                time="11:00 AM"
                caption={POST_DATA['post-11'].caption}
                image={POST_DATA['post-11'].image}
                actionType="workflow"
                hasOuterBorder
                locationCount={6}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
              />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-r-[0.943px] border-solid inset-0 pointer-events-none" />
        </div>

        {/* Sat 7 — new post appears here after creation */}
        <div className="bg-background flex-[1_0_0] min-h-[939px] min-w-px relative">
          <div aria-hidden="true" className="absolute border-border border-b-[0.943px] border-r-[0.943px] border-solid inset-0 pointer-events-none" />
          {newPost && (
            <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative size-full">
              <PostCard
                postId={newPostId!}
                status={newPost.status}
                platforms={newPost.platforms}
                time={newPost.time}
                caption={newPost.caption}
                image={newPost.image}
                actionType="simple"
                expiryDate={newPost.expiryDate}
                onActivityClick={onActivityClick}
                onPostClick={onPostClick}
                highlighted={highlightedPostId === newPostId}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
