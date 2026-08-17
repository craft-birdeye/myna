import { useState } from 'react';
import {
  Pencil, MessageSquare, Info, History, Copy, Trash2,
  Search, ChevronDown, MoreVertical, AlertCircle, Clock, RefreshCw
} from 'lucide-react';
import { POST_DATA } from './data/postData';
import { APPROVAL_DATA } from './data/approvalData';
import { PlatformIcons } from './PlatformIcons';

// ─── Status Badge ──────────────────────────────────────────────────────────────

type CardStatus = 'rejected' | 'expired';

const statusConfig: Record<CardStatus, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  rejected: { bg: '#fef6f5', color: '#de1b0c', label: 'Rejected',
    icon: <AlertCircle size={13} className="inline mr-[3px] mb-[1px]" /> },
  expired:  { bg: '#f0f0f0', color: '#555',    label: 'Expired',
    icon: <Clock size={13} className="inline mr-[3px] mb-[1px]" /> },
};

function StatusBadge({ status }: { status: CardStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="text-[12px] px-[8px] py-[3px] rounded-[4px] whitespace-nowrap shrink-0 flex items-center gap-[3px]"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Rejection Banner ──────────────────────────────────────────────────────────

function RejectionBanner({ reason, rejectedBy }: { reason: string; rejectedBy?: string }) {
  return (
    <div className="bg-muted border border-[#f5c6c2] rounded-[6px] px-[14px] py-[10px] mb-[12px]">
      <div className="flex items-start gap-[8px]">
        <AlertCircle size={16} className="text-[#de1b0c] shrink-0 mt-[1px]" />
        <div>
          {rejectedBy && (
            <p className="text-[12px] text-[#de1b0c] mb-[2px]">
              Rejected by {rejectedBy}
            </p>
          )}
          <p className="text-[13px] text-destructive leading-[18px]">
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Expired Banner ────────────────────────────────────────────────────────────

function ExpiredBanner() {
  return (
    <div className="bg-muted border border-border rounded-[6px] px-[14px] py-[10px] mb-[12px]">
      <div className="flex items-start gap-[8px]">
        <Clock size={16} className="text-muted-foreground shrink-0 mt-[1px]" />
        <div>
          <p className="text-[12px] text-muted-foreground mb-[2px]">
            Approval window expired
          </p>
          <p className="text-[13px] text-muted-foreground leading-[18px]">
            The scheduled time passed without completing the approval process. Edit and resubmit to publish this post.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

interface RejectedPostCardProps {
  postId: string;
  cardStatus: CardStatus;
  onOpenDetails: (postId: string) => void;
  onOpenActivity: (postId: string) => void;
}

function RejectedPostCard({ postId, cardStatus, onOpenDetails, onOpenActivity }: RejectedPostCardProps) {
  const post = POST_DATA[postId];
  const approval = APPROVAL_DATA[postId];
  if (!post) return null;

  const locationCount = approval?.locations?.length ?? 3;
  const displayDate = `${post.date.split(',')[1]?.trim() ?? post.date}, ${post.time}`;

  // Find primary rejection reason
  let rejectionReason = '';
  let rejectedBy = '';
  if (approval) {
    for (const step of approval.steps) {
      for (const approver of step.approvers) {
        if (approver.action === 'rejected' && approver.rejectionReason) {
          rejectionReason = approver.rejectionReason;
          rejectedBy = approver.isCurrentUser ? 'You' : approver.name;
          break;
        }
      }
      if (rejectionReason) break;
    }
    // Fallback to location rejection
    if (!rejectionReason) {
      const rejectedLoc = approval.locations.find(l => l.status === 'rejected' && l.rejectionReason);
      if (rejectedLoc) {
        rejectionReason = rejectedLoc.rejectionReason ?? '';
        rejectedBy = rejectedLoc.actionedBy ?? '';
      }
    }
  }

  return (
    <div
      className="bg-background border border-border rounded-[8px] overflow-hidden cursor-pointer hover:border-primary dark:hover:border-[#5b9cf6] transition-colors"
      onClick={() => onOpenDetails(postId)}
    >
      <div className="px-[16px] pt-[16px] pb-[0px]">
        {/* Top row: channel icons + status badge */}
        <div className="flex items-center justify-between mb-[10px]">
          <PlatformIcons platforms={post.platforms.length > 1 ? post.platforms : ['facebook', 'instagram', 'linkedin']} />
          <StatusBadge status={cardStatus} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-[6px] mb-[12px] flex-wrap">
          <span className="text-[13px] text-muted-foreground">{displayDate}</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{locationCount} locations</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{approval?.submittedBy ?? 'Creator name'}</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{approval?.workflowTitle ?? 'Workflow name'}</span>
        </div>

        {/* Rejection / Expired banner */}
        {cardStatus === 'rejected' && rejectionReason && (
          <RejectionBanner reason={rejectionReason} rejectedBy={rejectedBy} />
        )}
        {cardStatus === 'expired' && <ExpiredBanner />}

        {/* Caption */}
        <p className="text-[14px] text-foreground leading-[22px] mb-[12px] line-clamp-2">
          {post.caption}
        </p>

        {/* Hashtags */}
        <p className="text-[13px] text-primary leading-[20px] mb-[14px] line-clamp-1">
          {post.hashtags}
        </p>

        {/* Image */}
        <div className="flex gap-[8px] mb-[14px]">
          <div className="relative rounded-[6px] overflow-hidden shrink-0" style={{ width: 112, height: 112 }}>
            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        className="border-t border-border px-[16px] py-[10px] flex items-center justify-between"
        onClick={e => e.stopPropagation()}
      >
        {/* Left icons */}
        <div className="flex items-center gap-[12px]">
          <button className="text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0] p-[2px]" title="Edit">
            <Pencil size={18} />
          </button>
          <button className="text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0] p-[2px]" title="Comment">
            <MessageSquare size={18} />
          </button>
          <button className="text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0] p-[2px]" title="Info">
            <Info size={18} />
          </button>
          <button
            className="text-muted-foreground hover:text-primary dark:hover:text-[#5b9cf6] p-[2px]"
            title="Activity"
            onClick={() => onOpenActivity(postId)}
          >
            <History size={18} />
          </button>
          <button className="text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0] p-[2px]" title="Copy">
            <Copy size={18} />
          </button>
          <button className="text-muted-foreground hover:text-[#de1b0c] p-[2px]" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Right: Edit & Resubmit */}
        <div className="flex items-center gap-[8px]">
          <button className="h-[36px] px-[16px] flex items-center gap-[6px] rounded-[4px] border border-border bg-background text-[14px] text-foreground hover:bg-muted transition-colors">
            <Pencil size={14} /> Edit
          </button>
          <button className="h-[36px] px-[16px] flex items-center gap-[6px] rounded-[4px] bg-primary text-[14px] text-white hover:bg-primary/90 transition-colors">
            <RefreshCw size={14} /> Resubmit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mock Expired Posts ────────────────────────────────────────────────────────
// These are additional expired posts (awaiting posts that timed out)
const EXPIRED_POST_IDS = ['post-7']; // Post 7 is scheduled — we'll show it as expired for demo

// ─── Main View ─────────────────────────────────────────────────────────────────

interface RejectedPostsViewProps {
  onOpenDetails: (postId: string) => void;
  onOpenActivity: (postId: string) => void;
}

type FilterTab = 'all' | 'rejected' | 'expired';

export function RejectedPostsView({ onOpenDetails, onOpenActivity }: RejectedPostsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Rejected posts from data
  const rejectedPostIds = Object.keys(POST_DATA).filter(
    id => POST_DATA[id].status === 'rejected'
  );

  // All cards: rejected + expired
  type CardEntry = { postId: string; cardStatus: CardStatus };
  const allCards: CardEntry[] = [
    ...rejectedPostIds.map(id => ({ postId: id, cardStatus: 'rejected' as CardStatus })),
    ...EXPIRED_POST_IDS.map(id => ({ postId: id, cardStatus: 'expired' as CardStatus })),
  ];

  const filtered = allCards.filter(({ postId, cardStatus }) => {
    if (activeTab !== 'all' && cardStatus !== activeTab) return false;
    if (searchQuery) {
      const post = POST_DATA[postId];
      return post?.caption?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allCards.length },
    { id: 'rejected', label: 'Rejected', count: rejectedPostIds.length },
    { id: 'expired', label: 'Expired', count: EXPIRED_POST_IDS.length },
  ];

  return (
    <div className="flex flex-col h-full transition-colors duration-300">
      {/* Page header */}
      <div className="border-b border-border px-[24px] h-[64px] flex items-center justify-between shrink-0 bg-background">
        <h1 className="font-normal text-[20px] text-foreground tracking-[-0.4px]">
          Fix rejected posts
        </h1>
        <div className="flex items-center gap-[8px]">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-[10px] text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-[36px] pl-[32px] pr-[12px] rounded-md border border-border bg-background text-[14px] text-foreground outline-none focus:border-primary dark:focus:border-[#5b9cf6] w-[200px] placeholder:text-[#aaa] dark:placeholder:text-[#6b7a94]"
            />
          </div>
          <button className="h-[36px] px-[12px] flex items-center gap-[6px] rounded-md border border-border bg-background text-[14px] text-foreground hover:bg-muted">
            Newest <ChevronDown size={16} />
          </button>
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted">
            <MoreVertical size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-[0px] border-b border-border px-[24px] bg-background shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-[16px] py-[12px] text-[14px] border-b-2 -mb-[1px] flex items-center gap-[6px] transition-colors ${
              activeTab === tab.id
                ? 'border-primary  text-primary '
                : 'border-transparent text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span
              className={`text-[11px] px-[6px] py-[1px] rounded-[10px] ${
                activeTab === tab.id ? 'bg-primary  text-white' : 'bg-[#eaeaea]  text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto px-[24px] py-[16px] bg-muted ">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] gap-[8px]">
            <p className="text-[16px] text-muted-foreground">No posts here</p>
            <p className="text-[13px] text-muted-foreground">All posts are approved and on track!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[16px] max-w-[700px] mx-auto">
            {filtered.map(({ postId, cardStatus }) => (
              <RejectedPostCard
                key={postId}
                postId={postId}
                cardStatus={cardStatus}
                onOpenDetails={onOpenDetails}
                onOpenActivity={onOpenActivity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
