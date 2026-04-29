import { useState, useCallback } from 'react';
import {
  Heart, Target, ShieldAlert, Users, Flag, MessageSquare, TrendingUp,
  RefreshCw, CheckCircle, AlertTriangle, XCircle, Info,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useScrumStore } from '../store/useScrumStore';
import { calcHealthScore, ProjectHealthScore, HealthIndicator } from '../lib/healthScore';
import { Button } from '../components/ui/Button';

// ─── Icon map per indicator name ──────────────────────────────────────────────
const INDICATOR_ICONS: Record<string, React.ReactNode> = {
  'Sprint Pace': <Target size={20} />,
  'Risk Exposure': <ShieldAlert size={20} />,
  'Team Capacity': <Users size={20} />,
  'Milestone Health': <Flag size={20} />,
  'Standup Participation': <MessageSquare size={20} />,
  'Velocity Trend': <TrendingUp size={20} />,
};

// ─── Status colors ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  green: {
    ring: 'stroke-green-500',
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    bar: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    label: 'Healthy',
  },
  amber: {
    ring: 'stroke-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Needs Attention',
  },
  red: {
    ring: 'stroke-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
};

// ─── Gauge component ───────────────────────────────────────────────────────────
function HealthGauge({ score, status }: { score: number; status: 'green' | 'amber' | 'red' }) {
  const radius = 72;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colors = STATUS_COLORS[status];

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120" className="overflow-visible">
        {/* Background arc */}
        <path
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          className={colors.ring}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Score text */}
        <text x="100" y="88" textAnchor="middle" fontSize="36" fontWeight="700" fill="currentColor" className={colors.text}>
          {score}
        </text>
        <text x="100" y="108" textAnchor="middle" fontSize="12" fill="#94a3b8">
          / 100
        </text>
      </svg>

      {/* Status label */}
      <div className={`mt-1 px-4 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
        {colors.label}
      </div>
    </div>
  );
}

// ─── Status icon ──────────────────────────────────────────────────────────────
function StatusIcon({ status, size = 20 }: { status: 'green' | 'amber' | 'red'; size?: number }) {
  if (status === 'green') return <CheckCircle size={size} className="text-green-500" />;
  if (status === 'amber') return <AlertTriangle size={size} className="text-amber-500" />;
  return <XCircle size={size} className="text-red-500" />;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ScoreBar({ score, status }: { score: number; status: 'green' | 'amber' | 'red' }) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[status].bar}`}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  );
}

// ─── Indicator Card ───────────────────────────────────────────────────────────
function IndicatorCard({ indicator }: { indicator: HealthIndicator }) {
  const [expanded, setExpanded] = useState(false);
  const colors = STATUS_COLORS[indicator.status];
  const icon = INDICATOR_ICONS[indicator.name];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 shadow-sm transition-all`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`${colors.text} mt-0.5`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-800">{indicator.name}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${colors.text}`}>{indicator.score}</span>
              <StatusIcon status={indicator.status} size={16} />
            </div>
          </div>
          <ScoreBar score={indicator.score} status={indicator.status} />
          <p className={`text-xs font-semibold mt-2 ${colors.text}`}>{indicator.message}</p>
          {expanded && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{indicator.detail}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
      >
        <Info size={11} />
        {expanded ? 'Less' : 'Details'}
      </button>
    </div>
  );
}

