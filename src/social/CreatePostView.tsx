import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import svgPaths from './imports/svg-zf6pg056p3';
import svgMain from './imports/svg-q05k7ytov1';
import { imgHelp } from './imports/svg-ss3mz';
import { FacebookIcon, InstagramIcon, LinkedInIcon } from './PlatformIcons';
import { Tabs, Tooltip } from '../components';
import {
  Grid3X3, List, Trash2, Upload,
  Camera, Smile, Hash, Lightbulb, X, Plus, ChevronDown, ArrowLeft
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Platform = 'facebook' | 'instagram' | 'linkedin' | 'apple' | 'google';
type TabKey = 'initial' | Platform;
type MediaView = 'grid' | 'table';

interface MediaItem {
  id: string;
  file?: File;
  url: string;
  name: string;
  size: string;
  dateAdded: string;
}

const MAX_MEDIA = 50;
const GRID_PAGE_SIZE = 13; // how many thumbnails to show per "page"

// Picsum seeds chosen to give a nice variety of food/lifestyle/real-estate shots
const PICSUM_SEEDS = [
  'burger','pizza','coffee','sushi','tacos','pasta','salad','steak',
  'bakery','brunch','smoothie','noodles','dessert','barbecue','seafood','breakfast',
  'realestate','house','apartment','office','interior','exterior','garden','pool',
  'cityscape','street','nature','forest','beach','mountain','sunset','sunrise',
  'portrait','team','event','conference','workshop','meeting','training','celebration',
  'product','brand','logo','social','marketing','digital','creative','design',
  'travel','holiday',
];

// Pre-computed sizes to keep DEMO_MEDIA stable across renders
const DEMO_SIZES = [248, 312, 187, 425, 198, 276, 341, 159, 302, 218,
  388, 145, 267, 412, 193, 334, 278, 156, 421, 239,
  184, 317, 263, 401, 172, 295, 338, 207, 365, 143,
  289, 376, 231, 157, 413, 284, 196, 352, 168, 309,
  244, 387, 162, 421, 276, 198, 335, 253, 178, 411];

const DEMO_MEDIA: MediaItem[] = PICSUM_SEEDS.map((seed, i) => ({
  id: `media-${i + 1}`,
  url: `https://picsum.photos/seed/${seed}/400/400`,
  name: `${seed}-photo.jpg`,
  size: `${DEMO_SIZES[i]} KB`,
  dateAdded: 'Apr 8, 2026',
}));


// ─── Chevron Down Icon ────────────────────────────────────────────────────────
function ChevronDownIcon({ color = '#303030' }: { color?: string }) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div
        className="absolute inset-[37.46%_27.42%_37.45%_27.49%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-5.498px_-7.492px] mask-size-[20px_20px]"
        style={{ maskImage: `url('${imgHelp}')` }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.01782 5.0176">
          <path d={svgPaths.p5ccaa80} fill={color} />
        </svg>
      </div>
    </div>
  );
}

// ─── Chevron Up Icon ─────────────────────────────────────────────────────────
function ChevronUpIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div
        className="absolute inset-[37.53%_27.44%_37.4%_27.42%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-5.484px_-7.506px] mask-size-[20px_20px]"
        style={{ maskImage: `url('${imgHelp}')` }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.02811 5.01367">
          <path d={svgPaths.pddafd00} fill="#303030" />
        </svg>
      </div>
    </div>
  );
}

// ─── Info Icon ────────────────────────────────────────────────────────────────
function InfoIcon({ color = '#888888' }: { color?: string }) {
  return (
    <div className="relative shrink-0 size-[16px]">
      <div
        className="absolute inset-[12.08%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.933px_-1.933px] mask-size-[16px_16px]"
        style={{ maskImage: `url('${imgHelp}')` }}
      >
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.1666 15.1666">
          <path d={svgMain.p32bf4c0} fill={color} />
        </svg>
      </div>
    </div>
  );
}


// ─── Apple icon (SVG path of Apple logo) ─────────────────────────────────────
function AppleIcon() {
  return (
    <svg viewBox="0 0 814 1000" fill="currentColor" className="w-full h-full">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-43.4-154.4-112.7C47.5 751 0 641 0 549.7c0-158 103.8-241.5 205.5-241.5 52.8 0 97.3 32.5 131.2 32.5 31.2 0 80.9-35.3 143.7-35.3 22.8 0 108.2 2.6 167.9 79.3zm-74.9-211.3c31.9-37.9 54.3-90.8 54.3-143.7 0-7.7-.6-15.5-1.9-23.2C713.4 14.5 618.7 67.9 564.9 131.4c-29.5 33.8-56.6 86.1-56.6 138.9 0 8.3.6 16.6 2.6 24.3 4.5.6 9 1.3 13.5 1.3 40.5 0 123.6-49.5 159.8-116.1z" />
    </svg>
  );
}

type AppleButtonType =
  | 'Book now' | 'Call' | 'Directions' | 'Website' | 'Make an Appointment'
  | 'More Info' | 'Add to Favorites' | 'Create New Contact'
  | 'Recommend This Place' | 'Share' | 'Rate Us' | 'Save as Contact'
  | 'Share This Place';

const APPLE_BUTTON_TYPES: AppleButtonType[] = [
  'Book now', 'Call', 'Directions', 'Website', 'Make an Appointment',
  'More Info', 'Add to Favorites', 'Create New Contact',
  'Recommend This Place', 'Share', 'Rate Us', 'Save as Contact',
  'Share This Place',
];

/** Button types that need a URL / phone / address input */
const APPLE_URL_TYPES:   AppleButtonType[] = ['Book now', 'Website', 'Make an Appointment', 'More Info'];
const APPLE_PHONE_TYPES: AppleButtonType[] = ['Call'];

// ─── Platform Chip ────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

type GooglePublishAs = 'updates' | 'offers' | 'events';
type GoogleRecurrence = 'none' | 'daily' | 'weekly' | 'custom_weekly' | 'monthly_last' | 'monthly_nth';
type InstagramPublishAs = 'post' | 'reel' | 'story';
const INSTAGRAM_MAX_COLLABORATORS = 3;

// ─── Platform icon assets (from Figma, ~7-day CDN URLs) ──────────────────────
const PLATFORM_ICON_SRCS: Record<Platform, string> = {
  facebook: 'https://www.figma.com/api/mcp/asset/4c762688-ec28-45c6-a7ef-80053a46063a',
  instagram: 'https://www.figma.com/api/mcp/asset/c6a0b541-5e6f-4fe8-9a49-aa2ceed72614',
  google:   'https://www.figma.com/api/mcp/asset/e82bef00-6d8c-41cf-92da-d1b9a0066012',
  linkedin: 'https://www.figma.com/api/mcp/asset/6155bb89-17de-438a-b84a-a64ce00cc46f',
  apple:    'https://www.figma.com/api/mcp/asset/00fc37be-e64e-41f4-8260-ebb19ca1660d',
};
const PLATFORM_CHECK_BADGE = 'https://www.figma.com/api/mcp/asset/51521078-8aab-4731-a1a6-8423ed7bfed8';

// ─── Channel selector demo data ───────────────────────────────────────────────
const DEMO_LOCATIONS = [
  { id: 'loc-1', name: 'Lushgreen Atlanta',   handle: '@lushatlanta',   city: 'Atlanta, GA',    initials: 'LA', color: '#2e7d32' },
  { id: 'loc-2', name: 'Lushgreen Baltimore', handle: '@lushbaltimore', city: 'Baltimore, MD',  initials: 'LB', color: '#1565c0' },
  { id: 'loc-3', name: 'Lushgreen Chicago',   handle: '@lushchicago',   city: 'Chicago, IL',    initials: 'LC', color: '#6a1b9a' },
  { id: 'loc-4', name: 'Lushgreen Detroit',   handle: '@lushdetroit',   city: 'Detroit, MI',    initials: 'LD', color: '#c62828' },
  { id: 'loc-5', name: 'Lushgreen Phoenix',   handle: '@lushphoenix',   city: 'Phoenix, AZ',    initials: 'LP', color: '#e65100' },
  { id: 'loc-6', name: 'Lushgreen Seattle',   handle: '@lushseattle',   city: 'Seattle, WA',    initials: 'LS', color: '#00695c' },
];
const DEMO_CONTENT_STREAMS = [
  'Review site', 'Motto mortgage - Holidays', 'Summer campaign 2026', 'Weekly updates',
];

// ── Instagram collaborator lookup (public profiles only) ──────────────────────
interface InstagramCollaboratorProfile {
  handle: string;
  name: string;
  initials: string;
  color: string;
}
const INSTAGRAM_COLLABORATOR_PROFILES: InstagramCollaboratorProfile[] = [
  { handle: '@sproutcoffeeco',   name: 'Sprout Coffee Company',  initials: 'SC', color: '#6b4226' },
  { handle: '@lushgreeneats',    name: 'Lushgreen Eats',         initials: 'LE', color: '#2e7d32' },
  { handle: '@mottomortgage',    name: 'Motto Mortgage',         initials: 'MM', color: '#1565c0' },
  { handle: '@urbanbrewhouse',   name: 'Urban Brew House',       initials: 'UB', color: '#8d6e63' },
  { handle: '@thebakerytable',   name: 'The Bakery Table',       initials: 'BT', color: '#c62828' },
  { handle: '@fitwell.studio',   name: 'FitWell Studio',         initials: 'FW', color: '#6a1b9a' },
  { handle: '@greenleaf.market', name: 'Greenleaf Market',       initials: 'GM', color: '#00695c' },
  { handle: '@westside.diner',   name: 'Westside Diner',         initials: 'WD', color: '#e65100' },
];

const GOOGLE_BUTTON_TYPES = ['Book', 'Order online', 'Buy', 'Learn more', 'Sign up', 'Get offer', 'Call now'] as const;
const GOOGLE_EVENT_BUTTON_TYPES = ['None', 'Book', 'Buy', 'Learn more', 'Order online', 'Sign up'] as const;
type GoogleButtonType = typeof GOOGLE_BUTTON_TYPES[number];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NTH_LABELS = ['first', 'second', 'third', 'fourth'];

function getRecurrenceOptions(startDate: string): { value: GoogleRecurrence; label: string }[] {
  const opts: { value: GoogleRecurrence; label: string }[] = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
  ];
  if (startDate) {
    const d = new Date(startDate + 'T00:00:00');
    const dayName = DAY_NAMES[d.getDay()];
    opts.push({ value: 'weekly', label: `Weekly on ${dayName}` });
    opts.push({ value: 'custom_weekly', label: 'Custom weekly' });
    const nth = Math.ceil(d.getDate() / 7);
    opts.push({ value: 'monthly_nth', label: `Monthly on the ${NTH_LABELS[Math.min(nth - 1, 3)]} ${dayName}` });
    opts.push({ value: 'monthly_last', label: `Monthly on the last ${dayName}` });
  } else {
    opts.push({ value: 'weekly', label: 'Weekly' });
    opts.push({ value: 'custom_weekly', label: 'Custom weekly' });
    opts.push({ value: 'monthly_nth', label: 'Monthly (nth weekday)' });
    opts.push({ value: 'monthly_last', label: 'Monthly (last weekday)' });
  }
  return opts;
}

function getRecurrenceLabel(recurrence: GoogleRecurrence, startDate: string): string {
  return getRecurrenceOptions(startDate).find(o => o.value === recurrence)?.label ?? 'Does not repeat';
}


function PlatformChip({ platform, onRemove }: { platform: Platform; onRemove: () => void }) {
  const icon = platform === 'facebook' ? <FacebookIcon /> : platform === 'instagram' ? <InstagramIcon /> : platform === 'apple' ? <AppleIcon /> : platform === 'google' ? <GoogleIcon /> : <LinkedInIcon />;
  const label = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : platform === 'apple' ? 'Apple' : platform === 'google' ? 'Google' : 'LinkedIn';
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" style={{ backgroundColor: 'var(--s-bg-muted)', borderRadius: 4, padding: '4px 8px', height: 28 }}>
      <div className="shrink-0 size-[16px]">{icon}</div>
      <p className="font-normal leading-[normal] relative shrink-0 text-foreground text-[13px] tracking-[-0.26px] whitespace-nowrap">
        {label}
      </p>
      <button
        onClick={onRemove}
        className="flex items-center justify-center text-muted-foreground hover:text-[#212121] dark:hover:text-[#e4e8f0] ml-[2px]"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" style={{ borderRadius: 8, padding: '3px 8px', height: 26, backgroundColor: '#EAECF0' }}>
      <p className="font-normal leading-[normal] relative shrink-0 text-foreground text-[13px] tracking-[-0.26px] whitespace-nowrap">
        {label}
      </p>
      <button onClick={onRemove} className="flex items-center justify-center" style={{ color: '#555' }}>
        <X size={10} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────
function CustomCheckbox({ checked, onClick }: { checked: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center" type="button">
      {checked ? (
        <div className="w-[18px] h-[18px] rounded-[3px] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: '#1976d2' }}>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : (
        <div className="w-[18px] h-[18px] rounded-[3px] border-[1.5px] border-[#a0a0a0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]"></div>
      )}
    </button>
  );
}

// ─── Radio Button ───────────────────────────────────────────────────────────
function RadioButton({ selected }: { selected: boolean }) {
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 16, height: 16,
        border: selected ? '1.5px solid #1976d2' : '1.5px solid #c4c4c4',
        backgroundColor: 'white',
        transition: 'all 0.1s'
      }}
    >
      {selected && <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: '#1976d2' }} />}
    </div>
  );
}

// ─── Native Date / Time Picker Wrapper ──────────────────────────────────────
const PickCalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
const PickClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

function NativePicker({ type, value, onChange, icon, width = 160, hasError = false, min }: { type: 'date'|'time', value: string, onChange: (v: string) => void, icon: React.ReactNode, width?: number, hasError?: boolean, min?: string }) {
  return (
    <div
      className="relative flex items-center gap-[8px] focus-within:border-[#1976d2] dark:focus-within:border-[#5b9cf6] transition-colors"
      style={{
        border: `1px solid ${hasError ? '#de1b0c' : 'var(--s-border-subtle)'}`, borderRadius: 4,
        padding: '0 10px', height: 34, backgroundColor: 'var(--s-bg-input)', width
      }}
    >
      <div className="shrink-0 flex items-center justify-center text-muted-foreground pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        className="outline-none bg-transparent w-full h-full cursor-pointer relative z-10 full-picker"
        style={{
          fontSize: 13,color: value ? 'var(--s-text-primary)' : '#aaa',
        }}
      />
    </div>
  );
}

