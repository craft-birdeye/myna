/**
 * Social-style calendar card for Content Hub scheduled items.
 *
 * Structure intentionally mirrors the Social calendar card:
 * status chip, channel/time row, caption, image, action icons.
 */

import React from 'react';
import {
  Copy,
  FileText,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Monitor,
  Tag,
  Trash2,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import type { ScheduledItem, SocialPlatform } from './calendarData';

type StatusType = ScheduledItem['status'];

const statusChipClasses: Record<StatusType, string> = {
  Published: 'bg-primary/5 text-text-primary',
  Draft: 'bg-border text-text-secondary',
  Scheduled: 'bg-primary/5 text-primary',
};

const imageSeeds: Record<ScheduledItem['contentType'], string> = {
  social: 'garden-social',
  blog: 'nature-blog',
  faq: 'lawn-faq',
  email: 'winter-email',
  landing: 'landing-page',
};

function StatusChip({ status }: { status: StatusType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[5px] px-[7px] py-[3px] text-[11px] leading-4 tracking-[-0.15px]',
        statusChipClasses[status],
      )}
    >
      {status}
    </span>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Facebook">
      <circle cx="10" cy="10" r="10" fill="#337FFF" />
      <path
        d="M13.1 10.6h-2.05V16H8.7v-5.4H7.15V8.5H8.7V6.95C8.7 5.35 9.65 4 11.7 4h1.7v2.1h-1.05c-.75 0-1.3.35-1.3 1.1v1.3h2.25l-.2 2.1Z"
        fill="white"
      />
    </svg>
  );
}

function InstagramIcon() {
  const gradientId = React.useId().replace(/:/g, '');
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="Instagram">
      <defs>
        <linearGradient id={`content-hub-ig-${gradientId}`} x1="0" y1="20" x2="20" y2="0">
          <stop offset="0%" stopColor="#FBE18A" />
          <stop offset="25%" stopColor="#FCBB45" />
          <stop offset="45%" stopColor="#F75274" />
          <stop offset="65%" stopColor="#D53692" />
          <stop offset="82%" stopColor="#8F39CE" />
          <stop offset="100%" stopColor="#5B4FE9" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="10" fill={`url(#content-hub-ig-${gradientId})`} />
      <rect x="5.6" y="5.6" width="8.8" height="8.8" rx="2.4" stroke="white" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.3" stroke="white" strokeWidth="1.4" />
      <circle cx="13" cy="7" r="0.8" fill="white" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="LinkedIn">
      <rect width="20" height="20" rx="10" fill="#0A66C2" />
      <path d="M5.7 8.4h1.9v6H5.7v-6Zm1-2.8a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Zm3.1 2.8h1.8v.8h.03c.25-.48.9-.98 1.85-.98 1.98 0 2.35 1.3 2.35 3v3.18h-1.9v-2.82c0-.68-.02-1.55-.95-1.55-.95 0-1.1.73-1.1 1.5v2.87H9.8v-6Z" fill="white" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-label="X">
      <circle cx="10" cy="10" r="10" fill="#000" />
      <path d="M11.1 9.25 15.35 4.5h-1.02l-3.68 4.12L7.7 4.5H4.3l4.45 6.28-4.45 4.98h1.02l3.88-4.35 3.1 4.35h3.4l-4.6-6.51Zm-1.38 1.54-.45-.62L5.68 5.28H7.2l2.9 3.95.45.62 3.78 5.15H12.8l-3.08-4.21Z" fill="white" />
    </svg>
  );
}

function SocialPlatformIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === 'facebook') return <FacebookIcon />;
  if (platform === 'instagram') return <InstagramIcon />;
  if (platform === 'linkedin') return <LinkedInIcon />;
  return <TwitterIcon />;
}

function ContentChannelIcon({ post }: { post: ScheduledItem }) {
  if (post.contentType === 'social' && post.platform) {
    return <SocialPlatformIcon platform={post.platform} />;
  }

  const iconClass = 'size-5 text-muted-foreground';
  const iconProps = { strokeWidth: 1.6, absoluteStrokeWidth: true, 'aria-hidden': true };

  return (
    <span className="inline-flex size-5 items-center justify-center rounded-[5px] text-muted-foreground">
      {post.contentType === 'blog' && <FileText className={iconClass} {...iconProps} />}
      {post.contentType === 'faq' && <MessageSquare className={iconClass} {...iconProps} />}
      {post.contentType === 'email' && <Mail className={iconClass} {...iconProps} />}
      {post.contentType === 'landing' && <Monitor className={iconClass} {...iconProps} />}
    </span>
  );
}

function ActionIcons() {
  const actions = [
    { label: 'Edit', icon: Pencil },
    { label: 'Duplicate', icon: Copy },
    { label: 'Tag', icon: Tag },
    { label: 'Delete', icon: Trash2 },
    { label: 'More', icon: MoreVertical },
  ];

  return (
    <div className="flex items-start gap-2">
      {actions.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          className="inline-flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          <Icon className="size-4" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
        </button>
      ))}
    </div>
  );
}

function getImageUrl(post: ScheduledItem) {
  if (post.image) return post.image;
  const seed = imageSeeds[post.contentType] ?? 'content';
  return `https://picsum.photos/seed/${seed}-${post.id}/400/220`;
}

interface PostCardProps {
  post: ScheduledItem;
  compact?: boolean;
  isPast?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, compact = false, isPast = false }) => {
  const imageHeight = compact ? 'h-[76px]' : 'h-[110px]';

  return (
    <div
      className={cn(
        'relative w-full shrink-0 cursor-pointer overflow-hidden rounded-[8px] border transition-colors',
        isPast ? 'border-transparent bg-[#f1f3f6] dark:bg-[#252a35]' : 'border-border bg-background',
        !isPast && 'hover:border-primary/40',
      )}
    >
      <div className="flex w-full flex-col items-start gap-2 p-2">
        <div className="flex w-full items-center gap-2">
          <StatusChip status={post.status} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <ContentChannelIcon post={post} />
          <p className="ml-0.5 text-[11px] font-normal leading-[18px] tracking-[-0.22px] text-muted-foreground">
            {post.time}
          </p>
        </div>

        <p className="w-full text-[11px] font-normal leading-[1.4] text-foreground line-clamp-2">
          {post.caption}
        </p>

        <div className={cn('relative w-full shrink-0 overflow-hidden rounded-[4px]', imageHeight)}>
          <img alt="" className="absolute inset-0 h-full w-full object-cover" src={getImageUrl(post)} />
        </div>

        <ActionIcons />
      </div>
    </div>
  );
};
