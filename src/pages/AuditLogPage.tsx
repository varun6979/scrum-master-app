import { useState, useMemo } from 'react';
import { Search, Filter, Download, Clock, ArrowRight, User, GitBranch, Zap } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { TeamMember, Sprint } from '../types';
import { format, parseISO, isBefore, subDays } from 'date-fns';

type DateRange = '24h' | '7d' | '30d' | 'all';

const FIELD_ICONS: Record<string, React.ReactNode> = {
  status: <span className="text-purple-500">◈</span>,
  priority: <span className="text-orange-500">▲</span>,
  assigneeId: <User size={11} className="text-blue-500" />,
  storyPoints: <span className="text-green-500 font-bold text-xs">pts</span>,
  sprintId: <GitBranch size={11} className="text-amber-500" />,
  qaStatus: <Zap size={11} className="text-teal-500" />,
  approvalStatus: <span className="text-pink-500">✓</span>,
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  review: 'Review', blocked: 'Blocked', done: 'Done',
};

function formatValue(field: string, value: string, members: TeamMember[], sprints: Sprint[]) {
  if (!value || value === 'undefined') return '—';
  if (field === 'assigneeId') return members.find((m) => m.id === value)?.name ?? value;
  if (field === 'sprintId') return sprints.find((sp) => sp.id === value)?.name ?? 'Backlog';
  if (field === 'status') return STATUS_LABELS[value] ?? value;
  return value;
}

export function AuditLogPage() {
  const { activityLog, members, stories, sprints } = useScrumStore();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [filterField, setFilterField] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  const cutoff = useMemo(() => {
    const now = new Date();
    if (dateRange === '24h') return subDays(now, 1);
    if (dateRange === '7d') return subDays(now, 7);
    if (dateRange === '30d') return subDays(now, 30);
    return null;
  }, [dateRange]);

  const fields = useMemo(() => {
    const all = new Set(activityLog.map((e) => e.field ?? 'other'));
    return Array.from(all).filter(Boolean);
  }, [activityLog]);

  const filtered = useMemo(() => {
    return [...activityLog]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .filter((entry) => {
        if (cutoff && isBefore(parseISO(entry.timestamp), cutoff)) return false;
        if (filterField !== 'all' && entry.field !== filterField) return false;
        if (filterMember !== 'all' && entry.authorId !== filterMember) return false;
        if (search) {
          const story = stories.find((s) => s.id === entry.storyId);
          const q = search.toLowerCase();
          return (
            entry.action.toLowerCase().includes(q) ||
            story?.title.toLowerCase().includes(q) ||
            (entry.oldValue ?? '').toLowerCase().includes(q) ||
            (entry.newValue ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [activityLog, cutoff, filterField, filterMember, search, stories]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const entry of filtered) {
      const day = entry.timestamp.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(entry);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const exportCSV = () => {
    const rows = [
      ['Timestamp', 'Story', 'Field', 'Old Value', 'New Value', 'Author'],
      ...filtered.map((e) => {
        const story = stories.find((s) => s.id === e.storyId);
        const author = members.find((m) => m.id === e.authorId);
        return [
          e.timestamp,
          story?.title ?? e.storyId,
          e.field ?? 'N/A',
          formatValue(e.field ?? '', e.oldValue ?? '', members, sprints),
          formatValue(e.field ?? '', e.newValue ?? '', members, sprints),
          author?.name ?? 'System',
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Clock size={20} className="text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
            <p className="text-sm text-slate-500">Full history of every change made to stories</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-5 bg-white border border-surface-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{activityLog.length}</span>
          <span className="text-sm text-slate-400">total events</span>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-brand-600">{filtered.length}</span>
          <span className="text-sm text-slate-400">matching</span>
        </div>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-700">{members.length}</span>
          <span className="text-sm text-slate-400">contributors</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-surface-border rounded-xl px-3 py-2">
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories, fields, values..."
            className="flex-1 text-sm outline-none placeholder-slate-400 bg-transparent" />
        </div>

        <div className="flex items-center gap-1 bg-white border border-surface-border rounded-xl p-1">
          {(['24h', '7d', '30d', 'all'] as DateRange[]).map((d) => (
            <button key={d} onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${dateRange === d ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {d === 'all' ? 'All time' : `Last ${d}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select value={filterField} onChange={(e) => setFilterField(e.target.value)}
            className="border border-surface-border rounded-lg px-3 py-1.5 text-sm outline-none bg-white">
            <option value="all">All fields</option>
            {fields.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)}
            className="border border-surface-border rounded-lg px-3 py-1.5 text-sm outline-none bg-white">
            <option value="all">All authors</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Log timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-surface-border">
          <Clock size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No activity found</p>
          <p className="text-sm text-slate-400 mt-1">Changes to stories will be recorded here automatically</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, entries]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {format(parseISO(day), 'EEEE, MMMM d, yyyy')}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="bg-white rounded-2xl border border-surface-border overflow-hidden divide-y divide-slate-50">
                {entries.map((entry) => {
                  const story = stories.find((s) => s.id === entry.storyId);
                  const author = members.find((m) => m.id === entry.authorId);
                  return (
                    <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      {/* Author avatar */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: author?.avatarColor ?? '#94A3B8', fontSize: '9px' }}>
                        {author?.avatarInitials ?? 'SY'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-700">{author?.name ?? 'System'}</span>
                          <span className="text-xs text-slate-400">{entry.action}</span>
                          {entry.field && (
                            <span className="flex items-center gap-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                              {FIELD_ICONS[entry.field] ?? null}
                              {entry.field}
                            </span>
                          )}
                        </div>

                        {story && (
                          <p className="text-xs text-brand-600 font-medium mt-0.5 truncate">{story.title}</p>
                        )}

                        {entry.oldValue !== undefined && entry.newValue !== undefined && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded line-through">
                              {formatValue(entry.field ?? '', entry.oldValue, members, sprints)}
                            </span>
                            <ArrowRight size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                              {formatValue(entry.field ?? '', entry.newValue, members, sprints)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Time */}
                      <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                        {format(parseISO(entry.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