// ─── Media Grid Item ──────────────────────────────────────────────────────────
function MediaGridItem({
  item, selected, onToggleSelect, onDelete,
}: {
  item: MediaItem; selected: boolean; onToggleSelect: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative cursor-pointer group rounded-[6px] overflow-hidden"
      style={{ border: selected ? '2px solid #1976d2' : '2px solid transparent', flexShrink: 0, aspectRatio: '1/1', width: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onToggleSelect}
    >
      <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
      
      {/* Subtle scrim when hovered but not selected */}
      {hovered && !selected && (
        <div className="absolute inset-0 bg-black/10 transition-opacity pointer-events-none" />
      )}
      
      {/* Top right actions on hover */}
      {(hovered && !selected) && (
        <div className="absolute top-[6px] right-[6px] flex items-center gap-[4px] z-10 transition-opacity">
          {/* Edit icon */}
          <button 
            className="w-[26px] h-[26px] rounded-[4px] flex items-center justify-center hover:bg-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            onClick={(e) => { e.stopPropagation(); /* TODO Edit file */ }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Delete icon */}
          <button 
            className="w-[26px] h-[26px] rounded-[4px] flex items-center justify-center hover:bg-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={12} className="text-[#de1b0c]" />
          </button>
        </div>
      )}

      {/* Select state indicator (Checkmark overlay) */}
      {(hovered || selected) && (
        <div className="absolute top-[10px] left-[10px] pointer-events-none transition-opacity z-10">
          <CustomCheckbox checked={selected} />
        </div>
      )}
    </div>
  );
}

// ─── Upload Cell ──────────────────────────────────────────────────────────────
function UploadCell({ onFilesAdded, disabled }: { onFilesAdded: (f: File[]) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) onFilesAdded(files);
  }, [disabled, onFilesAdded]);

  return (
    <div
      className="flex flex-col items-center justify-center cursor-pointer transition-colors"
      style={{
        aspectRatio: '1/1', width: '100%', borderRadius: 6, flexShrink: 0,
        border: dragging ? '1.5px solid #1976d2' : '1.5px dashed #c4c4c4',
        backgroundColor: dragging ? '#e8f0fe' : '#fafafa',
      }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
          if (files.length) onFilesAdded(files);
          e.target.value = '';
        }}
      />
      {/* Simple Plus icon */}
      <Plus size={24} className="text-[#555]" strokeWidth={1.5} />
    </div>
  );
}