// ─── Explanation section ───────────────────────────────────────────────────────
function ScoreExplanation() {
  const items = [
    {
      name: 'Sprint Pace',
      icon: <Target size={14} />,
      desc: 'Compares the percentage of story points completed vs the percentage of time elapsed in the sprint. A pace ratio >= 1 means you\'re ahead of schedule.',
    },
    {
      name: 'Risk Exposure',
      icon: <ShieldAlert size={14} />,
      desc: 'Starts at 100 and deducts points for open risks: critical risks (score ≥15) cost -25 each, high risks (score 9–14) cost -10 each, all other open risks cost -3 each.',
    },
    {
      name: 'Team Capacity',
      icon: <Users size={14} />,
      desc: 'Measures utilization of team capacity (sum of member capacity points). 60–90% utilization scores 100. Under 60% or over 90% decreases the score.',
    },
    {
      name: 'Milestone Health',
      icon: <Flag size={14} />,
      desc: 'Starts at 100. Deducts -20 for each milestone marked "at risk" and -40 for each "missed" milestone.',
    },
    {
      name: 'Standup Participation',
      icon: <MessageSquare size={14} />,
      desc: 'Percentage of standup submissions in the last 5 working days relative to the expected maximum (team size × 5 days).',
    },
    {
      name: 'Velocity Trend',
      icon: <TrendingUp size={14} />,
      desc: 'Compares average velocity of the 2 most recent completed sprints vs the 2 before that. Improving trends (>5%) push score above 70; declining trends (< -10%) push it below.',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Info size={16} className="text-slate-400" />
        How Each Score is Computed
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <span className="text-slate-400">{item.icon}</span>
              {item.name}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
        <p className="text-xs text-slate-500">
          <strong>Overall score</strong> = simple average of all 6 indicator scores.{' '}
          <span className="text-green-600 font-medium">Green</span> = ≥70,{' '}
          <span className="text-amber-600 font-medium">Amber</span> = 40–69,{' '}
          <span className="text-red-600 font-medium">Red</span> = &lt;40.
        </p>
      </div>
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────
function HealthTrendChart({ history }: { history: { label: string; score: number; status: string }[] }) {
  if (history.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-slate-400" />
        Health Score History
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={history} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(value) => [`${value as number}`, 'Health Score']}
          />
          <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1} label={{ value: '70 (Green)', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} label={{ value: '40 (Amber)', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4F6EF7"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#4F6EF7', strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HealthScorePage() {
  const members = useScrumStore(s => s.members);
  const stories = useScrumStore(s => s.stories);
  const sprints = useScrumStore(s => s.sprints);
  const risks = useScrumStore(s => s.risks);
  const milestones = useScrumStore(s => s.milestones);
  const standups = useScrumStore(s => s.standups);
  const activeSprintId = useScrumStore(s => s.activeSprintId);

  const [refreshKey, setRefreshKey] = useState(0);
  const [history, setHistory] = useState<{ label: string; score: number; status: string }[]>([]);

  const activeSprint = sprints.find(s => s.id === activeSprintId) ?? null;
  const sprintStories = stories.filter(s => s.sprintId === activeSprintId);

  const health: ProjectHealthScore = calcHealthScore({
    activeSprint,
    sprintStories,
    allSprints: sprints,
    risks,
    milestones,
    standups,
    members,
    stories,
  });

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setHistory(prev => [
      ...prev,
      {
        label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        score: health.overall,
        status: health.status,
      },
    ].slice(-10));
  }, [health.overall, health.status]);

  const lastUpdated = new Date(health.lastUpdated).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColors = STATUS_COLORS[health.status];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="text-red-500" size={24} />
            Project Health
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time composite score across sprint pace, risks, team capacity, milestones, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Last updated: {lastUpdated}</span>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Overall score hero */}
      <div className={`rounded-2xl border ${statusColors.border} ${statusColors.bg} p-8 flex flex-col items-center shadow-sm`}>
        <HealthGauge score={health.overall} status={health.status} />
        <p className="mt-4 text-center text-sm text-slate-500 max-w-sm">
          {health.status === 'green'
            ? 'Project is on track. Keep up the good work and stay alert for emerging risks.'
            : health.status === 'amber'
            ? 'Some areas need attention. Review the indicators below and take action on red/amber items.'
            : 'Project health is critical. Immediate action is required on multiple fronts.'}
        </p>

        {/* Quick stats row */}
        <div className="mt-6 grid grid-cols-3 gap-6 w-full max-w-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800">
              {health.indicators.filter(i => i.status === 'green').length}
            </div>
            <div className="text-xs text-green-600 font-medium">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800">
              {health.indicators.filter(i => i.status === 'amber').length}
            </div>
            <div className="text-xs text-amber-600 font-medium">Amber</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-800">
              {health.indicators.filter(i => i.status === 'red').length}
            </div>
            <div className="text-xs text-red-600 font-medium">Critical</div>
          </div>
        </div>
      </div>

      {/* Indicator grid 2×3 */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Health Indicators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {health.indicators.map(ind => (
            <IndicatorCard key={ind.name} indicator={ind} />
          ))}
        </div>
      </div>

      {/* Trend chart (shows up after first manual refresh) */}
      {history.length >= 2 && (
        <HealthTrendChart history={history} />
      )}

      {/* Sprint context */}
      {activeSprint && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Target size={14} className="text-slate-400" />
            Active Sprint Context
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Sprint</div>
              <div className="text-sm font-semibold text-slate-800">{activeSprint.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">End Date</div>
              <div className="text-sm font-semibold text-slate-800">
                {new Date(activeSprint.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Total Points</div>
              <div className="text-sm font-semibold text-slate-800">
                {sprintStories.reduce((s, x) => s + x.storyPoints, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Done Points</div>
              <div className="text-sm font-semibold text-green-600">
                {sprintStories.filter(s => s.status === 'done').reduce((s, x) => s + x.storyPoints, 0)}
              </div>
            </div>
          </div>
          {activeSprint.goal && (
            <div className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Goal:</span> {activeSprint.goal}
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      <ScoreExplanation />
    </div>
  );
}
