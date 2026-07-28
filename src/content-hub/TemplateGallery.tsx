import React, { useState, useMemo } from 'react';
import { ArrowLeft, FileText, MessageSquare, Mail, Star, Megaphone, Share2, Search } from 'lucide-react';
import { Input } from '@/contenthub-ui/input';
import { Button } from '@/contenthub-ui/button';
import { TextTabsRow, type TextTabItem } from '@/contenthub-ui/text-tabs';
import {
  MAIN_VIEW_HEADER_BAND_CLASS,
  MAIN_VIEW_PRIMARY_HEADING_CLASS,
} from '@/contenthub-ui/mainViewTitleClasses';
import { cn } from '@/contenthub-ui/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ContentType = 'faq' | 'social' | 'email' | 'blog' | 'response' | 'ads';

export interface TemplateItem {
  id: string;
  type: ContentType;
  name: string;
  description: string;
  useCases: string[];
  previewLines: number[]; // kept for compat, unused visually
}

type TabId = 'all' | ContentType;

// ── Mock templates ─────────────────────────────────────────────────────────────

export const TEMPLATES: TemplateItem[] = [
  // FAQ
  { id: 'faq-1', type: 'faq', name: 'Product launch FAQ', description: 'Answer the most common questions customers ask when you launch a new product or service.', useCases: ['Launch campaigns', 'New products'], previewLines: [90, 60, 85, 50, 70] },
  { id: 'faq-2', type: 'faq', name: 'Location-specific FAQ', description: 'FAQ content tailored to a specific business location — hours, parking, services available.', useCases: ['Local SEO', 'Location pages'], previewLines: [70, 80, 55, 65, 45] },
  { id: 'faq-3', type: 'faq', name: 'Service & pricing FAQ', description: 'Clear answers about what you offer, how much it costs, and what the process looks like.', useCases: ['Pricing clarity', 'Sales enablement'], previewLines: [80, 60, 90, 70, 50] },
  { id: 'faq-4', type: 'faq', name: 'AEO / voice-search FAQ', description: 'Optimised for AI answer engines and voice search with concise, direct question-answer pairs.', useCases: ['Voice search', 'AI answer engines'], previewLines: [60, 80, 65, 75, 55] },
  // Social
  { id: 'soc-1', type: 'social', name: 'Promotion announcement', description: 'Drive awareness and urgency around a sale, offer, or limited-time deal across social channels.', useCases: ['Sales', 'Promo campaigns'], previewLines: [85, 55, 70] },
  { id: 'soc-2', type: 'social', name: 'Customer testimonial', description: 'Turn a great customer review into a shareable social post with brand-consistent formatting.', useCases: ['Social proof', 'Trust building'], previewLines: [70, 90, 60] },
  { id: 'soc-3', type: 'social', name: 'Seasonal / holiday', description: 'Timely content tied to a seasonal moment, holiday, or cultural event relevant to your audience.', useCases: ['Seasonal campaigns', 'Holidays'], previewLines: [60, 75, 80] },
  { id: 'soc-4', type: 'social', name: 'Behind the scenes', description: 'Humanise your brand by sharing how things work, your team, or your process in an authentic way.', useCases: ['Brand storytelling', 'Authenticity'], previewLines: [80, 60, 70] },
  // Email
  { id: 'em-1', type: 'email', name: 'Welcome series', description: 'Onboard new customers with a warm introduction to your business, services, and what to expect.', useCases: ['Onboarding', 'New customers'], previewLines: [90, 60, 80, 50, 70, 40] },
  { id: 'em-2', type: 'email', name: 'Promotional offer', description: 'A focused email driving a single, compelling offer with a clear call-to-action.', useCases: ['Promotions', 'Conversions'], previewLines: [70, 90, 55, 65] },
  { id: 'em-3', type: 'email', name: 'Re-engagement', description: 'Win back customers who haven\'t visited or engaged recently with a personalised incentive.', useCases: ['Win-back', 'Retention'], previewLines: [80, 60, 85, 55] },
  { id: 'em-4', type: 'email', name: 'Review request', description: 'Ask happy customers for a review at exactly the right moment with the right tone.', useCases: ['Review growth', 'Reputation'], previewLines: [65, 80, 70, 50] },
  // Blog
  { id: 'bl-1', type: 'blog', name: 'How-to guide', description: 'Step-by-step instructional content that answers a common customer question in depth.', useCases: ['SEO content', 'Education'], previewLines: [90, 70, 60, 85, 55, 75] },
  { id: 'bl-2', type: 'blog', name: 'Local SEO landing page', description: 'Location-specific content designed to rank for local search terms and convert nearby customers.', useCases: ['Local SEO', 'Lead gen'], previewLines: [80, 65, 90, 60, 70] },
  { id: 'bl-3', type: 'blog', name: 'Listicle', description: 'Easily scannable numbered or bulleted content that performs well for discovery and sharing.', useCases: ['Traffic', 'Shareability'], previewLines: [70, 55, 80, 65, 75] },
  { id: 'bl-4', type: 'blog', name: 'Case study', description: 'A detailed story of customer success that builds credibility and demonstrates real-world results.', useCases: ['Trust', 'B2B sales'], previewLines: [85, 70, 60, 90, 55] },
  // Review response
  { id: 'res-1', type: 'response', name: '5-star thank you', description: 'A warm, specific, on-brand response to a glowing review that reinforces loyalty.', useCases: ['Reputation', 'Retention'], previewLines: [75, 55, 85] },
  { id: 'res-2', type: 'response', name: 'Empathetic negative reply', description: 'Handle a negative review with empathy and professionalism while offering to make things right.', useCases: ['Crisis response', 'Reputation'], previewLines: [80, 65, 70] },
  { id: 'res-3', type: 'response', name: 'Mixed review response', description: 'Acknowledge the positives, address the concerns, and invite the customer back.', useCases: ['Reputation management'], previewLines: [70, 80, 60] },
  { id: 'res-4', type: 'response', name: 'No-text rating reply', description: 'A concise, friendly response to star-only ratings that still shows you care.', useCases: ['Quick responses'], previewLines: [60, 75] },
  // Ads
  { id: 'ads-1', type: 'ads', name: 'Google search ad', description: 'High-converting search ad copy with compelling headline and description variations.', useCases: ['Paid search', 'Lead gen'], previewLines: [80, 60, 90] },
  { id: 'ads-2', type: 'ads', name: 'Meta carousel', description: 'Multi-image carousel ad copy for Facebook and Instagram with individual card headlines.', useCases: ['Social ads', 'Brand awareness'], previewLines: [70, 55, 80] },
  { id: 'ads-3', type: 'ads', name: 'Local promo offer', description: 'Localised ad copy for a specific location promotion to drive foot traffic or bookings.', useCases: ['Local ads', 'Promotions'], previewLines: [85, 65, 75] },
  { id: 'ads-4', type: 'ads', name: 'Retargeting copy', description: 'Re-engage visitors who didn\'t convert with personalised, high-intent retargeting messages.', useCases: ['Retargeting', 'Conversions'], previewLines: [75, 90, 55] },
];

