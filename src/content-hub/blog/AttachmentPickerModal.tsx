/**
 * AttachmentPickerModal (v3)
 *
 * Layout matches Figma node 9614:21654 (Content Hub):
 *  - 1200px wide, 88vh max-height
 *  - Header: title + X (no subtitle / no header-level Save)
 *  - Tabs: myna Tabs component (underline style)
 *  - Media library: folder grid → drill-in → selectable image grid
 *  - Files: doc-file table with checkboxes
 *  - Upload: drag-drop zone (no checkboxes)
 *  - Footer: "N files selected" + Save primary button
 */

import React, { useRef, useState, useCallback } from 'react';
import { X, Upload, ChevronLeft, Check, Play, Film, LayoutGrid, List } from 'lucide-react';
import { Tabs } from '../../components';
import { cn } from '@/contenthub-ui/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AttachedFile {
  name: string;
  thumbUrl?: string;
  kind?: 'image' | 'video' | 'doc';
}

export interface AttachmentPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (selected: AttachedFile[]) => void;
  initialSelected?: string[];
}

interface MediaItem {
  id: string;
  name: string;
  kind: 'image' | 'video';
  thumbUrl: string;
}

interface FolderDef {
  id: string;
  name: string;
  items: MediaItem[];
}

interface DocFile {
  id: string;
  name: string;
  ext: 'PDF' | 'XLS' | 'PPT' | 'DOCX';
  size: string;
}

