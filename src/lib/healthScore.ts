import { Sprint, Story, Risk, Milestone, StandupEntry } from '../types';

export interface HealthIndicator {
  name: string;
  score: number;     // 0-100
  status: 'green' | 'amber' | 'red';
  message: string;
  detail: string;
}

export interface ProjectHealthScore {
  overall: number;
  status: 'green' | 'amber' | 'red';
  indicators: HealthIndicator[];
  lastUpdated: string;
}

function indicator(name: string, score: number, message: string, detail: string): HealthIndicator {
  const status = score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red';
  return { name, score, status, message, detail };
}

export function calcHealthScore(params: {
  activeSprint: Sprint | null;
  sprintStories: Story[];
  allSprints: Sprint[];
  risks: Risk[];
  milestones: Milestone[];
  standups: StandupEntry[];
  members: { capacityPoints: number }[];
  stories: Story[];
}): ProjectHealthScore {
  const { activeSprint, sprintStories, allSprints, risks, milestones, standups, members, stories } = params;
  const indicators: HealthIndicator[] = [];

  // 1. Sprint Pace
  if (activeSprint) {
    const start = new Date(activeSprint.startDate).getTime();
    const end = new Date(activeSprint.endDate).getTime();
    const now = Date.now();
    const elapsed = Math.max(0, (now - start) / (end - start));
    const totalPts = sprintStories.reduce((s, x) => s + x.storyPoints, 0);
    const donePts = sprintStories.filter(s => s.status === 'done').reduce((s, x) => s + x.storyPoints, 0);
    const donePct = totalPts > 0 ? donePts / totalPts : 0;
    const paceRatio = elapsed > 0 ? donePct / elapsed : 1;
    const paceScore = Math.min(100, Math.round(paceRatio * 80));
    const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    indicators.push(indicator(
      'Sprint Pace',
      paceScore,
      paceScore >= 70 ? 'On track' : paceScore >= 40 ? 'Slightly behind' : 'At risk',
      `${Math.round(donePct * 100)}% done with ${Math.round(elapsed * 100)}% of sprint elapsed. ${daysLeft} days remaining.`
    ));
  } else {
    indicators.push(indicator('Sprint Pace', 50, 'No active sprint', 'Start a sprint to track pace.'));
  }

  // 2. Risk Exposure
  const openRisks = risks.filter(r => r.status === 'open');
  const criticalRisks = openRisks.filter(r => r.riskScore >= 15);
  const highRisks = openRisks.filter(r => r.riskScore >= 9 && r.riskScore < 15);
  const riskScore = Math.max(0, 100 - criticalRisks.length * 25 - highRisks.length * 10 - openRisks.length * 3);
  indicators.push(indicator(
    'Risk Exposure',
    riskScore,
    criticalRisks.length > 0 ? `${criticalRisks.length} critical risk${criticalRisks.length > 1 ? 's' : ''}` : highRisks.length > 0 ? `${highRisks.length} high risk${highRisks.length > 1 ? 's' : ''}` : 'Low risk',
    `${openRisks.length} open risks total. ${criticalRisks.length} critical, ${highRisks.length} high.`
  ));

  // 3. Team Capacity
  const totalCap = members.reduce((s, m) => s + m.capacityPoints, 0);
  const assigned = sprintStories.reduce((s, x) => s + x.storyPoints, 0);
  const utilPct = totalCap > 0 ? (assigned / totalCap) * 100 : 0;
  const capScore = utilPct >= 60 && utilPct <= 90
    ? 100
    : utilPct < 60
    ? Math.round(utilPct / 60 * 80)
    : Math.max(0, Math.round(100 - (utilPct - 90) * 3));
  indicators.push(indicator(
    'Team Capacity',
    capScore,
    utilPct > 100 ? 'Over capacity' : utilPct < 50 ? 'Under-utilized' : 'Well balanced',
    `${Math.round(utilPct)}% of team capacity utilized this sprint (${assigned}/${totalCap}pts).`
  ));

  // 4. Milestone Health
  const upcoming = milestones.filter(m => m.status !== 'completed' && m.status !== 'missed');
  const atRisk = milestones.filter(m => m.status === 'at_risk').length;
  const missed = milestones.filter(m => m.status === 'missed').length;
  const msScore = Math.max(0, 100 - atRisk * 20 - missed * 40);
  indicators.push(indicator(
    'Milestone Health',
    msScore,
    missed > 0 ? `${missed} missed` : atRisk > 0 ? `${atRisk} at risk` : 'On track',
    `${upcoming.length} upcoming milestones. ${atRisk} at risk, ${missed} missed.`
  ));

  // 5. Standup Participation (last 5 days)
  const recentDays = 5;
  const recentStandups = standups.filter(s => {
    const d = new Date(s.date);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= recentDays;
  });
  const uniqueSubmissions = new Set(recentStandups.map(s => `${s.date}-${s.memberId}`)).size;
  const maxExpected = members.length * recentDays;
  const participationPct = maxExpected > 0 ? (uniqueSubmissions / maxExpected) * 100 : 0;
  const standupScore = Math.round(Math.min(100, participationPct));
  indicators.push(indicator(
    'Standup Participation',
    standupScore,
    participationPct >= 80 ? 'Good participation' : participationPct >= 50 ? 'Moderate' : 'Low participation',
    `${Math.round(participationPct)}% participation over the last ${recentDays} working days.`
  ));

  // 6. Velocity Trend
  const completedSprints = allSprints.filter(s => s.status === 'completed' && s.velocity !== undefined);
  let velScore = 70;
  let velMsg = 'Stable';
  let velDetail = 'Not enough data.';
  if (completedSprints.length >= 3) {
    const vels = completedSprints.map(s => s.velocity!);
    const recent = vels.slice(-2);
    const prior = vels.slice(-4, -2);
    if (prior.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
      const change = ((recentAvg - priorAvg) / priorAvg) * 100;
      velScore = change >= 0 ? Math.min(100, 70 + change * 2) : Math.max(0, 70 + change * 2);
      velMsg = change > 5 ? 'Improving' : change < -10 ? 'Declining' : 'Stable';
      velDetail = `Recent avg: ${Math.round(recentAvg)}pts vs prior avg: ${Math.round(priorAvg)}pts. ${change > 0 ? '+' : ''}${Math.round(change)}% change.`;
    }
  } else if (completedSprints.length > 0) {
    const vels = completedSprints.map(s => s.velocity!);
    const avgVel = vels.reduce((a, b) => a + b, 0) / vels.length;
    velDetail = `Average velocity: ${Math.round(avgVel)}pts over ${completedSprints.length} sprint${completedSprints.length > 1 ? 's' : ''}.`;
  }
  indicators.push(indicator('Velocity Trend', velScore, velMsg, velDetail));

  const overall = Math.round(indicators.reduce((s, i) => s + i.score, 0) / indicators.length);
  const status = overall >= 70 ? 'green' : overall >= 40 ? 'amber' : 'red';

  return { overall, status, indicators, lastUpdated: new Date().toISOString() };
}
