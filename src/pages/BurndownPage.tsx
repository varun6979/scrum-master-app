import { TrendingDown } from 'lucide-react';
import { useScrumStore, useBurndown } from '../store/useScrumStore';
import { BurndownChart } from '../components/charts/BurndownChart';
import { useState } from 'react';

export function BurndownPage() {
  const { sprints, stories } = useScrumStore();
  const [selectedSprintId, setSelectedSprintId] = useState(
    sprints.find((s) => s.status === 'active')?.id ?? sprints[0]?.id ?? ''
  );

  const { snapshots, sprint } = useBurndown(selectedSprintId);

  const sprintStories = stories.filter((s) => s.sprintId === selectedSprintId);
  const totalPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
  const donePoints = sprintStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0);
  const remaining = totalPoints - donePoints;
  const pctDone = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <TrendingDown size={20} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Burndown Chart</h1>
            <p className="text-sm text-slate-500">Sprint progress vs. ideal trajectory</p>
          </div>
        </div>
        <select
          className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={selectedSprintId}
          onChange={(e) => setSelectedSprintId(e.target.value)}
        >
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Points', value: totalPoints },
          { label: 'Completed', value: donePoints, color: 'text-green-600' },
          { label: 'Remaining', value: remaining, color: remaining > 0 ? 'text-amber-500' : 'text-green-600' },
          { label: '% Done', value: `${pctDone}%`, color: pctDone >= 80 ? 'text-green-600' : pctDone >= 50 ? 'text-amber-500' : 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color ?? 'text-slate-800'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {sprint && (
        <div className="bg-white rounded-xl border border-surface-border p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">{sprint.name}</h3>
          <p className="text-xs text-slate-500 mb-4">{sprint.goal}</p>
          <BurndownChart sprintId={selectedSprintId} height={300} />
        </div>
      )}

      {/* Story breakdown table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-slate-700">Stories in Sprint</h3>
        </div>
        <div className="divide-y divide-surface-border">
          {sprintStories.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No stories in this sprint</div>
          ) : (
            sprintStories.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'done' ? 'bg-green-500' : s.status === 'in_progress' ? 'bg-purple-500' : s.status === 'review' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <span className="flex-1 text-sm text-slate-700 truncate">{s.title}</span>
                <span className="text-xs text-slate-400 capitalize">{s.status.replace('_', ' ')}</span>
                <span className="text-xs font-semibold text-slate-600 w-8 text-right">{s.storyPoints}pt</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
