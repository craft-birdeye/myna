/**
 * socialPlatforms — brand logo SVGs and metadata for each social content type.
 *
 * Lucide does not include brand logos, so inline SVG components are used here.
 * These are the only brand-logo exceptions to the "Lucide icons only" rule.
 *
 * Brand guidelines:
 *   Facebook  — #1877F2, rx=8, white "f"
 *   Instagram — radial gradient (yellow→orange→red→purple→blue), rx=8, camera mark
 *   LinkedIn  — #0A66C2, rx=6, white "in" mark
 *   YouTube   — #FF0000, rx=8, white play triangle
 *   TikTok    — #010101, rx=8, white note shape with cyan+red echoes
 */

import React, { useId } from 'react';

// ── Brand logo components ─────────────────────────────────────────────────────

export function FacebookLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="8" fill="#1877F2" />
      <path
        d="M14 7H12.5C11.95 7 11.5 7.45 11.5 8V10H14L13.5 12.5H11.5V21H9V12.5H7V10H9V8C9 5.79 10.79 4 13 4H14V7Z"
        fill="white"
      />
    </svg>
  );
}

export function InstagramLogo({ size = 18 }: { size?: number }) {
  const uid = useId();
  const radId = `ig-r-${uid.replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        {/* Official Instagram radial gradient: yellow-orange at bottom-left → purple-blue at top-right */}
        <radialGradient id={radId} gradientUnits="userSpaceOnUse" cx="7.2" cy="25.7" r="25">
          <stop offset="0%"   stopColor="#fdf497" />
          <stop offset="10%"  stopColor="#fdf497" />
          <stop offset="45%"  stopColor="#fd5949" />
          <stop offset="62%"  stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="8" fill={`url(#${radId})`} />
      {/* Camera body */}
      <rect x="5.5" y="5.5" width="13" height="13" rx="4" stroke="white" strokeWidth="1.5" />
      {/* Lens circle */}
      <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" />
      {/* Viewfinder dot */}
      <circle cx="16.8" cy="7.2" r="1.1" fill="white" />
    </svg>
  );
}

export function LinkedInLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0A66C2" />
      {/* i — dot */}
      <circle cx="6.5" cy="7" r="1.8" fill="white" />
      {/* i — stem */}
      <rect x="5.1" y="10" width="2.8" height="9.5" rx="0.4" fill="white" />
      {/* n — left stem + arch + right stem */}
      <path
        d="M10.5 10H13V11.3C13.7 10.48 14.85 10 16.1 10C18.55 10 19.9 11.55 19.9 14.1V19.5H17.4V14.6C17.4 13.46 17 12.7 15.85 12.7C14.7 12.7 14 13.5 14 14.65V19.5H10.5V10Z"
        fill="white"
      />
    </svg>
  );
}

export function YouTubeLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="8" fill="#FF0000" />
      {/* Play triangle — centered at (12,12) */}
      <path d="M9.5 7.5L18 12L9.5 16.5V7.5Z" fill="white" />
    </svg>
  );
}

export function TikTokLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="8" fill="#010101" />
      {/* Cyan shadow — offset left */}
      <path
        d="M15 4.5V14.75C15 16.82 13.32 18.5 11.25 18.5C9.18 18.5 7.5 16.82 7.5 14.75C7.5 12.68 9.18 11 11.25 11V8.5C7.8 8.5 5 11.3 5 14.75C5 18.2 7.8 21 11.25 21C14.7 21 17.5 18.2 17.5 14.75V9.1C18.47 9.79 19.64 10.2 20.9 10.2V7.7C18.88 7.7 17.17 6.36 16.62 4.5H15Z"
        fill="#69C9D0"
        opacity="0.7"
        transform="translate(-0.6, -0.4)"
      />
      {/* Red shadow — offset right */}
      <path
        d="M15 4.5V14.75C15 16.82 13.32 18.5 11.25 18.5C9.18 18.5 7.5 16.82 7.5 14.75C7.5 12.68 9.18 11 11.25 11V8.5C7.8 8.5 5 11.3 5 14.75C5 18.2 7.8 21 11.25 21C14.7 21 17.5 18.2 17.5 14.75V9.1C18.47 9.79 19.64 10.2 20.9 10.2V7.7C18.88 7.7 17.17 6.36 16.62 4.5H15Z"
        fill="#EE1D52"
        opacity="0.7"
        transform="translate(0.6, 0.4)"
      />
      {/* White main shape */}
      <path
        d="M15 4.5V14.75C15 16.82 13.32 18.5 11.25 18.5C9.18 18.5 7.5 16.82 7.5 14.75C7.5 12.68 9.18 11 11.25 11V8.5C7.8 8.5 5 11.3 5 14.75C5 18.2 7.8 21 11.25 21C14.7 21 17.5 18.2 17.5 14.75V9.1C18.47 9.79 19.64 10.2 20.9 10.2V7.7C18.88 7.7 17.17 6.36 16.62 4.5H15Z"
        fill="white"
      />
    </svg>
  );
}

// ── Platform definitions ───────────────────────────────────────────────────────

export interface SocialPlatformDef {
  id: string;
  label: string;
  Logo: React.FC<{ size?: number }>;
}

export const SOCIAL_PLATFORMS: SocialPlatformDef[] = [
  { id: 'facebook-post',  label: 'Facebook post',  Logo: FacebookLogo },
  { id: 'facebook-reel',  label: 'Facebook Reel',  Logo: FacebookLogo },
  { id: 'instagram-post', label: 'Instagram post', Logo: InstagramLogo },
  { id: 'instagram-reel', label: 'Instagram Reel', Logo: InstagramLogo },
  { id: 'linkedin-post',  label: 'LinkedIn post',  Logo: LinkedInLogo },
  { id: 'youtube-shorts', label: 'YouTube Shorts', Logo: YouTubeLogo },
  { id: 'tiktok-video',   label: 'TikTok video',   Logo: TikTokLogo },
];

export const SOCIAL_PLATFORM_LABEL_SET = new Set(SOCIAL_PLATFORMS.map(p => p.label));
export const SOCIAL_PLATFORM_BY_LABEL = new Map(SOCIAL_PLATFORMS.map(p => [p.label, p]));
