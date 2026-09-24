/**
 * FAQSendForApprovalModal
 *
 * Lightweight popup invoked from the FAQ editor's Save split button.
 * Lets the user pick an approval workflow and an optional schedule date,
 * then submits the FAQ for review.
 */
import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CalendarDays, X } from 'lucide-react';
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

export interface FAQSendForApprovalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { approvalWorkflow: string; scheduleDate?: Date }) => void;
}

export function FAQSendForApprovalModal({ open, onClose, onSubmit }: FAQSendForApprovalModalProps) {
  const [approvalWorkflow, setApprovalWorkflow] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  function resetAndClose() {
    onClose();
    window.setTimeout(() => {
      setApprovalWorkflow('');
      setScheduleDate(undefined);
      setDatePickerOpen(false);
    }, 180);
  }

  function handleSubmit() {
    if (!approvalWorkflow) return;
    onSubmit({ approvalWorkflow, scheduleDate });
    resetAndClose();
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && resetAndClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 flex w-[calc(100vw-48px)] max-w-[480px]',
            '-translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-background shadow-modal',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200',
          )}
        >
          {/* Header */}
          <div className="flex flex-none items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>Send for approval</DialogTitle>
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
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-muted-foreground">Approval workflow</label>
              <Select value={approvalWorkflow} onValueChange={setApprovalWorkflow}>
                <SelectTrigger
                  size="sm"
                  aria-label="Approval workflow"
                  className="h-[34px] w-full border-border bg-background text-[13px]"
                >
                  <SelectValue placeholder="Select approval" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[var(--radix-select-trigger-width)]">
                  {APPROVAL_WORKFLOWS.map(workflow => (
                    <SelectItem key={workflow} value={workflow}>
                      {workflow}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-muted-foreground">Schedule date and time</label>
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-none items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="button" disabled={!approvalWorkflow} onClick={handleSubmit}>
              Send for approval
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