// ─── Media Section ────────────────────────────────────────────────────────────
function MediaSection({ mediaItems, setMediaItems }: {
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [mediaView, setMediaView] = useState<MediaView>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);

  // Reset pagination when media view changes
  const handleViewChange = (view: MediaView) => {
    setMediaView(view);
    setVisibleCount(GRID_PAGE_SIZE);
  };

  const allSelected = mediaItems.length > 0 && selectedIds.size === mediaItems.length;
  const visibleItems = useMemo(() => mediaItems.slice(0, visibleCount), [mediaItems, visibleCount]);
  const hasMore = visibleCount < mediaItems.length;

  const toggleSelectAll = () => {
    if (!allSelected) {
      setSelectedIds(new Set(mediaItems.map(m => m.id)));
      setVisibleCount(mediaItems.length);
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = () => {
    setMediaItems(prev => prev.filter(m => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
  };

  const handleFilesAdded = (files: File[]) => {
    const newItems: MediaItem[] = files.map(file => ({
      id: `media-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));
    setMediaItems(prev => [...prev, ...newItems]);
  };

  const count = mediaItems.length;
  const label = count === 0 ? 'No attached images' : count === 1 ? '1 attached image' : `${count} attached images`;

  return (
    <div className="border border-border rounded-[8px] overflow-hidden bg-background transition-colors duration-300">
      {/* Section header */}
      <div
        className="w-full flex items-center justify-between px-[16px] py-[12px]"
      >
        <div className="flex items-center gap-[8px]">
          <Camera size={18} className="text-muted-foreground" />
          <p className="font-normal leading-[20px] text-foreground text-[16px] tracking-[-0.32px]" style={{ cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
            {label}
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={e => {
              const f = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
              if (f.length) handleFilesAdded(f);
              e.target.value = '';
            }} 
          />
        </div>
        <div className="flex items-center gap-[8px]">
          {/* Add Media Text Button */}
          {expanded && (
            <label className="cursor-pointer font-medium hover:underline mr-[8px]" style={{ color: 'var(--s-blue)', fontSize: 14,}}>
              Add media
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                const f = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
                if (f.length) handleFilesAdded(f);
                e.target.value = '';
              }} />
            </label>
          )}

          {/* Grid/Table toggle - only when expanded and has items */}
          {expanded && count > 0 && (
            <div
              className="flex items-center gap-[2px] rounded-[4px] p-[2px]"
              style={{ backgroundColor: 'var(--s-bg-muted)' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => handleViewChange('grid')}
                className="p-[4px] rounded-[3px] transition-colors flex items-center justify-center"
                style={{ backgroundColor: mediaView === 'grid' ? 'var(--s-bg-primary)' : 'transparent', color: mediaView === 'grid' ? 'var(--s-blue)' : 'var(--s-text-muted)' }}
                title="Grid view"
              >
                <Grid3X3 size={12} />
              </button>
              <button
                onClick={() => handleViewChange('table')}
                className="p-[4px] rounded-[3px] transition-colors flex items-center justify-center"
                style={{ backgroundColor: mediaView === 'table' ? 'var(--s-bg-primary)' : 'transparent', color: mediaView === 'table' ? 'var(--s-blue)' : 'var(--s-text-muted)' }}
                title="List view"
              >
                <List size={12} />
              </button>
            </div>
          )}
          {expanded ? <button onClick={() => setExpanded(false)}><ChevronUpIcon /></button> : <button onClick={() => setExpanded(true)}><ChevronDownIcon /></button>}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-[16px] py-[16px]" style={{ maxHeight: 500, overflowY: 'auto' }}>
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-[16px] py-[10px] mb-[12px] rounded-[4px]" style={{ backgroundColor: 'var(--s-bg-primary)', border: '1px solid var(--s-blue)', position: 'relative' }}>
              {/* Optional tiny triangle for speech bubble effect */}
              <div style={{ position: 'absolute', bottom: '-5px', left: '20px', width: '9px', height: '9px', backgroundColor: 'var(--s-bg-primary)', borderRight: '1px solid var(--s-blue)', borderBottom: '1px solid var(--s-blue)', transform: 'rotate(45deg)' }} />

              <div className="flex items-center gap-[12px]">
                <CustomCheckbox checked={allSelected} onClick={toggleSelectAll} />
                <span style={{ fontSize: 14, color: 'var(--s-text-primary)',fontWeight: 600 }}>{selectedIds.size} selected</span>
              </div>
              <div className="flex items-center gap-[16px]">
                <button onClick={() => setSelectedIds(new Set())} style={{ color: 'var(--s-blue)', fontSize: 14,fontWeight: 500 }}>
                  Cancel
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[4px] hover:bg-muted transition-colors shadow-sm" style={{ border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg-primary)', color: 'var(--s-text-primary)', fontSize: 13,fontWeight: 500 }}>
                  <Trash2 size={13} className="text-muted-foreground" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Grid View */}
          {mediaView === 'grid' && (
            <div>
              {/* Responsive auto-fill grid that stretches to fill empty space */}
              <div 
                className="grid gap-[12px]"
                style={{ 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' 
                }}
              >
                {/* Upload cell as the first block */}
                <UploadCell onFilesAdded={handleFilesAdded} disabled={false} />
                {visibleItems.map(item => (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
                {count === 0 && (
                  <div className="flex flex-col items-center justify-center py-[24px] w-full gap-[10px]">
                    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
                      <Upload size={18} className="text-[#aaa]" />
                    </div>
                    <p style={{ fontSize: 13, color: '#888',}}>Drag & drop or click to add up to {MAX_MEDIA} images</p>
                    <label className="flex items-center gap-[5px] text-white text-[13px] font-medium px-[12px] py-[6px] rounded-[4px] cursor-pointer transition-colors" style={{ backgroundColor: '#1976d2',}}>
                      <Upload size={12} />
                      Upload images
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')); if (f.length) handleFilesAdded(f); e.target.value = ''; }} />
                    </label>
                  </div>
                )}
              </div>
              {/* Pagination — Load more */}
              {hasMore && (
                <div className="flex items-center justify-start mt-[16px]">
                  <button
                    onClick={() => setVisibleCount(count)}
                    className="flex items-center gap-[6px] hover:bg-muted transition-colors px-[8px] py-[6px] -ml-[8px] rounded-[4px]"
                    style={{ color: 'var(--s-blue)', fontSize: 14,fontWeight: 500 }}
                  >
                    Show all media
                    <ChevronDown size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
              {/* Show less — when all visible and count > page size */}
              {!hasMore && count > GRID_PAGE_SIZE && (
                <div className="flex justify-start mt-[16px]">
                  <button
                    onClick={() => setVisibleCount(GRID_PAGE_SIZE)}
                    className="flex items-center gap-[6px] hover:bg-muted transition-colors px-[8px] py-[6px] -ml-[8px] rounded-[4px]"
                    style={{ color: 'var(--s-blue)', fontSize: 14,fontWeight: 500 }}
                  >
                    Show less media
                    <ChevronDown size={14} strokeWidth={2} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {mediaView === 'table' && (
            <div style={{ border: '1px solid var(--s-border)', borderRadius: 4, overflow: 'hidden' }}>
              {count === 0 ? (
                <div className="flex flex-col items-center justify-center py-[24px] gap-[8px]">
                  <Upload size={18} className="text-[#aaa]" />
                  <p style={{ fontSize: 13, color: '#888',}}>No images added</p>
                  <label className="flex items-center gap-[5px] text-white text-[13px] px-[12px] py-[6px] rounded-[4px] cursor-pointer" style={{ backgroundColor: '#1976d2',}}>
                    <Upload size={12} />
                    Upload images
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')); if (f.length) handleFilesAdded(f); e.target.value = ''; }} />
                  </label>
                </div>
              ) : (
                <>
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--s-bg-secondary)', borderBottom: '1px solid var(--s-border)' }}>
                        <th style={{ width: 36, padding: '7px 12px' }}>
                          <CustomCheckbox checked={allSelected} onClick={toggleSelectAll} />
                        </th>
                        <th style={{ width: 48, padding: '7px 8px', fontSize: 11, color: 'var(--s-text-muted)',fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</th>
                        <th style={{ padding: '7px 8px', fontSize: 11, color: 'var(--s-text-muted)',fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                        <th style={{ width: 80, padding: '7px 8px', fontSize: 11, color: 'var(--s-text-muted)',fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</th>
                        <th style={{ width: 110, padding: '7px 8px', fontSize: 11, color: 'var(--s-text-muted)',fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date added</th>
                        {selectedIds.size === 0 && <th style={{ width: 50, padding: '7px 8px' }}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--s-border)', backgroundColor: selectedIds.has(item.id) ? 'var(--s-blue-bg)' : 'var(--s-bg-primary)' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <CustomCheckbox checked={selectedIds.has(item.id)} onClick={() => toggleSelect(item.id)} />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', backgroundColor: 'var(--s-bg-muted)' }}>
                              <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            </div>
                          </td>
                          <td style={{ padding: '8px', fontSize: 13, color: 'var(--s-text-primary)',maxWidth: 180 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          </td>
                          <td style={{ padding: '8px', fontSize: 12, color: 'var(--s-text-muted)',}}>{item.size}</td>
                          <td style={{ padding: '8px', fontSize: 12, color: 'var(--s-text-muted)',}}>{item.dateAdded}</td>
                          {selectedIds.size === 0 && (
                            <td style={{ padding: '8px' }}>
                              <button onClick={() => handleDelete(item.id)} className="text-[#aaa] hover:text-[#de1b0c] transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Table footer: load more + add images */}
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--s-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {hasMore ? (
                      <button
                        onClick={() => setVisibleCount(count)}
                        className="flex items-center gap-[5px]"
                        style={{ color: 'var(--s-blue)', fontSize: 13,fontWeight: 500 }}
                      >
                        <ChevronDown size={13} strokeWidth={2} />
                        Show all media ({count - visibleCount} remaining)
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#aaa',}}>{count} of {count} images</span>
                    )}
                    <label className="flex items-center gap-[5px] cursor-pointer font-medium" style={{ color: 'var(--s-blue)', fontSize: 13,}}>
                      <Plus size={13} />
                      Add more
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')); if (f.length) handleFilesAdded(f); e.target.value = ''; }} />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Per-platform preview sub-components ──────────────────────────────────────

// ── Shared: "Preview content for [stream]" row ────────────────────────────────
function PreviewContentRow({ contentStream }: { contentStream: string }) {
  const streams = ['Motto mortgage - Holidays', 'Review site', 'Summer campaign 2026', 'Weekly updates'];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(contentStream);
  return (
    <div className="relative flex items-center gap-[4px] px-[14px] py-[8px] text-[12px]">
      <span style={{ color: '#888' }}>Preview content for</span>
      <button type="button" className="inline-flex items-center gap-[2px]" style={{ color: '#1976d2' }} onClick={() => setOpen(v => !v)}>
        <span>{selected}</span>
        <ChevronDown size={11} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute left-[130px] top-full z-20 py-[4px]" style={{ minWidth: 220, marginTop: 2, backgroundColor: 'white', border: '1px solid var(--s-border)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {streams.map(s => (
            <button key={s} type="button" className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px]"
              style={{ color: '#212121' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { setSelected(s); setOpen(false); }}>
              {selected === s && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              {selected !== s && <span style={{ width: 12, display: 'inline-block' }} />}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared: brand logo avatar ─────────────────────────────────────────────────
function BrandAvatar({ size = 38, radius = '50%' }: { size?: number; radius?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#1B3A6B', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.32, letterSpacing: '0.5px' }}>
      MM
    </div>
  );
}

function ProfileAvatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size * 0.36, letterSpacing: '0.3px' }}>
      {initials}
    </div>
  );
}

function FacebookPreview({ content, mediaItems, contentStream }: { content: string; mediaItems: MediaItem[]; contentStream: string }) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = mediaItems.length > 0 ? mediaItems[0].url : 'https://picsum.photos/seed/fb1/800/420';
  const caption = content ? (content.length > 220 ? content.substring(0, 220) + '...' : content) : 'Nothing beats a freshly grilled burger stacked with juicy patties, soft buns, and bold flavors in every bite.';

  return (
    <div className="rounded-[8px] bg-background" style={{ border: '1px solid var(--s-border)' }}>
      {/* Accordion header */}
      <div className="flex items-center justify-between px-[14px] py-[11px] cursor-pointer rounded-t-[8px]" style={{ backgroundColor: 'white' }} onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-[8px]">
          <div className="shrink-0 size-[22px]"><FacebookIcon /></div>
          <span className="text-foreground text-[13px] tracking-[-0.26px]">Facebook</span>
          <span className="text-muted-foreground text-[12px]">3 Pages</span>
        </div>
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>
      {expanded && (
        <div>
          <PreviewContentRow contentStream={contentStream} />
          {/* Post card */}
          <div className="px-[14px] pt-[12px] pb-[14px]">
            <div className="flex items-center gap-[9px] mb-[10px]">
              <BrandAvatar size={38} />
              <div>
                <p className="text-foreground text-[14px] leading-[18px]">Motto Mortgage · Holidays</p>
                <p className="text-muted-foreground text-[12px] leading-[16px]">Just now · 🌐</p>
              </div>
            </div>
            <p className="text-foreground text-[14px] leading-[20px] mb-[10px]">{caption}</p>
          </div>
          <div className="w-full" style={{ backgroundColor: 'var(--s-bg-muted)' }}>
            <img src={imgSrc} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          </div>
          <div className="flex items-center gap-[16px] px-[14px] py-[10px]">
            <button className="flex items-center gap-[5px] text-muted-foreground text-[13px] hover:text-foreground transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              Like
            </button>
            <button className="flex items-center gap-[5px] text-muted-foreground text-[13px] hover:text-foreground transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Comment
            </button>
            <button className="flex items-center gap-[5px] text-muted-foreground text-[13px] hover:text-foreground transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InstagramPreview({ content, mediaItems, contentStream }: { content: string; mediaItems: MediaItem[]; contentStream: string }) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = mediaItems.length > 0 ? mediaItems[0].url : 'https://picsum.photos/seed/ig1/600/600';
  const caption = content ? (content.length > 150 ? content.substring(0, 150) + '...' : content) : 'Nothing beats a freshly grilled burger! Come hungry, eat happy. 😍🔥';

  return (
    <div className="rounded-[8px] bg-background" style={{ border: '1px solid var(--s-border)' }}>
      <div className="flex items-center justify-between px-[14px] py-[11px] cursor-pointer rounded-t-[8px]" style={{ backgroundColor: 'white' }} onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-[8px]">
          <div className="shrink-0 size-[22px]"><InstagramIcon /></div>
          <span className="text-foreground text-[13px] tracking-[-0.26px]">Instagram</span>
          <span className="text-muted-foreground text-[12px]">2 Profiles</span>
        </div>
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>
      {expanded && (
        <div>
          <PreviewContentRow contentStream={contentStream} />
          {/* Business header */}
          <div className="flex items-center justify-between px-[14px] py-[10px]">
            <div className="flex items-center gap-[9px]">
              <BrandAvatar size={32} />
              <span className="text-foreground text-[13px]">motto_mortgage</span>
            </div>
            <span className="text-foreground text-[18px] tracking-[3px] cursor-pointer">···</span>
          </div>
          {/* Square image */}
          <div style={{ backgroundColor: 'var(--s-bg-muted)' }}>
            <img src={imgSrc} alt="" style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} />
          </div>
          {/* Actions + caption */}
          <div className="px-[14px] pt-[10px] pb-[14px]">
            <div className="flex items-center justify-between mb-[8px]">
              <div className="flex items-center gap-[14px]">
                <button className="text-foreground hover:text-muted-foreground transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <button className="text-foreground hover:text-muted-foreground transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button className="text-foreground hover:text-muted-foreground transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
              <button className="text-foreground hover:text-muted-foreground transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            </div>
            <p className="text-foreground text-[13px] leading-[19px]">
              <span >motto_mortgage</span>{' '}{caption}
            </p>
            <p className="text-muted-foreground text-[12px] mt-[4px]">Just now</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedInPreview({ content, mediaItems, contentStream }: { content: string; mediaItems: MediaItem[]; contentStream: string }) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = mediaItems.length > 0 ? mediaItems[0].url : 'https://picsum.photos/seed/li1/800/420';
  const caption = content ? (content.length > 220 ? content.substring(0, 220) + '...' : content) : 'Nothing beats a freshly grilled burger stacked with juicy patties, soft buns, and bold flavors.';

  return (
    <div className="rounded-[8px] bg-background" style={{ border: '1px solid var(--s-border)' }}>
      <div className="flex items-center justify-between px-[14px] py-[11px] cursor-pointer rounded-t-[8px]" style={{ backgroundColor: 'white' }} onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-[8px]">
          <div className="shrink-0 size-[22px]"><LinkedInIcon /></div>
          <span className="text-foreground text-[13px] tracking-[-0.26px]">LinkedIn</span>
          <span className="text-muted-foreground text-[12px]">1 Company</span>
        </div>
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>
      {expanded && (
        <div>
          <PreviewContentRow contentStream={contentStream} />
          <div className="px-[14px] pt-[12px] pb-[10px]">
            <div className="flex items-center gap-[9px] mb-[10px]">
              <BrandAvatar size={44} radius="4px" />
              <div>
                <p className="text-foreground text-[14px] leading-[18px]" >Motto Mortgage</p>
                <p className="text-muted-foreground text-[12px] leading-[16px]">Financial Services · Just now · 🌐</p>
              </div>
            </div>
            <p className="text-foreground text-[14px] leading-[21px] mb-[10px]">{caption}</p>
          </div>
          <div className="w-full" style={{ backgroundColor: 'var(--s-bg-muted)' }}>
            <img src={imgSrc} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          </div>
          <div className="flex items-center gap-[16px] px-[14px] py-[10px]">
            <button className="flex items-center gap-[5px] text-muted-foreground text-[12px] hover:text-foreground transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              Like
            </button>
            <button className="flex items-center gap-[5px] text-muted-foreground text-[12px] hover:text-foreground transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Comment
            </button>
            <button className="flex items-center gap-[5px] text-muted-foreground text-[12px] hover:text-foreground transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Repost
            </button>
            <button className="flex items-center gap-[5px] text-muted-foreground text-[12px] hover:text-foreground transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplePreview({ content, mediaItems, appleHeader, appleButtonType, contentStream }: { content: string; mediaItems: MediaItem[]; appleHeader: string; appleButtonType: AppleButtonType; contentStream: string }) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = mediaItems.length > 0 ? mediaItems[0].url : 'https://picsum.photos/seed/apple1/400/400';
  const bodyText = content ? (content.length > 120 ? content.substring(0, 120) + '...' : content) : 'Happy Labor Day, USA! Celebrating hardworking individuals and their contributions.';

  return (
    <div className="rounded-[8px] bg-background" style={{ border: '1px solid var(--s-border)' }}>
      <div className="flex items-center justify-between px-[14px] py-[11px] cursor-pointer rounded-t-[8px]" style={{ backgroundColor: 'white' }} onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-[8px]">
          <div className="shrink-0 size-[22px] rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#000' }}>
            <div className="size-[13px]"><AppleIcon /></div>
          </div>
          <span className="text-foreground text-[13px] tracking-[-0.26px]">Apple</span>
          <span className="text-muted-foreground text-[12px]">3 listings</span>
        </div>
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>
      {expanded && (
        <div>
          <PreviewContentRow contentStream={contentStream} />
          <div className="p-[12px]">
          <div className="flex rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--s-border-subtle)', minHeight: 150 }}>
            <div className="flex flex-col justify-between p-[14px] flex-1 min-w-0">
              <div>
                <p className="text-foreground text-[15px] leading-[21px] mb-[6px] line-clamp-3" >
                  {appleHeader || 'Add a header to see it here'}
                </p>
                <p className="text-muted-foreground text-[13px] leading-[18px] line-clamp-3">{bodyText}</p>
              </div>
              <button className="mt-[12px] self-start" style={{ backgroundColor: '#efefef', color: 'var(--s-blue)', fontSize: 13, padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'default' }}>
                {appleButtonType || 'Book now'}
              </button>
            </div>
            <div className="shrink-0 w-[130px] rounded-r-[10px] overflow-hidden" style={{ backgroundColor: 'var(--s-bg-muted)', minHeight: 140 }}>
              <img src={imgSrc} alt="" className="w-full h-full object-cover" style={{ display: 'block' }} />
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-platform preview sub-components ──────────────────────────────────────

function GooglePreview({ content, mediaItems, contentStream, googlePublishAs, googleTitle, googleDurationStart, googleDurationEnd, googleCouponCode, googleButtonType, googleIncludeTimes, googleEventStartTime, googleEventEndTime, googleEventButtonType }: {
  content: string; mediaItems: MediaItem[]; contentStream: string; googlePublishAs: GooglePublishAs;
  googleTitle: string; googleDurationStart: string; googleDurationEnd: string;
  googleCouponCode: string; googleButtonType: GoogleButtonType;
  googleIncludeTimes: boolean; googleEventStartTime: string; googleEventEndTime: string;
  googleEventButtonType: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const imgSrc = mediaItems.length > 0 ? mediaItems[0].url : 'https://picsum.photos/seed/google/600/340';
  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, min] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(min).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="rounded-[8px] bg-background" style={{ border: '1px solid var(--s-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-[14px] py-[11px] cursor-pointer rounded-t-[8px]" style={{ backgroundColor: 'white' }} onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-[8px]">
          <div className="shrink-0 size-[22px]"><GoogleIcon /></div>
          <span className="text-foreground text-[13px] tracking-[-0.26px]">Google</span>
          <span className="text-muted-foreground text-[12px]">1 Page</span>
        </div>
        {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>

      {expanded && (
        <div>
          <PreviewContentRow contentStream={contentStream} />
          {/* Business name row */}
          <div className="flex items-center gap-[10px] px-[14px] py-[12px]">
            <BrandAvatar size={32} />
            <p className="text-foreground text-[14px] tracking-[-0.28px]">Motto Mortgage · Holidays</p>
          </div>
          {/* Full-width image */}
          <div className="w-full" style={{ backgroundColor: 'var(--s-bg-muted)' }}>
            <img src={imgSrc} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          </div>
          {/* Content area */}
          <div className="px-[14px] py-[12px]">
            {(googlePublishAs === 'offers' || googlePublishAs === 'events') && googleTitle && (
              <p className="text-foreground text-[15px] leading-[20px] mb-[4px]">{googleTitle}</p>
            )}
            {(googlePublishAs === 'offers' || googlePublishAs === 'events') && (googleDurationStart || googleDurationEnd) && (
              <div className="mb-[6px]">
                {googleDurationStart && (
                  <p className="text-foreground text-[13px] leading-[18px]">
                    {formatDate(googleDurationStart)}{googleIncludeTimes && googleEventStartTime ? `, ${formatTime(googleEventStartTime)}` : ''}
                  </p>
                )}
                {googleDurationEnd && (
                  <p className="text-muted-foreground text-[12px] leading-[17px]">
                    Ends {formatDate(googleDurationEnd)}{googleIncludeTimes && googleEventEndTime ? `, ${formatTime(googleEventEndTime)}` : ''}
                  </p>
                )}
              </div>
            )}
            <p className="text-muted-foreground text-[13px] leading-[19px] mb-[10px] line-clamp-3">
              {content || 'Save big this season! Exclusive deals and limited-time offers just for you.'}
            </p>
            {googlePublishAs === 'offers' && googleCouponCode && (
              <div className="rounded-[6px] mb-[10px] py-[12px] px-[14px] text-center" style={{ border: '1.5px dashed var(--s-border)' }}>
                <p className="text-muted-foreground text-[12px] mb-[6px]">Show this code at the shop</p>
                <p className="text-foreground text-[18px] tracking-[2px] mb-[4px]">{googleCouponCode}</p>
                {(googleDurationStart || googleDurationEnd) && (
                  <p className="text-muted-foreground text-[12px]">Valid {formatDate(googleDurationStart)} - {formatDate(googleDurationEnd)}</p>
                )}
              </div>
            )}
            {(googlePublishAs !== 'events' || googleEventButtonType !== 'None') && (
              <p className="text-[13px] tracking-[0.5px]" style={{ color: 'var(--s-blue)' }}>
                {googlePublishAs === 'updates'
                  ? googleButtonType.toUpperCase()
                  : googlePublishAs === 'events'
                    ? googleEventButtonType.toUpperCase()
                    : 'VIEW OFFER'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Panel ─────────────────────────────────────────────────────────────
function PreviewPanel({ content, mediaItems, activeTab, appleHeader, appleButtonType, selectedPlatforms, contentStream,
  googlePublishAs, googleTitle, googleDurationStart, googleDurationEnd, googleCouponCode, googleButtonType,
  googleIncludeTimes, googleEventStartTime, googleEventEndTime, googleEventButtonType }: {
  content: string;
  mediaItems: MediaItem[];
  activeTab: TabKey;
  appleHeader: string;
  appleButtonType: AppleButtonType;
  selectedPlatforms: Platform[];
  contentStream: string;
  googlePublishAs: GooglePublishAs;
  googleTitle: string;
  googleDurationStart: string;
  googleDurationEnd: string;
  googleCouponCode: string;
  googleButtonType: GoogleButtonType;
  googleIncludeTimes: boolean;
  googleEventStartTime: string;
  googleEventEndTime: string;
  googleEventButtonType: string;
}) {
  const showAll = activeTab === 'initial';

  const showFacebook  = showAll ? selectedPlatforms.includes('facebook')  : activeTab === 'facebook';
  const showInstagram = showAll ? selectedPlatforms.includes('instagram') : activeTab === 'instagram';
  const showLinkedIn  = showAll ? selectedPlatforms.includes('linkedin')  : activeTab === 'linkedin';
  const showApple     = showAll ? selectedPlatforms.includes('apple')     : activeTab === 'apple';
  const showGoogle    = showAll ? selectedPlatforms.includes('google')    : activeTab === 'google';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-[20px] pt-[20px] pb-[12px]">
        <div className="flex items-center gap-[6px] mb-[8px]">
          <p className="font-normal leading-[24px] text-foreground text-[16px] tracking-[-0.32px]">
            Preview
          </p>
        </div>
        <div className="flex items-start gap-[6px]">
          <div className="shrink-0 mt-[2px]"><InfoIcon /></div>
          <p className="font-normal leading-[18px] text-muted-foreground text-[12px] tracking-[-0.24px]">
            Preview approximates how your content will display when published. Tests and updates by social networks may affect the final appearance.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[20px] pb-[20px] flex flex-col gap-[12px]">
        {showFacebook  && <FacebookPreview  content={content} mediaItems={mediaItems} contentStream={contentStream} />}
        {showInstagram && <InstagramPreview content={content} mediaItems={mediaItems} contentStream={contentStream} />}
        {showLinkedIn  && <LinkedInPreview  content={content} mediaItems={mediaItems} contentStream={contentStream} />}
        {showApple     && <ApplePreview     content={content} mediaItems={mediaItems} appleHeader={appleHeader} appleButtonType={appleButtonType} contentStream={contentStream} />}
        {showGoogle    && <GooglePreview    content={content} mediaItems={mediaItems} contentStream={contentStream} googlePublishAs={googlePublishAs} googleTitle={googleTitle} googleDurationStart={googleDurationStart} googleDurationEnd={googleDurationEnd} googleCouponCode={googleCouponCode} googleButtonType={googleButtonType} googleIncludeTimes={googleIncludeTimes} googleEventStartTime={googleEventStartTime} googleEventEndTime={googleEventEndTime} googleEventButtonType={googleEventButtonType} />}
        {!showFacebook && !showInstagram && !showLinkedIn && !showApple && !showGoogle && (
          <p className="text-[13px] text-muted-foreground text-center mt-[20px]">No preview available for this tab.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface CreatePostViewProps {
  onBack: () => void;
  onPublish?: (mode: 'publish' | 'schedule' | 'draft', expiryDate?: string) => void;
}

export function CreatePostView({ onBack, onPublish }: CreatePostViewProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook', 'instagram', 'linkedin', 'apple', 'google']);
  const [activeTab, setActiveTab] = useState<TabKey>('initial');
  const [postContent, setPostContent] = useState(
    'Nothing beats a freshly grilled burger stacked with juicy patties, soft buns, and bold flavors in every bite. At our shop, we keep it simple—real ingredients, perfect grills, and burgers made to satisfy serious cravings. From the first bite to the last crumb, it\'s comfort, indulgence, and happiness all wrapped in one burger. Come hungry, eat happy, and leave planning your next visit. 😍🔥'
  );
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(DEMO_MEDIA);
  const [tags, setTags] = useState([
    { id: 't1', label: 'Photography' },
    { id: 't2', label: 'USA day' },
    { id: 't3', label: 'Warriors day' },
    { id: 't4', label: 'Independence day' },
  ]);
  const [selectedApproval, setSelectedApproval] = useState('');
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  // ── Apple post settings ──
  const [appleHeader, setAppleHeader]               = useState('The new wave of customer support journey');
  const [appleButtonType, setAppleButtonType]       = useState<AppleButtonType>('Book now');
  const [appleButtonLink, setAppleButtonLink]       = useState('');
  const [appleButtonTypeOpen, setAppleButtonTypeOpen] = useState(false);
  const [appleSettingsExpanded, setAppleSettingsExpanded] = useState(true);
  const [appleDurationStart, setAppleDurationStart] = useState('2023-09-08');
  const [appleDurationEnd, setAppleDurationEnd]     = useState('2023-09-15');

  // ── Google post settings ──
  const [googlePublishAs, setGooglePublishAs]         = useState<GooglePublishAs>('updates');
  const [googleButtonType, setGoogleButtonType]       = useState<GoogleButtonType>('Learn more');
  const [googleButtonTypeOpen, setGoogleButtonTypeOpen] = useState(false);
  const [googleButtonLink, setGoogleButtonLink]       = useState('');
  const [googleTitle, setGoogleTitle]                 = useState('');
  const [googleDurationStart, setGoogleDurationStart] = useState('');
  const [googleDurationEnd, setGoogleDurationEnd]     = useState('');
  const [googleCouponCode, setGoogleCouponCode]       = useState('');
  const [googleLink, setGoogleLink]                   = useState('');
  const [googleTerms, setGoogleTerms]                 = useState('');
  const [googleSettingsExpanded, setGoogleSettingsExpanded] = useState(true);
  const [googleIncludeTimes, setGoogleIncludeTimes]   = useState(false);
  const [googleEventStartTime, setGoogleEventStartTime] = useState('09:00');
  const [googleEventEndTime, setGoogleEventEndTime]   = useState('18:00');
  const [googleEventButtonType, setGoogleEventButtonType] = useState('None');
  const [googleEventButtonTypeOpen, setGoogleEventButtonTypeOpen] = useState(false);
  const [googleEventButtonLink, setGoogleEventButtonLink] = useState('');
  const [googleEventRecurrence, setGoogleEventRecurrence] = useState<GoogleRecurrence>('none');
  const [googleEventRecurrenceOpen, setGoogleEventRecurrenceOpen] = useState(false);
  const [googleEventRecurrenceEndDate, setGoogleEventRecurrenceEndDate] = useState('');
  const [googleEventRecurrenceCustomDays, setGoogleEventRecurrenceCustomDays] = useState<number[]>([]);

  // ── Instagram post settings ──
  const [instagramPublishAs, setInstagramPublishAs] = useState<InstagramPublishAs>('post');
  const [instagramFirstComment, setInstagramFirstComment] = useState('');
  const [instagramCollaborators, setInstagramCollaborators] = useState<string[]>([]);
  const [instagramCollaboratorInput, setInstagramCollaboratorInput] = useState('');
  const [instagramCollaboratorDropdownOpen, setInstagramCollaboratorDropdownOpen] = useState(false);
  const [instagramSettingsExpanded, setInstagramSettingsExpanded] = useState(true);

  // ── Channel selector dropdown ──────────────────────────────────────────────
  const channelSelectorRef = useRef<HTMLDivElement>(null);
  const channelPanelRef    = useRef<HTMLDivElement>(null);
  const [channelSelectorOpen, setChannelSelectorOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [channelSelectorTab, setChannelSelectorTab] = useState<'locations' | 'content-streams' | 'brand-identity'>('locations');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [locationFilterOpen, setLocationFilterOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(DEMO_LOCATIONS.map(l => l.id));
  const [activeChannelTab, setActiveChannelTab] = useState<Platform>('facebook');
  const [selectedPagesByPlatform, setSelectedPagesByPlatform] = useState<Record<Platform, string[]>>({
    facebook:  DEMO_LOCATIONS.map(l => l.id),
    instagram: DEMO_LOCATIONS.slice(0, 2).map(l => l.id),
    google:    DEMO_LOCATIONS.map(l => l.id),
    linkedin:  DEMO_LOCATIONS.map(l => l.id),
    apple:     DEMO_LOCATIONS.map(l => l.id),
  });
  const [contentStream, setContentStream] = useState('Motto mortgage - Holidays');
  const [contentStreamDropOpen, setContentStreamDropOpen] = useState(false);
  const [csChannels, setCsChannels] = useState<Platform[]>(['facebook', 'instagram', 'linkedin']);
  const [csChannelsOpen, setCsChannelsOpen] = useState(false);
  const [brandIdentityFilter, setBrandIdentityFilter] = useState('Brand identity 2');
  const [brandIdentityFilterOpen, setBrandIdentityFilterOpen] = useState(false);

  const platformPageLabel: Record<Platform, string> = {
    facebook: 'pages', instagram: 'profiles', google: 'profiles',
    linkedin: 'pages', apple: 'listings',
  };

  const [addToLibrary, setAddToLibrary] = useState(true);
  const [draftCalendarEnabled, setDraftCalendarEnabled] = useState(false);
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  
  // Per-channel schedule state
  const [channelSchedules, setChannelSchedules] = useState<Record<Platform, { date: string; time: string }>>({
    facebook: { date: '', time: '10:00' },
    instagram: { date: '', time: '10:00' },
    linkedin: { date: '', time: '10:00' },
    apple:    { date: '', time: '10:00' },
    google:   { date: '', time: '10:00' },
  });

  // ── Post Timing ──
  type PublishMode = 'now' | 'scheduled' | 'draft';
  type ScheduleMode = 'global' | 'per-channel';
  const [publishMode, setPublishMode]   = useState<PublishMode>('scheduled');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('global');
  const [scheduleDate, setScheduleDate] = useState('2026-04-20');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [expiryDate, setExpiryDate]       = useState('');
  const [expiryTime, setExpiryTime]       = useState('10:00');

  // Derived publish ISOs
  const allPublishISOs = publishMode === 'now'
    ? [new Date().toISOString().slice(0, 16)]
    : scheduleMode === 'global'
      ? (scheduleDate ? [`${scheduleDate}T${scheduleTime}`] : [])
      : selectedPlatforms.map(p => {
          const cs = channelSchedules[p];
          return cs && cs.date ? `${cs.date}T${cs.time}` : '';
        }).filter(Boolean);

  const latestPublishISO = allPublishISOs.length ? allPublishISOs.reduce((max, iso) => iso > max ? iso : max, "") : "";
  const earliestPublishISO = allPublishISOs.length ? allPublishISOs.reduce((min, iso) => iso < min ? iso : min, allPublishISOs[0]) : "";

  // For the timeline visualization
  const timelinePublishISO = earliestPublishISO;

  const expiryISO = expiryEnabled && expiryDate ? `${expiryDate}T${expiryTime}` : '';

  // Validation: Expiry must be after ALL publish dates. 
  const expiryBeforePublish  = !!(expiryISO && latestPublishISO && expiryISO <= latestPublishISO);
  const expiryEqualsPublish  = !!(expiryISO && latestPublishISO && expiryISO === latestPublishISO);
  const expiryInPast = publishMode === 'now' && !!(expiryISO && expiryISO < new Date().toISOString().slice(0, 16));
  const timingValid = !expiryBeforePublish && !expiryInPast;

  // Smart default: when enabling expiry, auto-fill latestPublishISO + 24h
  const handleToggleExpiry = (enabled: boolean) => {
    setExpiryEnabled(enabled);
    if (enabled && latestPublishISO) {
      const base = new Date(latestPublishISO);
      base.setHours(base.getHours() + 24);
      const d = base.toISOString().slice(0, 10);
      const t = base.toISOString().slice(11, 16);
      setExpiryDate(d);
      setExpiryTime(t);
    }
  };

  // Format display helpers
  const fmtDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Handle schedule mode switch
  const handleScheduleMode = (mode: ScheduleMode) => {
    if (mode === 'per-channel') {
      const newSchedules = { ...channelSchedules };
      for (const p of selectedPlatforms) {
        newSchedules[p] = { date: scheduleDate, time: scheduleTime };
      }
      setChannelSchedules(newSchedules);
    }
    setScheduleMode(mode);
  };

  const updateChannelSchedule = (platform: Platform, field: 'date' | 'time', value: string) => {
    setChannelSchedules(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
    }));
  };

  // Handle publish mode switch
  const handlePublishMode = (mode: PublishMode) => {
    setPublishMode(mode);
    setDraftCalendarEnabled(false);
    if (mode === 'draft') {
      setExpiryEnabled(false);
    } else if (expiryEnabled) {
      handleToggleExpiry(true);
    }
  };

  const maxChars = 2200;
  const charsLeft = maxChars - postContent.length;

  const removePlatform = (p: Platform) => {
    setSelectedPlatforms(prev => prev.filter(x => x !== p));
    if (activeTab === p) setActiveTab('initial');
  };

  // Click-outside: close channel selector panel (portal panel is outside the ref, so check both)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const inTrigger = channelSelectorRef.current?.contains(e.target as Node);
      const inPanel   = channelPanelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) {
        setChannelSelectorOpen(false);
        setLocationFilterOpen(false);
        setContentStreamDropOpen(false);
        setCsChannelsOpen(false);
        setBrandIdentityFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredLocations = useMemo(() =>
    DEMO_LOCATIONS.filter(l =>
      !locationSearch ||
      l.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      l.handle.toLowerCase().includes(locationSearch.toLowerCase()) ||
      l.city.toLowerCase().includes(locationSearch.toLowerCase())
    ), [locationSearch]
  );

  // Updates page selections for a platform and syncs selectedPlatforms
  const updatePlatformPages = useCallback((platform: Platform, ids: string[]) => {
    setSelectedPagesByPlatform(prev => {
      const next = { ...prev, [platform]: ids };
      const active = (Object.entries(next) as [Platform, string[]][])
        .filter(([, v]) => v.length > 0)
        .map(([p]) => p);
      setSelectedPlatforms(active);
      return next;
    });
  }, []);

  const APPROVAL_OPTIONS = ['Standard Review', 'Manager Approval', 'Legal Review', 'Executive Sign-off'];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'initial', label: 'Initial content' },
    ...selectedPlatforms.map(p => ({
      key: p,
      label: p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : p === 'apple' ? 'Apple' : p === 'google' ? 'Google' : 'LinkedIn',
    })),
  ];

  const schedulePickers = (
    <div className="flex flex-col gap-[12px]">
      {/* Segmented switcher — pill style */}
      <div className="inline-flex p-[3px]" style={{ backgroundColor: 'var(--s-border)', borderRadius: 8, alignSelf: 'flex-start' }}>
        <button
          onClick={() => handleScheduleMode('global')}
          className="transition-all"
          style={{
            padding: '4px 12px', fontSize: 12,backgroundColor: scheduleMode === 'global' ? 'var(--s-bg-primary)' : 'transparent',
            color: scheduleMode === 'global' ? 'var(--s-text-primary)' : 'var(--s-text-muted)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontWeight: scheduleMode === 'global' ? 500 : 400,
            boxShadow: scheduleMode === 'global' ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          Same time for all
        </button>
        <button
          onClick={() => handleScheduleMode('per-channel')}
          className="transition-all"
          style={{
            padding: '4px 12px', fontSize: 12,backgroundColor: scheduleMode === 'per-channel' ? 'var(--s-bg-primary)' : 'transparent',
            color: scheduleMode === 'per-channel' ? 'var(--s-text-primary)' : 'var(--s-text-muted)',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontWeight: scheduleMode === 'per-channel' ? 500 : 400,
            boxShadow: scheduleMode === 'per-channel' ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          Different per channel
        </button>
      </div>

      {/* Same time for all — date + time pickers */}
      {scheduleMode === 'global' && (
        <div className="flex items-center gap-[10px]">
          <NativePicker type="date" value={scheduleDate} onChange={setScheduleDate} icon={<PickCalendarIcon />} width={160} />
          <NativePicker type="time" value={scheduleTime} onChange={setScheduleTime} icon={<PickClockIcon />} width={120} />
          <p className="text-[11px] text-[#aaa] shrink-0">Your local time</p>
        </div>
      )}

      {/* Different per channel — one row per platform */}
      {scheduleMode === 'per-channel' && (
        <div className="flex flex-col gap-[8px]">
          {selectedPlatforms.map(platform => {
            const cs = channelSchedules[platform] || { date: '', time: '10:00' };
            const label = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : platform === 'apple' ? 'Apple' : platform === 'google' ? 'Google' : 'LinkedIn';
            return (
              <div key={platform} className="flex items-center gap-[10px]">
                <div className="shrink-0" style={{ width: 18, height: 18 }}>
                  {platform === 'facebook' ? <FacebookIcon /> : platform === 'instagram' ? <InstagramIcon /> : <LinkedInIcon />}
                </div>
                <span className="text-[12px] text-muted-foreground shrink-0" style={{ minWidth: 64 }}>{label}</span>
                <NativePicker type="date" value={cs.date} onChange={v => updateChannelSchedule(platform, 'date', v)} icon={<PickCalendarIcon />} width={150} />
                <NativePicker type="time" value={cs.time} onChange={v => updateChannelSchedule(platform, 'time', v)} icon={<PickClockIcon />} width={110} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col relative transition-colors duration-300" style={{ height: '100%', overflow: 'hidden' }}>
      <style>{`
        .full-picker::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        input[type="time"]::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>

      {/* ── Header — matches frontdesk/content hub pages ── */}
      <div className="flex items-center justify-between shrink-0 bg-surface px-2xl py-xl">
        {/* Left: back arrow + title */}
        <div className="flex items-center gap-sm">
          <button
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={1.6} />
          </button>
          <p className="text-h3 text-text-primary whitespace-nowrap">Create post</p>
        </div>

        {/* Right: add to library + schedule */}
        <div className="flex items-center gap-lg">
          <label className="flex items-center gap-xs cursor-pointer">
            <div
              className="flex items-center justify-center rounded-[3px] shrink-0"
              style={{
                width: 16, height: 16,
                backgroundColor: addToLibrary ? '#1976d2' : 'white',
                border: addToLibrary ? '1px solid #1976d2' : '1px solid #c4c4c4',
              }}
              onClick={() => setAddToLibrary(v => !v)}
            >
              {addToLibrary && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p className="text-body text-text-primary whitespace-nowrap">Add to post library</p>
            <InfoIcon />
          </label>

          <button
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            onClick={() => setTimingModalOpen(true)}
          >
            Schedule post
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1" style={{ overflow: 'hidden' }}>

        {/* ── Left Form Panel ── */}
        <div className="overflow-y-auto bg-background" style={{ flex: '0 0 calc(62% - 100px)', minWidth: 0 }}>
          <div style={{ padding: '20px 30px' }} className="flex flex-col gap-[16px]">

            {/* ── Post Content ── */}
            <div>
              <div className="flex flex-col gap-[12px]">
                {/* ── Channel selector ───────────────────────────────── */}
                <div ref={channelSelectorRef} className="relative mb-[12px]">
                  {/* Trigger bar */}
                  <div
                    className="flex items-center gap-[8px] flex-wrap cursor-pointer select-none"
                    style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '6px 12px', minHeight: 40 }}
                    onClick={() => {
                      if (!channelSelectorOpen && channelSelectorRef.current) {
                        const r = channelSelectorRef.current.getBoundingClientRect();
                        // Align top of dropdown with top of trigger so it covers/replaces it
                        setDropdownRect({ top: r.top, left: r.left, width: r.width });
                      }
                      setChannelSelectorOpen(v => !v);
                    }}
                  >
                    {selectedPlatforms.length === 0 ? (
                      <span className="text-[13px]" style={{ color: 'var(--s-text-muted)' }}>Select channels</span>
                    ) : (
                      selectedPlatforms.map(p => {
                        const count = selectedPagesByPlatform[p]?.length ?? 0;
                        const label = platformPageLabel[p]; // e.g. "pages" or "profiles"
                        return (
                          <div key={p} className="flex items-center gap-[6px] shrink-0"
                            style={{ backgroundColor: '#f4f4f5', borderRadius: 8, padding: '4px 10px 4px 8px', height: 32 }}>
                            <div className="shrink-0" style={{ width: 18, height: 18 }}>
                              {p === 'facebook' ? <FacebookIcon /> : p === 'instagram' ? <InstagramIcon /> : p === 'linkedin' ? <LinkedInIcon /> : p === 'google' ? <GoogleIcon /> : <AppleIcon />}
                            </div>
                            <span className="text-[13px]" style={{ color: '#212121' }}>{count} {label}</span>
                            <button onClick={e => { e.stopPropagation(); removePlatform(p); updatePlatformPages(p, []); }}
                              className="flex items-center justify-center ml-[2px]">
                              <X size={12} strokeWidth={2} style={{ color: '#888' }} />
                            </button>
                          </div>
                        );
                      })
                    )}
                    <div className="ml-auto" onClick={e => e.stopPropagation()}>
                      {channelSelectorOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    </div>
                  </div>
                </div>

                {/* ── Channel selector floating panel (portal) ────────── */}
                {channelSelectorOpen && dropdownRect && createPortal(
                  <div
                    ref={channelPanelRef}
                    style={{
                      position: 'fixed',
                      top: dropdownRect.top,
                      left: dropdownRect.left,
                      width: dropdownRect.width,
                      zIndex: 9999,
                      backgroundColor: 'white',
                      border: '1px solid var(--s-border)',
                      borderRadius: 8,
                      boxShadow: '0px 10px 24px 0px rgba(33,33,33,0.2)',
                      maxHeight: 'calc(100vh - 120px)',
                      overflowY: 'auto',
                    }}
                  >
                    {/* Outer 20px padding — wraps tabs + content */}
                    <div style={{ padding: 20 }}>

                    {/* Tab bar — shared Tabs component, no bottom border */}
                    <div style={{ marginBottom: 16 }}>
                      <Tabs
                        tabs={[
                          { id: 'locations',       label: 'Locations' },
                          { id: 'content-streams', label: 'Content streams' },
                          { id: 'brand-identity',  label: 'Brand identity' },
                        ]}
                        activeTab={channelSelectorTab}
                        onChange={(id) => setChannelSelectorTab(id as typeof channelSelectorTab)}
                      />
                    </div>

                    {/* ── Locations / Brand identity tab content ── */}
                    {(channelSelectorTab === 'locations' || channelSelectorTab === 'brand-identity') && (() => {
                      const isBI = channelSelectorTab === 'brand-identity';
                      const filter      = isBI ? brandIdentityFilter      : locationFilter;
                      const filterOpen  = isBI ? brandIdentityFilterOpen  : locationFilterOpen;
                      const setFilter   = isBI
                        ? (v: string) => setBrandIdentityFilter(v)
                        : (v: string) => setLocationFilter(v);
                      const setFOpen    = isBI
                        ? (v: boolean) => setBrandIdentityFilterOpen(v)
                        : (v: boolean) => setLocationFilterOpen(v);
                      const filterOpts  = isBI
                        ? ['Brand identity 1', 'Brand identity 2', 'Brand identity 3']
                        : ['All locations', 'Location group 1', 'Location group 2'];

                      // Per-platform tab selection model
                      const currentPagesForTab = selectedPagesByPlatform[activeChannelTab] ?? [];
                      const allIds = filteredLocations.map(l => l.id);
                      const selCount = allIds.filter(id => currentPagesForTab.includes(id)).length;
                      const allSel = selCount === allIds.length && allIds.length > 0;
                      const indeterminate = selCount > 0 && !allSel;

                      const platformLabel: Record<Platform, string> = {
                        facebook: 'Facebook', instagram: 'Instagram', google: 'Google',
                        linkedin: 'LinkedIn', apple: 'Apple',
                      };
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                          {/* ── Channel tab row: icons act as tabs ── */}
                          <div className="flex items-center gap-[8px]">
                            <div className="flex items-center gap-[8px] flex-1">
                              {(['facebook', 'instagram', 'google', 'linkedin', 'apple'] as Platform[]).map(p => {
                                const isActive = activeChannelTab === p;
                                const hasPages = (selectedPagesByPlatform[p] ?? []).length > 0;
                                return (
                                  <button key={p} type="button"
                                    className="relative shrink-0 flex items-center justify-center"
                                    title={`${platformLabel[p]} ${platformPageLabel[p]}`}
                                    style={{
                                      width: 36, height: 36, borderRadius: '50%',
                                      border: isActive ? '2.5px solid #1976d2' : '1.5px solid #d9d9d9',
                                      padding: 0, background: 'none', cursor: 'pointer',
                                      transition: 'border-color 0.12s',
                                    }}
                                    onClick={() => setActiveChannelTab(p)}
                                  >
                                    {/* Filled platform icon — 20px fixed then scaled up to fill 36px circle */}
                                    <div style={{ width: 20, height: 20, flexShrink: 0, transform: 'scale(1.55)', transformOrigin: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
                                      {p === 'facebook' ? <FacebookIcon /> : p === 'instagram' ? <InstagramIcon /> : p === 'linkedin' ? <LinkedInIcon /> : (
                                        // GoogleIcon / AppleIcon are bare SVGs — constrain them explicitly
                                        <svg viewBox={p === 'apple' ? '0 0 814 1000' : '0 0 24 24'} style={{ width: 20, height: 20 }}
                                          fill={p === 'apple' ? 'currentColor' : 'none'}>
                                          {p === 'google' ? <>
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                          </> : <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-43.4-154.4-112.7C47.5 751 0 641 0 549.7c0-158 103.8-241.5 205.5-241.5 52.8 0 97.3 32.5 131.2 32.5 31.2 0 80.9-35.3 143.7-35.3 22.8 0 108.2 2.6 167.9 79.3zm-74.9-211.3c31.9-37.9 54.3-90.8 54.3-143.7 0-7.7-.6-15.5-1.9-23.2C713.4 14.5 618.7 67.9 564.9 131.4c-29.5 33.8-56.6 86.1-56.6 138.9 0 8.3.6 16.6 2.6 24.3 4.5.6 9 1.3 13.5 1.3 40.5 0 123.6-49.5 159.8-116.1z" fill="currentColor" />}
                                        </svg>
                                      )}
                                    </div>
                                    {/* ✓ badge = pages selected for this platform */}
                                    {hasPages && (
                                      <div className="absolute flex items-center justify-center rounded-full"
                                        style={{ width: 13, height: 13, top: -1, right: -1, backgroundColor: '#1976d2', border: '1.5px solid white' }}>
                                        <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                                          <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <button type="button" onClick={() => setChannelSelectorOpen(false)}
                              style={{ color: '#888', flexShrink: 0 }}>
                              <ChevronDown size={16} strokeWidth={1.8} style={{ transform: 'rotate(180deg)' }} />
                            </button>
                          </div>

                          {/* Current tab label */}
                          <div className="text-[12px]" style={{ color: '#555' }}>
                            Showing <span style={{ color: '#1976d2' }}>{platformLabel[activeChannelTab]}</span> {platformPageLabel[activeChannelTab]} · Filter by{' '}
                            <span className="relative inline-block">
                              <button type="button" className="inline-flex items-center gap-[2px]" style={{ color: '#1976d2' }}
                                onClick={() => setFOpen(!filterOpen)}>
                                {filter} <ChevronDown size={11} strokeWidth={2} />
                              </button>
                              {filterOpen && (
                                <div className="absolute left-0 top-full z-10 rounded-[4px] py-[4px]"
                                  style={{ minWidth: 180, marginTop: 2, backgroundColor: 'white', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                  {filterOpts.map(opt => (
                                    <button key={opt} type="button"
                                      className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left text-[13px]"
                                      style={{ color: '#212121' }}
                                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      onClick={() => { setFilter(opt); setFOpen(false); }}>
                                      {filter === opt
                                        ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        : <span style={{ width: 12, display: 'inline-block' }} />}
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </span>
                          </div>

                          {/* Search bar */}
                          <div className="flex items-center" style={{ border: '1px solid #eaeaea', borderRadius: 4, height: 36 }}>
                            <div className="flex items-center gap-[6px] flex-1 px-[10px]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8f8f8f" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                              </svg>
                              <input type="text" placeholder={`Search ${platformPageLabel[activeChannelTab]}`}
                                value={locationSearch}
                                onChange={e => setLocationSearch(e.target.value)}
                                className="flex-1 outline-none bg-transparent text-[13px]"
                                style={{ color: '#212121' }} />
                            </div>
                          </div>

                          {/* Select all row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 18, height: 18, flexShrink: 0 }} onClick={() => {
                                const newIds = allSel ? [] : filteredLocations.map(l => l.id);
                                updatePlatformPages(activeChannelTab, newIds);
                              }}>
                                {indeterminate ? (
                                  <div style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 10, height: 2, backgroundColor: 'white', borderRadius: 99 }} />
                                  </div>
                                ) : <CustomCheckbox checked={allSel} />}
                              </div>
                              <span style={{ fontSize: 14, color: '#212121' }}>Select all</span>
                            </div>
                            <span style={{ fontSize: 14, color: '#555' }}>
                              {currentPagesForTab.length} {platformPageLabel[activeChannelTab]} selected
                            </span>
                          </div>

                          {/* Page/profile list for active channel tab */}
                          <div className="flex flex-col">
                            {filteredLocations.map(loc => {
                              const checked = currentPagesForTab.includes(loc.id);
                              const toggle = () => {
                                const newIds = checked
                                  ? currentPagesForTab.filter(id => id !== loc.id)
                                  : [...currentPagesForTab, loc.id];
                                updatePlatformPages(activeChannelTab, newIds);
                              };
                              return (
                                <div key={loc.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderRadius: 4, cursor: 'pointer' }}
                                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  onClick={toggle}>
                                  <div style={{ width: 18, height: 18, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <CustomCheckbox checked={checked} onClick={toggle} />
                                  </div>
                                  <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-white text-[11px] shrink-0"
                                    style={{ backgroundColor: loc.color }}>
                                    {loc.initials}
                                  </div>
                                  <div className="flex flex-col gap-[2px]">
                                    <span className="text-[14px]" style={{ color: '#212121' }}>{loc.name}</span>
                                    <span className="text-[12px]" style={{ color: '#8f8f8f' }}>{loc.handle} · {loc.city}</span>
                                  </div>
                                </div>
                              );
                            })}
                            {filteredLocations.length === 0 && (
                              <div className="py-[24px] text-center text-[13px]" style={{ color: '#8f8f8f' }}>No results found</div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Content streams tab ── */}
                    {channelSelectorTab === 'content-streams' && (
                      <div className="flex flex-col gap-[16px]">
                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[13px]" style={{ color: '#555' }}>Select content stream</label>
                          <div className="relative">
                            <button type="button"
                              className="w-full flex items-center justify-between outline-none"
                              style={{ border: '1px solid #eaeaea', borderRadius: 4, padding: '8px 12px', fontSize: 14, color: '#212121', backgroundColor: 'white' }}
                              onClick={() => setContentStreamDropOpen(v => !v)}>
                              <span>{contentStream || 'Select content stream'}</span>
                              <ChevronDown size={14} strokeWidth={1.6} style={{ color: '#555' }} />
                            </button>
                            {contentStreamDropOpen && (
                              <div className="absolute left-0 right-0 top-full z-10 py-[4px]"
                                style={{ marginTop: 2, backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {DEMO_CONTENT_STREAMS.map(cs => (
                                  <button key={cs} type="button"
                                    className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left"
                                    style={{ fontSize: 14, color: '#212121' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    onClick={() => { setContentStream(cs); setContentStreamDropOpen(false); }}>
                                    {contentStream === cs
                                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      : <span style={{ width: 12, display: 'inline-block' }} />}
                                    {cs}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[13px]" style={{ color: '#555' }}>Select channels</label>
                          <div className="relative">
                            <div className="flex items-center gap-[6px] flex-wrap cursor-pointer"
                              style={{ border: '1px solid #eaeaea', borderRadius: 4, padding: '6px 10px', minHeight: 40 }}
                              onClick={() => setCsChannelsOpen(v => !v)}>
                              {csChannels.length === 0 && <span className="text-[13px]" style={{ color: '#8f8f8f' }}>Select channels</span>}
                              {csChannels.map(p => (
                                <div key={p} className="flex items-center gap-[4px] shrink-0"
                                  style={{ backgroundColor: '#f0f0f0', borderRadius: 4, padding: '2px 8px', height: 26 }}>
                                  <div className="shrink-0 size-[14px]">
                                    {p === 'facebook' ? <FacebookIcon /> : p === 'instagram' ? <InstagramIcon /> : p === 'linkedin' ? <LinkedInIcon /> : p === 'google' ? <GoogleIcon /> : <AppleIcon />}
                                  </div>
                                  <span className="text-[12px]" style={{ color: '#212121' }}>
                                    {p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : p === 'linkedin' ? 'LinkedIn' : p === 'google' ? 'Google' : 'Apple'}
                                  </span>
                                  <button type="button" onClick={e => { e.stopPropagation(); setCsChannels(prev => prev.filter(x => x !== p)); }}>
                                    <X size={10} strokeWidth={2} style={{ color: '#555' }} />
                                  </button>
                                </div>
                              ))}
                              <ChevronDown size={14} className="ml-auto shrink-0" strokeWidth={1.6} style={{ color: '#555' }} />
                            </div>
                            {csChannelsOpen && (
                              <div className="absolute left-0 right-0 top-full z-10 py-[4px]"
                                style={{ marginTop: 2, backgroundColor: 'white', border: '1px solid #eaeaea', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                {(['facebook', 'instagram', 'linkedin', 'google', 'apple'] as Platform[]).map(p => {
                                  const lbl = p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : p === 'linkedin' ? 'LinkedIn' : p === 'google' ? 'Google' : 'Apple';
                                  return (
                                    <button key={p} type="button"
                                      className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left"
                                      style={{ fontSize: 14, color: '#212121' }}
                                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                      onClick={() => setCsChannels(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>
                                      <div className="shrink-0 size-[18px]">
                                        {p === 'facebook' ? <FacebookIcon /> : p === 'instagram' ? <InstagramIcon /> : p === 'linkedin' ? <LinkedInIcon /> : p === 'google' ? <GoogleIcon /> : <AppleIcon />}
                                      </div>
                                      {lbl}
                                      {csChannels.includes(p) && (
                                        <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none">
                                          <path d="M2 6l3 3 5-5" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button type="button" onClick={() => setChannelSelectorOpen(false)}
                            style={{ backgroundColor: '#1976d2', borderRadius: 4, padding: '0 20px', height: 36, fontSize: 14, color: '#fff' }}>
                            Done
                          </button>
                        </div>
                      </div>
                    )}

                    </div>{/* end outer 20px padding wrapper */}
                  </div>,
                  document.body
                )}

                {/* Content area (tabs + textarea) */}
                <div style={{ border: '1px solid var(--s-border)', borderRadius: 4, overflow: 'hidden' }}>
                  {/* Tab row — shared Tabs component */}
                  <div className="px-xs" style={{ borderBottom: '1px solid var(--s-border)' }}>
                    <Tabs
                      tabs={tabs.map(t => ({ id: t.key, label: t.label }))}
                      activeTab={activeTab}
                      onChange={(id) => setActiveTab(id as TabKey)}
                    />
                  </div>

                  {/* Textarea */}
                  <textarea
                    className="w-full outline-none resize-none bg-transparent"
                    style={{
                      padding: '14px 16px',
                      fontSize: 14,color: 'var(--s-text-primary)',
                      lineHeight: '22px',
                      letterSpacing: '-0.28px',
                      minHeight: 130,
                      border: 'none',
                      display: 'block',
                      width: '100%',
                    }}
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    placeholder={
                      activeTab === 'google' && googlePublishAs === 'events'
                        ? 'Describe your event — what to expect, who should attend, and why it\'s not to be missed...'
                        : activeTab === 'google' && googlePublishAs === 'offers'
                          ? 'Describe your offer — what\'s included, how to redeem, and what makes it special...'
                          : 'Write your post content...'
                    }
                  />

                  {/* Bottom toolbar */}
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: '8px 14px', borderTop: 'none' }}
                  >
                    <div className="flex items-center gap-[12px]">
                      <button className="flex items-center justify-center text-text-icon hover:text-text-primary transition-colors" style={{ width: 20, height: 20 }} title="Add image">
                        <Camera size={18} strokeWidth={1.5} />
                      </button>
                      <button className="flex items-center justify-center text-text-icon hover:text-text-primary transition-colors" style={{ width: 20, height: 20 }} title="Add emoji">
                        <Smile size={18} strokeWidth={1.5} />
                      </button>
                      <button className="flex items-center justify-center text-text-icon hover:text-text-primary transition-colors" style={{ width: 20, height: 20 }} title="Add hashtag">
                        <Hash size={16} strokeWidth={1.5} />
                      </button>
                      <button className="flex items-center justify-center hover:opacity-80 transition-opacity" style={{ width: 20, height: 20 }} title="AI assist">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.51931 12.0887H6.57118L6.24883 13.0207H5.2187L6.97763 8.12236H8.11988L9.8788 13.0207H8.84167L8.51931 12.0887ZM8.25302 11.3038L7.54525 9.25761L6.83747 11.3038H8.25302Z" fill="#6834B7"/>
                          <path d="M11.5173 8.12937V13.0207H10.5363V8.12937H11.5173Z" fill="#6834B7"/>
                          <path d="M11.3239 5.12083H3.8628C2.83401 5.12083 2 5.95484 2 6.98364V14.4349C2 15.4637 2.83401 16.2977 3.86281 16.2977H13.1768C14.2056 16.2977 15.0396 15.4637 15.0396 14.4349V8.85539C14.8579 8.94499 14.673 8.97287 14.523 8.97287C14.3815 8.97287 14.241 8.94766 14.1082 8.89686V14.4349C14.1082 14.9493 13.6912 15.3663 13.1768 15.3663H3.86281C3.34841 15.3663 2.9314 14.9493 2.9314 14.4349V6.98364C2.9314 6.46924 3.3484 6.05224 3.8628 6.05224H11.2664C11.2157 5.91308 11.1962 5.77401 11.1962 5.64919C11.1962 5.47286 11.2358 5.28997 11.3239 5.12083Z" fill="#6834B7"/>
                          <path d="M16.3135 3.88781C16.2909 3.87008 16.2773 3.84761 16.2727 3.8204C16.2684 3.79607 16.2737 3.77277 16.2886 3.75049C16.3932 3.57115 16.4698 3.42736 16.5185 3.31913C16.5688 3.21216 16.5876 3.11705 16.5749 3.0338C16.5651 2.9502 16.5229 2.85811 16.4483 2.75752C16.3736 2.65693 16.2655 2.52605 16.1238 2.36488C16.0815 2.31591 16.0782 2.26881 16.1138 2.22356C16.1316 2.20093 16.1535 2.18805 16.1794 2.1849C16.2054 2.18176 16.2301 2.1868 16.2535 2.20004C16.4371 2.30788 16.5853 2.38785 16.6981 2.43996C16.8122 2.49045 16.911 2.51063 16.9946 2.50049C17.081 2.49001 17.1717 2.44758 17.2668 2.37319C17.363 2.2972 17.4865 2.18501 17.6371 2.03663C17.683 1.9916 17.7301 1.98809 17.7784 2.02609C17.8267 2.06409 17.8329 2.11084 17.797 2.16636C17.6908 2.34443 17.6125 2.48695 17.5622 2.59392C17.5136 2.70215 17.4956 2.7979 17.5083 2.88115C17.5226 2.96566 17.567 3.05822 17.6417 3.15881C17.7176 3.25778 17.8255 3.38722 17.9656 3.54712C18.0079 3.59609 18.0112 3.64319 17.9756 3.68844C17.94 3.7337 17.8902 3.739 17.8262 3.70437C17.6417 3.60102 17.4932 3.52474 17.3807 3.47552C17.2683 3.42629 17.1695 3.40611 17.0843 3.41498C17.0007 3.42511 16.9115 3.46737 16.8164 3.54175C16.723 3.6174 16.6023 3.7278 16.4542 3.87294C16.4087 3.92086 16.3617 3.92581 16.3135 3.88781Z" fill="#6834B7"/>
                          <path d="M14.5714 8.04144C14.5135 8.04144 14.4639 8.02275 14.4225 7.98537C14.3853 7.95214 14.3646 7.90854 14.3604 7.85454C14.3025 7.43922 14.2446 7.11526 14.1867 6.88268C14.1329 6.6501 14.0439 6.47566 13.9198 6.35937C13.7998 6.23892 13.6178 6.14548 13.3737 6.07902C13.1296 6.01257 12.7945 5.93989 12.3684 5.86098C12.2401 5.83606 12.176 5.76545 12.176 5.64916C12.176 5.59102 12.1946 5.54325 12.2318 5.50587C12.2691 5.4685 12.3146 5.44565 12.3684 5.43735C12.7945 5.3792 13.1296 5.32105 13.3737 5.26291C13.6178 5.20061 13.7998 5.10924 13.9198 4.98879C14.0439 4.8642 14.135 4.68353 14.1929 4.44679C14.2508 4.20591 14.3066 3.87364 14.3604 3.45001C14.377 3.32126 14.4473 3.25689 14.5714 3.25689C14.6955 3.25689 14.7638 3.32334 14.7762 3.45624C14.83 3.87157 14.8838 4.19552 14.9376 4.4281C14.9955 4.66069 15.0865 4.83512 15.2106 4.95142C15.3389 5.06771 15.525 5.15908 15.7691 5.22553C16.0132 5.28783 16.3463 5.35843 16.7683 5.43735C16.8965 5.46227 16.9607 5.53287 16.9607 5.64916C16.9607 5.76545 16.8883 5.83606 16.7434 5.86098C16.3215 5.92743 15.9905 5.99181 15.7505 6.0541C15.5106 6.1164 15.3285 6.20778 15.2044 6.32822C15.0844 6.44866 14.9955 6.62725 14.9376 6.86399C14.8838 7.10073 14.83 7.42676 14.7762 7.84208C14.7638 7.97499 14.6955 8.04144 14.5714 8.04144Z" fill="#6834B7"/>
                        </svg>
                      </button>
                    </div>

                    {/* Personalize link */}
                    <div className="flex items-center gap-[4px] cursor-pointer">
                      <p className="font-normal leading-[20px] text-[#1976d2] text-[13px] tracking-[-0.26px] whitespace-nowrap">
                        Personalize
                      </p>
                      <ChevronDownIcon color="#1976d2" />
                    </div>
                  </div>
                </div>

                {/* Character count */}
                <p
                  className="font-normal leading-[normal] text-[13px] tracking-[-0.26px]"
                  style={{ color: charsLeft < 50 ? '#de1b0c' : 'var(--s-text-secondary)' }}
                >
                  {charsLeft} characters left
                </p>
              </div>
            </div>

            {/* ── Media Section ── */}
            <MediaSection mediaItems={mediaItems} setMediaItems={setMediaItems} />


            {/* ── Instagram Post Settings ── shown only on instagram tab */}
            {selectedPlatforms.includes('instagram') && activeTab === 'instagram' && (
              <div className="border border-border rounded-[8px] bg-background">
                {/* Section header */}
                <div
                  className="w-full flex items-center justify-between px-[16px] py-[12px] cursor-pointer hover:bg-muted/80 transition-colors rounded-t-[8px]"
                  onClick={() => setInstagramSettingsExpanded(v => !v)}
                >
                  <div className="flex items-center gap-[8px]">
                    <InstagramIcon />
                    <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                      Instagram post settings
                    </p>
                  </div>
                  {instagramSettingsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </div>

                {instagramSettingsExpanded && (
                  <div className="px-[20px] py-[16px] flex flex-col gap-[16px]" style={{ borderTop: '1px solid var(--s-border)' }}>

                    {/* Publish as radio */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Publish as</label>
                      <div className="flex items-center gap-[20px]">
                        {(['post', 'reel', 'story'] as InstagramPublishAs[]).map(type => (
                          <label key={type} className="flex items-center gap-[6px] cursor-pointer">
                            <input
                              type="radio"
                              name="instagramPublishAs"
                              value={type}
                              checked={instagramPublishAs === type}
                              onChange={() => setInstagramPublishAs(type)}
                              style={{ accentColor: 'var(--s-blue)', width: 14, height: 14 }}
                            />
                            <span className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-primary)' }}>
                              {type === 'post' ? 'Post' : type === 'reel' ? 'Reel' : 'Story'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* First comment */}
                    <div className="flex flex-col gap-[6px]">
                      <div className="flex items-center gap-[5px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>First comment</label>
                        <Tooltip content="Posted automatically right after your Instagram post goes live. Useful for hashtags or links you don't want cluttering the caption.">
                          <InfoIcon />
                        </Tooltip>
                      </div>
                      <textarea
                        value={instagramFirstComment}
                        onChange={e => setInstagramFirstComment(e.target.value.slice(0, 2200))}
                        rows={3}
                        maxLength={2200}
                        className="w-full outline-none bg-transparent resize-none"
                        style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                        placeholder="Write a comment"
                      />
                      <p className="font-normal leading-[normal] text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>
                        {2200 - instagramFirstComment.length} characters left
                      </p>
                    </div>

                    {/* Collaborators */}
                    <div className="flex flex-col gap-[6px]">
                      <div className="flex items-center gap-[5px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Collaborators</label>
                        <Tooltip content="Invite up to 3 public Instagram profiles to co-author this post. Only public (non-private) profiles can be invited — pick the right account from the list so the invite reaches the intended partner.">
                          <InfoIcon />
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-[6px] flex-wrap" style={{ border: '1px solid var(--s-border)', borderRadius: 8, padding: '8px 10px', minHeight: 40 }}>
                          {instagramCollaborators.map(handle => (
                            <TagChip
                              key={handle}
                              label={handle}
                              onRemove={() => setInstagramCollaborators(prev => prev.filter(h => h !== handle))}
                            />
                          ))}
                          {instagramCollaborators.length < INSTAGRAM_MAX_COLLABORATORS && (
                            <input
                              type="text"
                              value={instagramCollaboratorInput}
                              onChange={e => { setInstagramCollaboratorInput(e.target.value); setInstagramCollaboratorDropdownOpen(true); }}
                              onFocus={() => setInstagramCollaboratorDropdownOpen(true)}
                              onBlur={() => setTimeout(() => setInstagramCollaboratorDropdownOpen(false), 120)}
                              onKeyDown={e => {
                                if ((e.key === 'Enter' || e.key === ',') && instagramCollaboratorInput.trim()) {
                                  e.preventDefault();
                                  const handle = instagramCollaboratorInput.trim().replace(/^@?/, '@');
                                  setInstagramCollaborators(prev => prev.includes(handle) ? prev : [...prev, handle].slice(0, INSTAGRAM_MAX_COLLABORATORS));
                                  setInstagramCollaboratorInput('');
                                  setInstagramCollaboratorDropdownOpen(false);
                                } else if (e.key === 'Backspace' && !instagramCollaboratorInput && instagramCollaborators.length > 0) {
                                  setInstagramCollaborators(prev => prev.slice(0, -1));
                                }
                              }}
                              className="flex-1 outline-none bg-transparent min-w-[120px]"
                              style={{ fontSize: 14, color: 'var(--s-text-primary)' }}
                              placeholder="Invite collaborators"
                            />
                          )}
                        </div>

                        {/* Suggested public profiles dropdown */}
                        {instagramCollaboratorDropdownOpen && instagramCollaboratorInput.trim().length > 0 && instagramCollaborators.length < INSTAGRAM_MAX_COLLABORATORS && (() => {
                          const query = instagramCollaboratorInput.trim().toLowerCase().replace(/^@/, '');
                          const matches = INSTAGRAM_COLLABORATOR_PROFILES.filter(p =>
                            !instagramCollaborators.includes(p.handle) &&
                            (p.handle.toLowerCase().includes(query) || p.name.toLowerCase().includes(query))
                          ).slice(0, 5);
                          if (matches.length === 0) {
                            return (
                              <div
                                className="absolute left-0 right-0 bg-background z-20"
                                style={{ top: '100%', marginTop: 4, border: '1px solid var(--s-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '10px 12px' }}
                              >
                                <span className="font-normal text-[13px]" style={{ color: 'var(--s-text-muted)' }}>No public profiles found</span>
                              </div>
                            );
                          }
                          return (
                            <div
                              className="absolute left-0 right-0 bg-background z-20"
                              style={{ top: '100%', marginTop: 4, border: '1px solid var(--s-border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '6px', maxHeight: 240, overflowY: 'auto' }}
                            >
                              {matches.map(profile => (
                                <button
                                  key={profile.handle}
                                  type="button"
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    setInstagramCollaborators(prev => prev.includes(profile.handle) ? prev : [...prev, profile.handle].slice(0, INSTAGRAM_MAX_COLLABORATORS));
                                    setInstagramCollaboratorInput('');
                                    setInstagramCollaboratorDropdownOpen(false);
                                  }}
                                  className="w-full flex items-center gap-[10px] text-left hover:bg-muted transition-colors"
                                  style={{ padding: '7px 8px', borderRadius: 6 }}
                                >
                                  <ProfileAvatar initials={profile.initials} color={profile.color} />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-normal text-[13px] tracking-[-0.26px] truncate" style={{ color: 'var(--s-text-primary)' }}>{profile.name}</span>
                                    <span className="font-normal text-[12px] truncate" style={{ color: 'var(--s-text-muted)' }}>{profile.handle}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="font-normal text-[12px]" style={{ color: 'var(--s-text-muted)' }}>
                        Invite up to {INSTAGRAM_MAX_COLLABORATORS} public profiles. They'll be asked to accept once the post is published.
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}


            {/* ── Apple Post Settings ── shown only on apple tab */}
            {selectedPlatforms.includes('apple') && activeTab === 'apple' && (
              <div className="border border-border rounded-[8px] bg-background">
                {/* Section header */}
                <div
                  className="w-full flex items-center justify-between px-[16px] py-[12px] cursor-pointer hover:bg-muted/80 transition-colors rounded-t-[8px]"
                  onClick={() => setAppleSettingsExpanded(v => !v)}
                >
                  <div className="flex items-center gap-[8px]">
                    <div className="shrink-0 size-[16px] text-foreground"><AppleIcon /></div>
                    <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                      Apple post settings
                    </p>
                  </div>
                  {appleSettingsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </div>

                {appleSettingsExpanded && (
                  <div className="px-[20px] py-[16px] flex flex-col gap-[16px]">

                    {/* Header field */}
                    <div className="flex flex-col gap-[6px]">
                      <div className="flex items-center justify-between">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Header</label>
                        <span className="font-normal text-[12px]" style={{ color: 'var(--s-text-muted)' }}>{appleHeader.length}/38</span>
                      </div>
                      <input
                        type="text"
                        maxLength={38}
                        value={appleHeader}
                        onChange={e => setAppleHeader(e.target.value)}
                        className="w-full outline-none bg-transparent"
                        style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)', letterSpacing: '-0.28px' }}
                        placeholder="Enter header text"
                      />
                    </div>

                    {/* Button type dropdown */}
                    <div className="flex flex-col gap-[6px]">
                      <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Button type</label>
                      <div className="relative">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between text-left"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)', backgroundColor: 'var(--s-bg-primary)' }}
                          onClick={() => setAppleButtonTypeOpen(v => !v)}
                        >
                          <span>{appleButtonType}</span>
                          <ChevronDownIcon />
                        </button>
                        {appleButtonTypeOpen && (
                          <div
                            className="absolute left-0 right-0 bg-background z-20"
                            style={{ top: '100%', marginTop: 2, border: '1px solid var(--s-border)', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto' }}
                          >
                            {APPLE_BUTTON_TYPES.map(type => (
                              <button
                                key={type}
                                className="w-full text-left hover:bg-muted transition-colors flex items-center justify-between"
                                style={{ padding: '9px 12px', fontSize: 14, color: 'var(--s-text-primary)', letterSpacing: '-0.28px' }}
                                onClick={() => { setAppleButtonType(type); setAppleButtonLink(''); setAppleButtonTypeOpen(false); }}
                              >
                                {type}
                                {appleButtonType === type && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--s-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conditional: URL / website field */}
                    {APPLE_URL_TYPES.includes(appleButtonType) && (
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Button link</label>
                        <input
                          type="url"
                          value={appleButtonLink}
                          onChange={e => setAppleButtonLink(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)', letterSpacing: '-0.28px' }}
                          placeholder="Enter input"
                        />
                      </div>
                    )}

                    {/* Conditional: phone number */}
                    {APPLE_PHONE_TYPES.includes(appleButtonType) && (
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Phone number</label>
                        <input
                          type="tel"
                          value={appleButtonLink}
                          onChange={e => setAppleButtonLink(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)', letterSpacing: '-0.28px' }}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    )}

                    {/* Duration — date range */}
                    <div className="flex flex-col gap-[6px]">
                      <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Duration</label>
                      <div className="flex items-center gap-[8px]">
                        <div className="relative flex-1" style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PickCalendarIcon />
                          <input
                            type="date"
                            value={appleDurationStart}
                            onChange={e => setAppleDurationStart(e.target.value)}
                            className="full-picker flex-1 outline-none bg-transparent"
                            style={{ fontSize: 13, color: appleDurationStart ? 'var(--s-text-primary)' : 'var(--s-text-muted)', minWidth: 0 }}
                          />
                        </div>
                        <span className="shrink-0 text-[13px]" style={{ color: 'var(--s-text-muted)' }}>–</span>
                        <div className="relative flex-1" style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PickCalendarIcon />
                          <input
                            type="date"
                            value={appleDurationEnd}
                            onChange={e => setAppleDurationEnd(e.target.value)}
                            className="full-picker flex-1 outline-none bg-transparent"
                            style={{ fontSize: 13, color: appleDurationEnd ? 'var(--s-text-primary)' : 'var(--s-text-muted)', minWidth: 0 }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}


            {/* ── Google Post Settings ── shown only on google tab */}
            {selectedPlatforms.includes('google') && activeTab === 'google' && (
              <div className="border border-border rounded-[8px] bg-background">
                {/* Section header */}
                <div
                  className="w-full flex items-center justify-between px-[16px] py-[12px] cursor-pointer hover:bg-muted/50 transition-colors rounded-t-[8px]"
                  onClick={() => setGoogleSettingsExpanded(v => !v)}
                >
                  <div className="flex items-center gap-[8px]">
                    <div className="shrink-0 size-[16px]"><GoogleIcon /></div>
                    <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                      Google post settings
                    </p>
                  </div>
                  {googleSettingsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </div>

                {googleSettingsExpanded && (
                  <div className="px-[20px] py-[16px] flex flex-col gap-[16px]" style={{ borderTop: '1px solid var(--s-border)' }}>

                    {/* Publish as radio */}
                    <div className="flex flex-col gap-[8px]">
                      <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Publish as</label>
                      <div className="flex items-center gap-[20px]">
                        {(['updates', 'offers', 'events'] as GooglePublishAs[]).map(type => (
                          <label key={type} className="flex items-center gap-[6px] cursor-pointer">
                            <input
                              type="radio"
                              name="googlePublishAs"
                              value={type}
                              checked={googlePublishAs === type}
                              onChange={() => setGooglePublishAs(type)}
                              style={{ accentColor: 'var(--s-blue)', width: 14, height: 14 }}
                            />
                            <span className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-primary)' }}>
                              {type === 'updates' ? 'Google updates' : type === 'offers' ? 'Google offers' : 'Google events'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* ── Google updates fields ── */}
                    {googlePublishAs === 'updates' && (<>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Button type</label>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-left"
                            style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)', backgroundColor: 'var(--s-bg-primary)' }}
                            onClick={() => setGoogleButtonTypeOpen(v => !v)}
                          >
                            <span>{googleButtonType}</span>
                            <ChevronDownIcon />
                          </button>
                          {googleButtonTypeOpen && (
                            <div className="absolute left-0 right-0 bg-background z-20"
                              style={{ top: '100%', marginTop: 2, border: '1px solid var(--s-border)', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                              {GOOGLE_BUTTON_TYPES.map(type => (
                                <button key={type}
                                  className="w-full text-left hover:bg-muted transition-colors flex items-center justify-between"
                                  style={{ padding: '9px 12px', fontSize: 14, color: 'var(--s-text-primary)' }}
                                  onClick={() => { setGoogleButtonType(type); setGoogleButtonTypeOpen(false); }}>
                                  {type}
                                  {googleButtonType === type && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--s-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Link for button</label>
                        <input type="url" value={googleButtonLink} onChange={e => setGoogleButtonLink(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="Enter URL" />
                      </div>
                    </>)}

                    {/* ── Google offers fields ── */}
                    {googlePublishAs === 'offers' && (<>
                      <div className="flex flex-col gap-[6px]">
                        <div className="flex items-center justify-between">
                          <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Title <span style={{ color: 'var(--s-blue)' }}>*</span></label>
                          <span className="font-normal text-[12px]" style={{ color: 'var(--s-text-muted)' }}>{googleTitle.length}/58</span>
                        </div>
                        <input type="text" maxLength={58} value={googleTitle} onChange={e => setGoogleTitle(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="Enter title" />
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Duration <span style={{ color: 'var(--s-blue)' }}>*</span></label>
                        <div className="flex items-center gap-[8px]">
                          <div className="relative flex-1" style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PickCalendarIcon />
                            <input type="date" value={googleDurationStart} onChange={e => setGoogleDurationStart(e.target.value)}
                              className="full-picker flex-1 outline-none bg-transparent"
                              style={{ fontSize: 13, color: googleDurationStart ? 'var(--s-text-primary)' : 'var(--s-text-muted)', minWidth: 0 }} />
                          </div>
                          <span className="shrink-0 text-[13px]" style={{ color: 'var(--s-text-muted)' }}>–</span>
                          <div className="relative flex-1" style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '0 10px', height: 34, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <PickCalendarIcon />
                            <input type="date" value={googleDurationEnd} onChange={e => setGoogleDurationEnd(e.target.value)}
                              className="full-picker flex-1 outline-none bg-transparent"
                              style={{ fontSize: 13, color: googleDurationEnd ? 'var(--s-text-primary)' : 'var(--s-text-muted)', minWidth: 0 }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Coupon code</label>
                        <input type="text" value={googleCouponCode} onChange={e => setGoogleCouponCode(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="Enter Coupon code" />
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Link</label>
                        <input type="url" value={googleLink} onChange={e => setGoogleLink(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="Enter URL" />
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Terms &amp; Conditions</label>
                        <textarea value={googleTerms} onChange={e => setGoogleTerms(e.target.value)} rows={3}
                          className="w-full outline-none bg-transparent resize-none"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="Enter terms and conditions" />
                      </div>
                    </>)}

                    {/* ── Google events fields ── */}
                    {googlePublishAs === 'events' && (<>
                      {/* Event Title */}
                      <div className="flex flex-col gap-[6px]">
                        <div className="flex items-center justify-between">
                          <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Event title <span style={{ color: 'var(--s-blue)' }}>*</span></label>
                          <span className="font-normal text-[12px]" style={{ color: 'var(--s-text-muted)' }}>{googleTitle.length}/58</span>
                        </div>
                        <input type="text" maxLength={58} value={googleTitle} onChange={e => setGoogleTitle(e.target.value)}
                          className="w-full outline-none bg-transparent"
                          style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                          placeholder="e.g. Grand Opening" />
                      </div>

                      {/* Start date row */}
                      <div className="flex items-center gap-[10px]">
                        <label className="font-normal text-[13px] shrink-0 w-[36px]" style={{ color: 'var(--s-text-secondary)' }}>Start</label>
                        <div className="relative" style={{ border: '1px solid var(--s-border)', borderRadius: 4, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: 300 }}>
                          <PickCalendarIcon />
                          <input type="date" value={googleDurationStart} onChange={e => setGoogleDurationStart(e.target.value)}
                            className="full-picker outline-none bg-transparent"
                            style={{ fontSize: 13, color: googleDurationStart ? 'var(--s-text-primary)' : 'var(--s-text-muted)', flex: 1, minWidth: 0 }} />
                          <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
                        </div>
                        {googleIncludeTimes && (
                          <div className="relative" style={{ border: '1px solid var(--s-border)', borderRadius: 4, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: 150 }}>
                            <PickClockIcon />
                            <input type="time" value={googleEventStartTime} onChange={e => setGoogleEventStartTime(e.target.value)}
                              className="full-picker outline-none bg-transparent"
                              style={{ fontSize: 13, color: 'var(--s-text-primary)', flex: 1, minWidth: 0 }} />
                            <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
                          </div>
                        )}
                      </div>

                      {/* End date row */}
                      <div className="flex items-center gap-[10px]">
                        <label className="font-normal text-[13px] shrink-0 w-[36px]" style={{ color: 'var(--s-text-secondary)' }}>End</label>
                        <div className="relative" style={{ border: '1px solid var(--s-border)', borderRadius: 4, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: 300 }}>
                          <PickCalendarIcon />
                          <input type="date" value={googleDurationEnd} onChange={e => setGoogleDurationEnd(e.target.value)}
                            className="full-picker outline-none bg-transparent"
                            style={{ fontSize: 13, color: googleDurationEnd ? 'var(--s-text-primary)' : 'var(--s-text-muted)', flex: 1, minWidth: 0 }} />
                          <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
                        </div>
                        {googleIncludeTimes && (
                          <div className="relative" style={{ border: '1px solid var(--s-border)', borderRadius: 4, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: 150 }}>
                            <PickClockIcon />
                            <input type="time" value={googleEventEndTime} onChange={e => setGoogleEventEndTime(e.target.value)}
                              className="full-picker outline-none bg-transparent"
                              style={{ fontSize: 13, color: 'var(--s-text-primary)', flex: 1, minWidth: 0 }} />
                            <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
                          </div>
                        )}
                      </div>

                      {/* Include start/end times toggle */}
                      <div className="flex items-center gap-[10px]">
                        <label className="font-normal text-[13px]" style={{ color: 'var(--s-text-secondary)' }}>Include start/end times</label>
                        <button
                          type="button"
                          onClick={() => setGoogleIncludeTimes(v => !v)}
                          className="relative shrink-0 transition-colors"
                          style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: googleIncludeTimes ? 'var(--s-blue)' : '#c4c4c4' }}
                        >
                          <span className="absolute top-[2px] transition-transform"
                            style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block', transform: googleIncludeTimes ? 'translateX(18px)' : 'translateX(2px)' }} />
                        </button>
                      </div>

                      {/* Recurring schedule */}
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Repeats</label>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between outline-none bg-transparent"
                            style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                            onClick={() => setGoogleEventRecurrenceOpen(v => !v)}
                          >
                            <span>{getRecurrenceLabel(googleEventRecurrence, googleDurationStart)}</span>
                            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)' }} />
                          </button>
                          {googleEventRecurrenceOpen && (
                            <div className="absolute left-0 right-0 top-full z-20 bg-background border border-border rounded-[6px] shadow-dropdown overflow-hidden" style={{ marginTop: 2 }}>
                              {getRecurrenceOptions(googleDurationStart).map(opt => (
                                <button key={opt.value} type="button"
                                  className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left hover:bg-muted transition-colors"
                                  style={{ fontSize: 14, color: 'var(--s-text-primary)' }}
                                  onClick={() => { setGoogleEventRecurrence(opt.value); setGoogleEventRecurrenceOpen(false); }}>
                                  {googleEventRecurrence === opt.value && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--s-blue)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  )}
                                  {googleEventRecurrence !== opt.value && <span style={{ width: 12, display: 'inline-block' }} />}
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Custom weekly day toggles */}
                        {googleEventRecurrence === 'custom_weekly' && (
                          <div className="flex gap-[6px] mt-[4px]">
                            {DAY_ABBR.map((day, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setGoogleEventRecurrenceCustomDays(prev =>
                                  prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                                )}
                                className="flex items-center justify-center text-[12px] font-normal transition-colors"
                                style={{
                                  width: 32, height: 32, borderRadius: '50%',
                                  border: '1px solid var(--s-border)',
                                  backgroundColor: googleEventRecurrenceCustomDays.includes(i) ? 'var(--s-blue)' : 'transparent',
                                  color: googleEventRecurrenceCustomDays.includes(i) ? '#fff' : 'var(--s-text-primary)',
                                }}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Repeat until */}
                        {googleEventRecurrence !== 'none' && (
                          <div className="flex items-center gap-[10px] mt-[4px] pl-[12px]" style={{ borderLeft: '2px solid var(--s-border)' }}>
                            <label className="font-normal text-[13px] shrink-0" style={{ color: 'var(--s-text-secondary)' }}>Repeat until</label>
                            <div className="relative" style={{ border: '1px solid var(--s-border)', borderRadius: 4, height: 34, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', flex: 1 }}>
                              <PickCalendarIcon />
                              <input type="date" value={googleEventRecurrenceEndDate} onChange={e => setGoogleEventRecurrenceEndDate(e.target.value)}
                                className="full-picker outline-none bg-transparent"
                                style={{ fontSize: 13, color: googleEventRecurrenceEndDate ? 'var(--s-text-primary)' : 'var(--s-text-muted)', flex: 1, minWidth: 0 }} />
                              <ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Button Type (optional) */}
                      <div className="flex flex-col gap-[6px]">
                        <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Button type (optional)</label>
                        <div className="relative">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between outline-none bg-transparent"
                            style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                            onClick={() => setGoogleEventButtonTypeOpen(v => !v)}
                          >
                            <span>{googleEventButtonType}</span>
                            <ChevronDown size={14} strokeWidth={1.6} absoluteStrokeWidth style={{ color: 'var(--s-text-muted)' }} />
                          </button>
                          {googleEventButtonTypeOpen && (
                            <div className="absolute left-0 right-0 top-full z-20 bg-background border border-border rounded-[6px] shadow-dropdown overflow-hidden" style={{ marginTop: 2 }}>
                              {GOOGLE_EVENT_BUTTON_TYPES.map(type => (
                                <button key={type} type="button"
                                  className="w-full flex items-center gap-[8px] px-[12px] py-[8px] text-left hover:bg-muted transition-colors"
                                  style={{ fontSize: 14, color: 'var(--s-text-primary)' }}
                                  onClick={() => { setGoogleEventButtonType(type); setGoogleEventButtonTypeOpen(false); }}>
                                  {googleEventButtonType === type && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--s-blue)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  )}
                                  {googleEventButtonType !== type && <span style={{ width: 12, display: 'inline-block' }} />}
                                  {type}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Link for button */}
                      {googleEventButtonType !== 'None' && (
                        <div className="flex flex-col gap-[6px]">
                          <label className="font-normal text-[13px] tracking-[-0.26px]" style={{ color: 'var(--s-text-secondary)' }}>Link for your button</label>
                          <input type="url" value={googleEventButtonLink} onChange={e => setGoogleEventButtonLink(e.target.value)}
                            className="w-full outline-none bg-transparent"
                            style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 10px', fontSize: 14, color: 'var(--s-text-primary)' }}
                            placeholder="https://" />
                        </div>
                      )}
                    </>)}

                  </div>
                )}
              </div>
            )}

            {/* ── Tags Section ── */}
            <div className="border border-border rounded-[8px] overflow-hidden bg-background">
              <div className="w-full flex items-center justify-between px-[16px] py-[12px]">
                <div className="flex items-center gap-[5px]">
                  <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                    Tags
                  </p>
                  <InfoIcon />
                </div>
                <button>
                  <p className="font-normal text-[#1976d2] text-[13px] tracking-[-0.26px] whitespace-nowrap">
                    Manage tags
                  </p>
                </button>
              </div>
              <div className="px-[16px] pb-[16px]">
                <div className="flex items-center gap-[6px] flex-wrap" style={{ border: '1px solid var(--s-border)', borderRadius: 8, padding: '8px 10px', minHeight: 40 }}>
                  {tags.map(tag => (
                    <TagChip key={tag.id} label={tag.label} onRemove={() => setTags(prev => prev.filter(t => t.id !== tag.id))} />
                  ))}
                  {tags.length > 0 && (
                    <button onClick={() => setTags([])} className="flex items-center justify-center ml-auto shrink-0" style={{ color: '#888', width: 20, height: 20 }}>
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Approvals Section ── */}
            <div className="border border-border rounded-[8px] overflow-hidden bg-background">
              <div className="w-full flex items-center justify-between px-[16px] py-[12px]">
                <div className="flex items-center gap-[5px]">
                  <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                    Approvals
                  </p>
                  <InfoIcon />
                </div>
              </div>
              <div className="px-[16px] py-[16px]">
                <div className="relative">
                  <button
                    className="w-full flex items-center justify-between transition-colors"
                    style={{ border: '1px solid var(--s-border)', borderRadius: 4, padding: '8px 12px', height: 36, backgroundColor: 'var(--s-bg-input)' }}
                    onClick={() => setApprovalOpen(v => !v)}
                  >
                    <p
                      className="font-normal leading-[20px] text-[14px] tracking-[-0.28px]"
                      style={{ color: selectedApproval ? 'var(--s-text-primary)' : '#aaaaaa' }}
                    >
                      {selectedApproval || 'Select approval'}
                    </p>
                    <div style={{ transform: approvalOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                      <ChevronDownIcon />
                    </div>
                  </button>
                  {approvalOpen && (
                    <div
                      className="absolute left-0 right-0 bg-background z-20"
                      style={{ top: '100%', marginTop: 2, border: '1px solid var(--s-border)', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                      {APPROVAL_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          className="w-full text-left hover:bg-muted transition-colors"
                          style={{ padding: '9px 12px', fontSize: 14,color: 'var(--s-text-primary)', letterSpacing: '-0.28px' }}
                          onClick={() => { setSelectedApproval(opt); setApprovalOpen(false); }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Posting checklist ── */}
            <div className="border border-border rounded-[8px] overflow-hidden bg-background mb-[24px]">
              <div
                className="w-full flex items-center justify-between px-[16px] py-[12px] hover:bg-muted transition-colors cursor-pointer"
                onClick={() => setChecklistExpanded(v => !v)}
              >
                <p className="font-normal text-foreground text-[16px] tracking-[-0.32px]">
                  Posting checklist
                </p>
                {checklistExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </div>

              {checklistExpanded && (
                <div className="px-[16px] py-[16px] flex flex-col gap-[10px]">
                  {/* Warning item 1 */}
                  <div className="flex items-start gap-[10px]">
                    <div className="shrink-0 mt-[1px]">
                      <Lightbulb size={15} style={{ color: '#f59e0b' }} />
                    </div>
                    <p className="font-normal leading-[20px] text-muted-foreground text-[13px] tracking-[-0.26px]">
                      Instagram's daily limit for sharing posts, reels, and stories combined is 50.
                    </p>
                  </div>
                  {/* Warning item 2 */}
                  <div className="flex items-start gap-[10px]">
                    <div className="shrink-0 mt-[1px]">
                      <Lightbulb size={15} style={{ color: '#f59e0b' }} />
                    </div>
                    <p className="font-normal leading-[20px] text-muted-foreground text-[13px] tracking-[-0.26px]">
                      The{' '}
                      <span style={{ color: 'var(--s-blue)', cursor: 'pointer' }}>Facebook</span>
                      {' '}or{' '}
                      <span style={{ color: 'var(--s-blue)', cursor: 'pointer' }}>X (Twitter)</span>
                      {' '}accounts of at least one of your locations is disconnected or missing required permissions. Reconnect and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Preview Panel ── */}
        <div className="overflow-y-auto" style={{ flex: '1 1 0', backgroundColor: 'white', padding: '16px 20px 16px 12px' }}>
          <div style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: 'var(--s-bg-muted)' }}>
            <PreviewPanel content={postContent} mediaItems={mediaItems} activeTab={activeTab} appleHeader={appleHeader} appleButtonType={appleButtonType} selectedPlatforms={selectedPlatforms} contentStream={contentStream} googlePublishAs={googlePublishAs} googleTitle={googleTitle} googleDurationStart={googleDurationStart} googleDurationEnd={googleDurationEnd} googleCouponCode={googleCouponCode} googleButtonType={googleButtonType} googleIncludeTimes={googleIncludeTimes} googleEventStartTime={googleEventStartTime} googleEventEndTime={googleEventEndTime} googleEventButtonType={googleEventButtonType} />
          </div>
        </div>
      </div>

      {/* ── Post Timing Modal ── */}
      {timingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ paddingTop: 80, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setTimingModalOpen(false)}
        >
          <div
            className="bg-background flex flex-col"
            style={{ width: 580, maxHeight: '82vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-[20px] py-[14px] shrink-0" style={{ borderBottom: '1px solid var(--s-border)' }}>
              <p className="text-[16px] text-foreground tracking-[-0.32px]" style={{ fontWeight: 500 }}>
                Post timing
              </p>
              <button
                onClick={() => setTimingModalOpen(false)}
                className="flex items-center justify-center rounded-[4px] hover:bg-muted transition-colors"
                style={{ width: 28, height: 28 }}
              >
                <X size={16} color="var(--s-text-secondary)" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-[20px] py-[16px] flex flex-col gap-[0px]">

              {/* ── Publish mode radios ── */}
              <div className="flex flex-col gap-[10px]">

                <label className="flex items-start gap-[10px] cursor-pointer" onClick={() => handlePublishMode('now')}>
                  <div className="mt-[1px]"><RadioButton selected={publishMode === 'now'} /></div>
                  <div>
                    <p className="text-[13px] text-foreground leading-[18px]" style={{ fontWeight: publishMode === 'now' ? 500 : 400 }}>Publish now</p>
                    <p className="text-[12px] text-muted-foreground">Goes live immediately</p>
                  </div>
                </label>

                <label className="flex items-start gap-[10px] cursor-pointer" onClick={() => handlePublishMode('scheduled')}>
                  <div className="mt-[1px]"><RadioButton selected={publishMode === 'scheduled'} /></div>
                  <div>
                    <p className="text-[13px] text-foreground leading-[18px]" style={{ fontWeight: publishMode === 'scheduled' ? 500 : 400 }}>Schedule for later</p>
                    <p className="text-[12px] text-muted-foreground">Pick a date &amp; time</p>
                  </div>
                </label>

                {publishMode === 'scheduled' && (
                  <div className="pl-[26px]">{schedulePickers}</div>
                )}

                <label className="flex items-start gap-[10px] cursor-pointer" onClick={() => handlePublishMode('draft')}>
                  <div className="mt-[1px]"><RadioButton selected={publishMode === 'draft'} /></div>
                  <div>
                    <p className="text-[13px] text-foreground leading-[18px]" style={{ fontWeight: publishMode === 'draft' ? 500 : 400 }}>Save as draft</p>
                    <p className="text-[12px] text-muted-foreground">Save now, publish or schedule later</p>
                  </div>
                </label>

                {publishMode === 'draft' && (
                  <div className="pl-[26px]">
                    <div className="flex flex-col gap-[10px] rounded-[8px] px-[12px] py-[10px]" style={{ backgroundColor: 'var(--s-bg-muted)' }}>
                      <div className="flex items-start justify-between gap-[12px]">
                        <div>
                          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Add to calendar</p>
                          <p className="text-[12px] text-muted-foreground">Show this draft on the calendar at a set time</p>
                        </div>
                        <button
                          onClick={() => setDraftCalendarEnabled(v => !v)}
                          className="relative shrink-0 transition-colors"
                          style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: draftCalendarEnabled ? 'var(--s-blue)' : '#d0d0d0', border: 'none', cursor: 'pointer', marginTop: 2 }}
                        >
                          <span className="absolute top-[2px] transition-all duration-200" style={{ left: draftCalendarEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
                        </button>
                      </div>
                      {draftCalendarEnabled && (
                        <div className="flex items-center gap-[10px]">
                          <NativePicker type="date" value={scheduleDate} onChange={setScheduleDate} icon={<PickCalendarIcon />} width={160} />
                          <NativePicker type="time" value={scheduleTime} onChange={setScheduleTime} icon={<PickClockIcon />} width={120} />
                          <p className="text-[11px] text-[#aaa] shrink-0">Draft won't publish automatically</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="border-t border-border" style={{ margin: '16px 0' }} />

              {/* ── Set Expiry ── */}
              <div
                className="flex flex-col gap-[12px]"
                style={publishMode === 'draft' ? { opacity: 0.45, pointerEvents: 'none' } : {}}
              >
                <div className="flex items-start justify-between gap-[16px]">
                  <div>
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Set expiry</p>
                    <p className="text-[12px] text-muted-foreground">Post will be removed after this time</p>
                  </div>
                  <button
                    onClick={() => handleToggleExpiry(!expiryEnabled)}
                    className="relative shrink-0 transition-colors"
                    style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: expiryEnabled ? 'var(--s-blue)' : '#d0d0d0', border: 'none', cursor: 'pointer', marginTop: 2 }}
                  >
                    <span className="absolute top-[2px] transition-all duration-200" style={{ left: expiryEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
                  </button>
                </div>

                {expiryEnabled && (
                  <>
                    <div className="flex items-center gap-[10px]">
                      <NativePicker type="date" value={expiryDate} onChange={setExpiryDate} min={publishMode === 'scheduled' && scheduleDate ? scheduleDate : new Date().toISOString().slice(0, 10)} icon={<PickCalendarIcon />} width={160} hasError={expiryBeforePublish || expiryInPast} />
                      <NativePicker type="time" value={expiryTime} onChange={setExpiryTime} icon={<PickClockIcon />} width={120} hasError={expiryBeforePublish || expiryInPast} />
                    </div>
                    {expiryInPast && <p className="text-[12px] text-[#de1b0c]">Expiry must be in the future</p>}
                    {!expiryInPast && expiryEqualsPublish && <p className="text-[12px] text-[#de1b0c]">Expiry can't be the same as publish time</p>}
                    {!expiryInPast && !expiryEqualsPublish && expiryBeforePublish && <p className="text-[12px] text-[#de1b0c]">Expiry must be after the publish time</p>}
                    <p className="text-[11px] text-[#aaa]">Some platforms may not support automatic removal</p>

                    {timelinePublishISO && expiryISO && timingValid && (
                      <div className="flex flex-col gap-[8px]">
                        <p className="text-[11px] text-[#888]" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Post lifecycle</p>
                        {/* Track row: dots + lines all on the same items-center axis */}
                        <div className="flex items-center">
                          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: 'var(--s-blue)', boxShadow: '0 0 0 2px #c7ddf8' }} />
                          <div className="flex-1" style={{ height: 2, backgroundColor: 'var(--s-blue)', opacity: 0.5 }} />
                          <span className="text-[9px] px-[5px] py-[1px] rounded-full mx-[6px] shrink-0" style={{ backgroundColor: 'var(--s-blue-bg)', color: 'var(--s-blue)', fontWeight: 600, letterSpacing: '0.04em' }}>LIVE</span>
                          <div className="flex-1" style={{ height: 2, backgroundColor: '#c4c4c4' }} />
                          <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ backgroundColor: '#c4c4c4', boxShadow: '0 0 0 2px #e0e0e0' }} />
                        </div>
                        {/* Labels row */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px]" style={{ color: 'var(--s-blue)', fontWeight: 500, whiteSpace: 'nowrap' }}>{publishMode === 'now' ? 'Now' : fmtDateTime(timelinePublishISO)}</p>
                            <p className="text-[9px] text-[#aaa]" style={{ whiteSpace: 'nowrap' }}>Publish</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px]" style={{ color: 'var(--s-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtDateTime(expiryISO)}</p>
                            <p className="text-[9px] text-[#aaa]" style={{ whiteSpace: 'nowrap' }}>Expires</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-[8px] px-[20px] py-[14px] shrink-0" style={{ borderTop: '1px solid var(--s-border)' }}>
              <button
                onClick={() => setTimingModalOpen(false)}
                className="hover:bg-muted transition-colors"
                style={{ height: 36, padding: '0 16px', borderRadius: 4, border: '1px solid var(--s-border-subtle)',fontSize: 14, color: 'var(--s-text-primary)', fontWeight: 400 }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onPublish?.(publishMode === 'now' ? 'publish' : publishMode === 'scheduled' ? 'schedule' : 'draft', expiryISO || undefined); setTimingModalOpen(false); }}
                className="hover:opacity-90 transition-opacity"
                style={{ height: 36, padding: '0 20px', borderRadius: 4, backgroundColor: '#1976d2',fontSize: 14, color: 'white', fontWeight: 500 }}
              >
                {publishMode === 'now' ? 'Publish now' : publishMode === 'scheduled' ? 'Schedule post' : 'Save as draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
