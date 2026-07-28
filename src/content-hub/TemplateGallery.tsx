import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, FileText, MessageSquare, Mail, Star, Megaphone, Share2,
  Search, LayoutGrid, List, Eye, MoreHorizontal, ChevronRight, X,
} from 'lucide-react';
import thumbBlogAnnouncement from '@/assets/thumbnails/blog-announcement.png';
import thumbBlogWelcome from '@/assets/thumbnails/blog-welcome.png';
import thumbBlogNewDish from '@/assets/thumbnails/blog-new-dish.png';
import thumbBlogSurvey from '@/assets/thumbnails/blog-survey.png';
import thumbFaq from '@/assets/thumbnails/faq.png';
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
  previewLines: number[];
}

type TabId = 'all' | ContentType;
type ViewMode = 'grid' | 'list';

// ── Mock templates ─────────────────────────────────────────────────────────────

export const TEMPLATES: TemplateItem[] = [
  { id: 'faq-1', type: 'faq', name: 'Product launch FAQ', description: 'Answer the most common questions customers ask when you launch a new product or service.', useCases: ['Launch campaigns', 'New products'], previewLines: [90, 60, 85, 50, 70] },
  { id: 'faq-2', type: 'faq', name: 'Location-specific FAQ', description: 'FAQ content tailored to a specific business location — hours, parking, services available.', useCases: ['Local SEO', 'Location pages'], previewLines: [70, 80, 55, 65, 45] },
  { id: 'faq-3', type: 'faq', name: 'Service & pricing FAQ', description: 'Clear answers about what you offer, how much it costs, and what the process looks like.', useCases: ['Pricing clarity', 'Sales enablement'], previewLines: [80, 60, 90, 70, 50] },
  { id: 'faq-4', type: 'faq', name: 'AEO / voice-search FAQ', description: 'Optimised for AI answer engines and voice search with concise, direct question-answer pairs.', useCases: ['Voice search', 'AI answer engines'], previewLines: [60, 80, 65, 75, 55] },
  { id: 'soc-1', type: 'social', name: 'Promotion announcement', description: 'Drive awareness and urgency around a sale, offer, or limited-time deal across social channels.', useCases: ['Sales', 'Promo campaigns'], previewLines: [85, 55, 70] },
  { id: 'soc-2', type: 'social', name: 'Customer testimonial', description: 'Turn a great customer review into a shareable social post with brand-consistent formatting.', useCases: ['Social proof', 'Trust building'], previewLines: [70, 90, 60] },
  { id: 'soc-3', type: 'social', name: 'Seasonal / holiday', description: 'Timely content tied to a seasonal moment, holiday, or cultural event relevant to your audience.', useCases: ['Seasonal campaigns', 'Holidays'], previewLines: [60, 75, 80] },
  { id: 'soc-4', type: 'social', name: 'Behind the scenes', description: 'Humanise your brand by sharing how things work, your team, or your process in an authentic way.', useCases: ['Brand storytelling', 'Authenticity'], previewLines: [80, 60, 70] },
  { id: 'em-1', type: 'email', name: 'Welcome series', description: 'Onboard new customers with a warm introduction to your business, services, and what to expect.', useCases: ['Onboarding', 'New customers'], previewLines: [90, 60, 80, 50, 70, 40] },
  { id: 'em-2', type: 'email', name: 'Promotional offer', description: 'A focused email driving a single, compelling offer with a clear call-to-action.', useCases: ['Promotions', 'Conversions'], previewLines: [70, 90, 55, 65] },
  { id: 'em-3', type: 'email', name: 'Re-engagement', description: 'Win back customers who haven\'t visited or engaged recently with a personalised incentive.', useCases: ['Win-back', 'Retention'], previewLines: [80, 60, 85, 55] },
  { id: 'em-4', type: 'email', name: 'Review request', description: 'Ask happy customers for a review at exactly the right moment with the right tone.', useCases: ['Review growth', 'Reputation'], previewLines: [65, 80, 70, 50] },
  { id: 'bl-1', type: 'blog', name: 'How-to guide', description: 'Step-by-step instructional content that answers a common customer question in depth.', useCases: ['SEO content', 'Education'], previewLines: [90, 70, 60, 85, 55, 75] },
  { id: 'bl-2', type: 'blog', name: 'Local SEO landing page', description: 'Location-specific content designed to rank for local search terms and convert nearby customers.', useCases: ['Local SEO', 'Lead gen'], previewLines: [80, 65, 90, 60, 70] },
  { id: 'bl-3', type: 'blog', name: 'Listicle', description: 'Easily scannable numbered or bulleted content that performs well for discovery and sharing.', useCases: ['Traffic', 'Shareability'], previewLines: [70, 55, 80, 65, 75] },
  { id: 'bl-4', type: 'blog', name: 'Case study', description: 'A detailed story of customer success that builds credibility and demonstrates real-world results.', useCases: ['Trust', 'B2B sales'], previewLines: [85, 70, 60, 90, 55] },
  { id: 'res-1', type: 'response', name: '5-star thank you', description: 'A warm, specific, on-brand response to a glowing review that reinforces loyalty.', useCases: ['Reputation', 'Retention'], previewLines: [75, 55, 85] },
  { id: 'res-2', type: 'response', name: 'Empathetic negative reply', description: 'Handle a negative review with empathy and professionalism while offering to make things right.', useCases: ['Crisis response', 'Reputation'], previewLines: [80, 65, 70] },
  { id: 'res-3', type: 'response', name: 'Mixed review response', description: 'Acknowledge the positives, address the concerns, and invite the customer back.', useCases: ['Reputation management'], previewLines: [70, 80, 60] },
  { id: 'res-4', type: 'response', name: 'No-text rating reply', description: 'A concise, friendly response to star-only ratings that still shows you care.', useCases: ['Quick responses'], previewLines: [60, 75] },
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

// ── Mock helpers ───────────────────────────────────────────────────────────────

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h;
}

