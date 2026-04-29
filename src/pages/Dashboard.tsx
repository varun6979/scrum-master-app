import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Zap, ArrowRight } from 'lucide-react';
import { useScrumStore, useActiveSprint } from '../store/useScrumStore';
import { BurndownChart } from '../components/charts/BurndownChart';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { formatDate, getDaysLeft, sprintProgress, getTodayISO } from '../lib/dateUtils';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { stories, members, standups, epics } = useScrumStore();
  const activeSprint = useActiveSprint();
  const todayStr = getTodayISO();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const sprintStories = useMemo(
    () => (activeSprint ? stories.filter((s) => s.sprintId === activeSprint.id) : []),
    [stories, activeSprint]
  );

  const totalPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
  const donePoints = sprintStories
    .filter((s) => s.status === 'done')
    .reduce((sum, s) => sum + s.storyPoints, 0);

  const todayStandups = standups.filter((s) => s.date === todayStr);
  const blockersToday = todayStandups.filter((s) => s.hasBlocker);

  const daysLeft = activeSprint ? getDaysLeft(activeSprint.endDate) : 0;
  const progress = activeSprint
    ? sprintProgress(activeSprint.startDate, activeSprint.endDate)
    : 0;

  // Member workload
  const memberWorkload = members.map((m) => {
    const assigned = sprintStories
      .filter((s) => s.assigneeId === m.id)
      .reduce((sum, s) => sum + s.storyPoints, 0);
    return { member: m, assigned, pct: Math.min(100, (assigned / m.capacityPoints) * 100) };
  });

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, Team! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">{formatDate(todayStr)}</p>
        </div>
        {activeSprint && (
          <Link
            to="/board"
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Board <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Sprint"
          value={activeSprint?.name ?? '—'}
          sub={activeSprint ? `Ends ${formatDate(activeSprint.endDate)}` : 'No active sprint'}
          icon={Zap}
          color="#4F6EF7"
        />
        <StatCard
          label="Days Remaining"
          value={daysLeft}
          sub={`${progress}% of sprint elapsed`}
          icon={Clock}
          color="#F59E0B"
        />
        <StatCard
          label="Points Completed"
          value={`${donePoints} / ${totalPoints}`}
          sub={`${totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}% done`}
          icon={CheckCircle2}
          color="#10B981"
        />
        <StatCard
          label="Blockers Today"
          value={blockersToday.length}
          sub={blockersToday.length === 0 ? 'All clear!' : 'Need attention'}
          icon={AlertTriangle}
          color={blockersToday.length > 0 ? '#EF4444' : '#10B981'}
        />
      </div>

      {/* Sprint progress */}
      {activeSprint && (
        <div className="bg-white rounded-xl border border-surface-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{activeSprint.name} Progress</h2>
              <p className="text-xs text-slate-400 mt-0.5">{activeSprint.goal}</p>
            </div>
            <span className="text-sm font-bold text-brand-500">{progress}%</span>
          </div>
          <ProgressBar value={progress} showLabel={false} />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-slate-400">{formatDate(activeSprint.startDate)}</span>
            <span className="text-xs text-slate-400">{formatDate(activeSprint.endDate)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown chart */}
        <div className="bg-white rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Burndown Chart</h2>
          <BurndownChart sprintId={activeSprint?.id ?? null} height={220} />
        </div>

        {/* Today's blockers */}
        <div className="bg-white rounded-xl border border-surface-border p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">
            Today's Blockers
            {blockersToday.length > 0 && (
              <span className="ml-2 text-xs font-medium text-white bg-red-500 rounded-full px-2 py-0.5">
                {blockersToday.length}
              </span>
            )}
          </h2>
          {blockersToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <CheckCircle2 size={28} className="text-green-400 mb-2" />
              <p className="text-sm text-slate-400">No blockers reported today!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockersToday.map((entry) => {
                const member = members.find((m) => m.id === entry.memberId);
                return member ? (
                  <div key={entry.id} className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{member.name}</p>
                      <p className="text-xs text-red-700 mt-0.5 line-clamp-2">{entry.blockers}</p>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team workload */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Team Workload This Sprint</h2>
        <div className="space-y-4">
          {memberWorkload.map(({ member, assigned, pct }) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />
              <div className="w-28 flex-shrink-0">
                <p className="text-sm font-medium text-slate-700 truncate">{member.name}</p>
                <Badge variant="role" value={member.role} className="mt-0.5" />
              </div>
              <div className="flex-1">
                <ProgressBar
                  value={pct}
                  color={pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#4F6EF7'}
                  size="sm"
                />
              </div>
              <span className="text-xs text-slate-500 w-20 text-right flex-shrink-0">
                {assigned} / {member.capacityPoints} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
