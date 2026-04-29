import { useMemo } from 'react';
import { Zap, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export function VelocityPage() {
  const { sprints, stories } = useScrumStore();

  const completed = sprints.filter(sp => sp.status === 'completed').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const active = sprints.find(sp => sp.status === 'active');

  const chartData = useMemo(() => completed.map(sp => {
    const spStories = stories.filter(s => s.sprintId === sp.id);
    const committed = spStories.reduce((a, s) => a + s.storyPoints, 0);
    const completed_pts = spStories.filter(s => s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);
    const bugs = spStories.filter(s => s.storyType === 'bug' && s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);
    const features = completed_pts - bugs;
    return { name: sp.name.replace('Sprint ', 'S'), committed, completed: completed_pts, features, bugs, completion_rate: committed > 0 ? Math.round((completed_pts / committed) * 100) : 0 };
  }), [sprints, stories]);

  const avgVelocity = chartData.length > 0 ? Math.round(chartData.reduce((a, d) => a + d.completed, 0) / chartData.length) : 0;
  const avgCommitted = chartData.length > 0 ? Math.round(chartData.reduce((a, d) => a + d.committed, 0) / chartData.length) : 0;
  const lastThree = chartData.slice(-3);
  const recentAvg = lastThree.length > 0 ? Math.round(lastThree.reduce((a, d) => a + d.completed, 0) / lastThree.length) : 0;
  const trend = lastThree.length >= 2 ? (lastThree[lastThree.length - 1].completed - lastThree[0].completed) : 0;
  const avgCompletion = chartData.length > 0 ? Math.round(chartData.reduce((a, d) => a + d.completion_rate, 0) / chartData.length) : 0;

  // Cumulative flow by status across sprints
  const cfdData = useMemo(() => completed.map(sp => {
    const spStories = stories.filter(s => s.sprintId === sp.id);
    return {
      name: sp.name.replace('Sprint ', 'S'),
      Done: spStories.filter(s => s.status === 'done').length,
      Review: spStories.filter(s => s.status === 'review').length,
      'In Progress': spStories.filter(s => s.status === 'in_progress').length,
      'To Do': spStories.filter(s => s.status === 'todo').length,
      Backlog: spStories.filter(s => s.status === 'backlog').length,
    };
  }), [sprints, stories]);

  // Active sprint for predictability
  const activePrediction = useMemo(() => {
    if (!active) return null;
    const spStories = stories.filter(s => s.sprintId === active.id);
    const committed = spStories.reduce((a, s) => a + s.storyPoints, 0);
    const done = spStories.filter(s => s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);
    const predicted = recentAvg > 0 ? recentAvg : avgVelocity;
    return { committed, done, predicted, onTrack: done >= (committed * 0.5) };
  }, [active, stories, recentAvg, avgVelocity]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Zap size={22} className="text-brand-500" /> Velocity Chart</h1>
        <p className="text-slate-500 text-sm mt-1">Sprint-by-sprint delivery performance and trends</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Velocity', value: `${avgVelocity} pts`, sub: 'all sprints', icon: Zap, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Recent Velocity', value: `${recentAvg} pts`, sub: 'last 3 sprints', icon: TrendingUp, color: trend >= 0 ? 'text-green-600' : 'text-red-600', bg: trend >= 0 ? 'bg-green-50' : 'bg-red-50' },
          { label: 'Avg Committed', value: `${avgCommitted} pts`, sub: 'per sprint', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completion Rate', value: `${avgCompletion}%`, sub: 'committed → done', icon: AlertTriangle, color: avgCompletion >= 80 ? 'text-green-600' : 'text-amber-600', bg: avgCompletion >= 80 ? 'bg-green-50' : 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active sprint prediction */}
      {activePrediction && (
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${activePrediction.onTrack ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activePrediction.onTrack ? 'bg-green-100' : 'bg-amber-100'}`}>
            {activePrediction.onTrack ? <Zap size={18} className="text-green-600" /> : <AlertTriangle size={18} className="text-amber-600" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Active Sprint Prediction</p>
            <p className="text-xs text-slate-600 mt-0.5">
              {activePrediction.done} / {activePrediction.committed} pts done so far · Predicted: <span className="font-semibold">{activePrediction.predicted} pts</span> based on recent velocity
              {activePrediction.onTrack ? ' · On track ✓' : ' · Behind schedule — consider scope adjustment'}
            </p>
          </div>
        </div>
      )}

      {/* Velocity chart */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Committed vs Completed per Sprint</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Committed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-500 inline-block" /> Completed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Bugs</span>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="py-16 text-center"><p className="text-sm text-slate-400">Complete sprints to see velocity data.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <ReferenceLine y={avgVelocity} stroke="#6366F1" strokeDasharray="4 4" label={{ value: `Avg ${avgVelocity}`, fill: '#6366F1', fontSize: 11 }} />
              <Bar dataKey="committed" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Committed" />
              <Bar dataKey="features" fill="#6366F1" radius={[0, 0, 0, 0]} name="Features Done" stackId="done" />
              <Bar dataKey="bugs" fill="#EF4444" radius={[4, 4, 0, 0]} name="Bugs Done" stackId="done" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CFD */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Story Count by Status per Sprint</h2>
        {cfdData.length === 0 ? (
          <div className="py-8 text-center"><p className="text-sm text-slate-400">No completed sprint data yet.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cfdData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Done" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Review" stackId="a" fill="#8B5CF6" />
              <Bar dataKey="In Progress" stackId="a" fill="#6366F1" />
              <Bar dataKey="To Do" stackId="a" fill="#94A3B8" />
              <Bar dataKey="Backlog" stackId="a" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sprint table */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-border bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sprint History</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Sprint', 'Committed', 'Completed', 'Bugs', 'Completion %', 'vs Avg'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => {
                const vsAvg = row.completed - avgVelocity;
                return (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700">{row.name}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{row.committed} pts</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-brand-600">{row.completed} pts</td>
                    <td className="px-4 py-2.5 text-xs text-red-500">{row.bugs} pts</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(row.completion_rate, 100)}%`, backgroundColor: row.completion_rate >= 80 ? '#22C55E' : row.completion_rate >= 60 ? '#F59E0B' : '#EF4444' }} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{row.completion_rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium">
                      <span className={vsAvg >= 0 ? 'text-green-600' : 'text-red-500'}>{vsAvg >= 0 ? '+' : ''}{vsAvg} pts</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
