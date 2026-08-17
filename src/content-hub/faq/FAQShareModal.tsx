/**
 * FAQShareModal — publish/share dialog with three tabs:
 *   1. Copy link — shareable hosted FAQ URL
 *   2. Embed code — <script> snippet for any website
 *   3. Integrations — WordPress plugin + Framer component one-click install
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/contenthub-ui/dialog';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';
import {
  Link2, Code2, Puzzle, Copy, CheckCheck,
  ExternalLink, Globe, Layers,
} from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { TextTabsRow } from '@/contenthub-ui/text-tabs';
import { cn } from '@/contenthub-ui/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type ShareTab = 'link' | 'embed' | 'integrations';

interface FAQShareModalProps {
  open: boolean;
  onClose: () => void;
  /** Slug used to build the shareable URL / embed snippet */
  faqSetId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  };

  return { copied, copy };
}

// ── Sub-sections ───────────────────────────────────────────────────────────────

function CopyLinkTab({ faqSetId }: { faqSetId: string }) {
  const url = `https://birdeye.com/faq/${faqSetId}`;
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Share a hosted FAQ page directly with customers or link to it from your website.
      </p>

      <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden bg-muted/30 pl-3">
        <Globe size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground flex-shrink-0" />
        <input
          readOnly
          value={url}
          className="flex-1 text-[12px] text-foreground bg-transparent outline-none py-2.5 min-w-0 truncate"
        />
        <Button
          variant="ghost"
          size="sm"
          className="rounded-none border-l border-border h-full px-2 flex-shrink-0"
          onClick={() => copy(url)}
        >
          {copied
            ? <CheckCheck size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />
            : <Copy size={14} strokeWidth={1.6} absoluteStrokeWidth />
          }
          <span className="text-[12px] ml-1">{copied ? 'Copied!' : 'Copy'}</span>
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="self-start gap-2"
        onClick={() => window.open(url, '_blank')}
      >
        <ExternalLink size={13} strokeWidth={1.6} absoluteStrokeWidth />
        Preview page
      </Button>
    </div>
  );
}

function EmbedCodeTab({ faqSetId }: { faqSetId: string }) {
  const [embedType, setEmbedType] = useState<'script' | 'iframe'>('script');
  const { copied, copy } = useCopyToClipboard();

  const scriptSnippet = `<script src="https://cdn.birdeye.com/faq-widget.js" data-faq-id="${faqSetId}" async></script>`;
  const iframeSnippet = `<iframe src="https://birdeye.com/faq/${faqSetId}/embed" width="100%" style="border:none;min-height:480px" loading="lazy"></iframe>`;
  const snippet = embedType === 'script' ? scriptSnippet : iframeSnippet;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Embed your FAQ on any website by pasting this code where you want it to appear.
      </p>

      {/* Embed type toggle */}
      <div className="flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
        {(['script', 'iframe'] as const).map(type => (
          <button
            key={type}
            onClick={() => setEmbedType(type)}
            className={cn(
              'px-2 py-1.5 rounded-md text-[12px] transition-all',
              embedType === type
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {type === 'script' ? 'Script tag' : 'iFrame'}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative">
        <pre className="bg-muted/50 border border-border rounded-lg px-4 py-2 text-[11px] text-foreground font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
          {snippet}
        </pre>
        <button
          onClick={() => copy(snippet)}
          className="absolute top-2 right-2 flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied
            ? <CheckCheck size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />
            : <Copy size={12} strokeWidth={1.6} absoluteStrokeWidth />
          }
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Paste the snippet just before the closing{' '}
        <code className="bg-muted px-1 rounded text-foreground">&lt;/body&gt;</code> tag of your page.
      </p>
    </div>
  );
}

interface IntegrationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
  badge?: string;
}

function IntegrationCard({ icon, title, description, ctaLabel, onCta, badge }: IntegrationCardProps) {
  return (
    <div className="flex items-start gap-2 border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
      <div className="size-[34px] rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] text-foreground">{title}</span>
          {badge && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground leading-snug">{description}</p>
      </div>
      <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5" onClick={onCta}>
        <ExternalLink size={12} strokeWidth={1.6} absoluteStrokeWidth />
        {ctaLabel}
      </Button>
    </div>
  );
}

function IntegrationsTab({ faqSetId }: { faqSetId: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Connect your FAQ to your existing website in one click.
      </p>

      <IntegrationCard
        icon={<Layers size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />}
        title="WordPress"
        description="Install the Birdeye FAQ plugin and your FAQ appears automatically on any page or post."
        ctaLabel="Get plugin"
        badge="Free"
        onCta={() => window.open('https://wordpress.org/plugins/birdeye-faq/', '_blank')}
      />

      <IntegrationCard
        icon={<Puzzle size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-purple-600" />}
        title="Framer"
        description="Add the Birdeye FAQ component to your Framer project and sync content automatically."
        ctaLabel="Open in Framer"
        onCta={() => window.open(`https://framer.com/marketplace/birdeye-faq?id=${faqSetId}`, '_blank')}
      />

      <IntegrationCard
        icon={<Globe size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary" />}
        title="Any website"
        description="Use the embed code to add your FAQ to Webflow, Wix, Squarespace, or any HTML page."
        ctaLabel="Get embed code"
        onCta={() => {}}
      />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: ShareTab; label: string; icon: React.ReactNode }[] = [
  { id: 'link',         label: 'Copy link',    icon: <Link2    size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
  { id: 'embed',        label: 'Embed code',   icon: <Code2    size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
  { id: 'integrations', label: 'Integrations', icon: <Puzzle   size={13} strokeWidth={1.6} absoluteStrokeWidth /> },
];

export const FAQShareModal = ({
  open,
  onClose,
  faqSetId = 'faq-set-001',
}: FAQShareModalProps) => {
  const [activeTab, setActiveTab] = useState<ShareTab>('link');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Share FAQ</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <TextTabsRow<ShareTab>
          items={TAB_CONFIG.map(tab => ({
            id: tab.id,
            label: <span className="flex items-center gap-1.5">{tab.icon}{tab.label}</span>,
          }))}
          value={activeTab}
          onChange={setActiveTab}
          className="px-6 mt-4"
        />

        {/* Tab body */}
        <div className="px-6 py-6">
          {activeTab === 'link'         && <CopyLinkTab    faqSetId={faqSetId} />}
          {activeTab === 'embed'        && <EmbedCodeTab   faqSetId={faqSetId} />}
          {activeTab === 'integrations' && <IntegrationsTab faqSetId={faqSetId} />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
