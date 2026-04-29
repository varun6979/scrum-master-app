import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useScrumStore } from '../../store/useScrumStore';

export function VelocityChart() {
  const { sprints, stories } = useScrumStore();

  const completedSprints = sprints
    .filter((sp) => sp.status === 'completed')
    .slice(-6);

  const data = completedSprints.map((sp) => {
    const velocity =
      sp.velocity ??
      stories
        .filter((s) => s.sprintId === sp.id && s.status === 'done')
        .reduce((sum, s) => sum + s.storyPoints, 0);
    return { name: sp.name, Points: velocity };
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-surface-border">
        <p className="text-sm text-slate-400">No completed sprints yet</p>
      </div>
    );
  }

  const avg = Math.round(data.reduce((sum, d) => sum + d.Points, 0) / data.length);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
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
          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
          cursor={{ fill: '#F1F5F9' }}
        />
        <ReferenceLine
          y={avg}
          stroke="#F59E0B"
          strokeDasharray="4 2"
          label={{ value: `Avg: ${avg}`, position: 'right', fontSize: 11, fill: '#F59E0B' }}
        />
        <Bar dataKey="Points" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {data.map((_, idx) => (
            <Cell key={idx} fill="#4F6EF7" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
