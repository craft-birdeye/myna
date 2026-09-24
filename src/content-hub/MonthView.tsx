import React, { useState } from 'react';
import { cn } from '@/contenthub-ui/utils';
import { PostCard } from './PostCard';
import { ProjectBar } from './ProjectBar';
import { mockProjects, mockScheduledItems, type Project } from './calendarData';

interface MonthViewProps {
  currentDate: Date;
}

type ProjectWithSpan = Project & { startCol: number; spanCols: number };

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(date: Date): (Date | null)[] {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let i = 1; i <= last.getDate(); i++) days.push(new Date(year, month, i));
  return days;
}

function getWeeks(days: (Date | null)[]): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function isToday(d: Date | null) {
  if (!d) return false;
  return isSameDay(d, new Date());
}

function getProjectsForWeek(
  week: (Date | null)[],
  expandedCount: number,
): { displayed: ProjectWithSpan[]; remaining: number; all: ProjectWithSpan[] } {
  const validDays = week.filter(Boolean) as Date[];
  if (!validDays.length) return { displayed: [], remaining: 0, all: [] };

  const weekStart = validDays[0];
  const weekEnd   = validDays[validDays.length - 1];

  const projects: ProjectWithSpan[] = mockProjects
    .filter(p => !(p.endDate < weekStart || p.startDate > weekEnd))
    .map(p => {
      let startCol = week.findIndex(d => {
        if (!d) return false;
        const ds = new Date(d); ds.setHours(0,0,0,0);
        const ps = new Date(p.startDate); ps.setHours(0,0,0,0);
        return ds >= ps;
      });
      if (startCol < 0) startCol = week.findIndex(d => d !== null);

      let endCol = 6;
      week.forEach((d, i) => {
        if (!d) return;
        const ds = new Date(d); ds.setHours(0,0,0,0);
        const pe = new Date(p.endDate); pe.setHours(0,0,0,0);
        if (ds <= pe) endCol = i;
      });

      return { ...p, startCol, spanCols: endCol - startCol + 1 };
    });

  const displayed  = projects.slice(0, expandedCount);
  const remaining  = Math.max(0, projects.length - expandedCount);
  return { displayed, remaining, all: projects };
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [weekExpanded, setWeekExpanded] = useState<Map<number, number>>(new Map());

  const toggleDate = (key: string) =>
    setExpandedDates(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });

  const days  = getDaysInMonth(currentDate);
  const weeks = getWeeks(days);

  return (
    <div className="flex flex-col h-full bg-background">

      {/* Day name header */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {DAY_NAMES.map(n => (
          <div key={n} className="py-2 text-center text-[11px] text-muted-foreground uppercase tracking-wide border-r border-border last:border-r-0">
            {n}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 overflow-auto">
        {weeks.map((week, wi) => {
          const visibleCount = weekExpanded.get(wi) ?? 2;
          const { displayed, remaining, all } = getProjectsForWeek(week, visibleCount);

          return (
            <div key={wi} className="border-b border-border">
              {/* Project bars */}
              {all.length > 0 && (
                <div className="bg-muted/20 px-1 pt-1.5 pb-1">
                  <div className="grid grid-cols-7 gap-1 relative" style={{ minHeight: 26 }}>
                    {displayed.map(p => (
                      <ProjectBar
                        key={p.id}
                        project={p}
                        startCol={p.startCol}
                        spanCols={p.spanCols}
                        selected={selectedProjectId === p.id}
                        dimmed={!!selectedProjectId && selectedProjectId !== p.id}
                        onClick={() => setSelectedProjectId(v => v === p.id ? null : p.id)}
                      />
                    ))}
                  </div>
                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setWeekExpanded(m => new Map(m).set(wi, all.length))}
                      className="mt-0.5 text-[11px] text-primary hover:underline"
                    >
                      +{remaining} more projects
                    </button>
                  )}
                  {visibleCount > 2 && remaining === 0 && (
                    <button
                      type="button"
                      onClick={() => setWeekExpanded(m => new Map(m).set(wi, 2))}
                      className="mt-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Collapse
                    </button>
                  )}
                </div>
              )}

              {/* Date cells */}
              <div className="grid grid-cols-7">
                {week.map((date, di) => {
                  if (!date) return (
                    <div key={`empty-${wi}-${di}`}
                      className="border-r border-border last:border-r-0 bg-muted/30"
                      style={{ minHeight: 120 }}
                    />
                  );

                  const key   = date.toISOString();
                  const posts = mockScheduledItems.filter(p =>
                    isSameDay(p.date, date) &&
                    (!selectedProjectId || p.projectId === selectedProjectId)
                  );
                  const expanded   = expandedDates.has(key);
                  const visible    = expanded ? posts : posts.slice(0, 3);
                  const moreCount  = posts.length - 3;

                  return (
                    <div
                      key={key}
                      className={cn(
                        'border-r border-border last:border-r-0 p-2 flex flex-col',
                        isToday(date) && 'bg-primary/[0.02]',
                      )}
                      style={{ minHeight: 120 }}
                    >
                      {/* Date number */}
                      <div className="mb-1.5">
                        <span className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px]',
                          isToday(date)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground',
                        )}>
                          {date.getDate()}
                        </span>
                      </div>

                      {/* Content items */}
                      <div className="flex flex-col gap-1 flex-1">
                        {visible.map(post => (
                          <PostCard key={post.id} post={post} compact />
                        ))}
                        {moreCount > 0 && !expanded && (
                          <button
                            type="button"
                            onClick={() => toggleDate(key)}
                            className="text-left text-[11px] text-primary hover:underline px-1"
                          >
                            +{moreCount} more
                          </button>
                        )}
                        {expanded && (
                          <button
                            type="button"
                            onClick={() => toggleDate(key)}
                            className="text-left text-[11px] text-muted-foreground hover:text-foreground hover:underline px-1"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