// ── Label / badge config ───────────────────────────────────────────────────────

const TYPE_LABEL: Record<ContentType, string> = {
  faq: 'FAQ', social: 'Social', email: 'Email',
  blog: 'Blog', response: 'Review response', ads: 'Ads',
};

const TYPE_BADGE_CLASS: Record<ContentType, string> = {
  faq:      'text-purple-700 bg-purple-50',
  social:   'text-violet-700 bg-violet-50',
  email:    'text-sky-700 bg-sky-50',
  blog:     'text-primary bg-primary/5',
  response: 'text-amber-700 bg-amber-50',
  ads:      'text-text-secondary bg-surface-hover',
};

// ── Tabs ───────────────────────────────────────────────────────────────────────

const TABS: TextTabItem<TabId>[] = [
  { id: 'all',      label: 'All' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'social',   label: 'Social' },
  { id: 'email',    label: 'Email' },
  { id: 'blog',     label: 'Blog' },
  { id: 'response', label: 'Review response' },
  { id: 'ads',      label: 'Ads' },
];

// ── Blog thumbnail data ────────────────────────────────────────────────────────

const BLOG_DATA: Record<string, {
  tags: [string, string, string, string][]; // [label, bg, color, border]
  title: string;
  scene: 'city' | 'garden' | 'list' | 'chart';
}> = {
  'bl-1': {
    tags: [['How-to', '#EFF6FF', '#2563EB', '#BFDBFE'], ['Guide', '#F0FDF4', '#16A34A', '#BBF7D0']],
    title: 'How to Choose the Right Service Provider in 5 Steps',
    scene: 'city',
  },
  'bl-2': {
    tags: [['Local SEO', '#EFF6FF', '#2563EB', '#BFDBFE'], ['Location', '#F0FDF4', '#16A34A', '#BBF7D0']],
    title: 'Best HVAC Services in Austin, TX — Rated #1 Locally',
    scene: 'city',
  },
  'bl-3': {
    tags: [['Listicle', '#FFF7ED', '#C2410C', '#FED7AA'], ['Tips', '#F0FDF4', '#16A34A', '#BBF7D0']],
    title: '10 Ways to Improve Your Home Without Breaking the Budget',
    scene: 'list',
  },
  'bl-4': {
    tags: [['Case Study', '#FDF2F8', '#86198F', '#F5D0FE'], ['Results', '#F0FDF4', '#16A34A', '#BBF7D0']],
    title: 'How ABC Plumbing Increased Reviews by 340% in 6 Months',
    scene: 'chart',
  },
};

