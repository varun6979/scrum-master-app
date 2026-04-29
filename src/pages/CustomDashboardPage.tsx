import { useState, useEffect, useMemo } from 'react';
import {
  Plus, X, RotateCcw, LayoutDashboard, ChevronDown,
  Activity, AlertTriangle, User, TrendingUp, Clock,
  Gauge, BarChart2, Zap,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Story, StoryStatus } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetType =
  | 'sprint_progress'
  | 'story_status_breakdown'
  | 'blocked_stories'
  | 'my_stories'
  | 'team_velocity'
  | 'overdue_stories'
  | 'wip_summary'
  | 'quick_stats';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  label?: string;
  config?: Record<string, string>;
}

interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
}

const WIDGET_META: Record<WidgetType, { label: string; description: string; icon: React.ElementType; color: string }> = {
  sprint_progress: { label: 'Sprint Progress', description: 'Active sprint points and timeline', icon: Activity, color: 'bg-indigo-500' },
  story_status_breakdown: { label: 'Status Breakdown', description: 'Story count by status', icon: BarChart2, color: 'bg-violet-500' },
  blocked_stories: { label: 'Blocked Stories', description: 'All blocked or flagged stories', icon: AlertTriangle, color: 'bg-red-500' },
  my_stories: { label: 'Member Stories', description: 'Stories by a team member', icon: User, color: 'bg-sky-500' },
  team_velocity: { label: 'Team Velocity', description: 'Last 4 completed sprints', icon: TrendingUp, color: 'bg-emerald-500' },
  overdue_stories: { label: 'Overdue Stories', description: 'Stories past their due date', icon: Clock, color: 'bg-orange-500' },
  wip_summary: { label: 'WIP Summary', description: 'In-progress vs WIP limits', icon: Gauge, color: 'bg-pink-500' },
  quick_stats: { label: 'Quick Stats', description: '4 key project metrics at a glance', icon: Zap, color: 'bg-amber-500' },
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'default-1', type: 'quick_stats' },
  { id: 'default-2', type: 'sprint_progress' },
  { id: 'default-3', type: 'story_status_breakdown' },
  { id: 'default-4', type: 'blocked_stories' },
];

function genId() {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Status colors ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<StoryStatus, string> = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-500',
  in_progress: 'bg-indigo-500',
  review: 'bg-amber-500',
  blocked: 'bg-red-500',
  done: 'bg-green-500',
};

const STATUS_LABEL: Record<StoryStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
};

const STATUS_BAR_COLOR: Record<StoryStatus, string> = {
  backlog: 'bg-slate-300',
  todo: 'bg-blue-400',
  in_progress: 'bg-indigo-500',
  review: 'bg-amber-400',
  blocked: 'bg-red-500',
  done: 'bg-green-500',
};

// ─── Individual widget components ─────────────────────────────────────────────

