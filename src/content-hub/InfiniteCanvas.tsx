import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Grid, List, Calendar, ChevronDown, Sparkles, Plus } from 'lucide-react';
import { ContentCard, type ContentItem } from './ContentCard';
import { SkeletonCard } from './SkeletonCard';
import { Popover, PopoverTrigger, PopoverContent } from '@/contenthub-ui/popover';

// Card widths: social cards = 550px, long-form cards = 650px, gap between cards = 40px
// Layout: all cards in a single horizontal row, left-to-right
const CARD_GAP = 40;
const SOCIAL_W = 550;
const LONG_W = 650;
const ROW_Y = 60;

// Cumulative x positions: facebook(550) → reel(550) → email(650) → blog(650) → landing(650)
const X_FACEBOOK = 60;
const X_REEL     = X_FACEBOOK + SOCIAL_W + CARD_GAP;          // 650
const X_EMAIL    = X_REEL     + SOCIAL_W + CARD_GAP;          // 1240
const X_BLOG     = X_EMAIL    + LONG_W   + CARD_GAP;          // 1930
const X_LANDING  = X_BLOG     + LONG_W   + CARD_GAP;          // 2620

const SKELETON_LAYOUT: { type: ContentItem['type']; x: number; y: number }[] = [
  { type: 'facebook', x: X_FACEBOOK, y: ROW_Y },
  { type: 'reel',     x: X_REEL,     y: ROW_Y },
  { type: 'email',    x: X_EMAIL,    y: ROW_Y },
  { type: 'blog',     x: X_BLOG,     y: ROW_Y },
  { type: 'landing',  x: X_LANDING,  y: ROW_Y },
];

const DEFAULT_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: 'facebook',
    content:
      "Transform your yard into a living masterpiece 🌱\nWhether you're dreaming of a peaceful garden corner, a vibrant outdoor hangout, or a low-maintenance modern lawn — LushGreen Landscapes brings your vision to life.\n\n🌼 Native, drought-tolerant plants\n💧 Smart irrigation that saves water\n♻️ Eco-friendly materials built to last\n✨ Designs crafted for beauty in every season\n\nReady to upgrade your outdoor space?\n👉 Book your free yard design consultation today!",
    position: { x: X_FACEBOOK, y: ROW_Y },
    status: 'Draft',
    date: 'Jul 22, 10:30 AM',
  },
  {
    id: '2',
    type: 'reel',
    content:
      "Your dream yard is closer than you think 🌱✨\nFrom native plants to smart irrigation and modern outdoor makeovers — we design landscapes that grow beautifully through every season.",
    position: { x: X_REEL, y: ROW_Y },
    status: 'Draft',
    date: 'Jul 22, 10:31 AM',
  },
  {
    id: '3',
    type: 'email',
    content: '',
    position: { x: X_EMAIL, y: ROW_Y },
    status: 'Draft',
    date: 'Jul 22, 10:34 AM',
  },
  {
    id: '4',
    type: 'blog',
    content: '',
    position: { x: X_BLOG, y: ROW_Y },
    status: 'Draft',
    date: 'Jul 22, 10:35 AM',
  },
  {
    id: '5',
    type: 'landing',
    content: '',
    position: { x: X_LANDING, y: ROW_Y },
    status: 'Draft',
    date: 'Jul 22, 10:36 AM',
  },
];

/** Ghost thumbnail card shown in the empty state background — gray container + screenshot frame */
function GhostCard({ hue, rotate, x, y, scale = 1 }: { hue: number; rotate: number; x: string; y: string; scale?: number }) {
  return (
    <div
      className="absolute rounded-md border border-black/[0.07] bg-white overflow-hidden shadow-sm flex flex-col"
      style={{ width: 148, left: x, top: y, transform: `rotate(${rotate}deg) scale(${scale})`, transformOrigin: 'center' }}
    >
      {/* Gray container with white screenshot frame inside */}
      <div className="bg-surface-hover p-[7px] pb-[6px]">
        <div className="w-full bg-white rounded-md overflow-hidden shadow-sm ring-1 ring-black/[0.06] flex flex-col" style={{ height: 80 }}>
          {/* Colored header strip */}
          <div className="h-[22px] w-full flex items-center gap-1.5 px-2 shrink-0" style={{ background: `hsl(${hue},50%,50%)` }}>
            <div className="w-[9px] h-[9px] rounded-full bg-white/30 shrink-0" />
            <div className="flex flex-col gap-[2px] flex-1">
              <div className="h-[2px] w-full bg-white/70 rounded-full" />
              <div className="h-[1.5px] w-3/4 bg-white/40 rounded-full" />
            </div>
          </div>
          {/* Body */}
          <div className="flex-1 px-2 py-[5px] flex flex-col gap-[4px]">
            <div className="h-[3px] w-full bg-border rounded-full" />
            <div className="h-[3px] w-4/5 bg-border rounded-full" />
            <div className="h-[9px] w-full rounded-[2px]" style={{ background: `hsl(${hue},55%,93%)` }} />
            <div className="h-[3px] w-2/3 bg-surface-hover rounded-full" />
          </div>
        </div>
      </div>
      {/* Card footer text */}
      <div className="px-2.5 py-2 flex flex-col gap-[3px]">
        <div className="h-[3.5px] w-full bg-border rounded-full" />
        <div className="h-[3px] w-3/4 bg-surface-hover rounded-full" />
      </div>
    </div>
  );
}