function BlogSceneCity() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #bfdbfe, #e0f2fe)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[16px]" style={{ background: 'linear-gradient(to right, #94a3b8, #64748b)' }} />
      <div className="absolute bottom-[16px] left-[14px] w-[16px] h-[22px]" style={{ background: '#475569' }} />
      <div className="absolute bottom-[16px] left-[19px] w-[3px] h-[5px]" style={{ background: '#bfdbfe' }} />
      <div className="absolute bottom-[16px] left-[36px] w-[10px] h-[16px]" style={{ background: '#334155' }} />
      <div className="absolute bottom-[16px] left-[52px] w-[14px] h-[12px]" style={{ background: '#475569' }} />
      <div className="absolute bottom-[16px] right-[18px] w-[5px] h-[11px]" style={{ background: '#15803d', borderRadius: '40% 40% 0 0' }} />
      <div className="absolute bottom-[16px] right-[28px] w-[4px] h-[9px]" style={{ background: '#16a34a', borderRadius: '40% 40% 0 0' }} />
      <div className="absolute top-[7px] right-[24px] w-[9px] h-[9px] rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
    </div>
  );
}

function BlogSceneGarden() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #bae6fd, #d1fae5)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[16px]" style={{ background: 'linear-gradient(to right, #16a34a, #15803d)' }} />
      <div className="absolute bottom-[16px] left-[6px] w-[16px] h-[20px]" style={{ background: '#15803d', borderRadius: '50% 50% 0 0' }} />
      <div className="absolute bottom-[16px] left-[18px] w-[12px] h-[15px]" style={{ background: '#16a34a', borderRadius: '50% 50% 0 0' }} />
      <div className="absolute bottom-[16px] right-[10px] w-[14px] h-[18px]" style={{ background: '#15803d', borderRadius: '50% 50% 0 0' }} />
      <div className="absolute bottom-[18px] left-[36px] w-[4px] h-[4px] rounded-full" style={{ background: '#f472b6' }} />
      <div className="absolute bottom-[18px] left-[46px] w-[3px] h-[3px] rounded-full" style={{ background: '#facc15' }} />
      <div className="absolute bottom-[18px] left-[56px] w-[4px] h-[4px] rounded-full" style={{ background: '#fb923c' }} />
      <div className="absolute top-[8px] right-[26px] w-[8px] h-[8px] rounded-full" style={{ background: 'rgba(255,255,255,0.75)' }} />
    </div>
  );
}

