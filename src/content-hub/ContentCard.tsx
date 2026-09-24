import React, { useState } from 'react';
import { motion } from 'motion/react';

export interface ContentItem {
  id: string;
  type: 'facebook' | 'reel' | 'landing' | 'blog' | 'email';
  content: string;
  image?: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  date: string;
  position: { x: number; y: number };
  dimensions?: { width: number; height: number };
  score?: number;
}

interface ContentCardProps extends ContentItem {
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onPositionChange?: (id: string, pos: { x: number; y: number }) => void;
  onDimensionsChange?: (id: string, dims: { width: number; height: number }) => void;
  score?: number;
}

/* ── Platform icon helpers ─────────────────────────── */
const FacebookIcon = () => (
  <div className="relative shrink-0 size-[20px]">
    <svg viewBox="0 0 20 20" fill="none" className="size-full">
      <rect width="20" height="20" rx="4" fill="#1877F2" />
      <path
        d="M13.5 10H11.5V16H9V10H7.5V8H9V6.5C9 5.12 9.88 4 11.5 4H13V6H12C11.45 6 11.5 6.22 11.5 6.5V8H13L13.5 10Z"
        fill="white"
      />
    </svg>
  </div>
);

const InstagramIcon = () => (
  <div className="relative shrink-0 size-[20px]">
    <svg viewBox="0 0 20 20" fill="none" className="size-full">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="20" x2="20" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="10" cy="10" r="4" stroke="white" strokeWidth="1.5" />
      <circle cx="14.5" cy="5.5" r="1" fill="white" />
    </svg>
  </div>
);

const GlobeIcon = () => (
  <div className="relative shrink-0 size-[20px]">
    <svg viewBox="0 0 20 20" fill="none" className="size-full">
      <circle cx="10" cy="10" r="8" stroke="#555" strokeWidth="1.5" />
      <ellipse cx="10" cy="10" rx="4" ry="8" stroke="#555" strokeWidth="1.5" />
      <path d="M2 10h16M10 2a12 12 0 010 16M10 2a12 12 0 000 16" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const BlogIcon = () => (
  <div className="relative shrink-0 size-[20px]">
    <svg viewBox="0 0 20 20" fill="none" className="size-full">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="#555" strokeWidth="1.5" />
      <path d="M6 7h8M6 10h8M6 13h5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

const EmailIcon = () => (
  <div className="relative shrink-0 size-[20px]">
    <svg viewBox="0 0 20 20" fill="none" className="size-full">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="#555" strokeWidth="1.5" />
      <path d="M2 7l8 5 8-5" stroke="#555" strokeWidth="1.5" />
    </svg>
  </div>
);

/* ── Small utility icons ───────────────────────────── */
const ScheduleIcon = () => (
  <svg className="size-[14px]" viewBox="0 0 16 16" fill="#8f8f8f">
    <path d="M8 14.5C4.41 14.5 1.5 11.59 1.5 8C1.5 4.41 4.41 1.5 8 1.5C11.59 1.5 14.5 4.41 14.5 8C14.5 11.59 11.59 14.5 8 14.5ZM8 2.5C4.96 2.5 2.5 4.96 2.5 8C2.5 11.04 4.96 13.5 8 13.5C11.04 13.5 13.5 11.04 13.5 8C13.5 4.96 11.04 2.5 8 2.5ZM10.5 8.5H7.5V4.5H8.5V7.5H10.5V8.5Z" />
  </svg>
);

const PersonCheckIcon = () => (
  <svg className="size-[14px]" viewBox="0 0 16 16" fill="#8f8f8f">
    <path d="M6 7C7.66 7 9 5.66 9 4C9 2.34 7.66 1 6 1C4.34 1 3 2.34 3 4C3 5.66 4.34 7 6 7ZM6 2C7.1 2 8 2.9 8 4C8 5.1 7.1 6 6 6C4.9 6 4 5.1 4 4C4 2.9 4.9 2 6 2ZM6 8C3.67 8 1 9.17 1 11V12H9V11C9 9.17 6.33 8 6 8ZM2 11C2.2 10.29 3.89 9 6 9C8.11 9 9.8 10.29 10 11H2ZM13.5 6.5L11.5 8.5L10.5 7.5L9.79 8.21L11.5 9.91L14.21 7.21L13.5 6.5Z" />
  </svg>
);

const AccountIcon = () => (
  <svg className="size-[14px]" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="6" r="3" stroke="#aaa" strokeWidth="1.2" />
    <path d="M2 14c0-3 2.69-5 6-5s6 2 6 5" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const DotSep = () => (
  <svg className="shrink-0 size-[3px]" viewBox="0 0 3 3" fill="none">
    <circle cx="1.5" cy="1.5" r="1.5" fill="#888" />
  </svg>
);

/* ── Score helpers ─────────────────────────────────── */
function getScoreRingColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

function derivedScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  }
  return 60 + (h % 35);
}

/* ── Social card body ─────────────────────────────── */
function SocialCardBody({ item }: { item: ContentItem }) {
  const lines = item.content.split('\n');
  return (
    <>
      {/* Metadata */}
      <div className="flex items-center gap-2 flex-wrap">
        <ScheduleIcon />
        <span className="text-[12px] text-text-secondary text-nowrap">{item.date}</span>
        <DotSep />
        <PersonCheckIcon />
        <span className="text-[12px] text-text-secondary text-nowrap">Select approval</span>
      </div>

      {/* Text */}
      <div className="text-[14px] leading-[20px] text-text-primary">
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>

    </>
  );
}

/* ── Email card body ──────────────────────────────── */
function EmailCardBody({ item }: { item: ContentItem }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <ScheduleIcon />
        <span className="text-[12px] text-text-secondary">Select date time</span>
        <DotSep />
        <PersonCheckIcon />
        <span className="text-[12px] text-text-secondary">Select approval</span>
      </div>
      <div className="w-full flex flex-col gap-4">
        <div className="pb-3 border-b border-border">
          <p className="text-[17px] leading-[24px] text-foreground">Your Free Yard Design Consultation Awaits 🌱</p>
          <p className="text-[13px] text-muted-foreground mt-1">Thanks for your interest in transforming your outdoor space!</p>
        </div>
        <p className="text-[14px] leading-[20px] text-foreground">Hi there,</p>
        <p className="text-[14px] leading-[20px] text-foreground">Thanks for your interest in transforming your outdoor space! We're excited to help you create the yard of your dreams.</p>
        <p className="text-[15px] leading-[22px] text-foreground">What to Expect in Your Free Consultation</p>
        <div className="text-[14px] leading-[20px] text-foreground ml-1">
          <p className="mb-1">• A personalized assessment of your outdoor space</p>
          <p className="mb-1">• Custom design ideas tailored to your lifestyle and budget</p>
          <p className="mb-1">• Expert recommendations for native, low-maintenance plants</p>
          <p className="mb-1">• A clear timeline and transparent pricing</p>
        </div>
        <div className="w-full flex flex-col gap-2 p-4 rounded" style={{ backgroundColor: 'var(--color-accent)' }}>
          <p className="text-[14px] text-foreground">Ready to Get Started?</p>
          <button className="w-full py-2.5 rounded text-[14px] text-white" style={{ backgroundColor: 'var(--color-primary)' }} data-no-drag>
            Schedule Your Free Consultation
          </button>
          <p className="text-[13px] text-muted-foreground text-center">or call us at (555) 123-4567</p>
        </div>
        <p className="text-[14px] leading-[20px] text-foreground">Best regards,<br />The LushGreen Landscapes Team</p>
        <div className="pt-3 border-t border-border">
          <p className="text-[13px] text-muted-foreground italic">P.S. Book within the next 7 days and receive 10% off your first project!</p>
        </div>
      </div>
    </>
  );
}