const EmptyState = () => (
  <div className="relative flex flex-col items-center justify-center h-full gap-6 pointer-events-none select-none overflow-hidden">
    {/* Ghost cards in background */}
    <GhostCard hue={220} rotate={-6}  x="8%"  y="12%" scale={0.9} />
    <GhostCard hue={160} rotate={3}   x="30%" y="5%"  scale={0.85} />
    <GhostCard hue={280} rotate={5}   x="60%" y="8%"  scale={0.88} />
    <GhostCard hue={30}  rotate={-4}  x="78%" y="15%" scale={0.92} />
    <GhostCard hue={340} rotate={7}   x="5%"  y="55%" scale={0.87} />
    <GhostCard hue={190} rotate={-3}  x="75%" y="58%" scale={0.9}  />
    {/* Frosted-glass overlay so ghost cards recede */}
    <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
    {/* Prompt card */}
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center shadow-sm">
        <Sparkles size={28} className="text-primary" strokeWidth={1.6} />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[13px] text-foreground">
          Chat with our AI Copilot to generate content for your project
        </p>
        <div className="text-[13px] text-muted-foreground">or</div>
        <button className="text-[13px] text-foreground pointer-events-auto hover:text-primary flex items-center gap-1">
          Select from <span className="text-primary">library</span>
          <ChevronDown size={14} strokeWidth={1.6} className="text-primary" />
        </button>
      </div>
    </div>
  </div>
);

const CONTENT_TYPE_OPTIONS = [
  { id: 'facebook', label: 'Facebook post' },
  { id: 'reel',     label: 'Reel' },
  { id: 'email',    label: 'Email' },
  { id: 'blog',     label: 'Blog' },
  { id: 'landing',  label: 'Landing page' },
  { id: 'faq',      label: 'FAQ set' },
] as const;

interface InfiniteCanvasProps {
  isGenerating?: boolean;
  isReady?: boolean;
  faqReady?: boolean;
  onAddFAQ?: () => void;
}

export const InfiniteCanvas = ({ isGenerating = false, isReady = false, faqReady = false, onAddFAQ }: InfiniteCanvasProps) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [addContentOpen, setAddContentOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // When generation completes (isReady becomes true), populate content
  useEffect(() => {
    if (isReady) {
      setContentItems(DEFAULT_CONTENT);
    }
  }, [isReady]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const handleSelect = (id: string, multi: boolean) => {
    setSelectedItems(prev =>
      multi
        ? prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        : prev.includes(id) ? [] : [id]
    );
  };

  const handlePositionChange = (id: string, pos: { x: number; y: number }) => {
    setContentItems(prev => prev.map(item => item.id === id ? { ...item, position: pos } : item));
  };

  const handleDimensionsChange = (id: string, dims: { width: number; height: number }) => {
    setContentItems(prev => prev.map(item => item.id === id ? { ...item, dimensions: dims } : item));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.05 : 0.95;
      setZoom(prev => Math.max(0.3, Math.min(2, prev * factor)));
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, []);

  const showEmpty = !isGenerating && !isReady;
  const showSkeletons = isGenerating;
  const showContent = isReady && contentItems.length > 0;

  return (
    <div className="flex-grow h-full bg-muted overflow-hidden relative">
      {/* Toolbar — always visible */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background rounded-lg z-30 shadow-sm border border-border">
        <div className="flex flex-row items-center px-4 py-2 gap-4">
          {(showSkeletons || showContent) && (
            <>
              <span className="text-[13px] text-foreground text-nowrap">
                {selectedItems.length > 0 ? `${selectedItems.length} selected` : '0 selected'}
              </span>
              <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                <div className="bg-background flex items-center justify-center px-2 py-1 rounded-md shadow-sm">
                  <Grid size={16} strokeWidth={1.6} className="text-foreground" />
                </div>
                <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
                  <List size={16} strokeWidth={1.6} className="text-foreground" />
                </div>
                <div className="flex items-center justify-center px-2 py-1 rounded-md cursor-pointer hover:bg-background/50">
                  <Calendar size={16} strokeWidth={1.6} className="text-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleZoomOut} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
                  <ZoomOut size={16} strokeWidth={1.6} className="text-foreground" />
                </button>
                <span className="text-[13px] text-muted-foreground text-nowrap">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="p-1 hover:bg-surface-hover rounded-md transition-colors">
                  <ZoomIn size={16} strokeWidth={1.6} className="text-foreground" />
                </button>
              </div>
              <div className="w-px h-4 bg-border" />
            </>
          )}
          <Popover open={addContentOpen} onOpenChange={setAddContentOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-surface-hover transition-colors">
                <Plus size={14} strokeWidth={1.6} />
                Add content
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className="w-full text-left px-2 py-2 text-[13px] text-foreground rounded-md hover:bg-surface-hover transition-colors"
                  onClick={() => {
                    setAddContentOpen(false);
                    if (opt.id === 'faq') onAddFAQ?.();
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ position: 'relative' }}
      >
        {showEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <EmptyState />
          </div>
        )}

        {(showSkeletons || showContent) && (
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: '0 0',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200%',
              height: '200%',
            }}
          >
            {showSkeletons &&
              SKELETON_LAYOUT.map((sk, i) => (
                <SkeletonCard
                  key={sk.type}
                  position={{ x: sk.x, y: sk.y }}
                  contentType={sk.type}
                  delay={i * 0.12}
                />
              ))}

            {showContent &&
              contentItems.map(item => (
                <ContentCard
                  key={item.id}
                  {...item}
                  selected={selectedItems.includes(item.id)}
                  onSelect={handleSelect}
                  onPositionChange={handlePositionChange}
                  onDimensionsChange={handleDimensionsChange}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