function mockScore(id: string): number {
  const scores = [87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
  return scores[idHash(id) % scores.length];
}

function mockBrand(id: string): string {
  const brands = ['Aspen dental', 'Oakwood Services', 'Olive Garden'];
  return brands[idHash(id) % brands.length];
}

function mockDate(id: string): string {
  const h = idHash(id);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[h % 12];
  const day = String((h % 28) + 1).padStart(2, '0');
  return `${month} ${day}, 2025`;
}

const SCORE_BREAKDOWN_LABELS = [
  'Intent match', 'Search visibility', 'Content depth', 'Brand alignment', 'Publishing readiness',
];

// ── Blog thumbnail data ────────────────────────────────────────────────────────

export const BLOG_DATA: Record<string, {
  tags: [string, string, string, string][];
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

// Image map: blog template id -> actual thumbnail image
const BLOG_THUMB_IMG: Record<string, string> = {
  'bl-1': thumbBlogAnnouncement,
  'bl-2': thumbBlogWelcome,
  'bl-3': thumbBlogNewDish,
  'bl-4': thumbBlogSurvey,
};

function BlogThumbnail({ id }: { id: string }) {
  const src = BLOG_THUMB_IMG[id] ?? thumbBlogAnnouncement;
  return (
    <img
      src={src}
      alt="Blog preview"
      className="w-full h-full object-cover object-top"
      draggable={false}
    />
  );
}

// ── FAQ thumbnail ──────────────────────────────────────────────────────────────

export const FAQ_DATA: Record<string, { section: string; items: { q: string }[] }> = {
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

function FAQThumbnail({ id: _id }: { id: string }) {
  return (
    <img
      src={thumbFaq}
      alt="FAQ preview"
      className="w-full h-full object-cover object-top"
      draggable={false}
    />
  );
}

// ── Social thumbnail ───────────────────────────────────────────────────────────

const SOCIAL_DATA: Record<string, { platform: string; handle: string; text: string; likes: string }> = {
  'soc-1': { platform: 'FB', handle: 'OakwoodServices', text: 'Summer Sale — 20% off all services this week only. Book now and save before slots fill up!', likes: '47' },
  'soc-2': { platform: 'IG', handle: 'oakwood_co', text: '"Absolutely fantastic experience from start to finish. The team was professional and efficient." — Sarah M.', likes: '132' },
  'soc-3': { platform: 'FB', handle: 'OakwoodServices', text: 'Fall is here! Time to prep your home for the colder months. Here are our top 5 seasonal tips...', likes: '89' },
  'soc-4': { platform: 'IG', handle: 'oakwood_co', text: 'Ever wonder what goes on behind the scenes? Our team starts every morning with a full brief to make sure everything runs smoothly for you.', likes: '215' },
};

function SocialThumbnail({ id }: { id: string }) {
  const d = SOCIAL_DATA[id] ?? SOCIAL_DATA['soc-1'];
  const isFB = d.platform === 'FB';
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
          <span style={{ fontSize: 5, color: '#6b7280' }}>{d.likes} likes</span>
          <span style={{ fontSize: 5, color: '#6b7280' }}>· Comment · Share</span>
        </div>
      </div>
    </div>
  );
}

// ── Email thumbnail ────────────────────────────────────────────────────────────

const EMAIL_DATA: Record<string, { subject: string; preview: string; cta: string }> = {
  'em-1': { subject: 'Welcome to Oakwood Services!', preview: "We're so glad you're here. Here's everything you need to get started with your account.", cta: 'Get started' },
  'em-2': { subject: 'Exclusive offer — 25% off this week', preview: 'Your loyalty means everything to us. Use code LOYAL25 before Sunday to claim your discount.', cta: 'Claim offer' },
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
        <div className="flex items-center gap-1">
          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: '#1976d2' }} />
          <div className="h-[2px] rounded-full" style={{ width: 38, background: '#d1d5db' }} />
        </div>
        <p style={{ fontSize: 6, color: '#111827', lineHeight: '9px' }} className="line-clamp-1">{d.subject}</p>
        <p style={{ fontSize: 5, color: '#6b7280', lineHeight: '7.5px' }} className="line-clamp-2">{d.preview}</p>
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
  'res-1': { stars: 5, review: 'Outstanding service! The team arrived on time, worked efficiently, and exceeded all expectations.', response: 'Thank you so much for your kind words! We\'re thrilled to hear you had a great experience.' },
  'res-2': { stars: 1, review: 'Disappointed with the wait time and communication. Expected better given the price.', response: 'We\'re truly sorry to hear this. Your experience doesn\'t reflect our standards.' },
  'res-3': { stars: 3, review: 'Good quality work but the scheduling was a bit of a hassle. Results were worth it.', response: 'Thanks for sharing this. We\'re glad the results met your expectations.' },
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
        <div className="flex flex-col gap-[2px] p-[4px] rounded" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex items-center gap-1">
            <div className="w-[7px] h-[7px] rounded-full bg-border shrink-0" />
            <ReviewStars count={d.stars} />
          </div>
          {d.review && (
            <p style={{ fontSize: 5, color: '#374151', lineHeight: '7.5px' }} className="line-clamp-2">{d.review}</p>
          )}
        </div>
        <div className="flex gap-1 p-[4px] rounded" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <span style={{ fontSize: 4.5, color: '#1976d2', lineHeight: '7px', flexShrink: 0 }}>Re:</span>
          <p style={{ fontSize: 5, color: '#1e40af', lineHeight: '7.5px' }} className="line-clamp-3">{d.response}</p>
        </div>
      </div>
    </div>
  );
}

