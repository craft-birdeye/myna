import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Braces,
  CheckCircle2,
  Code,
  Copy,
  Download,
  File,
  FileText,
  Image,
  Link2,
  Mail,
  MessageSquare,
  Monitor,
  Presentation,
  Share2,
  Table,
  Video,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/contenthub-ui/dialog';
import { Button } from '@/contenthub-ui/button';
import { Checkbox } from '@/contenthub-ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';
import { cn } from '@/contenthub-ui/utils';
import { TextTabsRow } from '@/contenthub-ui/text-tabs';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';

type ShareTab = 'collaborate' | 'download' | 'embed';
type Permission = 'View only' | 'Comment' | 'Edit';

export type ProjectItemType = 'blog' | 'social' | 'email' | 'faq' | 'landing' | 'video';

export interface ProjectDownloadItem {
  id: string;
  itemType: ProjectItemType;
  label: string;
}

interface ContentShareModalProps {
  open: boolean;
  onClose: () => void;
  contentTitle?: string;
  shareUrl?: string;
  initialTab?: ShareTab;
  /** When provided, the Download tab shows per-item format selection (project mode) */
  projectItems?: ProjectDownloadItem[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  permission: Permission;
  isOwner?: boolean;
}

const TABS: { id: ShareTab; label: string }[] = [
  { id: 'download', label: 'Download' },
  { id: 'collaborate', label: 'Share' },
  { id: 'embed', label: 'Embed' },
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'you',  name: 'You',         email: 'Owner',                permission: 'Edit',      isOwner: true },
  { id: 'maya', name: 'Maya Singh',  email: 'maya@company.com',     permission: 'Edit'      },
  { id: 'jon',  name: 'Jon Bell',    email: 'jon@company.com',      permission: 'Comment'   },
  { id: 'nina', name: 'Nina Patel',  email: 'nina@company.com',     permission: 'View only' },
];

const DOWNLOAD_OPTIONS = [
  { id: 'png',  label: 'PNG',  icon: Image       },
  { id: 'pdf',  label: 'PDF',  icon: FileText     },
  { id: 'docx', label: 'DOCX', icon: File         },
  { id: 'xls',  label: 'XLS',  icon: Table        },
  { id: 'html', label: 'HTML', icon: Code         },
  { id: 'json', label: 'JSON', icon: Braces       },
  { id: 'ppt',  label: 'PPT',  icon: Presentation },
];

// Per-type format options shown in project download mode
const ITEM_TYPE_FORMATS: Record<ProjectItemType, { id: string; label: string }[]> = {
  blog:    [{ id: 'docx', label: 'DOCX' }, { id: 'pdf', label: 'PDF' }, { id: 'html', label: 'HTML' }],
  social:  [{ id: 'png',  label: 'PNG'  }, { id: 'pdf', label: 'PDF' }],
  email:   [{ id: 'html', label: 'HTML' }, { id: 'pdf', label: 'PDF' }, { id: 'docx', label: 'DOCX' }],
  faq:     [{ id: 'html', label: 'HTML' }, { id: 'json', label: 'JSON' }, { id: 'pdf', label: 'PDF' }],
  landing: [{ id: 'html', label: 'HTML' }, { id: 'pdf', label: 'PDF' }],
  video:   [{ id: 'pdf',  label: 'PDF'  }],
};

const ITEM_TYPE_DEFAULT_FORMAT: Record<ProjectItemType, string> = {
  blog:    'docx',
  social:  'png',
  email:   'html',
  faq:     'html',
  landing: 'html',
  video:   'pdf',
};

const ITEM_TYPE_ICON: Record<ProjectItemType, React.ElementType> = {
  blog:    FileText,
  social:  Share2,
  email:   Mail,
  faq:     MessageSquare,
  landing: Monitor,
  video:   Video,
};

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-primary/10 text-primary',
  'bg-primary/10 text-violet-700',
  'bg-primary/10 text-text-primary',
  'bg-surface-hover text-text-secondary',
  'bg-rose-100 text-rose-700',
];

function Avatar({ name, index }: { name: string; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className={cn('flex size-[34px] shrink-0 items-center justify-center rounded-full text-[11px]', color)}>
      {initials(name)}
    </div>
  );
}

function PermissionSelect({
  value,
  onChange,
}: {
  value: Permission;
  onChange: (value: Permission) => void;
}) {
  return (
    <Select value={value} onValueChange={next => onChange(next as Permission)}>
      <SelectTrigger className="h-[32px] w-[112px] border-border bg-background text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="View only">View only</SelectItem>
        <SelectItem value="Comment">Comment</SelectItem>
        <SelectItem value="Edit">Edit</SelectItem>
      </SelectContent>
    </Select>
  );
}

function CopyButton({
  text,
  copied,
  onCopy,
  children,
  variant = 'default',
}: {
  text: string;
  copied: boolean;
  onCopy: (text: string) => void;
  children: ReactNode;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button type="button" variant={variant} onClick={() => onCopy(text)} className="h-[32px] px-2 text-[12px] shrink-0">
      {copied ? <CheckCircle2 size={14} strokeWidth={1.6} absoluteStrokeWidth /> : <Copy size={14} strokeWidth={1.6} absoluteStrokeWidth />}
      {copied ? 'Copied' : children}
    </Button>
  );
}

