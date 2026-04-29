// Monte Carlo simulation for sprint delivery forecasting
import { Sprint, Story } from '../types';

export interface ForecastResult {
  p50: number;  // 50th percentile sprints to complete
  p75: number;
  p85: number;
  p95: number;
  sprintsHistory: number[];
  avgVelocity: number;
  minVelocity: number;
  maxVelocity: number;
  simulations: number;
  completionDates: { p50: string; p75: string; p85: string; p95: string };
}

export interface VelocityStats {
  avg: number;
  average: number; // alias kept for backward compat
  min: number;
  max: number;
  stdDev: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPct: number;
  samples: number[];
}

export interface MonteCarloResult {
  p50: number;
  p75: number;
  p85: number;
  p95: number;
  distribution: Record<number, number>; // sprints -> count
  totalSimulations: number;
}

export function calcVelocityStats(sprints: Sprint[]): VelocityStats {
  const completed = sprints.filter(s => s.status === 'completed' && s.velocity !== undefined);
  if (completed.length === 0) {
    return { avg: 0, average: 0, min: 0, max: 0, stdDev: 0, trend: 'stable', trendPct: 0, samples: [] };
  }

  const velocities = completed.map(s => s.velocity!);
  const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const min = Math.min(...velocities);
  const max = Math.max(...velocities);
  const stdDev = Math.sqrt(velocities.reduce((sum, v) => sum + (v - avg) ** 2, 0) / velocities.length);

  // Trend: compare first half vs second half
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let trendPct = 0;
  if (velocities.length >= 4) {
    const mid = Math.floor(velocities.length / 2);
    const firstHalf = velocities.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalf = velocities.slice(mid).reduce((a, b) => a + b, 0) / (velocities.length - mid);
    trendPct = ((secondHalf - firstHalf) / firstHalf) * 100;
    if (trendPct > 5) trend = 'improving';
    else if (trendPct < -5) trend = 'declining';
  } else if (velocities.length >= 2) {
    const recent = velocities.slice(-2);
    const older = velocities.slice(0, Math.max(1, velocities.length - 2));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    trendPct = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
    if (trendPct > 5) trend = 'improving';
    else if (trendPct < -5) trend = 'declining';
  }

  return { avg, average: avg, min, max, stdDev, trend, trendPct, samples: velocities };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Simple seeded PRNG (Lehmer LCG) for deterministic but varied results
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Box-Muller transform for normal distribution
function normalSample(rng: () => number, mean: number, sd: number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, mean + z * sd);
}

/**
 * Legacy overload: runMonteCarlo(remainingPoints, stats, simulations) -> MonteCarloResult
 * New overload: runMonteCarlo(remainingPoints, sprints, sprintLengthDays, simulations) -> ForecastResult
 */