interface StagedFile {
  id: string;
  name: string;
  kind: 'image' | 'video' | 'doc';
  thumbUrl?: string;
  ext?: string;
  uploading?: boolean;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

function img(seed: string, w = 400, h = 300) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const FOLDERS: FolderDef[] = [
  {
    id: 'menu',
    name: 'Menu',
    items: [
      { id: 'menu-1', name: 'appetizers.jpg',      kind: 'image', thumbUrl: img('food20') },
      { id: 'menu-2', name: 'pasta_special.jpg',    kind: 'image', thumbUrl: img('food21') },
      { id: 'menu-3', name: 'wood_fire_pizza.jpg',  kind: 'image', thumbUrl: img('food22') },
      { id: 'menu-4', name: 'salad_bowl.jpg',       kind: 'image', thumbUrl: img('food23') },
      { id: 'menu-5', name: 'desserts.jpg',         kind: 'image', thumbUrl: img('food24') },
      { id: 'menu-6', name: 'cocktails.jpg',        kind: 'image', thumbUrl: img('food25') },
      { id: 'menu-7', name: 'brunch_board.jpg',     kind: 'image', thumbUrl: img('food26') },
      { id: 'menu-v1', name: 'menu_tour.mp4',       kind: 'video', thumbUrl: img('food27') },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    items: [
      { id: 'rest-1', name: 'main_dining.jpg',      kind: 'image', thumbUrl: img('restaurant10') },
      { id: 'rest-2', name: 'bar_area.jpg',         kind: 'image', thumbUrl: img('restaurant11') },
      { id: 'rest-3', name: 'patio_seating.jpg',    kind: 'image', thumbUrl: img('restaurant12') },
      { id: 'rest-4', name: 'private_room.jpg',     kind: 'image', thumbUrl: img('restaurant13') },
      { id: 'rest-5', name: 'kitchen_open.jpg',     kind: 'image', thumbUrl: img('restaurant14') },
      { id: 'rest-v1', name: 'tour_video.mp4',      kind: 'video', thumbUrl: img('restaurant15') },
    ],
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    items: [
      { id: 'thx-1', name: 'feast_table.jpg',       kind: 'image', thumbUrl: img('autumn10') },
      { id: 'thx-2', name: 'turkey_roast.jpg',      kind: 'image', thumbUrl: img('autumn11') },
      { id: 'thx-3', name: 'pumpkin_pie.jpg',       kind: 'image', thumbUrl: img('autumn12') },
      { id: 'thx-4', name: 'harvest_decor.jpg',     kind: 'image', thumbUrl: img('autumn13') },
      { id: 'thx-5', name: 'family_dining.jpg',     kind: 'image', thumbUrl: img('autumn14') },
      { id: 'thx-6', name: 'cranberry_sauce.jpg',   kind: 'image', thumbUrl: img('autumn15') },
      { id: 'thx-7', name: 'stuffing_dish.jpg',     kind: 'image', thumbUrl: img('autumn16') },
      { id: 'thx-8', name: 'candied_yams.jpg',      kind: 'image', thumbUrl: img('autumn17') },
      { id: 'thx-9', name: 'cornbread.jpg',         kind: 'image', thumbUrl: img('autumn18') },
      { id: 'thx-10', name: 'tablescape.jpg',       kind: 'image', thumbUrl: img('autumn19') },
      { id: 'thx-11', name: 'apple_cider.jpg',      kind: 'image', thumbUrl: img('autumn20') },
      { id: 'thx-v1', name: 'feast_recap.mp4',      kind: 'video', thumbUrl: img('autumn21') },
    ],
  },
  {
    id: 'brand',
    name: 'Brand images',
    items: [
      { id: 'brand-1', name: 'logo_primary.png',    kind: 'image', thumbUrl: img('brand10') },
      { id: 'brand-2', name: 'logo_white.png',      kind: 'image', thumbUrl: img('brand11') },
      { id: 'brand-3', name: 'hero_banner.jpg',     kind: 'image', thumbUrl: img('brand12') },
      { id: 'brand-4', name: 'team_photo.jpg',      kind: 'image', thumbUrl: img('brand13') },
      { id: 'brand-5', name: 'storefront.jpg',      kind: 'image', thumbUrl: img('brand14') },
      { id: 'brand-v1', name: 'brand_story.mp4',    kind: 'video', thumbUrl: img('brand15') },
    ],
  },
];

// Loose assets shown in "All other assets" table
const LOOSE_ASSETS: (MediaItem & { type2?: string })[] = [
  { id: 'loose-1', name: 'cheese_burst_pizza.jpg',  kind: 'image', thumbUrl: img('pizza1', 200, 200) },
  { id: 'loose-2', name: 'cheese_burst_pizza2.jpg', kind: 'image', thumbUrl: img('pizza2', 200, 200) },
  { id: 'loose-3', name: 'restaurant_hero.jpg',     kind: 'image', thumbUrl: img('pizza3', 200, 200) },
  { id: 'loose-4', name: 'pepperoni_slice.gif',     kind: 'image', thumbUrl: img('pizza4', 200, 200) },
  { id: 'loose-5', name: 'wood_fired_pizza.mp4',    kind: 'video', thumbUrl: img('pizza5', 200, 200) },
  { id: 'loose-6', name: 'pizza_combo_offer.png',   kind: 'image', thumbUrl: img('pizza6', 200, 200) },
];

const DOC_FILES: DocFile[] = [
  { id: 'doc-pdf-1',  name: 'Product list.PDF',      ext: 'PDF',  size: '2.4 MB' },
  { id: 'doc-xls-1',  name: 'Product list.XLS',      ext: 'XLS',  size: '856 KB' },
  { id: 'doc-ppt-1',  name: 'Product list.PPT',      ext: 'PPT',  size: '14.2 MB' },
  { id: 'doc-pdf-2',  name: 'Menu Q4 2024.PDF',      ext: 'PDF',  size: '1.1 MB' },
  { id: 'doc-docx-1', name: 'Brand guidelines.DOCX', ext: 'DOCX', size: '3.8 MB' },
];

const RECENT_UPLOADS: StagedFile[] = [
  { id: 'rec-1', name: 'cheese_burst_pizza.mp4',  kind: 'video', thumbUrl: img('pizza7', 200, 200) },
  { id: 'rec-2', name: 'cheese_burst_pizza.jpg',   kind: 'image', thumbUrl: img('pizza8', 200, 200) },
  { id: 'rec-3', name: 'Product list.PDF',          kind: 'doc',  ext: 'PDF' },
  { id: 'rec-4', name: 'Product list.PPT',          kind: 'doc',  ext: 'PPT' },
  { id: 'rec-5', name: 'Product list.XLS',          kind: 'doc',  ext: 'XLS' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, string> = {
  PDF: '#E53935', XLS: '#1E7E34', PPT: '#D04A04', DOCX: '#1565C0',
};

function ExtBadge({ ext, size = 32 }: { ext: string; size?: number }) {
  const bg = EXT_COLORS[ext.toUpperCase()] ?? '#888';
  return (
    <div
      className="flex items-center justify-center rounded-md text-white flex-shrink-0 text-[9px]"
      style={{ width: size, height: size, background: bg }}
    >
      {ext.toUpperCase()}
    </div>
  );
}

// ── Checkbox (matches Aero DS style) ──────────────────────────────────────────

function AeroCheckbox({
  checked,
  onChange,
  indeterminate = false,
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex-shrink-0 size-[18px] rounded-[3px] border transition-colors flex items-center justify-center',
        checked || indeterminate
          ? 'bg-primary border-primary'
          : 'bg-surface border-border hover:border-primary/60',
      )}
    >
      {checked && <Check size={11} strokeWidth={2} className="text-white" />}
      {!checked && indeterminate && (
        <div className="w-[8px] h-[2px] rounded-full bg-white" />
      )}
    </button>
  );
}

// ── Folder card ────────────────────────────────────────────────────────────────

function FolderCard({
  folder,
  selectedCount,
  onClick,
  onToggleAll,
}: {
  folder: FolderDef;
  selectedCount: number;
  onClick: () => void;
  onToggleAll: () => void;
}) {
  const previews = folder.items.slice(0, 4);
  const extra = folder.items.length - 4;
  const allSelected = selectedCount === folder.items.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-sm text-left group focus:outline-none"
      style={{ width: 216 }}
    >
      {/* Card thumbnail */}
      <div
        className={cn(
          'relative overflow-hidden rounded-[8px] border transition-colors',
          selectedCount > 0
            ? 'border-primary/50'
            : 'border-[#e5e9f0] group-hover:border-primary/40',
        )}
        style={{ width: 216, height: 216, background: '#f2f4f7' }}
      >
        <div className="grid grid-cols-2 gap-sm absolute inset-[10px]">
          {previews.map((item, i) => (
            <div
              key={item.id}
              className="relative rounded-[4px] overflow-hidden border border-[#e5e9f0] bg-white"
            >
              <img
                src={item.thumbUrl}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              {item.kind === 'video' && (
                <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 flex items-center gap-0.5">
                  <Play size={8} strokeWidth={1.6} absoluteStrokeWidth className="text-white fill-white" />
                </div>
              )}
              {i === 3 && extra > 0 && (
                <div className="absolute inset-0 bg-[#e5e9f0]/80 flex items-center justify-center">
                  <span className="text-[16px] text-text-primary">+{extra}</span>
                </div>
              )}
            </div>
          ))}
          {/* Fill empty cells */}
          {Array.from({ length: Math.max(0, 4 - previews.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-[4px] bg-[#e5e9f0]" />
          ))}
        </div>

        {/* Checkbox — top-left overlay */}
        <div
          className="absolute top-2 left-2"
          onClick={e => { e.stopPropagation(); onToggleAll(); }}
        >
          <AeroCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={onToggleAll}
          />
        </div>

        {/* Count badge — top-right */}
        {selectedCount > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-white text-[11px] rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
            {selectedCount}
          </div>
        )}
      </div>
      <span className="text-body text-text-primary">{folder.name}</span>
    </button>
  );
}

// ── Selectable media tile (inside open folder) ─────────────────────────────────

function MediaTile({
  item,
  selected,
  onToggle,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative rounded-[4px] overflow-hidden aspect-square focus:outline-none transition-all',
        selected
          ? 'ring-2 ring-primary ring-offset-1'
          : 'ring-1 ring-[#e5e9f0] hover:ring-primary/50',
      )}
    >
      <img
        src={item.thumbUrl}
        alt={item.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {item.kind === 'video' && (
        <div className="absolute bottom-1 left-1 bg-black/55 rounded px-1 py-0.5 flex items-center gap-1">
          <Play size={8} strokeWidth={1.6} absoluteStrokeWidth className="text-white fill-white" />
          <span className="text-[9px] text-white">Video</span>
        </div>
      )}
      {selected && (
        <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-primary flex items-center justify-center shadow">
          <Check size={11} strokeWidth={2} className="text-white" />
        </div>
      )}
    </button>
  );
}

// ── Tab: Media library ─────────────────────────────────────────────────────────

function MediaLibraryTab({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [openFolder, setOpenFolder] = useState<FolderDef | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  function toggleFolderAll(folder: FolderDef) {
    const allSelected = folder.items.every(i => selected.has(i.id));
    folder.items.forEach(item => {
      const isSelected = selected.has(item.id);
      if (allSelected ? isSelected : !isSelected) onToggle(item.id);
    });
  }

  if (openFolder) {
    const folderSelected = openFolder.items.filter(i => selected.has(i.id));
    const allSelected = openFolder.items.every(i => selected.has(i.id));

    return (
      <div className="flex flex-col gap-md">
        {/* Breadcrumb */}
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setOpenFolder(null)}
            className="flex items-center gap-xs text-small text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.6} absoluteStrokeWidth />
            Back
          </button>
          <span className="text-text-tertiary text-small">/</span>
          <span className="text-small text-text-primary">{openFolder.name}</span>
          {folderSelected.length > 0 && (
            <span className="ml-auto text-small text-text-secondary">
              {folderSelected.length} selected
            </span>
          )}
        </div>

        {/* 4-column image grid */}
        <div className="grid grid-cols-4 gap-sm">
          {openFolder.items.map(item => (
            <MediaTile
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onToggle={() => onToggle(item.id)}
            />
          ))}
        </div>

        {/* Select all / count */}
        <div className="flex items-center justify-between pt-sm border-t border-border">
          <button
            type="button"
            onClick={() => {
              openFolder.items.forEach(i => {
                if (allSelected === selected.has(i.id)) onToggle(i.id);
              });
            }}
            className="text-small text-primary hover:underline"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-small text-text-secondary">{openFolder.items.length} items</span>
        </div>
      </div>
    );
  }

  // Root: folders + all other assets
  return (
    <div className="flex flex-col gap-xl">
      {/* Folders */}
      <div className="flex flex-col gap-sm">
        <p className="text-small text-text-primary">Folders</p>
        <div className="flex gap-md flex-wrap">
          {FOLDERS.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              selectedCount={folder.items.filter(i => selected.has(i.id)).length}
              onClick={() => setOpenFolder(folder)}
              onToggleAll={() => toggleFolderAll(folder)}
            />
          ))}
        </div>
      </div>