export function ContentShareModal({
  open,
  onClose,
  contentTitle = 'New FAQ page',
  shareUrl = 'https://contenthub.birdeye.com/share/faq-set-001',
  initialTab = 'collaborate',
  projectItems,
}: ContentShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>(initialTab);
  useEffect(() => { if (open) setActiveTab(initialTab); }, [open, initialTab]);

  // Project download state — format selection and item selection
  const [itemFormats, setItemFormats] = useState<Record<string, string>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !projectItems) return;
    const formats: Record<string, string> = {};
    const selected = new Set<string>();
    projectItems.forEach(item => {
      formats[item.id] = ITEM_TYPE_DEFAULT_FORMAT[item.itemType];
      selected.add(item.id);
    });
    setItemFormats(formats);
    setSelectedItemIds(selected);
  }, [open, projectItems]);

  // Invite chip state
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [pendingPermission, setPendingPermission] = useState<Permission>('View only');

  // Member list state
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  // Link access
  const [linkAccess, setLinkAccess] = useState<'anyone' | 'invited'>('anyone');
  const [linkPermission, setLinkPermission] = useState<Permission>('View only');

  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" style="border:0;min-height:480px" loading="lazy"></iframe>`;

  function copyText(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function addChip(raw: string) {
    const email = raw.trim().replace(/,$/, '');
    if (!email || pendingEmails.includes(email)) return;
    setPendingEmails(prev => [...prev, email]);
    setInputValue('');
  }

  function removeChip(index: number) {
    setPendingEmails(prev => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && pendingEmails.length > 0) {
      setPendingEmails(prev => prev.slice(0, -1));
    }
  }

  function handleInvite() {
    if (pendingEmails.length === 0) return;
    const newMembers: Member[] = pendingEmails.map((email, i) => ({
      id: `invited-${Date.now()}-${i}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      permission: pendingPermission,
    }));
    setMembers(prev => [...prev, ...newMembers]);
    setPendingEmails([]);
    setInputValue('');
  }

  const visibleMembers = useMemo(
    () => members.filter(m => !m.isOwner),
    [members],
  );
  const ownerMember = members.find(m => m.isOwner);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="!w-[960px] !max-w-[calc(100vw-32px)] flex flex-col gap-0 overflow-hidden p-0 h-[580px] !top-[50px] !translate-y-0">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Share content</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="shrink-0 px-6">
          <TextTabsRow<ShareTab>
            items={TABS.map(tab => ({ id: tab.id, label: tab.label }))}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'collaborate' && (
            <div className="space-y-6">
              {/* Chip invite input */}
              <div
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 cursor-text focus-within:border-primary/60 transition-colors min-h-[44px]"
                onClick={() => inputRef.current?.focus()}
              >
                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                  {pendingEmails.map((email, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-md bg-muted pl-2 pr-1 py-1 text-[12px] text-foreground"
                    >
                      <span className="max-w-[180px] truncate">{email}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeChip(i); }}
                        className="flex items-center justify-center size-4 rounded text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${email}`}
                      >
                        <X size={11} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => { if (inputValue.trim()) addChip(inputValue); }}
                    placeholder={pendingEmails.length === 0 ? 'Search teammates or enter an email' : ''}
                    className="h-[34px] min-w-[160px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Select value={pendingPermission} onValueChange={v => setPendingPermission(v as Permission)}>
                    <SelectTrigger className="h-[32px] w-[108px] border-border bg-background text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="View only">Can view</SelectItem>
                      <SelectItem value="Comment">Can comment</SelectItem>
                      <SelectItem value="Edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleInvite}
                    disabled={pendingEmails.length === 0}
                    className="h-[32px] px-2 text-[12px]"
                  >
                    Invite
                  </Button>
                </div>
              </div>

              {/* Who has access */}
              <div>
                <p className="mb-2 text-[12px] text-muted-foreground">Who has access</p>
                <div className="rounded-xl border border-border/70 divide-y divide-border">
                  {/* URL + copy — primary action at the top */}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <Link2 size={14} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-muted-foreground" />
                    <input
                      readOnly
                      value={shareUrl}
                      className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none"
                    />
                    <CopyButton text={shareUrl} copied={copied} onCopy={copyText} variant="outline">
                      Copy link
                    </CopyButton>
                  </div>

                  {/* Access settings — secondary, below the link */}
                  <div className="flex items-center justify-between gap-4 px-4 py-2">
                    <p className="text-[13px] text-muted-foreground">Who can open this link</p>
                    <div className="flex items-center gap-2">
                      {linkAccess === 'anyone' && (
                        <PermissionSelect value={linkPermission} onChange={setLinkPermission} />
                      )}
                      <Select value={linkAccess} onValueChange={v => setLinkAccess(v as 'anyone' | 'invited')}>
                        <SelectTrigger className="h-[32px] w-[178px] border-border bg-background text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="anyone">Anyone with the link</SelectItem>
                          <SelectItem value="invited">Only invited users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Owner row */}
                  {ownerMember && (
                    <div className="flex items-center justify-between gap-4 px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={ownerMember.name} index={0} />
                        <div>
                          <p className="text-[13px] text-foreground">{ownerMember.name}</p>
                          <p className="text-[12px] text-muted-foreground">{ownerMember.email}</p>
                        </div>
                      </div>
                      <span className="text-[12px] text-muted-foreground">Full access</span>
                    </div>
                  )}

                  {/* Invited member rows */}
                  {visibleMembers.map((member, i) => (
                    <div key={member.id} className="group flex items-center justify-between gap-4 px-4 py-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={member.name} index={i + 1} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-foreground">{member.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMembers(prev => prev.filter(m => m.id !== member.id))}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-surface-hover hover:text-foreground group-hover:opacity-100"
                          aria-label={`Remove ${member.name}`}
                        >
                          <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
                        </button>
                        <PermissionSelect
                          value={member.permission}
                          onChange={value => setMembers(prev => prev.map(m => m.id === member.id ? { ...m, permission: value } : m))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'download' && projectItems && projectItems.length > 0 ? (
            /* ── Project mode: per-item format selection ── */
            <div className="flex flex-col gap-4">

              {/* Summary row — select all + download all */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={selectedItemIds.size === projectItems.length && projectItems.length > 0}
                    onCheckedChange={checked => {
                      setSelectedItemIds(
                        checked
                          ? new Set(projectItems.map(i => i.id))
                          : new Set(),
                      );
                    }}
                  />
                  <span className="text-[13px] text-muted-foreground">
                    {selectedItemIds.size} of {projectItems.length} selected
                  </span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedItemIds.size === 0}
                  className="gap-1.5 h-[32px] px-2 text-[12px]"
                  onClick={() => {
                    const count = selectedItemIds.size;
                    toast.success(`Downloading ${count} item${count !== 1 ? 's' : ''}`, {
                      duration: 4000,
                      icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                    });
                  }}
                >
                  <Download size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  Download selected
                </Button>
              </div>

              {/* Item rows */}
              <div className="flex flex-col gap-2">
                {projectItems.map(item => {
                  const TypeIcon = ITEM_TYPE_ICON[item.itemType];
                  const formats = ITEM_TYPE_FORMATS[item.itemType];
                  const selectedFormat = itemFormats[item.id] ?? ITEM_TYPE_DEFAULT_FORMAT[item.itemType];
                  const isSelected = selectedItemIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors',
                        isSelected ? 'border-border bg-background' : 'border-border/40 bg-muted/20 opacity-60',
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={checked => {
                          setSelectedItemIds(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(item.id); else next.delete(item.id);
                            return next;
                          });
                        }}
                      />

                      {/* Content type icon */}
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/[0.07]">
                        <TypeIcon size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-foreground/70" />
                      </div>

                      {/* Label */}
                      <span className="flex-1 text-[13px] text-foreground">{item.label}</span>

                      {/* Format selector */}
                      <Select
                        value={selectedFormat}
                        onValueChange={val => setItemFormats(prev => ({ ...prev, [item.id]: val }))}
                        disabled={!isSelected}
                      >
                        <SelectTrigger className="h-[30px] w-[84px] border-border bg-background text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {formats.map(fmt => (
                            <SelectItem key={fmt.id} value={fmt.id} className="text-[12px]">
                              {fmt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Individual download */}
                      <button
                        type="button"
                        title={`Download as ${selectedFormat.toUpperCase()}`}
                        disabled={!isSelected}
                        onClick={() => toast.success(`Downloading ${item.label} as ${selectedFormat.toUpperCase()}`, {
                          duration: 4000,
                          icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                        })}
                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
                      >
                        <Download size={13} strokeWidth={1.6} absoluteStrokeWidth />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'download' ? (
            /* ── Single content mode: flat format list ── */
            <div className="flex flex-col gap-2">
              {DOWNLOAD_OPTIONS.map(option => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className="group flex items-center gap-4 rounded-[8px] border border-border/70 px-4 py-2"
                  >
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={15} strokeWidth={1.6} absoluteStrokeWidth />
                    </div>
                    <span className="flex-1 text-[13px] text-foreground">{option.label}</span>
                    <Button
                      type="button"
                      className="h-[32px] px-2 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toast.success(`${option.label} download started`, {
                        duration: 5000,
                        icon: <CheckCircle2 size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />,
                      })}
                    >
                      Download
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {activeTab === 'embed' && (
            <div className="space-y-4">
              <p className="text-[13px] leading-5 text-muted-foreground">
                Copy this embed code and paste it into any external website or page.
              </p>
              <pre className="max-h-[220px] overflow-auto rounded-xl border border-border bg-muted/40 p-4 text-[12px] leading-5 text-foreground whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
              <CopyButton text={embedCode} copied={copied} onCopy={copyText} variant="outline">
                Copy embed code
              </CopyButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
