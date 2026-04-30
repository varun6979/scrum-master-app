import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Award } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { VelocityChart } from '../components/charts/VelocityChart';
import { SprintPieChart } from '../components/charts/SprintPieChart';

type ReportTab = 'velocity' | 'sprint' | 'team';

export function ReportsPage() {
  const { sprints, stories, members, epics } = useScrumStore();
  const [tab, setTab] = useState<ReportTab>('velocity');
  const [selectedSprintId, setSelectedSprintId] = useState(
    sprints.find((s) => s.status === 'active')?.id ?? sprints[0]?.id ?? ''
  );

  const completedSprints = sprints.filter((s) => s.status === 'completed');
  const avgVelocity = completedSprints.length > 0
    ? Math.round(completedSprints.reduce((sum, s) => sum + (s.velocity ?? 0), 0) / completedSprints.length)
    : 0;

  const sprintStories = stories.filter((s) => s.sprintId === selectedSprintId);

  // Team performance: total done points per member across all sprints
  const memberPerf = members.map((m) => {
    const doneStories = stories.filter((s) => s.assigneeId === m.id && s.status === 'done');
    const totalPoints = doneStories.reduce((sum, s) => sum + s.storyPoints, 0);
    const totalStories = doneStories.length;
    const epicsWorked = [...new Set(doneStories.map((s) => s.epicId))].filter(Boolean).length;
    return { member: m, totalPoints, totalStories, epicsWorked };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const tabs = [
    { id: 'velocity' as ReportTab, label: 'Velocity', icon: TrendingUp },
    { id: 'sprint' as ReportTab, label: 'Sprint Summary', icon: BarChart3 },
    { id: 'team' as ReportTab, label: 'Team Performance', icon: Users },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <BarChart3 size={20} className="text-brand-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">Velocity, sprint summaries, and team performance</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sprints Completed', value: completedSprints.length },
          { label: 'Avg Velocity', value: `${avgVelocity}pt`, sub: 'per sprint' },
          { label: 'Total Stories Done', value: stories.filter((s) => s.status === 'done').length },
          { label: 'Total Points Done', value: stories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
            {s.sub && <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-surface-border mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Velocity tab */}
      {tab === 'velocity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Sprint Velocity (Last 8 Sprints)</h3>
            <VelocityChart />
          </div>
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-slate-700">Sprint History</h3>
            </div>
            <div className="divide-y divide-surface-border">
              {[...sprints].reverse().map((sp) => (
                <div key={sp.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{sp.name}</p>
                    <p className="text-xs text-slate-400">{sp.startDate} → {sp.endDate}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${sp.status === 'completed' ? 'bg-green-100 text-green-700' : sp.status === 'active' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>{sp.status}</span>
                  {sp.velocity !== undefined ? (
                    <span className="text-sm font-bold text-slate-800 w-16 text-right">{sp.velocity}pt</span>
                  ) : (
                    <span className="text-xs text-slate-400 w-16 text-right">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sprint Summary tab */}
      {tab === 'sprint' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Sprint Status Breakdown</h3>
            <select
              className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
            >
              {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <SprintPieChart sprintId={selectedSprintId} />
            </div>
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-border">
                <p className="text-xs font-semibold text-slate-600">Stories ({sprintStories.length})</p>
              </div>
              <div className="divide-y divide-surface-border max-h-72 overflow-y-auto">
                {sprintStories.map((s) => {
                  const colors: Record<string, string> = { done: 'bg-green-500', review: 'bg-amber-400', in_progress: 'bg-purple-500', todo: 'bg-blue-400', backlog: 'bg-slate-300' };
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[s.status]}`} />
                      <span className="flex-1 text-xs text-slate-700 truncate">{s.title}</span>
                      <span className="text-xs font-semibold text-slate-500">{s.storyPoints}pt</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['done', 'review', 'in_progress', 'todo', 'backlog'] as const).map((st) => {
              const count = sprintStories.filter((s) => s.status === st).length;
              const pts = sprintStories.filter((s) => s.status === st).reduce((sum, s) => sum + s.storyPoints, 0);
              const labels: Record<string, string> = { done: 'Done', review: 'In Review', in_progress: 'In Progress', todo: 'To Do', backlog: 'Backlog' };
              return (
                <div key={st} className="bg-white rounded-xl border border-surface-border p-3 text-center">
                  <p className="text-xs text-slate-400 mb-1">{labels[st]}</p>
                  <p className="text-xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-400">{pts}pt</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Performance tab */}
      {tab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-slate-700">Team Performance — All Time</h3>
            </div>
            <div className="divide-y divide-surface-border">
              {memberPerf.map(({ member, totalPoints, totalStories, epicsWorked }, i) => (
                <div key={member.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: member.avatarColor }}>
                    {member.avatarInitials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{member.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{totalPoints}pt</p>
                    <p className="text-xs text-slate-400">{totalStories} stories</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{epicsWorked} epics</p>
                  </div>
                  {i === 0 && <Award size={16} className="text-amber-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Per-epic breakdown */}
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-border">
              <h3 className="text-sm font-semibold text-slate-700">Points by Epic</h3>
            </div>
            <div className="divide-y divide-surface-border">
              {epics.map((epic) => {
                const epicStories = stories.filter((s) => s.epicId === epic.id);
                const done = epicStories.filter((s) => s.status === 'done');
                const pct = epicStories.length > 0 ? Math.round((done.length / epicStories.length) * 100) : 0;
                const pts = done.reduce((sum, s) => sum + s.storyPoints, 0);
                return (
                  <div key={epic.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />
                    <span className="flex-1 text-sm text-slate-700">{epic.title}</span>
                    <span className="text-xs text-slate-400">{done.length}/{epicStories.length} stories</span>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: epic.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-12 text-right">{pts}pt</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