function SprintProgressWidget() {
  const { stories, sprints } = useScrumStore();
  const activeSprint = sprints.find((s) => s.status === 'active');

  if (!activeSprint) {
    return <div className="text-sm text-slate-400 text-center py-8">No active sprint</div>;
  }

  const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id);
  const totalPoints = sprintStories.reduce((acc, s) => acc + s.storyPoints, 0);
  const donePoints = sprintStories.filter((s) => s.status === 'done').reduce((acc, s) => acc + s.storyPoints, 0);
  const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const today = new Date();
  const end = parseISO(activeSprint.endDate);
  const daysLeft = Math.max(0, differenceInDays(end, today));
  const totalDays = Math.max(1, differenceInDays(end, parseISO(activeSprint.startDate)));
  const elapsed = totalDays - daysLeft;
  const timePct = Math.min(100, Math.round((elapsed / totalDays) * 100));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{activeSprint.name}</span>
          <span className="text-xs text-slate-400">{daysLeft}d left</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{activeSprint.goal || 'No goal set'}</p>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Points Progress</span>
          <span className="font-medium text-slate-700">{donePoints} / {totalPoints}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-indigo-600 font-semibold">{pct}% done</span>
          <span className="text-slate-400">{sprintStories.length} stories</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Timeline</span>
          <span className="font-medium text-slate-700">{elapsed}d / {totalDays}d</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${timePct > 70 && pct < 50 ? 'bg-red-400' : 'bg-emerald-400'}`}
            style={{ width: `${timePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StoryStatusBreakdownWidget() {
  const { stories } = useScrumStore();
  const statuses: StoryStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'blocked', 'done'];
  const total = stories.length || 1;

  const counts = statuses.map((s) => ({
    status: s,
    count: stories.filter((st) => st.status === s).length,
  }));

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex">
        {counts.map(({ status, count }) => (
          count > 0 ? (
            <div
              key={status}
              className={`h-full ${STATUS_BAR_COLOR[status]} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${STATUS_LABEL[status]}: ${count}`}
            />
          ) : null
        ))}
      </div>

      {/* Count grid */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {counts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{STATUS_LABEL[status]}</p>
              <p className="text-sm font-bold text-slate-800">{count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockedStoriesWidget() {
  const { stories, members } = useScrumStore();
  const blocked = stories.filter((s) => s.status === 'blocked' || s.blockerFlag);

  if (blocked.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
        <AlertTriangle size={24} className="opacity-30" />
        <span className="text-sm">No blocked stories</span>
      </div>
    );
  }

  return (
    <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {blocked.map((story) => {
        const assignee = members.find((m) => m.id === story.assigneeId);
        return (
          <li key={story.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate">{story.title}</p>
              <p className="text-xs text-slate-500">
                {assignee ? assignee.name : 'Unassigned'} · {story.storyPoints}pts
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MyStoriesWidget({ config }: { config?: Record<string, string> }) {
  const { stories, members } = useScrumStore();
  const [selectedMemberId, setSelectedMemberId] = useState(config?.memberId ?? '');

  const displayMemberId = selectedMemberId || members[0]?.id;
  const member = members.find((m) => m.id === displayMemberId);
  const myStories = stories.filter((s) => s.assigneeId === displayMemberId);

  return (
    <div className="space-y-3">
      <div className="relative">
        <select
          value={displayMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 pr-8"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {myStories.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No stories assigned</p>
      ) : (
        <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {myStories.map((s) => (
            <li key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[s.status]}`} />
              <span className="flex-1 text-xs text-slate-700 truncate">{s.title}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">{s.storyPoints}pt</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamVelocityWidget() {
  const { sprints, stories } = useScrumStore();
  const completed = sprints.filter((s) => s.status === 'completed').slice(-4);

  if (completed.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">No completed sprints yet</div>;
  }

  const data = completed.map((sprint) => {
    const pts = stories
      .filter((s) => s.sprintId === sprint.id && s.status === 'done')
      .reduce((acc, s) => acc + s.storyPoints, 0);
    return { name: sprint.name, pts };
  });

  const maxPts = Math.max(...data.map((d) => d.pts), 1);

  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-20 truncate flex-shrink-0" title={d.name}>
            {d.name.length > 10 ? d.name.slice(0, 10) + '…' : d.name}
          </span>
          <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden flex items-center">
            <div
              className="h-full bg-emerald-500 rounded transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.max(5, (d.pts / maxPts) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-8 text-right flex-shrink-0">{d.pts}</span>
        </div>
      ))}
      <p className="text-xs text-slate-400 text-center mt-1">
        Avg: {Math.round(data.reduce((a, d) => a + d.pts, 0) / data.length)} pts/sprint
      </p>
    </div>
  );
}

function OverdueStoriesWidget() {
  const { stories, members } = useScrumStore();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = stories.filter((s) => s.dueDate && s.dueDate < today && s.status !== 'done');

  if (overdue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
        <Clock size={24} className="opacity-30" />
        <span className="text-sm">No overdue stories</span>
      </div>
    );
  }

  return (
    <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {overdue.map((s) => {
        const assignee = members.find((m) => m.id === s.assigneeId);
        const daysOver = differenceInDays(new Date(), parseISO(s.dueDate!));
        return (
          <li key={s.id} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
            <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate">{s.title}</p>
              <p className="text-xs text-orange-600">{daysOver}d overdue · {assignee?.name ?? 'Unassigned'}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WIPSummaryWidget() {
  const { stories, settings } = useScrumStore();
  const wipLimits: Record<string, number> = ((settings as unknown) as Record<string, unknown>).wipLimits as Record<string, number> ?? {};

  const wipStatuses: StoryStatus[] = ['in_progress', 'review'];
  const counts: Record<string, number> = {};
  wipStatuses.forEach((s) => {
    counts[s] = stories.filter((st) => st.status === s).length;
  });

  const labels: Record<string, string> = { in_progress: 'In Progress', review: 'Review' };
  const colors: Record<string, string> = { in_progress: 'bg-indigo-500', review: 'bg-amber-500' };

  return (
    <div className="space-y-3">
      {wipStatuses.map((s) => {
        const count = counts[s] ?? 0;
        const limit = wipLimits[s];
        const over = limit !== undefined && count > limit;
        return (
          <div key={s} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className={`w-2 h-2 rounded-full ${colors[s]}`} />
                {labels[s]}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${over ? 'text-red-600' : 'text-slate-800'}`}>{count}</span>
                {limit !== undefined && (
                  <span className="text-xs text-slate-400">/ {limit}</span>
                )}
              </div>
            </div>
            {limit !== undefined ? (
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : colors[s]}`}
                  style={{ width: `${Math.min(100, (count / limit) * 100)}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400">No WIP limit set</p>
            )}
          </div>
        );
      })}
      {Object.keys(wipLimits).length === 0 && (
        <p className="text-xs text-slate-400 text-center">Configure WIP limits in Settings.</p>
      )}
    </div>
  );
}

function QuickStatsWidget() {
  const { stories, sprints } = useScrumStore();
  const activeSprint = sprints.find((s) => s.status === 'active');

  const total = stories.length;
  const activeSprintStories = activeSprint ? stories.filter((s) => s.sprintId === activeSprint.id).length : 0;
  const blockers = stories.filter((s) => s.status === 'blocked' || s.blockerFlag).length;
  const doneThisSprint = activeSprint
    ? stories.filter((s) => s.sprintId === activeSprint.id && s.status === 'done').length
    : 0;

  const stats = [
    { label: 'Total Stories', value: total, color: 'text-slate-800', bg: 'bg-slate-100' },
    { label: 'Active Sprint', value: activeSprintStories, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { label: 'Blockers', value: blockers, color: 'text-red-700', bg: 'bg-red-100' },
    { label: 'Done This Sprint', value: doneThisSprint, color: 'text-green-700', bg: 'bg-green-100' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
          <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Widget card wrapper ──────────────────────────────────────────────────────

function WidgetCard({ widget, onRemove }: { widget: WidgetConfig; onRemove: () => void }) {
  const meta = WIDGET_META[widget.type];
  const Icon = meta.icon;

  const renderContent = () => {
    switch (widget.type) {
      case 'sprint_progress': return <SprintProgressWidget />;
      case 'story_status_breakdown': return <StoryStatusBreakdownWidget />;
      case 'blocked_stories': return <BlockedStoriesWidget />;
      case 'my_stories': return <MyStoriesWidget config={widget.config} />;
      case 'team_velocity': return <TeamVelocityWidget />;
      case 'overdue_stories': return <OverdueStoriesWidget />;
      case 'wip_summary': return <WIPSummaryWidget />;
      case 'quick_stats': return <QuickStatsWidget />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Card header */}
      <div className={`${meta.color} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-white opacity-90" />
          <span className="text-sm font-semibold text-white">
            {widget.label || meta.label}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-white opacity-60 hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-white/20"
        >
          <X size={14} />
        </button>
      </div>

      {/* Card body */}
      <div className="p-4 flex-1">
        {renderContent()}
      </div>
    </div>
  );
}

// ─── Add widget modal ─────────────────────────────────────────────────────────

function AddWidgetModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (type: WidgetType, label: string) => void;
}) {
  const [selected, setSelected] = useState<WidgetType>('sprint_progress');
  const [label, setLabel] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-lg">Add Widget</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-500 mb-4">Choose a widget to add to your dashboard.</p>

          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(WIDGET_META) as [WidgetType, typeof WIDGET_META[WidgetType]][]).map(([type, meta]) => {
              const Icon = meta.icon;
              const isSelected = selected === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelected(type)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`${meta.color} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {meta.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Custom Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={WIDGET_META[selected].label}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onAdd(selected, label); onClose(); setLabel(''); }}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CustomDashboardPage() {
  const { settings, updateSettings } = useScrumStore();

  // Load from settings or default
  const savedDashboards = ((settings as unknown) as Record<string, unknown>).customDashboards as DashboardConfig[] | undefined;
  const saved = savedDashboards?.[0];

  const [widgets, setWidgets] = useState<WidgetConfig[]>(
    saved?.widgets ?? DEFAULT_WIDGETS
  );
  const [modalOpen, setModalOpen] = useState(false);

  // Persist to store whenever widgets change
  useEffect(() => {
    const dashboard: DashboardConfig = {
      id: saved?.id ?? 'main',
      name: saved?.name ?? 'My Dashboard',
      widgets,
    };
    updateSettings({
      customDashboards: [dashboard],
    } as Parameters<typeof updateSettings>[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  const addWidget = (type: WidgetType, label: string) => {
    setWidgets((prev) => [
      ...prev,
      { id: genId(), type, label: label || undefined },
    ]);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Custom Dashboard</h1>
              <p className="text-sm text-slate-500">Add, remove and arrange widgets for your workflow.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw size={14} />
              Reset to Default
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus size={15} />
              Add Widget
            </button>
          </div>
        </div>
      </div>

      {/* Widget grid */}
      <div className="px-8 py-6">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
            <LayoutDashboard size={48} className="opacity-20" />
            <p className="text-lg font-medium">Your dashboard is empty</p>
            <p className="text-sm">Click <strong>Add Widget</strong> to get started.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={15} />
              Add Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {widgets.map((widget) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                onRemove={() => removeWidget(widget.id)}
              />
            ))}

            {/* Add more tile */}
            <button
              onClick={() => setModalOpen(true)}
              className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 py-10 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all min-h-[160px]"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">Add Widget</span>
            </button>
          </div>
        )}
      </div>

      <AddWidgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addWidget}
      />
    </div>
  );
}
