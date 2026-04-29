import { useMemo } from 'react';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { CalendarRange, Flag, Zap, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Sprint, Milestone } from '../types';

const SPRINT_COLORS: Record<string, string> = {
  completed: '#10B981',
  active: '#4F6EF7',
  planning: '#8B5CF6',
};

const MS_STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  in_progress: '#4F6EF7',
  at_risk: '#F59E0B',
  not_started: '#94A3B8',
  missed: '#EF4444',
};

const MS_STATUS_ICONS: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  in_progress: Zap,
  at_risk: AlertTriangle,
  not_started: Clock,
  missed: AlertTriangle,
};

export function TimelinePage() {
  const { sprints, milestones, epics } = useScrumStore();

  // Determine overall date range
  const allDates = [
    ...sprints.map((s) => s.startDate),
    ...sprints.map((s) => s.endDate),
    ...milestones.map((m) => m.dueDate),
  ];
  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));
  const rangeStart = parseISO(minDate);
  const rangeEnd = addDays(parseISO(maxDate), 7);
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;

  const toPercent = (dateStr: string) => {
    const d = parseISO(dateStr);
    return Math.max(0, Math.min(100, (differenceInDays(d, rangeStart) / totalDays) * 100));
  };
  const toWidth = (start: string, end: string) => {
    const s = parseISO(start);
    const e = parseISO(end);
    return Math.max(1, (differenceInDays(e, s) / totalDays) * 100);
  };

  const today = new Date();
  const todayPercent = Math.max(0, Math.min(100, (differenceInDays(today, rangeStart) / totalDays) * 100));

  // Generate month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; percent: number }[] = [];
    let current = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (current <= rangeEnd) {
      const pct = (differenceInDays(current, rangeStart) / totalDays) * 100;
      if (pct >= 0 && pct <= 100) {
        labels.push({ label: format(current, 'MMM yyyy'), percent: pct });
      }
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return labels;
  }, [rangeStart, rangeEnd, totalDays]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <CalendarRange size={20} className="text-brand-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Project Timeline</h1>
          <p className="text-sm text-slate-500">Gantt view of sprints, milestones, and epics</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[{ label: 'Completed Sprint', color: '#10B981' }, { label: 'Active Sprint', color: '#4F6EF7' }, { label: 'Planning Sprint', color: '#8B5CF6' }].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-px h-4 bg-red-400 border-l-2 border-red-400 border-dashed" />
          Today
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Flag size={12} className="text-amber-500" />
          Milestone
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Month header */}
        <div className="relative h-8 border-b border-surface-border bg-slate-50">
          {monthLabels.map((m) => (
            <div
              key={m.label}
              className="absolute top-0 h-full flex items-center pl-2 text-xs text-slate-500 font-medium border-l border-surface-border"
              style={{ left: `${m.percent}%` }}
            >
              {m.label}
            </div>
          ))}
          {/* Today line in header */}
          <div className="absolute top-0 h-full w-px bg-red-400 z-10" style={{ left: `${todayPercent}%` }} />
        </div>

        {/* Gantt body */}
        <div className="relative">
          {/* Today line */}
          <div className="absolute top-0 bottom-0 w-px bg-red-300 z-10 pointer-events-none" style={{ left: `${todayPercent}%` }}>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-400 rounded-full" />
          </div>

          {/* Sprints section */}
          <div className="border-b border-surface-border">
            <div className="px-4 py-2 bg-slate-50 border-b border-surface-border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sprints</p>
            </div>
            {sprints.map((sprint) => (
              <div key={sprint.id} className="relative h-14 border-b border-surface-border last:border-0 flex items-center">
                {/* Label area (fixed 160px via padding trick) */}
                <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 z-10 pointer-events-none" style={{ width: '160px', background: 'white' }}>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 truncate" style={{ maxWidth: '140px' }}>{sprint.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{sprint.status}</p>
                  </div>
                </div>
                {/* Bar area */}
                <div className="absolute inset-0" style={{ left: '160px' }}>
                  <div className="relative h-full">
                    <div
                      className="absolute top-3 bottom-3 rounded-lg flex items-center px-3 text-xs font-medium text-white shadow-sm"
                      style={{
                        left: `${toPercent(sprint.startDate)}%`,
                        width: `${toWidth(sprint.startDate, sprint.endDate)}%`,
                        backgroundColor: SPRINT_COLORS[sprint.status] ?? '#94A3B8',
                        minWidth: '60px',
                      }}
                    >
                      <span className="truncate">
                        {format(parseISO(sprint.startDate), 'MMM d')} – {format(parseISO(sprint.endDate), 'MMM d')}
                      </span>
                      {sprint.velocity && (
                        <span className="ml-auto pl-2 opacity-80">{sprint.velocity}pts</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Milestones section */}
          <div className="border-b border-surface-border">
            <div className="px-4 py-2 bg-slate-50 border-b border-surface-border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestones</p>
            </div>
            {milestones.map((ms) => {
              const Icon = MS_STATUS_ICONS[ms.status] ?? Flag;
              const color = MS_STATUS_COLORS[ms.status] ?? '#94A3B8';
              const linkedEpicColors = ms.epicIds.map((eid) => epics.find((e) => e.id === eid)?.color).filter(Boolean);
              return (
                <div key={ms.id} className="relative h-14 border-b border-surface-border last:border-0 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 z-10 pointer-events-none" style={{ width: '160px', background: 'white' }}>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 truncate" style={{ maxWidth: '140px' }}>{ms.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon size={10} style={{ color }} />
                        <span className="text-xs capitalize" style={{ color }}>{ms.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0" style={{ left: '160px' }}>
                    <div className="relative h-full">
                      {/* Diamond marker at due date */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${toPercent(ms.dueDate)}%` }}
                      >
                        <div
                          className="w-4 h-4 rotate-45 shadow-sm border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                          {format(parseISO(ms.dueDate), 'MMM d')}
                        </p>
                      </div>
                      {/* Epic color strips */}
                      {linkedEpicColors.length > 0 && (
                        <div className="absolute top-2 flex gap-1" style={{ left: `${toPercent(ms.dueDate) + 2}%` }}>
                          {linkedEpicColors.map((c, i) => (
                            <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Epics section */}
          <div>
            <div className="px-4 py-2 bg-slate-50 border-b border-surface-border">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Epics</p>
            </div>
            {epics.map((epic) => {
              // Epic spans from earliest story to latest story
              const epicStories = useScrumStore.getState().stories.filter((s) => s.epicId === epic.id && s.sprintId);
              const epicSprints = sprints.filter((sp) => epicStories.some((s) => s.sprintId === sp.id));
              if (epicSprints.length === 0) return null;
              const sortedSprints = [...epicSprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
              const epicStart = sortedSprints[0].startDate;
              const epicEnd = sortedSprints[sortedSprints.length - 1].endDate;
              const doneCount = epicStories.filter((s) => s.status === 'done').length;
              const totalCount = epicStories.length;
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

              return (
                <div key={epic.id} className="relative h-14 border-b border-surface-border last:border-0 flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 z-10 pointer-events-none" style={{ width: '160px', background: 'white' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />
                      <p className="text-xs font-semibold text-slate-700 truncate" style={{ maxWidth: '120px' }}>{epic.title}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0" style={{ left: '160px' }}>
                    <div className="relative h-full">
                      <div
                        className="absolute top-3 bottom-3 rounded-lg overflow-hidden"
                        style={{
                          left: `${toPercent(epicStart)}%`,
                          width: `${toWidth(epicStart, epicEnd)}%`,
                          minWidth: '60px',
                          backgroundColor: `${epic.color}30`,
                          border: `1.5px solid ${epic.color}80`,
                        }}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg"
                          style={{ width: `${pct}%`, backgroundColor: `${epic.color}50` }}
                        />
                        <div className="relative h-full flex items-center px-2">
                          <span className="text-xs font-medium" style={{ color: epic.color }}>
                            {pct}% done · {doneCount}/{totalCount} stories
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Total Sprints', value: sprints.length, sub: `${sprints.filter((s) => s.status === 'completed').length} completed` },
          { label: 'Milestones', value: milestones.length, sub: `${milestones.filter((m) => m.status === 'completed').length} achieved` },
          { label: 'At Risk', value: milestones.filter((m) => m.status === 'at_risk').length, sub: 'milestones need attention', alert: true },
          { label: 'Avg Velocity', value: `${Math.round(sprints.filter((s) => s.velocity).reduce((sum, s) => sum + (s.velocity ?? 0), 0) / Math.max(1, sprints.filter((s) => s.velocity).length))}pts`, sub: 'per sprint' },
        ].map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border p-4 ${card.alert ? 'border-amber-200' : 'border-surface-border'}`}>
            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.alert ? 'text-amber-500' : 'text-slate-800'}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
