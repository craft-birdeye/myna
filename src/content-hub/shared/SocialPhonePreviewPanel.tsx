import React from 'react';

/**
 * SocialPhonePreviewPanel — simulated phone frame driven by wizard state.
 * Reactive to selected platforms, post type, tone, and hashtag strategy.
 */

export interface SocialPhonePreviewPanelProps {
  platforms: string[];
  postType?: string;
  tone?: string;
  autoHashtags?: boolean;
  customHashtags?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook:  'Facebook',
  instagram: 'Instagram',
  linkedin:  'LinkedIn',
  google:    'Google',
  x:         'X / Twitter',
  tiktok:    'TikTok',
};

const TONE_EMOJIS: Record<string, string> = {
  professional:   '💼',
  friendly:       '😊',
  playful:        '🎉',
  authoritative:  '🔑',
};

function PhoneFrame({ platforms, postType, tone, autoHashtags, customHashtags }: SocialPhonePreviewPanelProps) {
  const isFB  = platforms.includes('facebook');
  const isIG  = platforms.includes('instagram');
  const isLI  = platforms.includes('linkedin');

  const platformInitial = isFB ? 'f' : isIG ? '✦' : isLI ? 'in' : platforms[0]?.[0]?.toUpperCase() ?? 'B';
  const toneEmoji = tone ? (TONE_EMOJIS[tone] ?? '') : '';

  const tags = customHashtags
    ? customHashtags.replace(/#/g, '').split(/\s+/).filter(Boolean).slice(0, 4)
    : autoHashtags
      ? ['spring', 'local', 'offer']
      : [];

  return (
    <div className="w-[180px] mx-auto border-2 border-border rounded-[20px] overflow-hidden bg-background shadow-sm">
      {/* Notch */}
      <div className="h-4 bg-border/40 flex items-center justify-center">
        <div className="w-12 h-1.5 rounded-full bg-border/60" />
      </div>

      <div className="bg-background p-4">
        {/* Platform profile row */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[8px] text-primary">
            {platformInitial}
          </div>
          <div>
            <div className="h-2 w-16 bg-muted rounded-full mb-0.5" />
            <div className="h-1.5 w-10 bg-muted/60 rounded-full" />
          </div>
        </div>

        {/* Image placeholder for Instagram */}
        {isIG && (
          <div className="w-full aspect-square bg-muted rounded-md mb-2 flex items-center justify-center text-[10px] text-muted-foreground">
            {postType === 'promotional' ? '🏷️' : postType === 'engagement' ? '💬' : postType === 'educational' ? '💡' : '🖼️'}
          </div>
        )}

        {/* Caption lines */}
        <div className="flex flex-col gap-1">
          <div className="h-2 rounded-full bg-muted" style={{ width: '90%' }} />
          <div className="h-2 rounded-full bg-muted" style={{ width: '75%' }} />
          <div className="h-2 rounded-full bg-muted/60" style={{ width: '55%' }} />
        </div>

        {/* Tone indicator */}
        {toneEmoji && (
          <div className="mt-1.5 text-[9px] text-muted-foreground">{toneEmoji}</div>
        )}

        {/* Hashtags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-0.5">
            {tags.map((tag) => (
              <span key={tag} className="text-[7px] text-primary">#{tag}</span>
            ))}
          </div>
        )}

        {/* CTA button for FB promotional */}
        {isFB && postType === 'promotional' && (
          <div className="mt-2 border border-border rounded-[4px] py-1 text-center text-[8px] text-primary">
            Learn more
          </div>
        )}
      </div>
    </div>
  );
}

export const SocialPhonePreviewPanel = ({
  platforms,
  postType,
  tone,
  autoHashtags,
  customHashtags,
}: SocialPhonePreviewPanelProps) => (
  <div className="flex flex-col items-center gap-4">
    <p className="text-[11px] text-muted-foreground uppercase tracking-wide self-start">Preview</p>

    {platforms.length > 0 ? (
      <>
        <PhoneFrame
          platforms={platforms}
          postType={postType}
          tone={tone}
          autoHashtags={autoHashtags}
          customHashtags={customHashtags}
        />

        {/* Active platform chips */}
        <div className="flex flex-wrap gap-1 justify-center">
          {platforms.map((p) => (
            <span key={p} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {PLATFORM_LABELS[p] ?? p}
            </span>
          ))}
        </div>
      </>
    ) : (
      <p className="text-[11px] text-muted-foreground text-center">Select at least one platform to see a preview</p>
    )}
  </div>
);