function BlogSceneList() {
  return (
    <div className="relative w-full h-full bg-surface-hover flex flex-col justify-center gap-[5px] px-3 py-2">
      {['1. Free expert consultation included', '2. Compare quotes from 3 providers', '3. Transparent pricing, no hidden fees', '4. Licensed & insured professionals'].map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-[12px] h-[12px] rounded-full border border-primary/30 bg-primary/10 shrink-0 flex items-center justify-center">
            <span style={{ fontSize: 5, color: '#1976d2' }}>{i + 1}</span>
          </div>
          <span style={{ fontSize: 6, color: '#374151', lineHeight: '8px' }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function BlogSceneChart() {
  const bars = [40, 65, 52, 88, 74, 95];
  return (
    <div className="relative w-full h-full bg-surface-hover flex flex-col justify-end px-3 pt-3 pb-2 gap-1">
      <div className="flex items-end gap-[4px] flex-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${h}%`, background: i === 5 ? '#1976d2' : '#bfdbfe' }} />
        ))}
      </div>
      <div className="flex gap-[4px]">
        {['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((l) => (
          <div key={l} className="flex-1 text-center" style={{ fontSize: 5, color: '#9ca3af' }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function BlogThumbnail({ id }: { id: string }) {
  const data = BLOG_DATA[id] ?? BLOG_DATA['bl-1'];
  const Scene = data.scene === 'list' ? BlogSceneList
    : data.scene === 'chart' ? BlogSceneChart
    : data.scene === 'garden' ? BlogSceneGarden
    : BlogSceneCity;
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-[2px] flex items-center justify-center shrink-0" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <FileText size={6} strokeWidth={1.6} absoluteStrokeWidth style={{ color: '#2563EB' }} />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">Blog post</span>
        <div className="flex items-center gap-[3px]">
          <div className="w-[28px] h-[2px] rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '90%', background: '#1D9E75' }} />
          </div>
          <span style={{ fontSize: 4.5, color: '#1D9E75', background: '#DCFCE7', borderRadius: 2, padding: '1px 2px' }}>90</span>
        </div>
      </div>
      {/* Hero image */}
      <div className="relative shrink-0 overflow-hidden border-b border-zinc-100" style={{ height: 44 }}>
        <Scene />
      </div>
      {/* Content */}
      <div className="px-2 py-[4px] flex flex-col gap-[3px] flex-1 overflow-hidden">
        <div className="flex gap-[2px] flex-wrap">
          {data.tags.map(([label, bg, color]) => (
            <span key={label} style={{ fontSize: 4, background: bg, color, borderRadius: 2, padding: '1px 3px' }}>{label}</span>
          ))}
        </div>
        <span className="block text-[5.5px] text-text-primary leading-tight line-clamp-2">{data.title}</span>
        <div className="flex items-center gap-[3px]">
          <div className="w-[7px] h-[7px] rounded-full bg-border shrink-0" />
          <div className="h-[1.5px] rounded-full bg-border" style={{ width: 24 }} />
          <div className="h-[1.5px] rounded-full bg-surface-hover" style={{ width: 14 }} />
        </div>
        <div className="flex flex-col gap-[2px]">
          <div className="h-[1.5px] rounded-full bg-border w-full" />
          <div className="h-[1.5px] rounded-full bg-border" style={{ width: '82%' }} />
        </div>
      </div>
    </div>
  );
}

// ── FAQ thumbnail data ─────────────────────────────────────────────────────────

const FAQ_DATA: Record<string, { section: string; items: { q: string }[] }> = {
  'faq-1': {
    section: 'Product launch',
    items: [
      { q: "What's included in the new product?" },
      { q: 'When does early access open?' },
      { q: 'Is there a free trial available?' },
      { q: 'Can I upgrade my plan later?' },
    ],
  },
  'faq-2': {
    section: 'Location info',
    items: [
      { q: 'What are your business hours?' },
      { q: 'Is parking available on-site?' },
      { q: 'Do you offer same-day service?' },
      { q: 'How do I book an appointment?' },
    ],
  },
  'faq-3': {
    section: 'Pricing & services',
    items: [
      { q: 'How much does the service cost?' },
      { q: 'Do you offer a money-back guarantee?' },
      { q: 'What happens after I sign up?' },
      { q: 'Are there any hidden fees?' },
    ],
  },
  'faq-4': {
    section: 'Quick answers',
    items: [
      { q: 'Who is the best provider near me?' },
      { q: 'How fast can I get a response?' },
      { q: 'What makes you different?' },
      { q: 'Do you serve my area?' },
    ],
  },
};

function FAQThumbnail({ id }: { id: string }) {
  const data = FAQ_DATA[id] ?? FAQ_DATA['faq-1'];
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-[2px] flex items-center justify-center shrink-0" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
          <MessageSquare size={6} strokeWidth={1.6} absoluteStrokeWidth style={{ color: '#7C3AED' }} />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">FAQ page</span>
        <div className="flex items-center gap-[3px]">
          <div className="w-[28px] h-[2px] rounded-full bg-surface-hover overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '95%', background: '#1D9E75' }} />
          </div>
          <span style={{ fontSize: 4.5, color: '#1D9E75', background: '#DCFCE7', borderRadius: 2, padding: '1px 2px' }}>95</span>
        </div>
      </div>
      {/* Section label */}
      <div className="px-2 py-[2px] border-b border-zinc-100" style={{ background: '#FAFAFA' }}>
        <span className="text-[4.5px] text-text-secondary">{data.section}</span>
      </div>
      {/* Q rows */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {data.items.map((item, i) => (
          <div key={i} className="px-2 py-[2.5px] border-b border-zinc-50 last:border-0 flex items-start gap-1">
            <span className="shrink-0" style={{ fontSize: 4.5, color: '#7C3AED', lineHeight: '7px' }}>Q</span>
            <span className="text-[5px] text-text-secondary leading-tight line-clamp-1">{item.q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Social thumbnail ───────────────────────────────────────────────────────────

const SOCIAL_DATA: Record<string, { platform: string; handle: string; text: string; likes: string }> = {
  'soc-1': { platform: 'FB', handle: 'OakwoodServices', text: '🎉 Summer Sale — 20% off all services this week only. Book now and save before slots fill up!', likes: '47' },
  'soc-2': { platform: 'IG', handle: 'oakwood_co', text: '"Absolutely fantastic experience from start to finish. The team was professional and efficient." — Sarah M.', likes: '132' },
  'soc-3': { platform: 'FB', handle: 'OakwoodServices', text: '🍂 Fall is here! Time to prep your home for the colder months. Here are our top 5 seasonal tips...', likes: '89' },
  'soc-4': { platform: 'IG', handle: 'oakwood_co', text: 'Ever wonder what goes on behind the scenes? Our team starts every morning with a full brief to make sure everything runs smoothly for you.', likes: '215' },
};

function SocialThumbnail({ id }: { id: string }) {
  const d = SOCIAL_DATA[id] ?? SOCIAL_DATA['soc-1'];
  const isFB = d.platform === 'FB';
  const platformBg = isFB ? '#1877F2' : 'linear-gradient(135deg, #FFDC80, #E1306C, #833AB4)';
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: isFB ? '#1877F2' : 'linear-gradient(135deg, #F77737, #E1306C)' }}>
          <Share2 size={6} strokeWidth={1.6} absoluteStrokeWidth className="text-white" />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">{isFB ? 'Facebook post' : 'Instagram post'}</span>
      </div>
      <div className="px-2 py-[5px] flex flex-col gap-[4px] flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-border shrink-0" />
          <div>
            <div className="h-[2px] rounded-full bg-border" style={{ width: 40 }} />
            <div className="h-[1.5px] rounded-full bg-surface-hover mt-[2px]" style={{ width: 25 }} />
          </div>
        </div>
        <p style={{ fontSize: 5.5, color: '#374151', lineHeight: '8px' }} className="line-clamp-4">{d.text}</p>
        <div className="flex items-center gap-1 mt-auto">
          <span style={{ fontSize: 5, color: '#6b7280' }}>❤️ {d.likes}</span>
          <span style={{ fontSize: 5, color: '#6b7280' }}>· Comment · Share</span>
        </div>
      </div>
    </div>
  );
}

// ── Email thumbnail ────────────────────────────────────────────────────────────

const EMAIL_DATA: Record<string, { subject: string; preview: string; cta: string }> = {
  'em-1': { subject: 'Welcome to Oakwood Services!', preview: "We're so glad you're here. Here's everything you need to get started with your account.", cta: 'Get started' },
  'em-2': { subject: '🎁 Exclusive offer — 25% off this week', preview: 'Your loyalty means everything to us. Use code LOYAL25 before Sunday to claim your discount.', cta: 'Claim offer' },
  'em-3': { subject: 'We miss you — come back & save', preview: "It's been a while! Here's a special offer just for you to make your return worthwhile.", cta: 'Redeem offer' },
  'em-4': { subject: 'How was your recent visit?', preview: 'We hope everything went smoothly. If you enjoyed your experience, we\'d love a quick review.', cta: 'Leave a review' },
};

function EmailThumbnail({ id }: { id: string }) {
  const d = EMAIL_DATA[id] ?? EMAIL_DATA['em-1'];
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-[2px] flex items-center justify-center shrink-0" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
          <Mail size={6} strokeWidth={1.6} absoluteStrokeWidth style={{ color: '#0284C7' }} />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">Email</span>
      </div>
      <div className="px-2 py-[5px] flex flex-col gap-[4px] flex-1 overflow-hidden">
        {/* From row */}
        <div className="flex items-center gap-1">
          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: '#1976d2' }} />
          <div>
            <div className="h-[2px] rounded-full" style={{ width: 38, background: '#d1d5db' }} />
          </div>
        </div>
        {/* Subject */}
        <p style={{ fontSize: 6, color: '#111827', lineHeight: '9px' }} className="line-clamp-1">{d.subject}</p>
        {/* Preview */}
        <p style={{ fontSize: 5, color: '#6b7280', lineHeight: '7.5px' }} className="line-clamp-2">{d.preview}</p>
        {/* CTA button */}
        <div className="mt-auto">
          <div className="h-[8px] rounded" style={{ width: 52, background: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 4.5, color: 'white' }}>{d.cta}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Review response thumbnail ──────────────────────────────────────────────────

const RESPONSE_DATA: Record<string, { stars: number; review: string; response: string }> = {
  'res-1': { stars: 5, review: 'Outstanding service! The team arrived on time, worked efficiently, and exceeded all expectations. Will definitely book again.', response: 'Thank you so much for your kind words! We\'re thrilled to hear you had a great experience.' },
  'res-2': { stars: 1, review: 'Disappointed with the wait time and communication. Expected better given the price.', response: 'We\'re truly sorry to hear this. Your experience doesn\'t reflect our standards and we\'d love to make it right.' },
  'res-3': { stars: 3, review: 'Good quality work but the scheduling was a bit of a hassle. Results were worth it in the end.', response: 'Thanks for sharing this. We\'re glad the results met your expectations and we\'re working on improving our scheduling.' },
  'res-4': { stars: 4, review: '', response: 'Thank you for the 4 stars! We appreciate your support and hope to earn that 5th star next time.' },
};

function ReviewStars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <div className="flex gap-[1px]">
      {Array.from({ length: total }).map((_, i) => (
        <Star key={i} size={6} strokeWidth={1.6} absoluteStrokeWidth
          style={{ color: i < count ? '#F59E0B' : '#D1D5DB', fill: i < count ? '#F59E0B' : 'transparent' }} />
      ))}
    </div>
  );
}

function ResponseThumbnail({ id }: { id: string }) {
  const d = RESPONSE_DATA[id] ?? RESPONSE_DATA['res-1'];
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-[2px] flex items-center justify-center shrink-0" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <Star size={6} strokeWidth={1.6} absoluteStrokeWidth style={{ color: '#D97706' }} />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">Review response</span>
      </div>
      <div className="px-2 py-[5px] flex flex-col gap-[4px] flex-1 overflow-hidden">
        {/* Review */}
        <div className="flex flex-col gap-[2px] p-[4px] rounded" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-full bg-border shrink-0" />
            <ReviewStars count={d.stars} />
          </div>
          {d.review && (
            <p style={{ fontSize: 5, color: '#374151', lineHeight: '7.5px' }} className="line-clamp-2">{d.review}</p>
          )}
        </div>
        {/* Response */}
        <div className="flex gap-1 p-[4px] rounded" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <span style={{ fontSize: 4.5, color: '#1976d2', lineHeight: '7px', flexShrink: 0 }}>↩</span>
          <p style={{ fontSize: 5, color: '#1e40af', lineHeight: '7.5px' }} className="line-clamp-3">{d.response}</p>
        </div>
      </div>
    </div>
  );
}

// ── Ads thumbnail ──────────────────────────────────────────────────────────────

const ADS_DATA: Record<string, { platform: string; headline: string; url: string; desc: string }> = {
  'ads-1': { platform: 'Google', headline: 'Expert Home Services in Austin | Book Online', url: 'oakwoodservices.com › schedule', desc: 'Trusted by 2,000+ homeowners. Same-day availability. Licensed & insured. Free estimates on all services.' },
  'ads-2': { platform: 'Meta', headline: 'Your dream home starts here ✨', url: '', desc: 'Swipe to see our most popular services this season. Book online and get 15% off your first visit.' },
  'ads-3': { platform: 'Google', headline: 'Summer Special — 25% Off This Week', url: 'oakwoodservices.com › offer', desc: 'Don\'t miss our biggest promotion of the year. Valid for new and returning customers. Limited slots available.' },
  'ads-4': { platform: 'Meta', headline: 'Still thinking it over?', url: '', desc: 'You left something behind! Complete your booking now and we\'ll guarantee your preferred time slot.' },
};

function AdsThumbnail({ id }: { id: string }) {
  const d = ADS_DATA[id] ?? ADS_DATA['ads-1'];
  const isGoogle = d.platform === 'Google';
  return (
    <div className="w-full h-full flex flex-col border border-zinc-200 rounded-md bg-white overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-[4px] border-b border-zinc-100">
        <div className="w-[12px] h-[12px] rounded-[2px] flex items-center justify-center shrink-0" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <Megaphone size={6} strokeWidth={1.6} absoluteStrokeWidth style={{ color: '#C2410C' }} />
        </div>
        <span className="text-[5px] text-text-secondary flex-1">{d.platform} ad</span>
        <span style={{ fontSize: 4, color: '#1D9E75', background: '#DCFCE7', borderRadius: 2, padding: '1px 2px' }}>Sponsored</span>
      </div>
      <div className="px-2 py-[5px] flex flex-col gap-[3px] flex-1 overflow-hidden">
        {isGoogle ? (
          <>
            <p style={{ fontSize: 4.5, color: '#188038' }} className="line-clamp-1">{d.url}</p>
            <p style={{ fontSize: 6.5, color: '#1a0dab', lineHeight: '9px' }} className="line-clamp-2">{d.headline}</p>
            <p style={{ fontSize: 5, color: '#4d5156', lineHeight: '7px' }} className="line-clamp-3">{d.desc}</p>
          </>
        ) : (
          <>
            <div className="w-full h-[28px] rounded" style={{ background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }} />
            <p style={{ fontSize: 6.5, color: '#111827', lineHeight: '9px' }} className="line-clamp-1">{d.headline}</p>
            <p style={{ fontSize: 5, color: '#6b7280', lineHeight: '7px' }} className="line-clamp-2">{d.desc}</p>
            <div className="mt-auto">
              <div className="h-[7px] rounded" style={{ width: 48, background: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 4, color: 'white' }}>Learn more</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Master thumbnail dispatcher ────────────────────────────────────────────────

function TemplateThumbnail({ template }: { template: TemplateItem }) {
  switch (template.type) {
    case 'blog':     return <BlogThumbnail id={template.id} />;
    case 'faq':      return <FAQThumbnail id={template.id} />;
    case 'social':   return <SocialThumbnail id={template.id} />;
    case 'email':    return <EmailThumbnail id={template.id} />;
    case 'response': return <ResponseThumbnail id={template.id} />;
    case 'ads':      return <AdsThumbnail id={template.id} />;
  }
}

// ── Thumbnail bg tint per type ─────────────────────────────────────────────────

const TYPE_THUMB_BG: Record<ContentType, string> = {
  blog:     '#F8FAFC',
  faq:      '#FAF8FF',
  social:   '#FDF4FF',
  email:    '#F0F9FF',
  response: '#FFFBEB',
  ads:      '#FFF7ED',
};

// ── Component ──────────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  onBack: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
  hideBack?: boolean;
}

export const TemplateGallery = ({ onBack, onSelectTemplate, hideBack = false }: TemplateGalleryProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TemplateItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return TEMPLATES.filter((t) => {
      const matchesTab = activeTab === 'all' || t.type === activeTab;
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [activeTab, query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className={MAIN_VIEW_HEADER_BAND_CLASS}>
        <div className="flex items-center gap-2">
          {!hideBack && (
            <button onClick={onBack} className="p-1 hover:bg-surface-hover rounded-full transition-colors">
              <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground" />
            </button>
          )}
          <h1 className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Templates</h1>
        </div>
        <div className="relative">
          <Search size={13} strokeWidth={1.6} absoluteStrokeWidth className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-[34px] pl-8 pr-3 text-[13px] w-[200px]"
          />
        </div>
      </div>

      {/* Tabs */}
      <TextTabsRow<TabId>
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Template types"
        className="px-6"
      />

      {/* Main area */}
      <div className="flex flex-grow min-h-0 overflow-hidden">
        {/* Card grid */}
        <div className="flex-grow overflow-y-auto px-6 py-5">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[13px] text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filtered.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelected(tmpl)}
                  className={cn(
                    'group bg-background border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-card',
                    selected?.id === tmpl.id
                      ? 'border-primary ring-1 ring-primary/20 shadow-card'
                      : 'border-border hover:border-primary/40',
                  )}
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-[144px] overflow-hidden border-b border-border/60"
                    style={{ background: TYPE_THUMB_BG[tmpl.type] }}
                  >
                    <div className="absolute inset-0 p-4">
                      <div className="w-full h-full rounded-md overflow-hidden shadow-card">
                        <TemplateThumbnail template={tmpl} />
                      </div>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.04] transition-all duration-150" />
                  </div>

                  {/* Metadata */}
                  <div className="p-3 flex flex-col gap-1.5">
                    <span className={cn('self-start text-[10px] px-2 py-0.5 rounded-full', TYPE_BADGE_CLASS[tmpl.type])}>
                      {TYPE_LABEL[tmpl.type]}
                    </span>
                    <p className="text-[13px] text-foreground leading-snug">{tmpl.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{tmpl.description}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {tmpl.useCases.map((uc) => (
                        <span key={uc} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="w-[280px] flex-shrink-0 border-l border-border overflow-y-auto flex flex-col">
          {!selected ? (
            <div className="flex-grow flex items-center justify-center text-[13px] text-muted-foreground p-6 text-center">
              Select a template to preview
            </div>
          ) : (
            <>
              {/* Large thumbnail preview */}
              <div
                className="h-[200px] shrink-0 p-5 border-b border-border"
                style={{ background: TYPE_THUMB_BG[selected.type] }}
              >
                <div className="w-full h-full rounded-lg overflow-hidden shadow-card">
                  <TemplateThumbnail template={selected} />
                </div>
              </div>

              {/* Meta */}
              <div className="px-5 py-4 border-b border-border flex-shrink-0">
                <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full mb-2', TYPE_BADGE_CLASS[selected.type])}>
                  {TYPE_LABEL[selected.type]}
                </span>
                <p className="text-[13px] text-foreground">{selected.name}</p>
              </div>

              {/* Description + use cases */}
              <div className="px-5 py-4 flex flex-col gap-3 flex-1">
                <p className="text-[12px] text-muted-foreground leading-relaxed">{selected.description}</p>
                <div className="flex flex-wrap gap-1">
                  {selected.useCases.map((uc) => (
                    <span key={uc} className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{uc}</span>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-6 mt-auto">
                <Button variant="default" className="w-full" onClick={() => onSelectTemplate(selected)}>
                  Use this template
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
