import { useState } from 'react';
import {
  Pencil, MessageSquare, Info, History, Copy, Trash2,
  Search, SlidersHorizontal, ChevronDown, MoreVertical
} from 'lucide-react';
import { POST_DATA } from './data/postData';
import { APPROVAL_DATA } from './data/approvalData';
import { PlatformIcons } from './PlatformIcons';

// ─── Status Badge ──────────────────────────────────────────────────────────────

const statusConfig = {
  awaiting: { bg: '#fef3d6', color: '#c69204', label: 'Awaiting approval' },
};

function StatusBadge({ status }: { status: 'awaiting' }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="text-[12px] px-[8px] py-[3px] rounded-[4px] whitespace-nowrap shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  postId: string;
  onOpenDetails: (postId: string) => void;
  onOpenActivity: (postId: string) => void;
}

function PostCard({ postId, onOpenDetails, onOpenActivity }: PostCardProps) {
  const post = POST_DATA[postId];
  const approval = APPROVAL_DATA[postId];
  if (!post || post.status !== 'awaiting') return null;

  const locationCount = approval?.locations?.length ?? 10;
  const creatorName = approval?.submittedBy ?? 'Creator name';
  const workflowName = approval?.workflowTitle ?? 'Workflow name';
  const displayDate = `${post.date.split(',')[1]?.trim() ?? post.date}, ${post.time}`;

  // Show multiple images layout
  const images = [post.image, post.image, post.image, post.image, post.image];

  return (
    <div
      className="bg-background border border-border rounded-[8px] overflow-hidden cursor-pointer hover:border-primary dark:hover:border-[#5b9cf6] transition-colors"
      onClick={() => onOpenDetails(postId)}
    >
      <div className="px-[16px] pt-[16px] pb-[0px]">
        {/* Top row: channel icons + status badge */}
        <div className="flex items-center justify-between mb-[10px]">
          <PlatformIcons platforms={post.platforms.length > 1 ? post.platforms : ['facebook', 'instagram', 'linkedin']} />
          <StatusBadge status="awaiting" />
        </div>

        {/* Meta row: date • locations • creator • workflow */}
        <div className="flex items-center gap-[6px] mb-[12px] flex-wrap">
          <span className="text-[13px] text-muted-foreground">{displayDate}</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{locationCount} locations</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{creatorName}</span>
          <span className="text-muted-foreground text-[12px]">•</span>
          <span className="text-[13px] text-muted-foreground">{workflowName}</span>
        </div>

        {/* Caption */}
        <p className="text-[14px] text-foreground leading-[22px] mb-[12px] line-clamp-3">
          {post.caption}
        </p>

        {/* Hashtags */}
        <p className="text-[13px] text-primary leading-[20px] mb-[14px] line-clamp-2">
          {post.hashtags}
        </p>

        {/* Images row */}
        <div className="flex gap-[8px] mb-[14px]">
          <div className="relative rounded-[6px] overflow-hidden shrink-0" style={{ width: 112, height: 112 }}>
            <img src={post.image} alt="Post" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        className="border-t border-border px-[16px] py-[10px] flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
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

        {/* Right: Reject + Approve */}
        <div className="flex items-center gap-[8px]">
          <button className="h-[36px] px-[16px] rounded-[4px] border border-border bg-background text-[14px] text-foreground hover:bg-muted transition-colors">
            Reject
          </button>
          <button className="h-[36px] px-[16px] rounded-[4px] bg-primary text-[14px] text-white hover:bg-primary/90 transition-colors">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

interface ApprovePostsViewProps {
  onOpenDetails: (postId: string) => void;
  onOpenActivity: (postId: string) => void;
}

export function ApprovePostsView({ onOpenDetails, onOpenActivity }: ApprovePostsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Posts that need approval
  const approvalPostIds = Object.keys(POST_DATA).filter(
    id => POST_DATA[id].status === 'awaiting'
  );

  const filtered = approvalPostIds.filter(id => {
    if (!searchQuery) return true;
    const post = POST_DATA[id];
    return post.caption.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full transition-colors duration-300">
      {/* Page header */}
      <div className="border-b border-border px-[24px] h-[64px] flex items-center justify-between shrink-0 bg-background">
        <h1 className="font-normal text-[20px] text-foreground tracking-[-0.4px]">
          Approve posts
        </h1>
        <div className="flex items-center gap-[8px]">
          {/* Search */}
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
          {/* Sort */}
          <button className="h-[36px] px-[12px] flex items-center gap-[6px] rounded-md border border-border bg-background text-[14px] text-foreground hover:bg-muted">
            Newest <ChevronDown size={16} />
          </button>
          {/* Filter */}
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted">
            <SlidersHorizontal size={16} className="text-muted-foreground" />
          </button>
          {/* More */}
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted">
            <MoreVertical size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Posts list */}
      <div className="flex-1 overflow-y-auto px-[24px] py-[16px] bg-muted ">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] gap-[8px]">
            <p className="text-[16px] text-muted-foreground">No posts awaiting approval</p>
            <p className="text-[13px] text-muted-foreground">All caught up! Check back later.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[16px] max-w-[700px] mx-auto">
            {filtered.map(id => (
              <PostCard
                key={id}
                postId={id}
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
