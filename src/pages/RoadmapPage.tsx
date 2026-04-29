import { useState, useMemo } from 'react';
import { Map, ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { addMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isWithinInterval, differenceInDays, startOfDay } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#3B82F6',
};

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94A3B8',
  in_progress: '#6366F1',
  at_risk: '#F59E0B',
  completed: '#22C55E',
  missed: '#EF4444',
};

type ViewMode = 'quarter' | 'half' | 'year';

const VIEW_MONTHS: Record<ViewMode, number> = { quarter: 3, half: 6, year: 12 };

export function RoadmapPage() {
  const { epics, milestones, sprints, stories } = useScrumStore();
  const [viewMode, setViewMode] = useState<ViewMode>('quarter');
  const [offset, setOffset] = useState(0); // months offset from today
  const [filter, setFilter] = useState<'all' | 'epics' | 'milestones' | 'sprints'>('all');

  const today = startOfDay(new Date());
  const viewStart = startOfMonth(addMonths(today, offset));
  const viewEnd = endOfMonth(addMonths(viewStart, VIEW_MONTHS[viewMode] - 1));
  const months = eachMonthOfInterval({ start: viewStart, end: viewEnd });
  const totalDays = differenceInDays(viewEnd, viewStart) + 1;

  const getBar = (start: Date, end: Date) => {
    const clampedStart = start < viewStart ? viewStart : start;
    const clampedEnd = end > viewEnd ? viewEnd : end;
    if (clampedStart > viewEnd || clampedEnd < viewStart) return null;
    const left = (differenceInDays(clampedStart, viewStart) / totalDays) * 100;
    const width = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  // Build roadmap rows
  const rows = useMemo(() => {
    const result: { id: string; type: string; label: string; sublabel?: string; color: string; start: Date; end: Date; pct?: number }[] = [];

    if (filter === 'all' || filter === 'epics') {
      epics.forEach(epic => {
        const epicStories = stories.filter(s => s.epicId === epic.id && s.dueDate);
        const dates = epicStories.map(s => parseISO(s.dueDate!));
        const created = parseISO(epic.createdAt);
        const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : addMonths(created, 2);
        const done = stories.filter(s => s.epicId === epic.id && s.status === 'done').length;
        const total = stories.filter(s => s.epicId === epic.id).length;
        result.push({
          id: epic.id, type: 'Epic', label: epic.title,
          sublabel: `${done}/${total} stories`,
          color: epic.color, start: created, end: endDate,
          pct: total > 0 ? Math.round((done / total) * 100) : 0,
        });
      });
    }

    if (filter === 'all' || filter === 'sprints') {
      sprints.forEach(sprint => {
        result.push({
          id: sprint.id, type: 'Sprint', label: sprint.name,
          sublabel: sprint.goal ? sprint.goal.slice(0, 40) : sprint.status,
          color: sprint.status === 'active' ? '#6366F1' : sprint.status === 'completed' ? '#22C55E' : '#94A3B8',
          start: parseISO(sprint.startDate), end: parseISO(sprint.endDate),
        });
      });
    }

    if (filter === 'all' || filter === 'milestones') {
      milestones.forEach(m => {
        const date = parseISO(m.dueDate);
        result.push({
          id: m.id, type: 'Milestone', label: m.title,
          sublabel: m.status.replace('_', ' '),
          color: STATUS_COLORS[m.status] ?? '#94A3B8',
          start: date, end: date,
        });
      });
    }

    return result;
  }, [epics, sprints, milestones, stories, filter]);

  const todayPct = (differenceInDays(today, viewStart) / totalDays) * 100;
  const showTodayLine = todayPct >= 0 && todayPct <= 100;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Map size={22} className="text-brand-500" /> Product Roadmap
          </h1>
          <p className="text-slate-500 text-sm mt-1">Visual timeline of epics, sprints, and milestones</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['all', 'epics', 'sprints', 'milestones'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {/* View mode */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['quarter', 'half', 'year'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {v === 'quarter' ? 'Q' : v === 'half' ? '6M' : '1Y'}
              </button>
            ))}
          </div>
          {/* Navigate */}
          <div className="flex items-center gap-1">
            <button onClick={() => setOffset(o => o - VIEW_MONTHS[viewMode])} className="p-1.5 rounded-lg border border-surface-border hover:bg-slate-50"><ChevronLeft size={16} /></button>
            <button onClick={() => setOffset(0)} className="px-3 py-1.5 text-xs font-medium border border-surface-border rounded-lg hover:bg-slate-50">Today</button>
            <button onClick={() => setOffset(o => o + VIEW_MONTHS[viewMode])} className="p-1.5 rounded-lg border border-surface-border hover:bg-slate-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Month headers */}
        <div className="flex border-b border-surface-border">
          <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-surface-border bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</p>
          </div>
          <div className="flex-1 flex">
            {months.map(month => (
              <div key={month.toISOString()} className="flex-1 px-2 py-3 border-r border-slate-100 last:border-r-0 text-center">
                <p className="text-xs font-semibold text-slate-600">{format(month, 'MMM')}</p>
                <p className="text-xs text-slate-400">{format(month, 'yyyy')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Map size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No items to display for this period.</p>
            </div>
          ) : rows.map(row => {
            const bar = getBar(row.start, row.end);
            return (
              <div key={row.id} className="flex items-center hover:bg-slate-50 transition-colors group">
                {/* Label */}
                <div className="w-56 flex-shrink-0 px-4 py-3 border-r border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: row.color + '22', color: row.color }}>
                      {row.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{row.label}</p>
                  {row.sublabel && <p className="text-xs text-slate-400 truncate">{row.sublabel}</p>}
                </div>

                {/* Bar area */}
                <div className="flex-1 relative h-14 px-0">
                  {/* Month grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((m, i) => (
                      <div key={i} className="flex-1 border-r border-slate-100 last:border-r-0" />
                    ))}
                  </div>

                  {/* Today line */}
                  {showTodayLine && (
                    <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10 pointer-events-none"
                      style={{ left: `${todayPct}%` }}>
                      <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-red-400" />
                    </div>
                  )}

                  {/* Bar */}
                  {bar && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg flex items-center px-2 overflow-hidden"
                      style={{ left: bar.left, width: bar.width, backgroundColor: row.color, minWidth: '4px' }}
                      title={`${row.label}: ${format(row.start, 'MMM d')} – ${format(row.end, 'MMM d, yyyy')}`}
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {row.pct !== undefined && (
                          <div className="h-1.5 w-12 bg-white/30 rounded-full overflow-hidden flex-shrink-0">
                            <div className="h-full bg-white rounded-full" style={{ width: `${row.pct}%` }} />
                          </div>
                        )}
                        <span className="text-white text-xs font-medium truncate">{row.label}</span>
                      </div>
                    </div>
                  )}

                  {/* Milestone diamond */}
                  {bar && row.type === 'Milestone' && (
                    <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 rounded-sm flex-shrink-0 z-10"
                      style={{ left: bar.left, backgroundColor: row.color }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-surface-border bg-slate-50 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-px bg-red-400 relative"><div className="absolute -left-0.5 -top-1 w-2 h-2 rounded-full bg-red-400" /></div>
            <span>Today</span>
          </div>
          {[{ label: 'Epic', color: '#6366F1' }, { label: 'Sprint', color: '#22C55E' }, { label: 'Milestone ◆', color: '#F59E0B' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-auto">{format(viewStart, 'MMM d')} – {format(viewEnd, 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
