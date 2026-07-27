/**
 * FAQPublishModal
 *
 * Single-step publish flow: pick a blog post or landing page, set optional
 * approval workflow + schedule date, then publish.
 */
import React, { useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import {
  CalendarDays,
  CheckCircle2,
  Info,
  Search,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/contenthub-ui/dialog';
import { Button } from '@/contenthub-ui/button';
import { Calendar } from '@/contenthub-ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/contenthub-ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';
import { cn } from '@/contenthub-ui/utils';
import { MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/contenthub-ui/mainViewTitleClasses';
import { ProjectThumbnail } from '../projectShared';
import type { FAQItem } from './FAQReviewCard';

export interface FAQPublishModalProps {
  open: boolean;
  onClose: () => void;
  faqs: FAQItem[];
  overallScore: number;
}

interface ExistingPage {
  id: string;
  type: 'Blog post' | 'Landing page';
  title: string;
  updatedAt: string;
  hue: number;
}

const EXISTING_PAGES: ExistingPage[] = [
  {
    id: 'blog-emergency-service',
    type: 'Blog post',
    title: 'How to choose an emergency service provider',
    updatedAt: 'Updated 2 days ago',
    hue: 210,
  },
  {
    id: 'landing-property-appraisal',
    type: 'Landing page',
    title: 'Property appraisal services',
    updatedAt: 'Updated May 7',
    hue: 145,
  },
  {
    id: 'blog-same-day-service',
    type: 'Blog post',
    title: 'What same-day service means for local customers',
    updatedAt: 'Updated Apr 28',
    hue: 30,
  },
  {
    id: 'landing-service-area',
    type: 'Landing page',
    title: 'Austin service areas',
    updatedAt: 'Updated Apr 19',
    hue: 280,
  },
];

const APPROVAL_WORKFLOWS = [
  'Marketing approval',
  'Legal review',
  'Brand compliance',
  'Regional manager approval',
  'SEO review',
  'Product marketing review',
  'Executive approval',
  'Franchise owner approval',
  'Content quality review',
  'Final publishing review',
];

function formatScheduleDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export const FAQPublishModal = ({ open, onClose }: FAQPublishModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [approvalWorkflow, setApprovalWorkflow] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const selectedPage = EXISTING_PAGES.find(page => page.id === selectedPageId);

  const filteredPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXISTING_PAGES;
    return EXISTING_PAGES.filter(page =>
      page.title.toLowerCase().includes(q) || page.type.toLowerCase().includes(q),
    );
  }, [query]);

  function resetAndClose() {
    onClose();
    window.setTimeout(() => {
      setQuery('');
      setSelectedPageId(null);
      setApprovalWorkflow('');
      setScheduleDate(undefined);
      setDatePickerOpen(false);
    }, 180);
  }

  function handlePublish() {
    if (!selectedPage) return;
    toast.success(`FAQ published to "${selectedPage.title}"`, {
      icon: <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-accent-positive flex-none" />,
    });
    resetAndClose();
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && resetAndClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50px] z-50 flex max-h-[calc(100vh-66px)] w-[calc(100vw-48px)] max-w-[600px]',
            'translate-x-[-50%] flex-col overflow-hidden rounded-xl bg-background shadow-modal',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          )}
        >
          {/* Header */}
          <div className="flex flex-none items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Publish FAQ</DialogTitle>
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
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {/* Info banner */}
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 dark:border-blue-900/40 dark:bg-blue-950/30">
              <Info size={15} strokeWidth={1.6} absoluteStrokeWidth className="mt-0.5 flex-none text-primary dark:text-blue-400" />
              <p className="text-[12px] leading-5 text-text-primary dark:text-blue-200">
                All FAQs will be added to the end of the selected blog post or landing page.
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
              <Search size={15} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search blog posts and landing pages"
                className="h-[34px] min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Page list */}
            <div className="flex flex-col gap-2">
              {filteredPages.map(page => {
                const selected = selectedPageId === page.id;
                return (
                  <button
                    type="button"
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={cn(
                      'flex items-center gap-4 rounded-lg border px-4 py-2 text-left transition-colors',
                      selected
                        ? 'border-primary/50 bg-primary/[0.04]'
                        : 'border-border/70 bg-background hover:border-primary/30 hover:bg-surface-hover',
                    )}
                  >
                    <ProjectThumbnail hue={page.hue} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-foreground truncate">{page.title}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{page.type} · {page.updatedAt}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 size={16} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-accent-positive" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-none items-center gap-2 border-t border-border px-6 py-4">
            {/* Approval workflow */}
            <Select value={approvalWorkflow} onValueChange={setApprovalWorkflow}>
              <SelectTrigger
                size="sm"
                aria-label="Approval workflow"
                className="h-[34px] w-[200px] border-border bg-background text-[13px]"
              >
                <SelectValue placeholder="Select approval" />
              </SelectTrigger>
              <SelectContent align="start" className="w-[240px]">
                {APPROVAL_WORKFLOWS.map(workflow => (
                  <SelectItem key={workflow} value={workflow}>
                    {workflow}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Schedule date picker */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-[34px] items-center gap-2 rounded-md border border-border bg-background px-2 text-[13px] text-foreground transition-colors hover:bg-surface-hover/60"
                  aria-label="Schedule date"
                >
                  <CalendarDays size={14} strokeWidth={1.6} absoluteStrokeWidth className="flex-none text-muted-foreground" />
                  <span className={scheduleDate ? 'text-foreground' : 'text-muted-foreground'}>
                    {scheduleDate ? formatScheduleDate(scheduleDate) : 'Select date and time'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={date => {
                    setScheduleDate(date);
                    if (date) setDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex-1" />

            <Button
              type="button"
              disabled={!selectedPage}
              onClick={handlePublish}
            >
              Publish
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
