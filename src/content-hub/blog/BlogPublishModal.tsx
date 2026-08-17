/**
 * BlogPublishModal
 *
 * Lets the user publish a blog post to a pre-connected WordPress or Wix site.
 * Accounts are configured once in Settings → Integrations; this modal only
 * shows those connected accounts — it never asks for credentials.
 *
 * Flow:
 *  1. Account picker  — WordPress / Wix tabs, list of connected sites
 *  2. Published state — live URL with Copy / Share / Open actions
 */
import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Share2,
  UserRound,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/contenthub-ui/dialog';
import { Button } from '@/contenthub-ui/button';
import { TextTabsRow } from '@/contenthub-ui/text-tabs';
import { cn } from '@/contenthub-ui/utils';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';

// ── Mock connected accounts ───────────────────────────────────────────────────

interface ConnectedSite {
  id: string;
  platform: 'wordpress' | 'wix';
  name: string;
  url: string;
  postCount: number;
  lastActivity: string;
  hue: number;
}

const CONNECTED_SITES: ConnectedSite[] = [
  {
    id: 'wp-smile',
    platform: 'wordpress',
    name: 'Smile Dental Group',
    url: 'smile-dental.com',
    postCount: 142,
    lastActivity: 'Post published 3 days ago',
    hue: 210,
  },
  {
    id: 'wp-acme',
    platform: 'wordpress',
    name: 'Acme Dental Westside',
    url: 'acmedental-west.com',
    postCount: 38,
    lastActivity: 'Post published 2 weeks ago',
    hue: 150,
  },
  {
    id: 'wp-bayview',
    platform: 'wordpress',
    name: 'Bayview Orthodontics',
    url: 'bayviewortho.com',
    postCount: 61,
    lastActivity: 'Post published 1 week ago',
    hue: 280,
  },
  {
    id: 'wix-smile',
    platform: 'wix',
    name: 'Smile Dental Group',
    url: 'smile-dental.wixsite.com/main',
    postCount: 28,
    lastActivity: 'Page published 5 days ago',
    hue: 40,
  },
  {
    id: 'wix-pacific',
    platform: 'wix',
    name: 'Pacific Rim Restaurants',
    url: 'pacificrim.wixsite.com/group',
    postCount: 15,
    lastActivity: 'Page published 3 weeks ago',
    hue: 330,
  },
];

// ── Site avatar ───────────────────────────────────────────────────────────────

