import React, { useState } from 'react';
import { Megaphone, MessageCircle, Lightbulb } from 'lucide-react';
import { ContentFlowChip, ContentFlowChoiceCard } from '../shared/ContentFlowControls';

// ── Platform data ──────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  connected: true },
  { id: 'instagram', label: 'Instagram', connected: true },
  { id: 'linkedin',  label: 'LinkedIn',  connected: true },
  { id: 'google',    label: 'Google',    connected: false },
  { id: 'x',        label: 'X / Twitter', connected: false },
  { id: 'tiktok',   label: 'TikTok',    connected: false },
];

const POST_TYPES = [
  { id: 'promotional', icon: Megaphone, label: 'Promotional', description: 'Drive a sale or offer' },
  { id: 'engagement', icon: MessageCircle, label: 'Engagement', description: 'Spark conversation or shares' },
  { id: 'educational', icon: Lightbulb, label: 'Educational', description: 'Share a tip or how-to' },
];

// ── Phone preview ──────────────────────────────────────────────────────────────

function PhonePreview({ platforms, postType }: { platforms: string[]; postType: string }) {
  const isFB = platforms.includes('facebook');
  const isIG = platforms.includes('instagram');

  return (
    <div className="w-[180px] mx-auto border-2 border-border rounded-[20px] overflow-hidden bg-background shadow-sm">
      <div className="h-4 bg-border/40 flex items-center justify-center">
        <div className="w-12 h-1.5 rounded-full bg-border/60" />
      </div>
      <div className="bg-background p-2">
        {/* Platform indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary">
            {isFB ? 'f' : isIG ? '✦' : 'B'}
          </div>
          <div>
            <div className="h-2 w-16 bg-muted rounded-full mb-0.5" />
            <div className="h-1.5 w-10 bg-muted/60 rounded-full" />
          </div>
        </div>
        {/* Image placeholder */}
        {isIG && (
          <div className="w-full aspect-square bg-muted rounded-md mb-2 flex items-center justify-center text-[10px] text-muted-foreground">
            {postType === 'promotional' ? '🏷️' : postType === 'engagement' ? '💬' : '💡'}
          </div>
        )}
        {/* Caption lines */}
        <div className="flex flex-col gap-1">
          <div className="h-2 rounded-full bg-muted" style={{ width: '90%' }} />
          <div className="h-2 rounded-full bg-muted" style={{ width: '75%' }} />
          <div className="h-2 rounded-full bg-muted/60" style={{ width: '55%' }} />
        </div>
        {/* Hashtags (IG) */}
        {isIG && (
          <div className="mt-2 flex flex-wrap gap-0.5">
            {['#spring', '#local', '#offer'].map((tag) => (
              <span key={tag} className="text-[7px] text-primary">{tag}</span>
            ))}
          </div>
        )}
        {/* CTA (FB promotional) */}
        {isFB && postType === 'promotional' && (
          <div className="mt-2 border border-border rounded-[4px] py-1 text-center text-[8px] text-primary">
            Learn more
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 1 component ───────────────────────────────────────────────────────────

interface SocialWizardStep1Props {
  selectedPlatforms: string[];
  onPlatformsChange: (p: string[]) => void;
  postType: string;
  onPostTypeChange: (t: string) => void;
}

export const SocialWizardStep1 = ({
  selectedPlatforms,
  onPlatformsChange,
  postType,
  onPostTypeChange,
}: SocialWizardStep1Props) => {
  const togglePlatform = (id: string) => {
    onPlatformsChange(
      selectedPlatforms.includes(id)
        ? selectedPlatforms.filter((p) => p !== id)
        : [...selectedPlatforms, id],
    );
  };

  return (
    <div className="max-w-[600px] mx-auto p-8 flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Platform pills — flex-wrap */}
        <div>
          <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Platforms</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <ContentFlowChip
                key={p.id}
                label={`${p.label}${p.connected ? ' connected' : ''}`}
                selected={selectedPlatforms.includes(p.id)}
                onClick={() => togglePlatform(p.id)}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Connected platforms are ready to publish. Others can still be drafted.</p>
        </div>

        {/* Post type */}
        <div>
          <p className="text-[12px] text-muted-foreground uppercase tracking-wide mb-4">Post type</p>
          <div className="flex flex-col gap-2">
            {POST_TYPES.map((t) => (
              <ContentFlowChoiceCard
                key={t.id}
                selected={postType === t.id}
                onClick={() => onPostTypeChange(t.id)}
                icon={t.icon}
                title={t.label}
                description={t.description}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
