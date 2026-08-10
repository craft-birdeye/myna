import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Sparkles } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { FilterPaneTriggerButton } from '@/content-hub/FilterPane';
import { cn } from '@/contenthub-ui/utils';
import type { CalendarViewType } from './CalendarView';

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  showViewControls?: boolean;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewType,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  filterOpen,
  onFilterOpenChange,
  showViewControls = true,
}) => {
  const formatLabel = () => {
    if (viewType === 'month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewType === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      if (start.getMonth() === end.getMonth()) {
        return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return 'All content';
  };

  const VIEW_ORDER: CalendarViewType[] = ['list', 'week', 'month'];
  const VIEW_LABELS: Record<CalendarViewType, string> = {
    list: 'List',
    week: 'Week',
    month: 'Month',
  };

  return (
    <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          aria-label="Previous period"
        >
          <ChevronLeft className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
        </Button>

        <p className="whitespace-nowrap text-[18px] font-normal tracking-tight text-foreground">
          {formatLabel()}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNext}
          aria-label="Next period"
        >
          <ChevronRight className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onToday}
          className="px-2 text-primary hover:text-primary"
        >
          Today
        </Button>
      </div>

      {showViewControls && (
        <div className="flex items-center gap-2">
          <div
            className="flex h-[36px] items-center gap-1 rounded-md border border-border px-2 py-[6px]"
            aria-label="Calendar view"
          >
            {VIEW_ORDER.map(v => (
              <button
                key={v}
                type="button"
                aria-label={`${VIEW_LABELS[v]} view`}
                onClick={() => onViewChange(v)}
                className={cn(
                  'h-6 rounded px-2 text-[14px] font-normal tracking-[-0.28px] text-foreground transition-colors',
                  viewType === v && 'bg-muted text-primary',
                )}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="AI suggestions"
            title="AI suggestions"
          >
            <Sparkles className="size-[14px] text-primary" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
            <span className="sr-only">AI</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="More options"
          >
            <MoreVertical className="size-[14px]" strokeWidth={1.6} absoluteStrokeWidth aria-hidden />
          </Button>

          <FilterPaneTriggerButton
            open={filterOpen}
            onOpenChange={onFilterOpenChange}
          />
        </div>
      )}
    </div>
  );
};
