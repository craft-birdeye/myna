/**
 * FAQLeftPanel — dead-simple left panel for the faqReady / Create manually mode.
 * Two action buttons + a drag-resize handle on the right edge.
 */
import React, { useRef, useCallback } from 'react';
import { MessageSquarePlus, FolderPlus } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';

interface FAQLeftPanelProps {
  onAddQuestion: () => void;
  onAddSection: () => void;
  onWidthChange: (width: number) => void;
  className?: string;
}

export const FAQLeftPanel = ({
  onAddQuestion,
  onAddSection,
  onWidthChange,
  className,
}: FAQLeftPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = Math.max(180, Math.min(420, ev.clientX - rect.left));
      onWidthChange(newWidth);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [onWidthChange]);

  return (
    <div
      ref={panelRef}
      className={cn('relative flex flex-col bg-background border-r border-border h-full select-none', className)}
    >
      {/* Main content */}
      <div className="flex flex-col gap-2 p-4 pt-5">
        <Button
          variant="default"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onAddQuestion}
        >
          <MessageSquarePlus size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Add question
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onAddSection}
        >
          <FolderPlus size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Add section
        </Button>
      </div>

      {/* Subtle hint */}
      <div className="px-4 mt-1">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Drag questions and sections directly on the canvas to reorder.
        </p>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors group"
        title="Drag to resize"
      >
        {/* 3-dot visual indicator on hover */}
        <div className="absolute top-1/2 -translate-y-1/2 left-[-2px] flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground" />
          ))}
        </div>
      </div>
    </div>
  );
};
