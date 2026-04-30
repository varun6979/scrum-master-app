import { useState, useMemo } from 'react';
import { Clock, TrendingUp, Users, BarChart3, Download, AlertTriangle } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';

type GroupBy = 'member' | 'sprint' | 'epic';

function fmtHours(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function OverUnderBadge({ estimate, spent }: { estimate: number; spent: number }) {
  if (estimate === 0) return <span className="text-xs text-slate-300">—</span>;
  const pct = Math.round((spent / estimate) * 100);
  const over = spent > estimate;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
      {over ? '+' : ''}{pct - 100}%
    </span>
  );
}

function TimeBar({ estimate, spent }: { estimate: number; spent: number }) {
  if (estimate === 0) return <div className="h-2 bg-slate-100 rounded-full w-24" />;
  const pct = Math.min(100, (spent / estimate) * 100);
  const over = spent > estimate;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-24">
      <div className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-brand-400'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function TimeReportPage() {
  const { stories, members, sprints, epics } = useScrumStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('member');
  const [sprintFilter, setSprintFilter] = useState('all');
  const [minLogged, setMinLogged] = useState(false);

  const filteredStories = useMemo(() => {
    let s = stories.filter((st) => (st.timeEstimateMins ?? 0) > 0 || (st.timeSpentMins ?? 0) > 0);
    if (sprintFilter !== 'all') s = s.filter((st) => st.sprintId === sprintFilter);
    if (minLogged) s = s.filter((st) => (st.timeSpentMins ?? 0) > 0);
    return s;
  }, [stories, sprintFilter, minLogged]);

  // Totals
  const totalEstimate = filteredStories.reduce((sum, s) => sum + (s.timeEstimateMins ?? 0), 0);
  const totalSpent = filteredStories.reduce((sum, s) => sum + (s.timeSpentMins ?? 0), 0);

  // Group data
  const groupedData = useMemo(() => {
    if (groupBy === 'member') {
      const map = new Map<string, { estimate: number; spent: number; count: number; stories: typeof filteredStories }>();
      for (const s of filteredStories) {
        const key = s.assigneeId ?? '__unassigned__';
        const existing = map.get(key) ?? { estimate: 0, spent: 0, count: 0, stories: [] };
        map.set(key, {
          estimate: existing.estimate + (s.timeEstimateMins ?? 0),
          spent: existing.spent + (s.timeSpentMins ?? 0),
          count: existing.count + 1,
          stories: [...existing.stories, s],
        });
      }
      return Array.from(map.entries()).map(([key, data]) => ({
        key,
        label: members.find((m) => m.id === key)?.name ?? 'Unassigned',
        color: members.find((m) => m.id === key)?.avatarColor ?? '#94A3B8',
        initials: members.find((m) => m.id === key)?.avatarInitials ?? '??',
        ...data,
      })).sort((a, b) => b.spent - a.spent);
    }

    if (groupBy === 'sprint') {
      const map = new Map<string, { estimate: number; spent: number; count: number; stories: typeof filteredStories }>();
      for (const s of filteredStories) {
        const key = s.sprintId ?? '__backlog__';
        const existing = map.get(key) ?? { estimate: 0, spent: 0, count: 0, stories: [] };
        map.set(key, {
          estimate: existing.estimate + (s.timeEstimateMins ?? 0),
          spent: existing.spent + (s.timeSpentMins ?? 0),
          count: existing.count + 1,
          stories: [...existing.stories, s],
        });
      }
      return Array.from(map.entries()).map(([key, data]) => {
        const sprint = sprints.find((sp) => sp.id === key);
        return { key, label: sprint?.name ?? 'Backlog', color: '#4F6EF7', initials: 'SP', ...data };
      }).sort((a, b) => b.spent - a.spent);
    }

    // epic
    const map = new Map<string, { estimate: number; spent: number; count: number; stories: typeof filteredStories }>();
    for (const s of filteredStories) {
      const key = s.epicId ?? '__none__';
      const existing = map.get(key) ?? { estimate: 0, spent: 0, count: 0, stories: [] };
      map.set(key, {
        estimate: existing.estimate + (s.timeEstimateMins ?? 0),
        spent: existing.spent + (s.timeSpentMins ?? 0),
        count: existing.count + 1,
        stories: [...existing.stories, s],
      });
    }
    return Array.from(map.entries()).map(([key, data]) => {
      const epic = epics.find((e) => e.id === key);
      return { key, label: epic?.title ?? 'No Epic', color: epic?.color ?? '#94A3B8', initials: 'EP', ...data };
    }).sort((a, b) => b.spent - a.spent);
  }, [filteredStories, groupBy, members, sprints, epics]);

  // Over-logged stories (spent > estimate)
  const overlogged = filteredStories.filter((s) => (s.timeSpentMins ?? 0) > (s.timeEstimateMins ?? 0) && (s.timeEstimateMins ?? 0) > 0);

  const exportCSV = () => {
    const rows = [
      ['Story', 'Assignee', 'Sprint', 'Epic', 'Estimate (h)', 'Logged (h)', 'Delta'],
      ...filteredStories.map((s) => {
        const est = (s.timeEstimateMins ?? 0) / 60;
        const spent = (s.timeSpentMins ?? 0) / 60;
        return [
          s.title,
          members.find((m) => m.id === s.assigneeId)?.name ?? 'Unassigned',
          sprints.find((sp) => sp.id === s.sprintId)?.name ?? 'Backlog',
          epics.find((e) => e.id === s.epicId)?.title ?? '',
          est.toFixed(1), spent.toFixed(1),
          (spent - est).toFixed(1),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'time-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Time Tracking Reports</h1>
            <p className="text-sm text-slate-500">Per-user, per-sprint, and per-epic time analysis</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-surface-border px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Stories Tracked</p>
          <p className="text-2xl font-bold text-slate-800">{filteredStories.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Total Estimated</p>
          <p className="text-2xl font-bold text-blue-600">{fmtHours(totalEstimate)}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border px-4 py-3">
          <p className="text-xs text-slate-400 mb-1">Total Logged</p>
          <p className="text-2xl font-bold text-amber-600">{fmtHours(totalSpent)}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${totalSpent > totalEstimate ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-xs text-slate-400 mb-1">Overall Variance</p>
          <p className={`text-2xl font-bold ${totalSpent > totalEstimate ? 'text-red-600' : 'text-green-600'}`}>
            {totalEstimate > 0 ? `${Math.round(((totalSpent - totalEstimate) / totalEstimate) * 100)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-white border border-surface-border rounded-lg p-1">
          {(['member', 'sprint', 'epic'] as GroupBy[]).map((g) => (
            <button key={g} onClick={() => setGroupBy(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${groupBy === g ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {g === 'member' ? <><Users size={12} className="inline mr-1" />By Member</> : g === 'sprint' ? <><BarChart3 size={12} className="inline mr-1" />By Sprint</> : <><TrendingUp size={12} className="inline mr-1" />By Epic</>}
            </button>
          ))}
        </div>

        <select value={sprintFilter} onChange={(e) => setSprintFilter(e.target.value)}
          className="border border-surface-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-300 bg-white">
          <option value="all">All Sprints</option>
          {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={minLogged} onChange={(e) => setMinLogged(e.target.checked)} className="rounded" />
          Has logged time only
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Group summary */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Summary</p>
            </div>
            <div className="divide-y divide-slate-50">
              {groupedData.map((row) => (
                <div key={row.key} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: row.color, fontSize: '9px' }}>
                      {row.initials}
                    </div>
                    <span className="text-sm font-medium text-slate-700 flex-1 truncate">{row.label}</span>
                    <span className="text-xs text-slate-400">{row.count} stories</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TimeBar estimate={row.estimate} spent={row.spent} />
                    <div className="text-xs text-slate-500">
                      <span className="text-slate-700 font-medium">{fmtHours(row.spent)}</span>
                      {row.estimate > 0 && <span className="text-slate-400"> / {fmtHours(row.estimate)}</span>}
                    </div>
                    <OverUnderBadge estimate={row.estimate} spent={row.spent} />
                  </div>
                </div>
              ))}
              {groupedData.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-sm">No time data for current filters</div>
              )}
            </div>
          </div>
        </div>

        {/* Story-level detail */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-surface-border overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Story Detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Story</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Assignee</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Estimate</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Logged</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStories.map((s) => {
                    const assignee = members.find((m) => m.id === s.assigneeId);
                    const est = s.timeEstimateMins ?? 0;
                    const spent = s.timeSpentMins ?? 0;
                    const over = spent > est && est > 0;
                    return (
                      <tr key={s.id} className={`hover:bg-slate-50 ${over ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-2.5 max-w-[220px]">
                          <p className="text-sm text-slate-700 truncate">{s.title}</p>
                          <p className="text-xs text-slate-400">{sprints.find((sp) => sp.id === s.sprintId)?.name ?? 'Backlog'}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          {assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                                style={{ backgroundColor: assignee.avatarColor, fontSize: '9px' }}>
                                {assignee.avatarInitials}
                              </div>
                              <span className="text-xs text-slate-600">{assignee.name.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-slate-600">
                          {est > 0 ? fmtHours(est) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-medium text-slate-700">
                          {spent > 0 ? fmtHours(spent) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <OverUnderBadge estimate={est} spent={spent} />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStories.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No stories with time data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Over-logged alert */}
          {overlogged.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm font-semibold text-red-700">{overlogged.length} stories over estimate</span>
              </div>
              <div className="space-y-1">
                {overlogged.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="text-red-600 truncate flex-1">{s.title}</span>
                    <span className="text-red-500 font-medium">{fmtHours(s.timeSpentMins ?? 0)} / {fmtHours(s.timeEstimateMins ?? 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
