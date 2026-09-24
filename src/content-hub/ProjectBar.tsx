import React from 'react';
import { cn } from '@/contenthub-ui/utils';
import { type Project, PROJECT_COLOR_MAP } from './calendarData';

interface ProjectBarProps {
  project: Project;
  startCol: number;
  spanCols: number;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtRange(s: Date, e: Date) {
  return s.getMonth() === e.getMonth()
    ? `${MONTH[s.getMonth()]} ${s.getDate()}–${e.getDate()}`
    : `${MONTH[s.getMonth()]} ${s.getDate()} – ${MONTH[e.getMonth()]} ${e.getDate()}`;
}

export const ProjectBar: React.FC<ProjectBarProps> = ({
  project,
  startCol,
  spanCols,
  selected = false,
  dimmed = false,
  onClick,
}) => {
  const colors = PROJECT_COLOR_MAP[project.colorKey];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      className={cn(
        'flex items-center gap-1.5 px-2 rounded-md cursor-pointer transition-all truncate text-[11px] h-[26px]',
        colors.bg,
        colors.text,
        'border',
        selected ? 'border-primary/60 ring-1 ring-primary/30' : colors.border,
        dimmed && 'opacity-40',
      )}
      style={{
        gridColumn: `${startCol + 1} / span ${spanCols}`,
      }}
    >
      <span className="truncate">{project.name}</span>
      <span className="opacity-50 shrink-0">&middot;</span>
      <span className="shrink-0 opacity-70">{fmtRange(project.startDate, project.endDate)}</span>
    </div>
  );
};
