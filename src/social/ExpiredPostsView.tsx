import { useState } from 'react';
import { POST_DATA } from './data/postData';
import { FacebookIcon, InstagramIcon, LinkedInIcon } from './PlatformIcons';
import { Clock, RotateCcw, AlertTriangle, Info } from 'lucide-react';

const RV = { } as const;


interface ExpiredPostsViewProps {
  onCreatePost: () => void;
  onOpenActivity: (postId: string) => void;
}

// ── Platform icons row ───────────────────────────────────────────────────────
function PlatformRow({ platforms }: { platforms: ('facebook' | 'instagram' | 'linkedin')[] }) {
  return (
    <div className="flex items-center gap-[4px]">
      {platforms.map(p => (
        <div key={p} className="shrink-0 size-[18px]">
          {p === 'facebook' ? <FacebookIcon /> : p === 'instagram' ? <InstagramIcon /> : <LinkedInIcon />}
        </div>
      ))}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function ExpiredBadge() {
  return (
    <span
      className="inline-flex items-center gap-[4px] px-[8px] py-[2px] rounded-[4px] shrink-0 bg-muted border border-border"
    >
      <Clock size={11} className="text-muted-foreground" />
      <span style={{ fontSize: 11 }} className="text-muted-foreground">Expired</span>
    </span>
  );
}

// ── Platform failure warning ─────────────────────────────────────────────────
function PartialFailureBanner({ failedPlatforms }: { failedPlatforms: string[] }) {
  const names: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' };
  return (
    <div className="flex items-start gap-[8px] px-[10px] py-[7px] rounded-[4px] mt-[8px] bg-muted border border-[#ffcc80] ">
      <AlertTriangle size={13} className="text-[#e65100] shrink-0 mt-[1px]" />
      <p style={{ fontSize: 12, lineHeight: 1.5 }} className="text-[#7c4700] ">
        Post could not be removed from <strong>{failedPlatforms.map(p => names[p]).join(', ')}</strong> — the platform's API does not support automatic deletion. The post remains visible there but is marked expired in BirdEye.
      </p>
    </div>
  );
}

// ── Single expired post card ─────────────────────────────────────────────────
function ExpiredPostCard({
  postId,
  onReschedule,
  onOpenActivity,
}: {
  postId: string;
  onReschedule: () => void;
  onOpenActivity: (id: string) => void;
}) {
  const post = POST_DATA[postId];
  if (!post) return null;

  const expiryLabel = post.expiryDate
    ? new Date(post.expiryDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'No expiry date set';

  return (
    <div
      className="bg-background border border-border rounded-[8px] overflow-hidden mb-[12px]"
    >
      <div className="flex gap-[0] items-stretch">
        {/* Thumbnail */}
        <div style={{ width: 80, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          <img
            src={post.image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(60%) opacity(0.75)' }}
          />
          {/* Expired overlay stamp */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.28)' }}
          >
            <Clock size={20} color="white" style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-[14px] py-[12px] min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-[8px] mb-[6px]">
            <PlatformRow platforms={post.platforms} />
            <ExpiredBadge />
            <span style={{ fontSize: 11, marginLeft: 'auto' }} className="text-muted-foreground">
              {post.location}
            </span>
          </div>

          {/* Caption */}
          <p
            style={{ fontSize: 13, lineHeight: '18px' }}
            className="mb-[6px] line-clamp-2 text-[#333] "
          >
            {post.caption}
          </p>

          {/* Expiry + schedule meta */}
          <div className="flex items-center gap-[14px] flex-wrap">
            <div className="flex items-center gap-[4px]">
              <Clock size={12} className="text-muted-foreground" />
              <span style={{ fontSize: 11.5 }} className="text-muted-foreground">
                Expired: {expiryLabel}
              </span>
            </div>
            {post.scheduledFor && (
              <span style={{ fontSize: 11.5 }} className="text-muted-foreground">
                Originally: {post.scheduledFor}
              </span>
            )}
          </div>

          {/* Partial failure banner */}
          {post.expiryFailedPlatforms && post.expiryFailedPlatforms.length > 0 && (
            <PartialFailureBanner failedPlatforms={post.expiryFailedPlatforms} />
          )}
        </div>

        {/* Action column */}
        <div className="flex flex-col items-end justify-between px-[14px] py-[12px] shrink-0 gap-[8px]">
          <button
            onClick={onReschedule}
            className="flex items-center gap-[5px] transition-colors bg-primary hover:bg-primary/90 text-white rounded-[4px] cursor-pointer"
            style={{
              height: 30, padding: '0 12px',
              border: 'none',
              fontSize: 12,
            }}
          >
            <RotateCcw size={11} />
            Reschedule
          </button>
          <button
            onClick={() => onOpenActivity(postId)}
            className="text-primary "
            style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View history
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ExpiredPostsView({ onCreatePost, onOpenActivity }: ExpiredPostsViewProps) {
  const [search, setSearch] = useState('');

  const expiredPosts = Object.values(POST_DATA).filter(p => p.status === 'expired');

  const filtered = expiredPosts.filter(p =>
    !search || p.caption.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase())
  );

  const failedCount = expiredPosts.filter(p => p.expiryFailedPlatforms && p.expiryFailedPlatforms.length > 0).length;

  return (
    <div className="bg-background h-full flex flex-col transition-colors duration-300">

      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0 border-b border-border"
        style={{ padding: '14px 24px' }}
      >
        <div>
          <p
            style={{ fontSize: 18, letterSpacing: '-0.36px' }}
            className="text-foreground"
          >
            Expired posts
          </p>
          <p style={{ fontSize: 12,marginTop: 2, ...RV }} className="text-muted-foreground">
            {expiredPosts.length} post{expiredPosts.length !== 1 ? 's' : ''} expired
          </p>
        </div>
      </div>

      {/* Platform failure notice banner (shown if any partial failures) */}
      {failedCount > 0 && (
        <div
          className="flex items-start gap-[10px] mx-[24px] mt-[14px] px-[14px] py-[10px] rounded-[6px] bg-muted border border-[#ffcc80] "
        >
          <Info size={15} className="text-[#e65100] shrink-0 mt-[1px]" />
          <p style={{ fontSize: 12.5,lineHeight: 1.5, ...RV }} className="text-[#7c4700] ">
            <strong>{failedCount} post{failedCount !== 1 ? 's' : ''}</strong> could not be fully removed from all platforms due to API limitations. These posts remain visible on the affected platforms but are marked as expired in BirdEye.
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '12px 24px 0' }}>
        <div
          className="flex items-center gap-[8px] border border-border rounded-[6px] bg-background"
          style={{ padding: '7px 12px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="var(--s-text-muted)" strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke="var(--s-text-muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search expired posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13,color: 'var(--s-text-primary)', background: 'transparent', ...RV }}
          />
        </div>
      </div>

      {/* Edge case: empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-[12px]">
          <div
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-muted"
          >
            <Clock size={20} className="text-muted-foreground" />
          </div>
          <p style={{ fontSize: 14,...RV }} className="text-muted-foreground">
            {search ? 'No expired posts match your search' : 'No expired posts yet'}
          </p>
          {!search && (
            <p style={{ fontSize: 12,textAlign: 'center', maxWidth: 320, lineHeight: 1.5, ...RV }} className="text-muted-foreground">
              Posts with an expiry date set will appear here once they expire. You can set an expiry date when creating or editing a post.
            </p>
          )}
        </div>
      )}

      {/* Post list */}
      {filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto" style={{ padding: '14px 24px' }}>
          {filtered.map(post => (
            <ExpiredPostCard
              key={post.postId}
              postId={post.postId}
              onReschedule={onCreatePost}
              onOpenActivity={onOpenActivity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
