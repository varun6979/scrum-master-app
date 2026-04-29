import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useBurndown } from '../../store/useScrumStore';
import { formatShortDate } from '../../lib/dateUtils';

interface BurndownChartProps {
  sprintId: string | null;
  height?: number;
}

export function BurndownChart({ sprintId, height = 300 }: BurndownChartProps) {
  const { snapshots } = useBurndown(sprintId);

  if (!sprintId || snapshots.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 rounded-xl border border-surface-border"
        style={{ height }}
      >
        <p className="text-sm text-slate-400">No burndown data available</p>
      </div>
    );
  }

  const chartData = snapshots.map((s) => ({
    date: formatShortDate(s.date),
    Remaining: s.remainingPoints,
    Ideal: s.idealPoints,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
        />
        <Line
          type="monotone"
          dataKey="Ideal"
          stroke="#3B82F6"
          strokeDasharray="6 3"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="Remaining"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
