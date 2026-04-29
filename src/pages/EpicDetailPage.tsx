import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, Layers, TrendingDown, CheckCircle2, Clock, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-500',
  todo: 'bg-blue-50 text-blue-600',
  in_progress: 'bg-indigo-50 text-indigo-600',
  review: 'bg-purple-50 text-purple-600',
  blocked: 'bg-red-50 text-red-600',
  done: 'bg-green-50 text-green-700',
};

export function EpicDetailPage() {
  const { epicId } = useParams<{ epicId: string }>();
  const navigate = useNavigate();
  const { epics, stories, members, sprints } = useScrumStore();

  const epic = epics.find(e => e.id === epicId);
  const epicStories = useMemo(
    () => stories.filter(s => s.epicId === epicId),
    [stories, epicId]
  );

  if (!epic) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Epic not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-500 text-sm hover:underline">← Go back</button>
      </div>
    );
  }

  const done = epicStories.filter(s => s.status === 'done');
  const inProgress = epicStories.filter(s => s.status === 'in_progress');
  const blocked = epicStories.filter(s => s.status === 'blocked');
  const totalPoints = epicStories.reduce((a, s) => a + s.storyPoints, 0);
  const donePoints = done.reduce((a, s) => a + s.storyPoints, 0);
  const progressPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
  const owner = members.find(m => m.id === epic.ownerId);

  // Stories by sprint for burndown-like view
  const sprintGroups = useMemo(() => {
    const groups: Record<string, typeof epicStories> = { 'Backlog': [] };
    epicStories.forEach(s => {
      if (!s.sprintId) {
        groups['Backlog'].push(s);
      } else {
        const sp = sprints.find(sp => sp.id === s.sprintId);
        const name = sp?.name ?? 'Unknown Sprint';
        if (!groups[name]) groups[name] = [];
        groups[name].push(s);
      }
    });
    return groups;
  }, [epicStories, sprints]);

  // Simple burndown data points (cumulative done points per sprint)
  const burndownData = useMemo(() => {
    const sprintList = sprints.filter(sp => epicStories.some(s => s.sprintId === sp.id)).sort((a, b) => a.startDate.localeCompare(b.startDate));
    let cumDone = 0;
    return sprintList.map(sp => {
      const spStories = epicStories.filter(s => s.sprintId === sp.id);
      const spDone = spStories.filter(s => s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);
      cumDone += spDone;
      return { name: sp.name, done: cumDone, total: totalPoints };
    });
  }, [sprints, epicStories, totalPoints]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-start gap-4">
          <div className="w-5 h-12 rounded-lg flex-shrink-0" style={{ backgroundColor: epic.color }} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{epic.title}</h1>
              <Badge variant="priority" value={epic.priority} />
            </div>
            <p className="text-slate-500 text-sm">{epic.description || 'No description.'}</p>
            {owner && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar initials={owner.avatarInitials} color={owner.avatarColor} size="sm" />
                <span className="text-xs text-slate-500">{owner.name} · Owner</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Stories', value: epicStories.length, icon: Layers, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Completed', value: done.length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Blocked', value: blocked.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-500" />
            <span className="text-sm font-semibold text-slate-700">Completion Progress</span>
          </div>
          <span className="text-sm font-bold text-brand-600">{progressPct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: epic.color }} />
        </div>
        <p className="text-xs text-slate-400">{donePoints} / {totalPoints} story points completed</p>

        {/* Mini burndown bars */}
        {burndownData.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Cumulative completion per sprint</p>
            <div className="flex items-end gap-2 h-16">
              {burndownData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '48px' }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t transition-all"
                      style={{ height: `${d.total > 0 ? (d.done / d.total) * 48 : 0}px`, backgroundColor: epic.color, opacity: 0.8 }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 truncate w-full text-center">{d.name.split(' ').pop()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stories table grouped by sprint */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
          <Layers size={16} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-700">Stories ({epicStories.length})</h2>
        </div>

        {epicStories.length === 0 ? (
          <div className="py-12 text-center">
            <Layers size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No stories in this epic yet.</p>
          </div>
        ) : (
          <div>
            {Object.entries(sprintGroups).filter(([, ss]) => ss.length > 0).map(([sprintName, ss]) => (
              <div key={sprintName}>
                <div className="px-5 py-2 bg-slate-50 border-b border-surface-border">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{sprintName}</p>
                </div>
                {ss.map((story, idx) => {
                  const assignee = story.assigneeId ? members.find(m => m.id === story.assigneeId) : null;
                  return (
                    <div key={story.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 ${idx < ss.length - 1 ? 'border-b border-surface-border' : ''}`}>
                      <Badge variant="priority" value={story.priority} />
                      <span className="flex-1 text-sm text-slate-800 truncate">{story.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[story.status] ?? 'bg-slate-100 text-slate-500'}`}>{story.status.replace('_', ' ')}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-2 py-0.5">{story.storyPoints}pt</span>
                      {assignee ? (
                        <Avatar initials={assignee.avatarInitials} color={assignee.avatarColor} size="sm" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team */}
      {epicStories.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-brand-500" />
            <h2 className="text-sm font-semibold text-slate-700">Team Contribution</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {members
              .filter(m => epicStories.some(s => s.assigneeId === m.id))
              .map(m => {
                const assigned = epicStories.filter(s => s.assigneeId === m.id);
                const doneCount = assigned.filter(s => s.status === 'done').length;
                return (
                  <div key={m.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{doneCount}/{assigned.length} done</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Burndown chart link */}
      <div className="flex items-center gap-2">
        <TrendingDown size={14} className="text-slate-400" />
        <button onClick={() => navigate('/burndown')} className="text-sm text-brand-500 hover:text-brand-700 hover:underline">
          View full Burndown Chart →
        </button>
      </div>
    </div>
  );
}