export function runMonteCarlo(
  remainingPoints: number,
  sprintsOrStats: Sprint[] | VelocityStats,
  sprintLengthDaysOrSimulations?: number,
  simulationsArg?: number
): ForecastResult | MonteCarloResult {
  // Detect which overload we're in
  if (Array.isArray(sprintsOrStats)) {
    // New API: (remainingPoints, sprints[], sprintLengthDays, simulations) -> ForecastResult
    const sprints = sprintsOrStats;
    const sprintLengthDays = sprintLengthDaysOrSimulations ?? 14;
    const simulations = simulationsArg ?? 10000;

    const completed = sprints.filter(s => s.status === 'completed' && s.velocity !== undefined);

    if (completed.length === 0 || remainingPoints <= 0) {
      const today = new Date().toISOString().split('T')[0];
      return {
        p50: 0, p75: 0, p85: 0, p95: 0,
        sprintsHistory: [],
        avgVelocity: 0, minVelocity: 0, maxVelocity: 0,
        simulations,
        completionDates: { p50: today, p75: today, p85: today, p95: today },
      } as ForecastResult;
    }

    const velocities = completed.map(s => s.velocity!);
    const stats = calcVelocityStats(sprints);
    const sprintsNeeded: number[] = [];

    for (let i = 0; i < simulations; i++) {
      let remaining = remainingPoints;
      let sprintCount = 0;
      let maxIter = 100;

      while (remaining > 0 && maxIter-- > 0) {
        const sampledVelocity = velocities[Math.floor(Math.random() * velocities.length)];
        const noise = sampledVelocity * (0.9 + Math.random() * 0.2);
        remaining -= Math.max(1, noise);
        sprintCount++;
      }
      sprintsNeeded.push(sprintCount);
    }

    sprintsNeeded.sort((a, b) => a - b);

    const p50 = sprintsNeeded[Math.floor(simulations * 0.50)];
    const p75 = sprintsNeeded[Math.floor(simulations * 0.75)];
    const p85 = sprintsNeeded[Math.floor(simulations * 0.85)];
    const p95 = sprintsNeeded[Math.floor(simulations * 0.95)];

    const today = new Date().toISOString().split('T')[0];
    const toDate = (count: number) => addDays(today, count * sprintLengthDays);

    return {
      p50, p75, p85, p95,
      sprintsHistory: velocities,
      avgVelocity: stats.avg,
      minVelocity: stats.min,
      maxVelocity: stats.max,
      simulations,
      completionDates: {
        p50: toDate(p50),
        p75: toDate(p75),
        p85: toDate(p85),
        p95: toDate(p95),
      },
    } as ForecastResult;
  } else {
    // Legacy API: (remainingPoints, stats, simulations) -> MonteCarloResult
    const stats = sprintsOrStats;
    const simulations = sprintLengthDaysOrSimulations ?? 10000;
    const rng = makeRng(remainingPoints * 31 + simulations);
    const distribution: Record<number, number> = {};
    const results: number[] = [];

    const mean = stats.average || stats.avg || 20;
    const sd = Math.max(stats.stdDev, mean * 0.15);

    for (let i = 0; i < simulations; i++) {
      let remaining = remainingPoints;
      let sprintCount = 0;
      while (remaining > 0 && sprintCount < 200) {
        const vel = normalSample(rng, mean, sd);
        remaining -= vel;
        sprintCount++;
      }
      results.push(sprintCount);
      distribution[sprintCount] = (distribution[sprintCount] || 0) + 1;
    }

    results.sort((a, b) => a - b);

    const p = (pct: number) => {
      const idx = Math.floor((pct / 100) * results.length);
      return results[Math.min(idx, results.length - 1)];
    };

    return {
      p50: p(50),
      p75: p(75),
      p85: p(85),
      p95: p(95),
      distribution,
      totalSimulations: simulations,
    } as MonteCarloResult;
  }
}

export function calcCycleTimeMetrics(stories: Story[]) {
  const done = stories.filter(s => s.status === 'done' && s.completedAt);

  if (done.length === 0) return null;

  const leadTimes = done.map(s => {
    const created = new Date(s.createdAt).getTime();
    const completed = new Date(s.completedAt!).getTime();
    return (completed - created) / (1000 * 60 * 60 * 24); // days
  }).filter(d => d > 0);

  const cycleTimes = done.map(s => {
    const created = new Date(s.createdAt).getTime();
    const completed = new Date(s.completedAt!).getTime();
    const lead = (completed - created) / (1000 * 60 * 60 * 24);
    return lead * 0.6;
  }).filter(d => d > 0);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const p85 = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.85)];
  };

  return {
    avgLeadTime: avg(leadTimes),
    medianLeadTime: median(leadTimes),
    p85LeadTime: p85(leadTimes),
    avgCycleTime: avg(cycleTimes),
    medianCycleTime: median(cycleTimes),
    p85CycleTime: p85(cycleTimes),
    totalDone: done.length,
    throughput: done.length / Math.max(1, stories.filter(s => s.sprintId).length / 7),
  };
}
