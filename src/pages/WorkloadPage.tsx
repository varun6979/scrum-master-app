import { useMemo } from 'react';
import { Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useScrumStore, useActiveSprint } from '../store/useScrumStore';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-500',
  in_progress: 'bg-blue-100 text-blue-600',
  review: 'bg-purple-100 text-purple-600',
  blocked: 'bg-red-100 text-red-600',
  done: 'bg-green-100 text-green-700',
  backlog: 'bg-slate-50 text-slate-400',
};

export function WorkloadPage() {
  const { members, stories, sprints, activeSprintId } = useScrumStore();
  const activeSprint = useActiveSprint();

  // Show active sprint or most recent
  const targetSprint = activeSprint ?? sprints.filter(sp => sp.status !== 'completed').sort((a, b) => b.startDate.localeCompare(a.startDate))[0];

  const memberData = useMemo(() => {
    return members.map(member => {
      const allAssigned = stories.filter(s => s.assigneeId === member.id && s.status !== 'done');
      const sprintAssigned = targetSprint ? stories.filter(s => s.assigneeId === member.id && s.sprintId === targetSprint.id) : [];
      const sprintDone = sprintAssigned.filter(s => s.status === 'done');
      const sprintPts = sprintAssigned.reduce((a, s) => a + s.storyPoints, 0);
      const donePts = sprintDone.reduce((a, s) => a + s.storyPoints, 0);
      const capacity = member.capacityPoints;
      const utilization = capacity > 0 ? Math.round((sprintPts / capacity) * 100) : 0;
      const blocked = sprintAssigned.filter(s => s.status === 'blocked');
      const inProgress = sprintAssigned.filter(s => s.status === 'in_progress');
      return { member, sprintAssigned, sprintDone, sprintPts, donePts, capacity, utilization, blocked, inProgress, allAssigned };
    });
  }, [members, stories, targetSprint]);

  const overloaded = memberData.filter(m => m.utilization > 100);
  const underloaded = memberData.filter(m => m.utilization < 50 && m.utilization > 0);
  const idle = memberData.filter(m => m.sprintPts === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users size={22} className="text-brand-500" /> Team Workload</h1>
        <p className="text-slate-500 text-sm mt-1">
          {targetSprint ? `Showing: ${targetSprint.name}` : 'No active sprint — showing all open work'}
        </p>
      </div>

      {/* Alerts */}
      {(overloaded.length > 0 || idle.length > 0) && (
        <div className="space-y-2">
          {overloaded.map(m => (
            <div key={m.member.id} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700"><span className="font-semibold">{m.member.name}</span> is over capacity — {m.sprintPts}/{m.capacity} pts ({m.utilization}%)</span>
            </div>
          ))}
          {idle.map(m => (
            <div key={m.member.id} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <Clock size={16} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-600"><span className="font-semibold">{m.member.name}</span> has no stories assigned in this sprint</span>
            </div>
          ))}
        </div>
      )}

      {/* Workload cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {memberData.map(({ member, sprintAssigned, sprintDone, sprintPts, donePts, capacity, utilization, blocked, inProgress }) => {
          const isOverloaded = utilization > 100;
          const isIdle = sprintPts === 0;
          const barColor = isOverloaded ? '#EF4444' : utilization >= 80 ? '#F59E0B' : '#22C55E';

          return (
            <div key={member.id} className={`bg-white rounded-xl border p-5 ${isOverloaded ? 'border-red-200' : 'border-surface-border'}`}>
              {/* Member header */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar initials={member.avatarInitials} color={member.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                    {isOverloaded && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Over capacity</span>}
                    {blocked.length > 0 && <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">{blocked.length} blocked</span>}
                  </div>
                  <p className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-slate-900">{sprintPts}<span className="text-xs text-slate-400 font-normal">/{capacity}</span></p>
                  <p className="text-xs text-slate-400">pts</p>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Capacity utilization</span>
                  <span className="font-semibold" style={{ color: barColor }}>{isIdle ? 'No work' : `${utilization}%`}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: barColor }} />
                </div>
                {donePts > 0 && (
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{donePts} pts done</span>
                    <span>{sprintPts - donePts} pts remaining</span>
                  </div>
                )}
              </div>

              {/* Stories */}
              {sprintAssigned.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {sprintAssigned.map(story => (
                    <div key={story.id} className="flex items-center gap-2 py-1">
                      <Badge variant="priority" value={story.priority} />
                      <span className="flex-1 text-xs text-slate-700 truncate">{story.title}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{story.storyPoints}pt</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[story.status] ?? ''}`}>
                        {story.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">No stories assigned</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-border bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Summary</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['Member', 'Role', 'Committed', 'Done', 'Remaining', 'Capacity', 'Utilization', 'Blocked'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {memberData.map(({ member, sprintPts, donePts, capacity, utilization, blocked }) => (
              <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />
                    <span className="text-xs font-medium text-slate-700">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{member.role.replace('_', ' ')}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{sprintPts} pts</td>
                <td className="px-4 py-2.5 text-xs text-green-600 font-medium">{donePts} pts</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{sprintPts - donePts} pts</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{capacity} pts</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-semibold ${utilization > 100 ? 'text-red-500' : utilization >= 80 ? 'text-amber-500' : 'text-green-600'}`}>{utilization}%</span>
                </td>
                <td className="px-4 py-2.5">
                  {blocked.length > 0 ? <span className="text-xs text-red-500 font-medium">{blocked.length} issue{blocked.length > 1 ? 's' : ''}</span> : <span className="text-xs text-green-500">Clear</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
