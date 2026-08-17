import React, { useState } from 'react';
import { Edit, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';
import { STATUS_COLORS } from '../shared/scoreColors';

export interface SocialPost {
  post_id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  caption: string;
  hashtags: string[];
  location: string;
  tone: string;
  status: 'ready' | 'needs-work';
}

const PLATFORM_COLOR: Record<SocialPost['platform'], string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#010101',
};

const PLATFORM_LABEL: Record<SocialPost['platform'], string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X / Twitter',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

interface SocialReviewCardProps extends SocialPost {
  position: { x: number; y: number };
  onEdit: (id: string) => void;
}

export const SocialReviewCard = ({
  post_id,
  platform,
  caption,
  hashtags,
  location,
  tone,
  status,
  position,
  onEdit,
}: SocialReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const color = PLATFORM_COLOR[platform];

  return (
    <div
      style={{ position: 'absolute', left: position.x, top: position.y, width: 480 }}
      className="bg-white rounded-lg border border-border overflow-hidden"
    >
      {/* Platform header strip */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: `${color}14` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[12px]" style={{ color }}>
            {PLATFORM_LABEL[platform]}
          </span>
          <span className="text-[11px] text-muted-foreground">· {location}</span>
        </div>
        <span
          className="text-[11px] px-2 py-0.5 rounded-md"
          style={{ background: STATUS_COLORS[status]?.bg, color: STATUS_COLORS[status]?.text }}
        >
          {STATUS_COLORS[status]?.label ?? status}
        </span>
      </div>

      {/* Post body */}
      <div className="px-4 py-2 flex flex-col gap-2">
        {/* Simulated profile row */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex-shrink-0" />
          <div className="flex flex-col">
            <div className="h-2 w-20 bg-muted rounded-full" />
            <div className="h-1.5 w-14 bg-muted/60 rounded-full mt-1" />
          </div>
        </div>

        {/* Caption */}
        <p
          className={cn(
            'text-[13px] text-foreground leading-relaxed cursor-pointer',
            !expanded && 'line-clamp-3',
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {caption}
        </p>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag) => (
              <span key={tag} className="text-[12px] text-primary">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Simulated engagement row */}
        <div className="flex items-center gap-4 pt-1 border-t border-border text-muted-foreground">
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <Heart size={13} strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-[11px]">Like</span>
          </button>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <MessageCircle size={13} strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-[11px]">Comment</span>
          </button>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <Repeat2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-[11px]">Share</span>
          </button>
          <span className="ml-auto text-[11px] text-muted-foreground">{tone} tone</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onEdit(post_id)}>
          <Edit size={12} strokeWidth={1.6} absoluteStrokeWidth className="mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
};
