import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Legend, Cell,
} from 'recharts';
import { Activity, TrendingUp, Clock, Zap } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useScrumStore } from '../store/useScrumStore';

// ─── helpers ───────────────────────────────────────────────────────────────────

function safeDay(d: string | undefined) {
  if (!d) return null;
  try { return parseISO(d); } catch { return null; }
}

const EPIC_COLORS = ['#4F6EF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

type SortKey = 'title' | 'epicName' | 'storyPoints' | 'leadDays' | 'cycleDays' | 'completedAt';
type SortDir = 'asc' | 'desc';

// ─── MetricsPage ───────────────────────────────────────────────────────────────

export function MetricsPage() {
  const { stories, epics } = useScrumStore();
  const [sortKey, setSortKey] = useState<SortKey>('completedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const epicMap = useMemo(() => {
    const m: Record<string, string> = {};
    epics.forEach((e) => { m[e.id] = e.title; });
    return m;
  }, [epics]);

  const epicColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    epics.forEach((e, i) => { m[e.id] = e.color || EPIC_COLORS[i % EPIC_COLORS.length]; });
    return m;
  }, [epics]);

  // Completed stories with computed metrics
  const completedStories = useMemo(() => {
    return stories
      .filter((s) => s.status === 'done' && s.completedAt)
      .map((s) => {
        const created = safeDay(s.createdAt);
        const completed = safeDay(s.completedAt!);
        const updated = safeDay(s.updatedAt);

        const leadDays = created && completed ? Math.max(1, differenceInDays(completed, created)) : 1;
        const cycleDays = updated && completed
          ? Math.max(1, differenceInDays(completed, updated))
          : 1;

        return {
          ...s,
          epicName: epicMap[s.epicId] ?? 'No Epic',
          epicColor: epicColorMap[s.epicId] ?? '#6B7280',
          leadDays,
          cycleDays,
          completedDateStr: s.completedAt ? format(parseISO(s.completedAt), 'MMM d, yyyy') : '—',
        };
      });
  }, [stories, epicMap, epicColorMap]);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (completedStories.length === 0) {
      return { avgCycle: 0, avgLead: 0, throughput: 0, p85Cycle: 0 };
    }
    const cycles = completedStories.map((s) => s.cycleDays).sort((a, b) => a - b);
    const leads = completedStories.map((s) => s.leadDays);
    const avgCycle = cycles.reduce((a, b) => a + b, 0) / cycles.length;
    const avgLead = leads.reduce((a, b) => a + b, 0) / leads.length;
    const p85Cycle = cycles[Math.floor(0.85 * cycles.length)] ?? cycles[cycles.length - 1];

    // Rough throughput: completed stories / distinct sprint count
    const sprintIds = new Set(completedStories.map((s) => s.sprintId).filter(Boolean));
    const throughput = sprintIds.size > 0
      ? completedStories.length / sprintIds.size
      : completedStories.length;

    return { avgCycle, avgLead, throughput, p85Cycle };
  }, [completedStories]);

  // ── Flow efficiency bars ─────────────────────────────────────────────────────
  const flowData = useMemo(() => {
    // Use lead days as a proxy broken into rough columns
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const leads = completedStories.map((s) => s.leadDays);
    const cycles = completedStories.map((s) => s.cycleDays);
    const avgLead = avg(leads);
    const avgCycle = avg(cycles);
    // Approximate: backlog+todo = lead - cycle, review ≈ 0.15 * cycle
    const inProgress = avgCycle * 0.75;
    const review = avgCycle * 0.25;
    const todo = Math.max(0, (avgLead - avgCycle) * 0.35);
    const backlog = Math.max(0, (avgLead - avgCycle) * 0.65);
    return [
      { name: 'Backlog', days: parseFloat(backlog.toFixed(1)) },
      { name: 'To Do', days: parseFloat(todo.toFixed(1)) },
      { name: 'In Progress', days: parseFloat(inProgress.toFixed(1)) },
      { name: 'Review', days: parseFloat(review.toFixed(1)) },
    ];
  }, [completedStories]);

  // ── Lead time histogram ──────────────────────────────────────────────────────
  const histData = useMemo(() => {
    const buckets = [
      { label: '0-3d', min: 0, max: 3 },
      { label: '3-7d', min: 3, max: 7 },
      { label: '7-14d', min: 7, max: 14 },
      { label: '14-30d', min: 14, max: 30 },
      { label: '30d+', min: 30, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: completedStories.filter((s) => s.leadDays > b.min && s.leadDays <= b.max).length,
    }));
  }, [completedStories]);

  // ── Cycle time scatter ───────────────────────────────────────────────────────
  const scatterData = useMemo(() => completedStories.map((s) => ({
    x: s.storyPoints,
    y: s.cycleDays,
    name: s.title,
    epicColor: s.epicColor,
    epicName: s.epicName,
  })), [completedStories]);

  const { meanCycle, sdCycle } = useMemo(() => {
    if (completedStories.length === 0) return { meanCycle: 0, sdCycle: 0 };
    const cycles = completedStories.map((s) => s.cycleDays);
    const m = cycles.reduce((a, b) => a + b, 0) / cycles.length;
    const sd = Math.sqrt(cycles.reduce((a, b) => a + Math.pow(b - m, 2), 0) / cycles.length);
    return { meanCycle: parseFloat(m.toFixed(2)), sdCycle: parseFloat(sd.toFixed(2)) };
  }, [completedStories]);

  // ── Sorted table ─────────────────────────────────────────────────────────────
  const sortedStories = useMemo(() => {
    const arr = [...completedStories];
    arr.sort((a, b) => {
      let va: string | number = a[sortKey] as string | number;
      let vb: string | number = b[sortKey] as string | number;
      if (typeof va === 'string' && typeof vb === 'string') {
        va = va.toLowerCase(); vb = vb.toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = Number(va); const nb = Number(vb);
      return sortDir === 'asc' ? na - nb : nb - na;
    });
    return arr;
  }, [completedStories, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-slate-400 ml-1">↕</span>;
    return <span className="text-brand-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flow Metrics</h1>
          <p className="text-slate-500 text-sm">Cycle time, lead time and throughput analysis</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Avg Cycle Time"
          value={`${stats.avgCycle.toFixed(1)}d`}
          icon={<Clock size={18} className="text-blue-600" />}
          color="blue"
          sub="In-progress → done"
        />
        <StatCard
          label="Avg Lead Time"
          value={`${stats.avgLead.toFixed(1)}d`}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          color="emerald"
          sub="Created → done"
        />
        <StatCard
          label="Throughput"
          value={`${stats.throughput.toFixed(1)}`}
          icon={<Zap size={18} className="text-amber-600" />}
          color="amber"
          sub="Stories / sprint avg"
        />
        <StatCard
          label="85th %ile Cycle"
          value={`${stats.p85Cycle.toFixed(1)}d`}
          icon={<Activity size={18} className="text-purple-600" />}
          color="purple"
          sub="Upper control limit"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow efficiency */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Flow Efficiency — Time per Column</h2>
          {completedStories.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={flowData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit="d" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v as number}d`, 'Avg time']} />
                <Bar dataKey="days" fill="#4F6EF7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lead time histogram */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Lead Time Distribution</h2>
          {completedStories.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={histData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v as number, 'Stories']} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cycle time scatter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Cycle Time Scatter Plot</h2>
        <p className="text-sm text-slate-500 mb-4">Each dot is a completed story. X = story points, Y = cycle time.</p>
        {completedStories.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Points"
                label={{ value: 'Story Points', position: 'insideBottom', offset: -5, fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Days"
                label={{ value: 'Cycle (days)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-2 shadow text-xs">
                      <p className="font-semibold truncate max-w-[180px]">{d.name}</p>
                      <p className="text-slate-500">{d.epicName} · {d.x}pts · {d.y}d</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={meanCycle} stroke="#6B7280" strokeDasharray="4 4" label={{ value: `Mean ${meanCycle}d`, position: 'right', fontSize: 11 }} />
              <ReferenceLine y={meanCycle + sdCycle} stroke="#EF4444" strokeDasharray="4 4" label={{ value: `+1σ`, position: 'right', fontSize: 11 }} />
              <ReferenceLine y={Math.max(0, meanCycle - sdCycle)} stroke="#10B981" strokeDasharray="4 4" label={{ value: `-1σ`, position: 'right', fontSize: 11 }} />
              <Legend />
              <Scatter name="Stories" data={scatterData}>
                {scatterData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.epicColor} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
        {/* Epic legend */}
        {epics.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {epics.map((e, i) => (
              <div key={e.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: e.color || EPIC_COLORS[i % EPIC_COLORS.length] }} />
                {e.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stories table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Completed Stories ({completedStories.length})
        </h2>
        {completedStories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {(
                    [
                      { key: 'title', label: 'Title' },
                      { key: 'epicName', label: 'Epic' },
                      { key: 'storyPoints', label: 'Points' },
                      { key: 'leadDays', label: 'Lead Time' },
                      { key: 'cycleDays', label: 'Cycle Time' },
                      { key: 'completedAt', label: 'Completed' },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="text-left py-2 px-3 text-slate-500 font-medium cursor-pointer hover:text-slate-800 select-none whitespace-nowrap"
                    >
                      {label}
                      <SortIcon k={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStories.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[240px] truncate">{s.title}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.epicColor }} />
                        <span className="text-slate-600 text-xs">{s.epicName}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.storyPoints}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.leadDays <= 7 ? 'bg-green-100 text-green-700'
                        : s.leadDays <= 14 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {s.leadDays}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.cycleDays <= 3 ? 'bg-green-100 text-green-700'
                        : s.cycleDays <= 7 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {s.cycleDays}d
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{s.completedDateStr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string; icon: React.ReactNode; color: string; sub: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color] ?? 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <Activity size={32} className="mb-2" />
      <p className="text-sm">No completed stories yet.</p>
    </div>
  );
}
