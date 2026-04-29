import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useScrumStore } from '../../store/useScrumStore';
import { StoryStatus } from '../../types';

interface SprintPieChartProps {
  sprintId: string | null;
}

const STATUS_COLORS: Record<StoryStatus, string> = {
  done: '#10B981',
  in_progress: '#8B5CF6',
  review: '#F59E0B',
  todo: '#3B82F6',
  backlog: '#94A3B8',
  blocked: '#EF4444',
};

const STATUS_LABELS: Record<StoryStatus, string> = {
  done: 'Done',
  in_progress: 'In Progress',
  review: 'Review',
  todo: 'To Do',
  backlog: 'Backlog',
  blocked: 'Blocked',
};

export function SprintPieChart({ sprintId }: SprintPieChartProps) {
  const { stories } = useScrumStore();

  const sprintStories = stories.filter((s) => s.sprintId === sprintId);

  if (sprintStories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-surface-border">
        <p className="text-sm text-slate-400">No stories in this sprint</p>
      </div>
    );
  }

  const statusCounts = (Object.keys(STATUS_COLORS) as StoryStatus[]).reduce(
    (acc, status) => {
      const count = sprintStories.filter((s) => s.status === status).length;
      if (count > 0) acc.push({ name: STATUS_LABELS[status], value: count, status });
      return acc;
    },
    [] as { name: string; value: number; status: StoryStatus }[]
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={statusCounts}
          cx="50%"
          cy="45%"
          outerRadius={90}
          innerRadius={55}
          dataKey="value"
          paddingAngle={3}
        >
          {statusCounts.map((entry, idx) => (
            <Cell key={idx} fill={STATUS_COLORS[entry.status]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} stories`, '']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