// ── Ads thumbnail ──────────────────────────────────────────────────────────────

const ADS_DATA: Record<string, { platform: string; headline: string; url: string; desc: string }> = {
  'ads-1': { platform: 'Google', headline: 'Expert Home Services in Austin | Book Online', url: 'oakwoodservices.com › schedule', desc: 'Trusted by 2,000+ homeowners. Same-day availability. Licensed & insured. Free estimates on all services.' },
  'ads-2': { platform: 'Meta', headline: 'Your dream home starts here', url: '', desc: 'Swipe to see our most popular services this season. Book online and get 15% off your first visit.' },
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

export function TemplateThumbnail({ template }: { template: TemplateItem }) {
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

export const TYPE_THUMB_BG: Record<ContentType, string> = {
  blog:     '#E5E9F0',
  faq:      '#E5E9F0',
  social:   '#E5E9F0',
  email:    '#E5E9F0',
  response: '#E5E9F0',
  ads:      '#E5E9F0',
};

// ── Preview modal ──────────────────────────────────────────────────────────────

function PreviewModal({
  item,
  onClose,
  onUse,
}: {
  item: TemplateItem;
  onClose: () => void;
  onUse: () => void;
}) {
  const score = mockScore(item.id);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-xl flex flex-col overflow-hidden"
        style={{
          width: 1100,
          maxWidth: '95vw',
          maxHeight: '88vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <span className="text-[15px] text-foreground">Preview of {item.name}</span>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={onUse} className="h-8 px-4 text-[13px]">
              Use content
            </Button>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md hover:bg-surface-hover transition-colors"
            >
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: score + metadata */}
          <div className="w-[360px] shrink-0 border-r border-border overflow-y-auto p-6 flex flex-col gap-5">
            {/* Score number */}
            <div>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="text-[52px] leading-none" style={{ color: '#1D9E75' }}>{score}</span>
                <span className="text-[20px] text-muted-foreground mb-1.5">/ 100</span>
              </div>
              <div className="w-full h-[6px] rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: '#1D9E75' }}
                />
              </div>
            </div>

            {/* Score breakdown */}
            <div>
              <p className="text-[12px] text-muted-foreground mb-2">Score breakdown</p>
              <div className="flex flex-col divide-y divide-border">
                {SCORE_BREAKDOWN_LABELS.map((label) => (
                  <button
                    key={label}
                    className="flex items-center justify-between py-2.5 text-left w-full"
                    onClick={() => setExpanded(expanded === label ? null : label)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        size={13}
                        strokeWidth={1.6}
                        absoluteStrokeWidth
                        className={cn('text-muted-foreground transition-transform duration-150', expanded === label && 'rotate-90')}
                      />
                      <span className="text-[13px] text-foreground">{label}</span>
                    </div>
                    <span className="text-[13px] text-muted-foreground">{score}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Topic</p>
              <p className="text-[13px] text-foreground leading-relaxed">{item.description}</p>
            </div>

            {/* Brand identity */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Brand identity</p>
              <p className="text-[13px] text-foreground">{mockBrand(item.id)}</p>
            </div>

            {/* Created by */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1">Created by</p>
              <p className="text-[13px] text-foreground">Birdeye on {mockDate(item.id)}</p>
            </div>
          </div>

          {/* Right: content preview */}
          <div className="flex-1 overflow-auto" style={{ background: '#F5F7FA' }}>
            {/* Zoom bar */}
            <div className="flex items-center justify-end px-4 py-2 bg-white border-b border-border">
              <span className="text-[12px] text-muted-foreground">75%</span>
            </div>
            <div className="p-8 flex justify-center">
              <div
                className="bg-white rounded-lg overflow-hidden"
                style={{ width: 620, minHeight: 480, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
              >
                {/* Thumbnail preview scaled up */}
                <div
                  className="w-full overflow-hidden"
                  style={{ height: 300, background: TYPE_THUMB_BG[item.type], padding: 24 }}
                >
                  <div className="w-full h-full overflow-hidden rounded-md shadow-card">
                    <TemplateThumbnail template={item} />
                  </div>
                </div>
                {/* Content text */}
                <div className="p-6 flex flex-col gap-3">
                  <h2 className="text-[18px] text-foreground leading-snug">{item.name}</h2>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {item.useCases.map((uc) => (
                      <span key={uc} className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {uc}
                      </span>
                    ))}
                  </div>
                  {/* Mock body lines */}
                  <div className="flex flex-col gap-2 mt-2">
                    {[100, 92, 85, 78, 95].map((w, i) => (
                      <div key={i} className="h-[10px] rounded-sm bg-muted" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  onBack: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
  hideBack?: boolean;
}

export const TemplateGallery = ({ onBack, onSelectTemplate, hideBack = false }: TemplateGalleryProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previewItem, setPreviewItem] = useState<TemplateItem | null>(null);

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
        <div className="flex items-center gap-2">
          {/* Grid / list toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex size-8 items-center justify-center transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-hover',
              )}
            >
              <LayoutGrid size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex size-8 items-center justify-center border-l border-border transition-colors',
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-hover',
              )}
            >
              <List size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
          {/* Search */}
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
      </div>

      {/* Tabs */}
      <TextTabsRow<TabId>
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel="Template types"
        className="px-6"
      />

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-[13px] text-muted-foreground">
            No templates match your search.
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid view ── */
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            {filtered.map((tmpl) => (
              <div
                key={tmpl.id}
                className="group bg-white border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-card hover:border-primary/30"
              >
                {/* Thumbnail */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: 178, background: TYPE_THUMB_BG[tmpl.type] }}
                >
                  {/* Mini content preview */}
                  <div className="absolute inset-0 p-3">
                    <div className="w-full h-full rounded-md overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.10)' }}>
                      <TemplateThumbnail template={tmpl} />
                    </div>
                  </div>

                  {/* Type badge — top right */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-[2px] rounded border',
                        TYPE_BADGE_CLASS[tmpl.type],
                      )}
                      style={{ background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      {TYPE_LABEL[tmpl.type]}
                    </span>
                  </div>

                  {/* Hover overlay with CTAs */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20" style={{ background: 'rgba(0,0,0,0.42)' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectTemplate(tmpl); }}
                      className="h-8 rounded-md bg-primary text-white text-[12px] transition-colors hover:bg-primary/90"
                      style={{ width: 126 }}
                    >
                      Use content
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(tmpl); }}
                      className="h-8 rounded-md text-foreground text-[12px] transition-colors hover:bg-white/90"
                      style={{ width: 126, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.5)' }}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-2.5">
                  <p className="text-[12px] text-foreground leading-snug truncate">{tmpl.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Created by Birdeye</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Table view ── */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Content type', 'Content score', 'Brand identity', 'Last updated', 'Created by'].map((col) => (
                  <th key={col} className="py-2.5 pr-6 text-[11px] text-muted-foreground font-normal whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((tmpl) => {
                const score = mockScore(tmpl.id);
                const scoreColor = score >= 90 ? '#1D9E75' : '#94a3b8';
                return (
                  <tr key={tmpl.id} className="group transition-colors hover:bg-surface-hover/40">
                    {/* Name + thumbnail */}
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-8 rounded overflow-hidden shrink-0 border border-border/60"
                          style={{ background: TYPE_THUMB_BG[tmpl.type] }}
                        >
                          <TemplateThumbnail template={tmpl} />
                        </div>
                        <button
                          className="text-[13px] text-primary hover:underline text-left"
                          onClick={() => setPreviewItem(tmpl)}
                        >
                          {tmpl.name}
                        </button>
                      </div>
                    </td>
                    {/* Content type */}
                    <td className="py-3 pr-6">
                      <span className={cn('text-[11px] px-1.5 py-0.5 rounded', TYPE_BADGE_CLASS[tmpl.type])}>
                        {TYPE_LABEL[tmpl.type]}
                      </span>
                    </td>
                    {/* Score */}
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
                        </div>
                        <span className="text-[12px] text-foreground whitespace-nowrap">{score}/100</span>
                      </div>
                    </td>
                    {/* Brand identity */}
                    <td className="py-3 pr-6">
                      <span className="text-[12px] text-foreground">{mockBrand(tmpl.id)}</span>
                    </td>
                    {/* Last updated */}
                    <td className="py-3 pr-6">
                      <span className="text-[12px] text-muted-foreground">{mockDate(tmpl.id)}</span>
                    </td>
                    {/* Created by */}
                    <td className="py-3 pr-6">
                      <span className="text-[12px] text-foreground">Birdeye</span>
                    </td>
                    {/* Row actions */}
                    <td className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewItem(tmpl)}
                          className="flex size-7 items-center justify-center rounded hover:bg-surface-hover transition-colors"
                        >
                          <Eye size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                        </button>
                        <button className="flex size-7 items-center justify-center rounded hover:bg-surface-hover transition-colors">
                          <MoreHorizontal size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview modal */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onUse={() => { onSelectTemplate(previewItem); setPreviewItem(null); }}
        />
      )}
    </div>
  );
};