function SiteAvatar({ name, hue }: { name: string; hue: number }) {
  return (
    <div
      className="size-[34px] rounded-full flex items-center justify-center text-[13px] flex-shrink-0"
      style={{
        backgroundColor: `hsl(${hue}, 55%, 92%)`,
        color: `hsl(${hue}, 50%, 28%)`,
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

// ── Site card ─────────────────────────────────────────────────────────────────

function SiteCard({
  site,
  selected,
  onClick,
}: {
  site: ConnectedSite;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border px-4 py-2 text-left transition-colors',
        selected
          ? 'border-primary/50 bg-primary/[0.04]'
          : 'border-border/70 bg-background hover:border-primary/30 hover:bg-surface-hover',
      )}
    >
      <SiteAvatar name={site.name} hue={site.hue} />
      <p className="flex-1 text-[13px] text-foreground truncate">{site.name}</p>
      {selected && (
        <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-primary" />
      )}
    </button>
  );
}

// ── Published success state ───────────────────────────────────────────────────

function PublishedState({ liveUrl }: { liveUrl: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(liveUrl).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-6 px-6 pb-8 pt-6">
      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/5 dark:bg-green-950/30">
          <CheckCircle2 size={24} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />
        </div>
        <div className="text-center">
          <p className="text-[15px] text-foreground">Blog post published</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Your post is live and being indexed</p>
        </div>
      </div>

      {/* Live URL row */}
      <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5">
        <Globe size={13} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
        <span className="flex-1 truncate font-mono text-[12px] text-foreground">{liveUrl}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-none text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy link"
        >
          {copied
            ? <span className="text-text-primary text-[11px]">Copied</span>
            : <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />
          }
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex w-full gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleCopy}
        >
          <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Copy link
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
        >
          <Share2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Share link
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
        >
          <ExternalLink size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Open page
        </Button>
      </div>

    </div>
  );
}

// ── Already-published "manage" state ──────────────────────────────────────────

interface PublishedInfo {
  url: string;
  siteName: string;
  platform: 'wordpress' | 'wix';
  publishedAt: number; // epoch ms
  by: string;
}

function relativeTime(epochMs: number): string {
  const mins = Math.floor((Date.now() - epochMs) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Framer-style state shown when a post is already published and the user opens
 * Publish again: the live link, who last updated it and when, plus an Update CTA
 * to push the latest edits — instead of re-asking for a destination.
 */
function ManageState({
  info,
  onUpdate,
  onPublishElsewhere,
}: {
  info: PublishedInfo;
  onUpdate: () => void;
  onPublishElsewhere: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const displayUrl = info.url.replace(/^https?:\/\//, '');

  function handleCopy() {
    navigator.clipboard.writeText(info.url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col px-6 pb-6 pt-5">
      {/* Detail rows */}
      <div className="flex flex-col gap-2">
        {/* Live link */}
        <div className="flex items-center gap-2">
          <Globe size={15} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
          <span className="flex-1 truncate text-[13px] text-foreground">{displayUrl}</span>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Copy link"
            >
              {copied
                ? <span className="text-[11px] text-text-primary">Copied</span>
                : <Copy size={14} strokeWidth={1.6} absoluteStrokeWidth />
              }
            </button>
            <a
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Open page"
            >
              <ExternalLink size={14} strokeWidth={1.6} absoluteStrokeWidth />
            </a>
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-2">
          <Clock size={15} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">
            Updated {relativeTime(info.publishedAt)} · by {info.by}
          </span>
        </div>

        {/* Change status */}
        <div className="flex items-center gap-2">
          <UserRound size={15} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">
            Published to {info.siteName} · {info.platform === 'wordpress' ? 'WordPress' : 'Wix'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2">
        <Button type="button" className="w-full" onClick={onUpdate}>
          Update
        </Button>
      </div>

      {/* Publish to another destination */}
      <button
        type="button"
        onClick={onPublishElsewhere}
        className="mt-4 self-center text-[12px] text-primary transition-colors hover:underline underline-offset-2"
      >
        Publish to another site
      </button>
    </div>
  );
}

// ── Account picker tab content ────────────────────────────────────────────────

function AccountList({
  sites,
  selectedId,
  onSelect,
  emptyLabel,
}: {
  sites: ConnectedSite[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-[13px] text-foreground">No accounts connected</p>
        <p className="text-[12px] text-muted-foreground max-w-[260px]">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {sites.map(site => (
        <SiteCard
          key={site.id}
          site={site}
          selected={selectedId === site.id}
          onClick={() => onSelect(site.id)}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface BlogPublishModalProps {
  open: boolean;
  onClose: () => void;
}

type ModalView = 'picker' | 'published' | 'manage';

export const BlogPublishModal = ({ open, onClose }: BlogPublishModalProps) => {
  const [view, setView] = useState<ModalView>('picker');
  const [activeTab, setActiveTab] = useState<'wordpress' | 'wix'>('wordpress');
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState('');
  // Persisted across opens so a second Publish click manages the live post
  // instead of re-asking for a destination.
  const [publishedInfo, setPublishedInfo] = useState<PublishedInfo | null>(null);

  // Pick the right view each time the modal opens: manage an existing
  // publication, or start the destination picker for a first publish.
  useEffect(() => {
    if (open) setView(publishedInfo ? 'manage' : 'picker');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const wpSites  = CONNECTED_SITES.filter(s => s.platform === 'wordpress');
  const wixSites = CONNECTED_SITES.filter(s => s.platform === 'wix');

  const selectedSite = CONNECTED_SITES.find(s => s.id === selectedSiteId) ?? null;

  function handlePublish() {
    if (!selectedSite) return;
    const slug = 'dubbo-property-market-2026-buyers-sellers-landlords';
    const url  = `https://${selectedSite.url}/${slug}/`;
    setLiveUrl(url);
    setPublishedInfo({
      url,
      siteName: selectedSite.name,
      platform: selectedSite.platform,
      publishedAt: Date.now(),
      by: 'You',
    });
    setView('published');
    toast.success(`Published to ${selectedSite.name}`, {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary flex-none" />,
    });
  }

  function handleUpdate() {
    setPublishedInfo(prev => (prev ? { ...prev, publishedAt: Date.now(), by: 'You' } : prev));
    toast.success('Changes published', {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary flex-none" />,
    });
    resetAndClose();
  }

  function resetAndClose() {
    onClose();
    window.setTimeout(() => {
      setSelectedSiteId(null);
      setActiveTab('wordpress');
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && resetAndClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50px] z-50 flex max-h-[calc(100vh-66px)] w-[calc(100vw-48px)] max-w-[560px]',
            'translate-x-[-50%] flex-col overflow-hidden rounded-xl bg-background shadow-modal',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          )}
        >
          {/* Header */}
          <div className="flex flex-none items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>
              {view === 'published' || view === 'manage' ? 'Published' : 'Publish blog post'}
            </DialogTitle>
            <button
              type="button"
              onClick={resetAndClose}
              className="-mr-1 flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          {/* Body */}
          {view === 'manage' && publishedInfo ? (
            <ManageState
              info={publishedInfo}
              onUpdate={handleUpdate}
              onPublishElsewhere={() => { setSelectedSiteId(null); setView('picker'); }}
            />
          ) : view === 'published' ? (
            <PublishedState liveUrl={liveUrl} />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Underline tabs */}
                <div className="px-6 pt-4">
                  <TextTabsRow
                    ariaLabel="Publishing platform"
                    value={activeTab}
                    onChange={v => { setActiveTab(v); setSelectedSiteId(null); }}
                    items={[
                      { id: 'wordpress' as const, label: 'WordPress' },
                      { id: 'wix' as const,       label: 'Wix' },
                    ]}
                  />
                </div>

                <div className="px-6 py-4">
                  {activeTab === 'wordpress' ? (
                    <AccountList
                      sites={wpSites}
                      selectedId={selectedSiteId}
                      onSelect={setSelectedSiteId}
                      emptyLabel="Connect a WordPress site in Settings → Integrations to publish here."
                    />
                  ) : (
                    <AccountList
                      sites={wixSites}
                      selectedId={selectedSiteId}
                      onSelect={setSelectedSiteId}
                      emptyLabel="Connect a Wix site in Settings → Integrations to publish here."
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-none items-center justify-between border-t border-border px-6 py-4">
                <button
                  type="button"
                  className="text-[12px] text-primary hover:underline underline-offset-2 transition-colors"
                >
                  Manage {activeTab === 'wordpress' ? 'WordPress' : 'Wix'} accounts
                </button>
                <Button
                  type="button"
                  disabled={!selectedSite}
                  onClick={handlePublish}
                >
                  Publish as new page
                </Button>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
