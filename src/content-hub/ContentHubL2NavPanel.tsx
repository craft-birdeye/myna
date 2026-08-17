import React from 'react';
import {
  FolderPlus, FileText, Share2, Mail,
  MessageSquare, Monitor, Video, Plus,
} from 'lucide-react';
import {
  L2NavLayout,
  FOOTER_ROW_CLS,
  L2_HEADER_PLUS_WRAPPER_BLUE,
  L2_HEADER_PLUS_GLYPH_BLUE,
  L2_HEADER_PLUS_STROKE_PX,
} from '@/contenthub-ui/L2NavLayout';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/contenthub-ui/dropdown-menu';
import type { ContentHomeInitialMode } from '@/content-hub/ContentHome';

export type ContentHubSubView =
  | 'content-hub-home'
  | 'content-hub-projects'
  | 'content-hub-templates'
  | 'content-hub-calendar'
  | 'content-hub-assigned'
  | 'content-hub-approve'
  | 'content-hub-fix'
  | 'content-hub-agents-faq'
  | 'content-hub-agents-blog';

interface ContentHubL2NavPanelProps {
  activeItem: string;
  onActiveItemChange: (key: string, view: ContentHubSubView) => void;
  /** Called when user picks a creation mode from the + dropdown */
  onCreate?: (mode: ContentHomeInitialMode) => void;
  /** @deprecated use onCreate */
  onCreateProject?: () => void;
}

const LABEL_TO_VIEW: Record<string, ContentHubSubView> = {
  'Home':                        'content-hub-home',
  'Projects':                    'content-hub-projects',
  'View all contents':           'content-hub-projects',
  'Templates':                   'content-hub-templates',
  'Calendar':                    'content-hub-calendar',
  'Assigned to me':              'content-hub-assigned',
  'Awaiting approval':           'content-hub-approve',
  'Fix content':                 'content-hub-fix',
  'Drafts':                      'content-hub-projects',
  'FAQ generation agents':       'content-hub-agents-faq',
  'Blog recommendation agents':  'content-hub-agents-blog',
};

// ── Create dropdown options ────────────────────────────────────────────────────

const CREATE_ITEMS: {
  mode: ContentHomeInitialMode;
  label: string;
  icon: React.ElementType;
  accent?: boolean;
  enabled?: boolean;
}[] = [
  { mode: 'project', label: 'Project',        icon: FolderPlus,    enabled: true },
  { mode: 'blog',    label: 'Blog post',       icon: FileText,      enabled: true },
  { mode: 'faq',     label: 'FAQs',            icon: MessageSquare, enabled: true },
  { mode: 'social',  label: 'Social post',     icon: Share2 },
  { mode: 'email',   label: 'Email campaign',  icon: Mail },
  { mode: 'brief',   label: 'Landing page',    icon: Monitor },
  { mode: 'brief',   label: 'Video post',      icon: Video },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ContentHubL2NavPanel({
  activeItem,
  onActiveItemChange,
  onCreate,
  onCreateProject,
}: ContentHubL2NavPanelProps) {

  const handleActiveItemChange = (key: string) => {
    let label: string;
    if (key.startsWith('standalone/')) {
      label = key.replace('standalone/', '');
    } else {
      const slashIdx = key.indexOf('/');
      label = slashIdx !== -1 ? key.slice(slashIdx + 1) : key;
    }
    const view = LABEL_TO_VIEW[label];
    if (view) onActiveItemChange(key, view);
  };

  const handleCreate = (mode: ContentHomeInitialMode) => {
    if (onCreate) onCreate(mode);
    else onCreateProject?.();
  };

  const createDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={FOOTER_ROW_CLS}
          style={{ fontSize: 14 }}
        >
          <span className="text-[14px]">Create new</span>
          <div className={L2_HEADER_PLUS_WRAPPER_BLUE}>
            <Plus
              className={L2_HEADER_PLUS_GLYPH_BLUE}
              strokeWidth={L2_HEADER_PLUS_STROKE_PX}
              absoluteStrokeWidth
              aria-hidden
            />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="start" className="w-[220px] p-2">

        {CREATE_ITEMS.map((opt) => (
          <DropdownMenuItem
            key={opt.label}
            onClick={(event) => {
              if (!opt.enabled) {
                event.preventDefault();
                return;
              }
              handleCreate(opt.mode);
            }}
            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer"
          >
            {/* Icon container — matches reference: ~36px, soft primary tint bg */}
            <div className={`size-[34px] rounded-lg flex items-center justify-center shrink-0 ${
              opt.accent ? 'bg-primary/15' : 'bg-primary/[0.07]'
            }`}>
              <opt.icon
                size={18}
                strokeWidth={1.6}
                absoluteStrokeWidth
                className={opt.accent ? 'text-primary' : 'text-foreground/70'}
              />
            </div>
            <span className={`text-[13.5px] font-normal ${opt.accent ? 'text-primary' : 'text-foreground'}`}>
              {opt.label}
            </span>
          </DropdownMenuItem>
        ))}

      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <L2NavLayout
      headerSlot={createDropdown}
      sections={[
        {
          label: 'Human actions',
          children: [
            { label: 'View all contents', key: 'Projects' },
            'Assigned to me',
            'Awaiting approval',
            'Fix content',
          ],
        },
        {
          label: 'Outcomes',
          children: [
            { label: 'Content published',  key: 'outcomes-content-published',  nonNav: true },
            { label: 'AEO score impact',   key: 'outcomes-aeo-score-impact',   nonNav: true },
            { label: 'Content engagement', key: 'outcomes-content-engagement', nonNav: true },
            { label: 'Reports',            key: 'outcomes-reports',            nonNav: true, external: true },
          ],
        },
        {
          label: 'Resources',
          children: [
            { label: 'Brand identity', key: 'resources-brand-identity', nonNav: true, external: true },
            { label: 'Approvals',      key: 'resources-approvals',      nonNav: true, external: true },
            { label: 'Media library',  key: 'resources-media-library',  nonNav: true, external: true },
            { label: 'Files',          key: 'resources-files',          nonNav: true, external: true },
            { label: 'Links',          key: 'resources-links',          nonNav: true, external: true },
            { label: 'Tags',           key: 'resources-tags',           nonNav: true },
          ],
        },
      ]}
      activeItem={activeItem}
      onActiveItemChange={handleActiveItemChange}
      defaultActive="Human actions/Projects"
      defaultExpandedSections={['Human actions']}
      data-no-print
    />
  );
}