      {/* All other assets */}
      <div className="flex flex-col gap-sm">
        {/* Section header with view toggle */}
        <div className="flex items-center justify-between">
          <p className="text-small text-text-primary">All other assets</p>
          {/* View switcher — MYNA shared-chrome pattern */}
          <div className="flex h-[30px] items-center gap-xs rounded-sm border border-border-selected bg-surface px-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex size-[22px] items-center justify-center rounded-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-surface-selected text-text-primary'
                  : 'text-text-icon hover:bg-surface-hover',
              )}
            >
              <LayoutGrid size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex size-[22px] items-center justify-center rounded-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-surface-selected text-text-primary'
                  : 'text-text-icon hover:bg-surface-hover',
              )}
            >
              <List size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="flex flex-col">
            {LOOSE_ASSETS.map(asset => (
              <AssetRow
                key={asset.id}
                id={asset.id}
                name={asset.name}
                thumb={asset.thumbUrl}
                isVideo={asset.kind === 'video'}
                checked={selected.has(asset.id)}
                onToggle={() => onToggle(asset.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-sm">
            {LOOSE_ASSETS.map(asset => (
              <MediaTile
                key={asset.id}
                item={{ id: asset.id, name: asset.name, kind: asset.kind, thumbUrl: asset.thumbUrl }}
                selected={selected.has(asset.id)}
                onToggle={() => onToggle(asset.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared asset row (used by media + files tabs) ──────────────────────────────

function AssetRow({
  id,
  name,
  thumb,
  ext,
  isVideo,
  checked,
  onToggle,
}: {
  id: string;
  name: string;
  thumb?: string;
  ext?: string;
  isVideo?: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-md px-0 py-sm border-b border-[#eaeaea] transition-colors',
        checked ? 'bg-primary/[0.03]' : 'hover:bg-surface-hover',
      )}
    >
      <AeroCheckbox checked={checked} onChange={onToggle} />

      {/* Thumbnail or ext badge */}
      {thumb ? (
        <div className="relative size-[50px] rounded-[4px] overflow-hidden flex-shrink-0 border border-[#e5e9f0] bg-white">
          <img src={thumb} alt={name} className="w-full h-full object-cover" loading="lazy" />
          {isVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-white fill-white" />
            </div>
          )}
        </div>
      ) : ext ? (
        <ExtBadge ext={ext} size={50} />
      ) : null}

      <span className="text-body text-text-primary truncate">{name}</span>
    </div>
  );
}

// ── Tab: Files ─────────────────────────────────────────────────────────────────

function FilesTab({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {DOC_FILES.map(file => (
        <AssetRow
          key={file.id}
          id={file.id}
          name={`${file.name}  ·  ${file.size}`}
          ext={file.ext}
          checked={selected.has(file.id)}
          onToggle={() => onToggle(file.id)}
        />
      ))}
    </div>
  );
}

// ── Tab: Upload ────────────────────────────────────────────────────────────────

function UploadTab({ onFilesAdded }: { onFilesAdded: (names: string[]) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function detectKind(name: string): StagedFile['kind'] {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
    return 'doc';
  }

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles: StagedFile[] = Array.from(files).map(f => ({
      id: `staged-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      kind: detectKind(f.name),
      ext: f.name.split('.').pop()?.toUpperCase(),
      thumbUrl: detectKind(f.name) === 'image' ? URL.createObjectURL(f) : undefined,
      uploading: true,
    }));
    setStaged(prev => [...prev, ...newFiles]);
    setTimeout(() => {
      setStaged(prev => prev.map(s =>
        newFiles.find(n => n.id === s.id) ? { ...s, uploading: false } : s,
      ));
      onFilesAdded(newFiles.map(s => s.name));
    }, 800);
  }, [onFilesAdded]);

  return (
    <div className="flex flex-col gap-lg">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); }}
        className={cn(
          'w-full rounded-[8px] border-2 border-dashed flex flex-col items-center gap-sm py-2xl transition-all',
          isDragOver
            ? 'border-primary/60 bg-primary/5 scale-[0.99]'
            : 'border-border hover:border-primary/40 hover:bg-surface-hover',
        )}
      >
        <div className={cn(
          'size-[40px] rounded-full flex items-center justify-center transition-colors',
          isDragOver ? 'bg-primary/10' : 'bg-surface-muted',
        )}>
          <Upload size={18} strokeWidth={1.6} absoluteStrokeWidth className={isDragOver ? 'text-primary' : 'text-text-secondary'} />
        </div>
        <p className="text-body text-text-primary">Drop files or click to browse</p>
        <p className="text-small text-text-secondary">.pdf · .docx · .txt · .png · .jpg · .mp4</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx,.ppt,.pptx,.mp4,.mov"
        className="hidden"
        onChange={e => processFiles(e.target.files)}
      />

      {/* Staged */}
      {staged.length > 0 && (
        <div className="flex flex-col gap-xs">
          <p className="text-small text-text-secondary">Just uploaded</p>
          {staged.map(file => (
            <div
              key={file.id}
              className={cn(
                'flex items-center gap-md px-md py-sm rounded-md border transition-colors',
                file.uploading ? 'border-border bg-surface-muted' : 'border-primary/20 bg-primary/5',
              )}
            >
              {file.kind === 'image' && file.thumbUrl ? (
                <img src={file.thumbUrl} alt={file.name} className="size-8 rounded object-cover flex-shrink-0" />
              ) : file.kind === 'video' ? (
                <div className="size-8 rounded bg-surface-muted flex items-center justify-center flex-shrink-0">
                  <Film size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary" />
                </div>
              ) : (
                <ExtBadge ext={file.ext ?? 'FILE'} size={32} />
              )}
              <span className="flex-1 text-body text-text-primary truncate">{file.name}</span>
              {file.uploading
                ? <div className="size-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin flex-shrink-0" />
                : <Check size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-primary flex-shrink-0" />
              }
            </div>
          ))}
        </div>
      )}

      {/* Recent uploads — no checkboxes */}
      <div className="flex flex-col gap-xs">
        <p className="text-small text-text-secondary">Recent uploads</p>
        <div className="flex flex-col">
          {RECENT_UPLOADS.map(file => (
            <div key={file.id} className="flex items-center gap-md py-sm border-b border-[#eaeaea]">
              {file.kind === 'image' && file.thumbUrl ? (
                <img src={file.thumbUrl} alt={file.name} className="size-[50px] rounded-[4px] object-cover flex-shrink-0 border border-[#e5e9f0]" />
              ) : file.kind === 'video' && file.thumbUrl ? (
                <div className="relative size-[50px] rounded-[4px] overflow-hidden flex-shrink-0 border border-[#e5e9f0]">
                  <img src={file.thumbUrl} alt={file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-white fill-white" />
                  </div>
                </div>
              ) : (
                <ExtBadge ext={file.ext ?? 'FILE'} size={50} />
              )}
              <span className="text-body text-text-primary truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── All selectable items index ─────────────────────────────────────────────────

interface SelectableItem { name: string; thumbUrl?: string; kind?: AttachedFile['kind'] }

const ALL_ITEMS: Record<string, SelectableItem> = {
  ...Object.fromEntries(
    FOLDERS.flatMap(f => f.items.map(i => [i.id, { name: i.name, thumbUrl: i.thumbUrl, kind: i.kind } as SelectableItem]))
  ),
  ...Object.fromEntries(
    LOOSE_ASSETS.map(i => [i.id, { name: i.name, thumbUrl: i.thumbUrl, kind: i.kind } as SelectableItem])
  ),
  ...Object.fromEntries(
    DOC_FILES.map(i => [i.id, { name: i.name, kind: 'doc' as const } as SelectableItem])
  ),
};

// ── Main modal ─────────────────────────────────────────────────────────────────

type TabId = 'media' | 'files' | 'upload';

export function AttachmentPickerModal({
  open,
  onClose,
  onSave,
  initialSelected = [],
}: AttachmentPickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('media');

  const [selected, setSelected] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    initialSelected.forEach(name => {
      const entry = Object.entries(ALL_ITEMS).find(([, v]) => v.name === name);
      if (entry) ids.add(entry[0]);
    });
    return ids;
  });

  const [uploadedNames, setUploadedNames] = useState<string[]>([]);

  function toggleSelection(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSave() {
    const fromSelected: AttachedFile[] = Array.from(selected)
      .map(id => ALL_ITEMS[id])
      .filter(Boolean)
      .map(item => ({ name: item.name, thumbUrl: item.thumbUrl, kind: item.kind }));

    const uploadedFiles: AttachedFile[] = uploadedNames.map(name => ({ name, kind: 'doc' as const }));

    // Deduplicate by name
    const seen = new Set<string>();
    const all = [...fromSelected, ...uploadedFiles].filter(f => {
      if (seen.has(f.name)) return false;
      seen.add(f.name);
      return true;
    });
    onSave(all);
    onClose();
  }

  const totalCount = selected.size + uploadedNames.length;

  const TABS = [
    { id: 'media' as TabId,  label: 'Media library' },
    { id: 'files' as TabId,  label: 'Files' },
    { id: 'upload' as TabId, label: 'Upload' },
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative z-10 flex flex-col bg-surface rounded-[4px] shadow-modal overflow-hidden"
        style={{ width: 'min(1200px, 95vw)', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2xl py-md flex-shrink-0 bg-surface">
          <p className="text-[16px] text-text-primary tracking-[-0.32px]">Attachments</p>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <X size={16} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        {/* Tabs bar */}
        <div className="px-2xl flex-shrink-0">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={id => setActiveTab(id as TabId)}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#eaeaea] flex-shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2xl py-xl">
          {activeTab === 'media' && (
            <MediaLibraryTab selected={selected} onToggle={toggleSelection} />
          )}
          {activeTab === 'files' && (
            <FilesTab selected={selected} onToggle={toggleSelection} />
          )}
          {activeTab === 'upload' && (
            <UploadTab onFilesAdded={names => setUploadedNames(prev => [...new Set([...prev, ...names])])} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-2xl py-md border-t border-[#eaeaea] flex-shrink-0 bg-surface">
          <p className="text-[16px] text-text-primary tracking-[-0.32px]">
            {totalCount > 0 ? `${totalCount} file${totalCount === 1 ? '' : 's'} selected` : ''}
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
