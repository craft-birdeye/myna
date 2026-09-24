import { ArrowLeft } from 'lucide-react';

interface CanvasBackButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * T6 — Shared back button used in all canvas-mode headers:
 * CreateView topbar, FAQEditor, NewProjectBrief, RecDetailView.
 */
export function CanvasBackButton({ label, onClick, className }: CanvasBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors' +
        (className ? ' ' + className : '')
      }
    >
      <ArrowLeft size={16} strokeWidth={1.6} />
      {label}
    </button>
  );
}