/* ── Landing card body ────────────────────────────── */
function LandingCardBody({ item }: { item: ContentItem }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <ScheduleIcon />
        <span className="text-[12px] text-text-secondary">Select date time</span>
        <DotSep />
        <PersonCheckIcon />
        <span className="text-[12px] text-text-secondary">Select approval</span>
      </div>
      <div className="w-full flex flex-col gap-4">
        {/* Hero */}
        <div className="pb-4 border-b border-border flex flex-col gap-2">
          <h1 className="text-[24px] leading-[30px] text-foreground">Transform Your Yard into a Living Masterpiece</h1>
          <p className="text-[15px] leading-[22px] text-muted-foreground">
            Your outdoor space is more than just a yard — it's an extension of your home. At LushGreen Landscapes, we bring your vision to life with creativity and care.
          </p>
          <div className="flex gap-2 mt-1">
            <button className="px-4 py-2.5 rounded text-[13px] text-white" style={{ backgroundColor: 'var(--color-primary)' }} data-no-drag>Get Free Consultation</button>
            <button className="px-4 py-2.5 rounded text-[13px] border border-border text-foreground" data-no-drag>View Portfolio</button>
          </div>
        </div>
        {/* Hero image placeholder */}
        <div className="w-full h-[220px] rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-muted)' }}>
          <span className="text-[13px] text-muted-foreground">Hero Image</span>
        </div>
        {/* Features */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[18px] text-foreground">Designed for Beauty and Built to Last</h2>
          <div className="grid grid-cols-3 gap-2">
            {[{ e: '🌱', h: 'Native Plants', d: 'Drought-tolerant & thriving' }, { e: '💧', h: 'Smart Irrigation', d: 'Conserves water' }, { e: '♻️', h: 'Eco-Friendly', d: 'Sustainable materials' }].map(f => (
              <div key={f.h} className="flex flex-col gap-1.5 p-2 rounded" style={{ backgroundColor: 'var(--color-accent)' }}>
                <div className="text-[20px]">{f.e}</div>
                <p className="text-[13px] text-foreground">{f.h}</p>
                <p className="text-[12px] text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Benefits */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[18px] text-foreground">Why Homeowners Love LushGreen</h2>
          {['Personalized designs tailored to your property', 'Expert horticultural and design teams', 'Transparent pricing with no hidden surprises', 'On-time delivery and long-lasting results'].map(b => (
            <p key={b} className="text-[14px] leading-[22px] text-foreground">✓ {b}</p>
          ))}
        </div>
        {/* CTA */}
        <div className="p-4 rounded flex flex-col gap-2 text-center" style={{ backgroundColor: 'var(--color-secondary)' }}>
          <h3 className="text-[17px] text-secondary-foreground">Let's Create Something Beautiful Together</h3>
          <p className="text-[14px] text-secondary-foreground">Book your free consultation today.</p>
          <button className="w-full py-2.5 rounded text-[14px] text-white" style={{ backgroundColor: 'var(--color-primary)' }} data-no-drag>Get Started Today</button>
        </div>
      </div>
    </>
  );
}

/* ── Blog card body ───────────────────────────────── */
function BlogCardBody({ item }: { item: ContentItem }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <ScheduleIcon />
        <span className="text-[12px] text-text-secondary">Select date time</span>
        <DotSep />
        <PersonCheckIcon />
        <span className="text-[12px] text-text-secondary">Select approval</span>
      </div>
      <div className="w-full flex flex-col gap-4">
        {/* Title + meta */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[20px] leading-[28px] text-foreground">
            5 Native Plants That Transform Your Yard Into a Low-Maintenance Paradise
          </h1>
          <div className="flex gap-2 items-center text-[12px] text-muted-foreground">
            <span>By Sarah Johnson</span>
            <span>•</span>
            <span>5 min read</span>
            <span>•</span>
            <span>July 22, 2024</span>
          </div>
        </div>
        {/* Featured image */}
        <div className="w-full h-[200px] rounded overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1565489030990-e211075fe11c?w=800&q=80"
            alt="Featured blog"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        {/* Body */}
        <p className="text-[14px] leading-[22px] text-foreground">
          Tired of spending every weekend fighting with your lawn? The secret to a beautiful, easy-care yard might be simpler than you think: native plants.
        </p>
        <p className="text-[14px] leading-[22px] text-foreground">
          Native plants are perfectly adapted to your local climate, soil, and wildlife. They require less water, fewer pesticides, and minimal maintenance once established.
        </p>
        <h3 className="text-[16px] text-foreground">Why Choose Native Plants?</h3>
        <div className="text-[14px] leading-[22px] text-foreground ml-1">
          {[['Drought-resistant:', "They've evolved to thrive in local rainfall patterns"], ['Low maintenance:', 'No constant fertilizing or chemical treatments'], ['Wildlife-friendly:', 'They attract pollinators and beneficial insects'], ['Cost-effective:', 'Lower water bills and less time spent on upkeep']].map(([k, v]) => (
            <p key={k} className="mb-1.5"><strong>{k}</strong> {v}</p>
          ))}
        </div>
        {/* Callout */}
        <div className="p-4 border-l-4 rounded" style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-primary)' }}>
          <p className="text-[13px] italic text-foreground">
            "Switching to native plants reduced our water usage by 40% and gave us our weekends back." — Jennifer M., Homeowner
          </p>
        </div>
        {/* CTA */}
        <div className="p-4 rounded flex flex-col gap-2" style={{ backgroundColor: 'var(--color-secondary)' }}>
          <p className="text-[14px] text-secondary-foreground">Ready to make the switch?</p>
          <button className="w-full py-2 rounded text-[14px] text-white" style={{ backgroundColor: 'var(--color-primary)' }} data-no-drag>Get Free Consultation</button>
        </div>
      </div>
    </>
  );
}

/* ── Main ContentCard component ──────────────────── */
export const ContentCard = ({
  id,
  type,
  content,
  image,
  status,
  date,
  position,
  dimensions,
  selected,
  onSelect,
  onPositionChange,
  onDimensionsChange,
  score,
}: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const scoreVal = score ?? derivedScore(id);
  const ringColor = getScoreRingColor(scoreVal);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const isLongForm = type === 'landing' || type === 'blog' || type === 'email';
  const defaultWidth = isLongForm ? 650 : 550;
  const [cardW, setCardW] = useState(dimensions?.width ?? defaultWidth);

  React.useEffect(() => {
    document.body.style.userSelect = isDragging || isResizing ? 'none' : '';
    return () => { document.body.style.userSelect = ''; };
  }, [isDragging, isResizing]);

  const handleDragStart = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setResizeStart({ width: cardW, height: 0, x: position.x, y: position.y });
  };

  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange?.(id, { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      } else if (isResizing && resizeHandle) {
        const deltaX = e.clientX - dragStart.x;
        if (resizeHandle.includes('e')) {
          const newW = Math.max(400, resizeStart.width + deltaX);
          setCardW(newW);
          onDimensionsChange?.(id, { width: newW, height: 0 });
        }
        if (resizeHandle.includes('w')) {
          const newW = Math.max(400, resizeStart.width - deltaX);
          setCardW(newW);
          onDimensionsChange?.(id, { width: newW, height: 0 });
        }
      }
    };
    const handleUp = () => { setIsDragging(false); setIsResizing(false); setResizeHandle(null); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, id, resizeHandle, onPositionChange, onDimensionsChange]);

  const getIcon = () => {
    switch (type) {
      case 'facebook': return <FacebookIcon />;
      case 'reel': return <InstagramIcon />;
      case 'blog': return <BlogIcon />;
      case 'landing': return <GlobeIcon />;
      case 'email': return <EmailIcon />;
      default: return <FacebookIcon />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'facebook': return 'Facebook post';
      case 'reel': return 'Instagram reel';
      case 'blog': return 'Blog post';
      case 'landing': return 'Landing page';
      case 'email': return 'Email';
      default: return type;
    }
  };

  const item: ContentItem = { id, type, content, image, status, date, position, dimensions };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: cardW,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white flex flex-col gap-[12px] items-start p-[16px] relative rounded-[8px] w-full">
        {/* Border */}
        <div
          aria-hidden
          className={`absolute border-2 inset-[-1px] rounded-[9px] pointer-events-none transition-colors ${
            selected ? 'border-primary' : 'border-border'
          }`}
        />

        {/* Header */}
        <div
          className={`flex items-center justify-between w-full ${isHovered && !isDragging ? 'cursor-grab' : ''}`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {/* Checkbox */}
            <div
              data-no-drag
              className="size-[18px] cursor-pointer hover:opacity-80 shrink-0"
              onClick={(e) => { e.stopPropagation(); onSelect(id, e.shiftKey || e.metaKey || e.ctrlKey); }}
            >
              {selected ? (
                <svg viewBox="0 0 18 18" fill="none" className="size-full">
                  <rect x="1" y="1" width="16" height="16" rx="2" fill="#1976D2" />
                  <path d="M5 9L8 12L13 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 18 18" fill="none" className="size-full">
                  <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="#CCC" strokeWidth="1.5" />
                </svg>
              )}
            </div>
            {/* Icon + label */}
            {getIcon()}
            <span className="text-[14px] text-text-primary text-nowrap">{getTypeLabel()}</span>
            {/* Status chip */}
            {!isLongForm && (
              <div className="bg-border px-2 py-0.5 rounded-[4px]">
                <span className="text-[12px] text-text-secondary">{status}</span>
              </div>
            )}
          </div>
          {/* Right side: unassigned + score ring */}
          <div className="flex items-center gap-2">
            {!isLongForm && (
              <div className="flex items-center gap-1">
                <span className="text-[12px] text-text-secondary">Unassigned</span>
                <AccountIcon />
              </div>
            )}
            <div
              className="w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: ringColor }}
            >
              <span style={{ color: ringColor, fontSize: '11px', fontWeight: 700 }}>{scoreVal}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="relative rounded-[8px] w-full">
          <div className="absolute border border-border inset-0 pointer-events-none rounded-[8px]" />
          <div className="p-[16px] flex flex-col gap-[14px]">
            {type === 'email' && <EmailCardBody item={item} />}
            {type === 'landing' && <LandingCardBody item={item} />}
            {type === 'blog' && <BlogCardBody item={item} />}
            {(type === 'facebook' || type === 'reel') && <SocialCardBody item={item} />}
          </div>
        </div>

        {/* Resize handles */}
        {(isHovered || isResizing) && (
          <>
            <div className="absolute w-2 h-[34px] bg-white border border-primary rounded cursor-e-resize top-1/2 -translate-y-1/2 -right-1 z-10"
              onMouseDown={(e) => handleResizeStart(e, 'e')} />
            <div className="absolute w-2 h-[34px] bg-white border border-primary rounded cursor-w-resize top-1/2 -translate-y-1/2 -left-1 z-10"
              onMouseDown={(e) => handleResizeStart(e, 'w')} />
          </>
        )}
      </div>
    </motion.div>
  );
};
