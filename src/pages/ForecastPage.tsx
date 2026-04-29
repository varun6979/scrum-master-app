import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { useScrumStore } from '../store/useScrumStore';
import { runMonteCarlo, calcVelocityStats, MonteCarloResult } from '../lib/forecast';

// ─── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try { return format(parseISO(iso), 'MMM d, yyyy'); } catch { return iso; }
}

function addSprintDays(days: number, sprintLen: number, count: number): string {
  const d = addDays(new Date(), count * sprintLen);
  return format(d, 'MMM d, yyyy');
}

// ─── ForecastPage ──────────────────────────────────────────────────────────────

export function ForecastPage() {
  const { stories, sprints, milestones, settings } = useScrumStore();

  // Config state
  const backlogPointsDefault = useMemo(
    () => stories.filter((s) => !s.sprintId || s.status === 'backlog').reduce((sum, s) => sum + s.storyPoints, 0),
    [stories]
  );
  const [remainingOverride, setRemainingOverride] = useState<string>('');
  const [simulations, setSimulations] = useState(10000);
  const [sprintLen, setSprintLen] = useState(settings.sprintLengthDays ?? 14);
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const completedSprints = useMemo(() => sprints.filter((sp) => sp.status === 'completed'), [sprints]);
  const velocityStats = useMemo(() => calcVelocityStats(completedSprints), [completedSprints]);

  const remainingPoints = remainingOverride !== '' ? parseInt(remainingOverride, 10) || 0 : backlogPointsDefault;

  function runSim() {
    const res = runMonteCarlo(remainingPoints, velocityStats, simulations) as MonteCarloResult;
    setResult(res);
    setHasRun(true);
  }

  // Distribution chart data (top 15 buckets by frequency)
  const distData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.distribution)
      .map(([k, v]) => ({ sprints: parseInt(k, 10), count: v }))
      .sort((a, b) => a.sprints - b.sprints)
      .slice(0, 20);
  }, [result]);

  // Historical velocity chart
  const velocityChartData = useMemo(() => {
    return completedSprints.map((sp, i) => ({
      name: sp.name,
      velocity: sp.velocity ?? 0,
      trend: velocityStats.avg,
    }));
  }, [completedSprints, velocityStats]);

  // Milestone alignment
  const milestoneAlignment = useMemo(() => {
    if (!result) return [];
    const p75Date = addDays(new Date(), result.p75 * sprintLen);
    return milestones
      .filter((m) => m.status !== 'completed')
      .map((m) => {
        let due: Date | null = null;
        try { due = parseISO(m.dueDate); } catch { return null; }
        const diff = due.getTime() - p75Date.getTime();
        const days = Math.round(diff / (1000 * 60 * 60 * 24));
        return { ...m, dueFmt: fmtDate(m.dueDate), status75: days >= 14 ? 'green' : days >= 0 ? 'amber' : 'red', diffDays: days };
      })
      .filter(Boolean) as (typeof milestones[number] & { dueFmt: string; status75: string; diffDays: number })[];
  }, [milestones, result, sprintLen]);

  const trendLabel = velocityStats.trend === 'improving'
    ? 'Improving'
    : velocityStats.trend === 'declining'
    ? 'Declining'
    : 'Stable';
  const trendColor = velocityStats.trend === 'improving'
    ? 'text-green-600'
    : velocityStats.trend === 'declining'
    ? 'text-red-600'
    : 'text-amber-600';

  const confidenceRows = result
    ? [
        { label: '50% likely', value: result.p50, pct: 50 },
        { label: '75% likely', value: result.p75, pct: 75 },
        { label: '85% likely', value: result.p85, pct: 85 },
        { label: '95% likely', value: result.p95, pct: 95 },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Delivery Forecast</h1>
          <p className="text-slate-500 text-sm">Monte Carlo simulation based on historical velocity</p>
        </div>
      </div>

      {/* Configuration panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Simulation Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Remaining Backlog Points
            </label>
            <input
              type="number"
              min={0}
              value={remainingOverride !== '' ? remainingOverride : backlogPointsDefault}
              onChange={(e) => setRemainingOverride(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder={String(backlogPointsDefault)}
            />
            <p className="text-xs text-slate-400 mt-1">Auto-calculated: {backlogPointsDefault} pts from backlog</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sprint Length (days)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={sprintLen}
              onChange={(e) => setSprintLen(parseInt(e.target.value, 10) || 14)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Simulations: {simulations.toLocaleString()}
            </label>
            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={simulations}
              onChange={(e) => setSimulations(parseInt(e.target.value, 10))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>1,000</span>
              <span>50,000</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={runSim}
            disabled={completedSprints.length === 0}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Simulation
          </button>
          {completedSprints.length === 0 && (
            <span className="ml-3 text-xs text-amber-600">
              Complete at least one sprint to enable forecasting.
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {hasRun && result && (
        <>
          {/* Confidence table + distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Confidence Table</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Confidence</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Sprints</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Est. Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {confidenceRows.map((row) => (
                    <tr key={row.pct} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.pct >= 85 ? 'bg-amber-100 text-amber-700'
                          : row.pct >= 75 ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                          {row.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.value} sprints</td>
                      <td className="py-3 px-3 text-slate-600">
                        {addSprintDays(0, sprintLen, row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Distribution chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Simulation Distribution ({result.totalSimulations.toLocaleString()} runs)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distData} margin={{ right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sprints" label={{ value: 'Sprints', position: 'insideBottom', offset: -3, fontSize: 11 }} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v as number, 'Simulations']} labelFormatter={(l) => `${l} sprints`} />
                  <Bar dataKey="count" fill="#4F6EF7" radius={[3, 3, 0, 0]} />
                  <ReferenceLine x={result.p50} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'p50', position: 'top', fontSize: 10 }} />
                  <ReferenceLine x={result.p85} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'p85', position: 'top', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assumption callout */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
            <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              This forecast is based on your historical sprint velocities using Monte Carlo simulation with{' '}
              <strong>{result.totalSimulations.toLocaleString()}</strong> iterations. Results assume team
              composition and scope remain constant. Average velocity used:{' '}
              <strong>{velocityStats.avg.toFixed(1)} pts/sprint</strong>.
            </p>
          </div>

          {/* Milestone alignment */}
          {milestoneAlignment.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Milestone Alignment (vs. p75 forecast)</h2>
              <div className="space-y-3">
                {milestoneAlignment.map((m) => {
                  const Icon = m.status75 === 'green' ? CheckCircle2 : m.status75 === 'amber' ? AlertTriangle : XCircle;
                  const color = m.status75 === 'green' ? 'text-green-600 bg-green-50 border-green-200'
                    : m.status75 === 'amber' ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-red-600 bg-red-50 border-red-200';
                  const msg = m.status75 === 'green'
                    ? `On track — ${m.diffDays}d buffer`
                    : m.status75 === 'amber'
                    ? `Tight — only ${m.diffDays}d buffer`
                    : `At risk — ${Math.abs(m.diffDays)}d late at p75`;
                  return (
                    <div key={m.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${color}`}>
                      <Icon size={18} className="flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs opacity-80">Due {m.dueFmt}</p>
                      </div>
                      <span className="text-xs font-medium">{msg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Velocity stats + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Velocity Statistics</h2>
          <div className="space-y-3">
            <VStatRow label="Average" value={`${velocityStats.avg.toFixed(1)} pts/sprint`} />
            <VStatRow label="Min / Max" value={`${velocityStats.min} – ${velocityStats.max} pts`} />
            <VStatRow label="Std Deviation" value={`±${velocityStats.stdDev.toFixed(1)} pts`} />
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-xs text-slate-500">Trend</span>
              <span className={`text-xs font-semibold ${trendColor}`}>
                {trendLabel}
                {velocityStats.trendPct !== 0 && ` (${velocityStats.trendPct > 0 ? '+' : ''}${velocityStats.trendPct.toFixed(1)}%)`}
              </span>
            </div>
            <VStatRow label="Completed Sprints" value={String(completedSprints.length)} />
          </div>
        </div>

        {/* Velocity chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Historical Velocity + Trend</h2>
          {velocityChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <TrendingUp size={28} className="mb-2" />
              <p className="text-sm">No completed sprints yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={velocityChartData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="velocity" stroke="#4F6EF7" strokeWidth={2} dot={{ r: 4 }} name="Velocity" />
                <Line type="monotone" dataKey="trend" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Avg" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function VStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}
