import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { PostCard } from './PostCard';
import { mockScheduledItems, mockProjects, PROJECT_COLOR_MAP } from './calendarData';
import type { Project } from './calendarData';

interface WeekViewProps {
  currentDate: Date;
}

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear();
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function isPastDay(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day < today;
}

type ProjectWithSpan = Project & { startCol: number; spanCols: number };

function getProjectsForWeek(weekDays: Date[]): ProjectWithSpan[] {
  const weekStart = weekDays[0];
  const weekEnd   = weekDays[6];

  return mockProjects
    .filter(p => !(p.endDate < weekStart || p.startDate > weekEnd))
    .map(p => {
      const startCol = Math.max(0, weekDays.findIndex(d => {
        const ds = new Date(d); ds.setHours(0,0,0,0);
        const ps = new Date(p.startDate); ps.setHours(0,0,0,0);
        return ds >= ps;
      }));
      let endCol = 6;
      weekDays.forEach((d, i) => {
        const ds = new Date(d); ds.setHours(0,0,0,0);
        const pe = new Date(p.endDate); pe.setHours(0,0,0,0);
        if (ds <= pe) endCol = i;
      });
      return { ...p, startCol, spanCols: endCol - startCol + 1 };
    });
}

export const WeekView: React.FC<WeekViewProps> = ({ currentDate }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const weekDays = getWeekDays(currentDate);
  const allProjects = getProjectsForWeek(weekDays);
  const VISIBLE = 5;
  const displayProjects = showAll ? allProjects : allProjects.slice(0, VISIBLE);
  const remaining = allProjects.length - VISIBLE;

  return (
    <div className="flex h-full flex-col bg-background">

      {/* Day header */}
      <div className="grid h-[45px] shrink-0 grid-cols-7 border-b border-border bg-background">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center border-r border-border last:border-r-0',
              isToday(day) && 'bg-primary/[0.04]',
            )}
          >
            {isToday(day) ? (
              <span className="flex items-center gap-1 text-[12px]">
                <span className="text-primary">{DAY_NAMES[i]}</span>
                <span className="bg-primary rounded-full size-[19px] inline-flex items-center justify-center text-white text-[11px]">
                  {day.getDate()}
                </span>
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground">
                {DAY_NAMES[i]} {day.getDate()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Project strips */}
      {allProjects.length > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/30">
          <div className="flex flex-col gap-1 px-1 py-1">
            {displayProjects.map(project => {
              const colors = PROJECT_COLOR_MAP[project.colorKey];
              const selected = selectedProjectId === project.id;
              const dimmed  = !!selectedProjectId && !selected;
              return (
                <div
                  key={project.id}
                  className="grid grid-cols-7 relative"
                  style={{ height: 26 }}
                >
                  {/* Positioning overlay */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedProjectId(p => p === project.id ? null : project.id)}
                    className={cn(
                      'absolute top-0 flex h-full cursor-pointer items-center gap-1 px-2 truncate rounded-[4px] border text-[11px] transition-all',
                      colors.bg, colors.text, colors.border,
                      selected && 'ring-1 ring-primary/40 border-primary/50',
                      dimmed && 'opacity-35',
                    )}
                    style={{
                      left: `calc(${(project.startCol / 7) * 100}% + 2px)`,
                      width: `calc(${(project.spanCols / 7) * 100}% - 4px)`,
                    }}
                  >
                    <span className="truncate">{project.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Show more / less */}
          {remaining > 0 || showAll ? (
            <div className="px-4 pb-1">
              <button
                type="button"
                onClick={() => setShowAll(v => !v)}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                {showAll
                  ? <><ChevronUp size={12} strokeWidth={1.6} absoluteStrokeWidth /> Collapse</>
                  : <><ChevronDown size={12} strokeWidth={1.6} absoluteStrokeWidth /> Show {remaining} more projects</>
                }
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Content grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid min-h-full grid-cols-7 border-l border-border">
          {weekDays.map((day, i) => {
            const posts = mockScheduledItems
              .filter(p => isSameDay(p.date, day) &&
                (!selectedProjectId || p.projectId === selectedProjectId))
              .sort((a, b) => a.date.getHours() - b.date.getHours());

            return (
              <div
                key={i}
                className={cn(
                  'flex min-w-px flex-col items-start gap-[10px] border-b border-r border-border p-[10px]',
                  isPastDay(day) ? 'bg-surface-hover dark:bg-[#181b22]' : 'bg-background',
                  isToday(day) && 'bg-primary/[0.02]',
                )}
                style={{ minHeight: 939 }}
              >
                {posts.map(post => (
                  <PostCard key={post.id} post={post} isPast={isPastDay(day)} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
