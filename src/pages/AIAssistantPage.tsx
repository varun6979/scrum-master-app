import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, Send, CheckCheck, X, AlertTriangle, Clock,
  FileText, Target, Zap, BarChart3, ChevronRight,
} from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useScrumStore } from '../store/useScrumStore';
import { Story, Sprint, Risk, StandupEntry, TeamMember } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AISugg {
  id: string;
  icon: React.ReactNode;
  text: string;
  confidence: 'High' | 'Medium';
  dismissed: boolean;
  accepted: boolean;
  relatedLink?: string;
  relatedLabel?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function safeDay(d: string | undefined) {
  if (!d) return null;
  try { return parseISO(d); } catch { return null; }
}

function buildSuggestions(stories: Story[],
  sprints: Sprint[],
  risks: Risk[],
  standups: StandupEntry[],
  members: TeamMember[],
): AISugg[] {
  const suggestions: AISugg[] = [];
  const today = new Date();

  // 1. In-progress stories stale for > 3 days
  const staleInProgress = stories.filter((s) => {
    if (s.status !== 'in_progress') return false;
    const updated = safeDay(s.updatedAt);
    if (!updated) return false;
    return differenceInDays(today, updated) > 3;
  });
  staleInProgress.slice(0, 3).forEach((s) => {
    const days = differenceInDays(today, safeDay(s.updatedAt)!);
    suggestions.push({
      id: `stale-${s.id}`,
      icon: <Clock size={15} className="text-amber-500" />,
      text: `Story "${s.title}" has been in progress for ${days} days. Consider breaking it down or escalating.`,
      confidence: 'High',
      dismissed: false,
      accepted: false,
    });
  });

  // 2. Velocity declining
  const completed = sprints.filter((sp) => sp.status === 'completed' && typeof sp.velocity === 'number');
  if (completed.length >= 2) {
    const last = completed[completed.length - 1].velocity!;
    const prev = completed[completed.length - 2].velocity!;
    if (prev > 0 && (prev - last) / prev > 0.1) {
      const pct = Math.round(((prev - last) / prev) * 100);
      suggestions.push({
        id: 'velocity-drop',
        icon: <AlertTriangle size={15} className="text-red-500" />,
        text: `Your velocity has dropped ${pct}% from ${prev} to ${last} pts over the last 2 sprints. Consider reducing sprint scope.`,
        confidence: 'High',
        dismissed: false,
        accepted: false,
      });
    }
  }

  // 3. Risks without mitigation
  const unmitigated = risks.filter((r) => r.status === 'open' && (!r.mitigation || r.mitigation.trim() === ''));
  unmitigated.slice(0, 2).forEach((r) => {
    suggestions.push({
      id: `risk-${r.id}`,
      icon: <AlertTriangle size={15} className="text-orange-500" />,
      text: `Risk "${r.title}" has no mitigation plan. Assign an owner and add a mitigation strategy.`,
      confidence: 'High',
      dismissed: false,
      accepted: false,
    });
  });

  // 4. Blocked standups
  const recentBlockers = standups.filter((su) => su.hasBlocker && su.date >= todayStr().slice(0, 7));
  recentBlockers.slice(0, 2).forEach((su) => {
    const member = members.find((m) => m.id === su.memberId);
    if (member) {
      suggestions.push({
        id: `blocker-${su.id}`,
        icon: <AlertTriangle size={15} className="text-red-400" />,
        text: `${member.name} reported a blocker on ${su.date}: "${su.blockers.slice(0, 80)}...". Escalation may be needed.`,
        confidence: 'Medium',
        dismissed: false,
        accepted: false,
      });
    }
  });

  // 5. Capacity overload check
  const activeSprint = sprints.find((sp) => sp.status === 'active');
  if (activeSprint) {
    const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id);
    const totalPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
    const totalCapacity = members.reduce((sum, m) => sum + m.capacityPoints, 0);
    if (totalCapacity > 0 && totalPoints > totalCapacity) {
      const pct = Math.round((totalPoints / totalCapacity) * 100);
      suggestions.push({
        id: 'capacity-over',
        icon: <Zap size={15} className="text-purple-500" />,
        text: `Team is at ${pct}% capacity (${totalPoints} pts committed vs ${totalCapacity} pts capacity). Risk of burnout and lower velocity next sprint.`,
        confidence: 'High',
        dismissed: false,
        accepted: false,
      });
    }
  }

  return suggestions.slice(0, 6);
}

function buildAIResponse(
  input: string,
  stories: Story[],
  sprints: Sprint[],
  risks: Risk[],
  members: TeamMember[],
  standups: StandupEntry[],
): string {
  const q = input.toLowerCase().trim();
  const activeSprint = sprints.find((sp) => sp.status === 'active');

  if (q.includes('sprint going') || q.includes('how is') || q.includes('status')) {
    if (!activeSprint) return 'There is no active sprint right now. Head to the Sprints page to start one.';
    const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id);
    const done = sprintStories.filter((s) => s.status === 'done');
    const inProg = sprintStories.filter((s) => s.status === 'in_progress');
    const todo = sprintStories.filter((s) => s.status === 'todo');
    const total = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
    const donePoints = done.reduce((sum, s) => sum + s.storyPoints, 0);
    const pct = total > 0 ? Math.round((donePoints / total) * 100) : 0;
    return `${activeSprint.name} is ${pct}% complete by points (${donePoints}/${total} pts). ${done.length} stories done, ${inProg.length} in progress, ${todo.length} to do. ${pct >= 60 ? 'Looking good!' : pct >= 30 ? 'Moderate pace — keep pushing.' : 'Behind pace. Consider scope reduction or pair programming.'}`;
  }

  if (q.includes('risk') || q.includes('danger') || q.includes('concern')) {
    const openRisks = risks.filter((r) => r.status === 'open');
    if (openRisks.length === 0) return 'No open risks registered. That\'s a good sign, but consider reviewing risks at each sprint planning.';
    const top = openRisks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
    return `You have ${openRisks.length} open risks. Top concerns:\n${top.map((r, i) => `${i + 1}. "${r.title}" (score ${r.riskScore}, ${r.probability} probability)`).join('\n')}`;
  }

  if (q.includes('finish') || q.includes('complete') || q.includes('when') || q.includes('forecast')) {
    const completedSprints = sprints.filter((sp) => sp.status === 'completed' && sp.velocity);
    if (completedSprints.length === 0) return 'Not enough sprint data to forecast. Complete at least one sprint, then visit the Forecast page for Monte Carlo projections.';
    const avgVelocity = completedSprints.reduce((sum, sp) => sum + (sp.velocity ?? 0), 0) / completedSprints.length;
    const backlogPoints = stories.filter((s) => !s.sprintId || s.status === 'backlog').reduce((sum, s) => sum + s.storyPoints, 0);
    const sprintsNeeded = avgVelocity > 0 ? Math.ceil(backlogPoints / avgVelocity) : '?';
    return `Based on your average velocity of ${avgVelocity.toFixed(1)} pts/sprint and ${backlogPoints} points remaining in the backlog, you need approximately ${sprintsNeeded} more sprints. Visit the Forecast page for a full Monte Carlo analysis.`;
  }

  if (q.includes('overload') || q.includes('capacity') || q.includes('who')) {
    if (!activeSprint) return 'No active sprint to analyze capacity for.';
    const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id && s.assigneeId);
    const memberLoad: Record<string, number> = {};
    sprintStories.forEach((s) => {
      if (s.assigneeId) memberLoad[s.assigneeId] = (memberLoad[s.assigneeId] || 0) + s.storyPoints;
    });
    const overloaded = members
      .filter((m) => (memberLoad[m.id] || 0) > m.capacityPoints)
      .map((m) => `${m.name} (${memberLoad[m.id]}pts committed vs ${m.capacityPoints}pts capacity)`);
    if (overloaded.length === 0) return 'No team members appear overloaded in the current sprint. Capacity looks healthy!';
    return `Potentially overloaded members:\n${overloaded.join('\n')}\n\nConsider redistributing some stories.`;
  }

  if (q.includes('retro') || q.includes('retrospective') || q.includes('discuss')) {
    const blockers = standups.filter((su) => su.hasBlocker).slice(-5);
    const incomplete = stories.filter((s) => s.sprintId && s.status !== 'done' && sprints.find((sp) => sp.id === s.sprintId && sp.status === 'completed'));
    const suggestions = [];
    if (blockers.length > 0) suggestions.push(`Recurring blockers (${blockers.length} reported)`);
    if (incomplete.length > 0) suggestions.push(`${incomplete.length} stories carried over from last sprint`);
    const completedSprints = sprints.filter((sp) => sp.status === 'completed' && sp.velocity);
    if (completedSprints.length >= 2) {
      const last = completedSprints[completedSprints.length - 1].velocity!;
      const prev = completedSprints[completedSprints.length - 2].velocity!;
      if (Math.abs(last - prev) / prev > 0.15) suggestions.push(`Velocity variance: ${prev} → ${last} pts`);
    }
    if (suggestions.length === 0) return 'Good sprint! Discuss: What went well? Process improvements? Team morale?';
    return `Suggested retro topics:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nVisit the Retrospective page to log items.`;
  }

  return "I can help you analyze your sprint data. Try asking:\n• \"How is the sprint going?\"\n• \"What are the main risks?\"\n• \"When will we finish?\"\n• \"Who is overloaded?\"\n• \"What should we discuss in retro?\"";
}

// ─── AIAssistantPage ───────────────────────────────────────────────────────────

export function AIAssistantPage() {
  const { stories, sprints, risks, members, standups, epics } = useScrumStore();

  // Suggestion feed state
  const initialSuggestions = useMemo(
    () => buildSuggestions(stories, sprints, risks, standups, members),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [suggestions, setSuggestions] = useState<AISugg[]>(initialSuggestions);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      text: "Hi! I'm your AI Sprint Assistant. I have access to your sprint data, risks, team capacity and more. Ask me anything about your project.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: Date.now() + '-u', role: 'user', text: trimmed, timestamp: new Date().toISOString() };
    const aiText = buildAIResponse(trimmed, stories, sprints, risks, members, standups);
    const aiMsg: ChatMessage = { id: Date.now() + '-a', role: 'assistant', text: aiText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  }

  function dismissSugg(id: string) {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, dismissed: true } : s));
  }
  function acceptSugg(id: string) {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, accepted: true } : s));
  }

  // Quick actions
  const [actionOutputs, setActionOutputs] = useState<Record<string, string>>({});

  function genStandupSummary() {
    const today = todayStr();
    const todayStandups = standups.filter((su) => su.date === today);
    if (todayStandups.length === 0) {
      setActionOutputs((p) => ({ ...p, standup: 'No standups logged today. Head to Daily Standup to add entries.' }));
      return;
    }
    const lines = todayStandups.map((su) => {
      const m = members.find((mem) => mem.id === su.memberId);
      return `${m?.name ?? 'Unknown'}: ${su.today}${su.hasBlocker ? ` [BLOCKED: ${su.blockers}]` : ''}`;
    });
    setActionOutputs((p) => ({ ...p, standup: `Standup Summary — ${today}\n\n${lines.join('\n\n')}` }));
  }

  function estimatePoints() {
    const modal = prompt('Paste story description:');
    if (!modal) return;
    const words = modal.trim().split(/\s+/).length;
    const pts = words < 20 ? 1 : words < 50 ? 2 : words < 100 ? 3 : words < 180 ? 5 : words < 300 ? 8 : 13;
    setActionOutputs((p) => ({ ...p, estimate: `Based on story complexity (${words} words), estimated story points: ${pts}.\n\nThis is a rough baseline — adjust based on technical complexity, dependencies, and team familiarity.` }));
  }

  function draftSprintGoal() {
    const planningSprint = sprints.find((sp) => sp.status === 'planning');
    if (!planningSprint) {
      setActionOutputs((p) => ({ ...p, goal: 'No planning sprint found. Create a sprint in planning status first.' }));
      return;
    }
    const planStories = stories.filter((s) => s.sprintId === planningSprint.id);
    if (planStories.length === 0) {
      setActionOutputs((p) => ({ ...p, goal: `Sprint "${planningSprint.name}" has no stories assigned yet.` }));
      return;
    }
    const epicIds = [...new Set(planStories.map((s) => s.epicId))];
    const epicTitles = epicIds.map((id) => epics.find((e) => e.id === id)?.title ?? 'Unknown').join(', ');
    const totalPoints = planStories.reduce((sum, s) => sum + s.storyPoints, 0);
    setActionOutputs((p) => ({
      ...p,
      goal: `Suggested Sprint Goal for "${planningSprint.name}":\n\nDeliver ${planStories.length} stories (${totalPoints} pts) across ${epicTitles}, focusing on ${planStories[0].title} and related work, to advance the team's delivery cadence.`,
    }));
  }

  const activeSprint = sprints.find((sp) => sp.status === 'active');
  const visibleSuggestions = suggestions.filter((s) => !s.dismissed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">AI Sprint Assistant</h1>
            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full border border-brand-200">
              Powered by Claude
            </span>
          </div>
          <p className="text-slate-500 text-sm">Intelligent insights from your real sprint data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Suggestion Feed */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">AI Suggestions</h2>
          {visibleSuggestions.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
              <Sparkles size={24} className="mx-auto mb-2" />
              <p className="text-sm">No suggestions right now — everything looks good!</p>
            </div>
          )}
          {visibleSuggestions.map((sugg) => (
            <div key={sugg.id} className={`bg-white border rounded-2xl p-4 transition-all ${sugg.accepted ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className="mt-0.5 flex-shrink-0">{sugg.icon}</span>
                <p className="text-sm text-slate-700 leading-relaxed flex-1">{sugg.text}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sugg.confidence === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {sugg.confidence} confidence
                </span>
                <div className="flex gap-1 ml-auto">
                  {!sugg.accepted && (
                    <button onClick={() => acceptSugg(sugg.id)} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded-lg transition-colors">
                      <CheckCheck size={12} /> Accept
                    </button>
                  )}
                  <button onClick={() => dismissSugg(sugg.id)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors">
                    <X size={12} /> Dismiss
                  </button>
                </div>
              </div>
              {sugg.accepted && <p className="text-xs text-green-600 mt-1 font-medium">Accepted</p>}
            </div>
          ))}
        </div>

        {/* Center — Chat */}
        <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles size={15} className="text-brand-600" />
            <span className="text-sm font-semibold text-slate-800">Sprint Chat</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about your sprint..."
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-3 py-2 disabled:opacity-40 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Right — Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Quick Actions</h2>

          <QuickActionCard
            icon={<FileText size={16} className="text-blue-600" />}
            label="Generate Standup Summary"
            description="Summarize today's standups"
            onClick={genStandupSummary}
            output={actionOutputs['standup']}
          />
          <QuickActionCard
            icon={<Target size={16} className="text-emerald-600" />}
            label="Estimate Story Points"
            description="Paste a description for a quick estimate"
            onClick={estimatePoints}
            output={actionOutputs['estimate']}
          />
          <QuickActionCard
            icon={<Zap size={16} className="text-amber-600" />}
            label="Draft Sprint Goal"
            description="Generate a goal from planning sprint stories"
            onClick={draftSprintGoal}
            output={actionOutputs['goal']}
          />
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-purple-600" />
              <span className="text-sm font-medium text-slate-800">Create Sprint Report</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Generate a full PDF sprint report</p>
            <a
              href="/reports"
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
            >
              Go to Reports <ChevronRight size={12} />
            </a>
          </div>

          {/* Sprint snapshot card */}
          {activeSprint && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2">Active Sprint Snapshot</p>
              {(() => {
                const ss = stories.filter((s) => s.sprintId === activeSprint.id);
                const done = ss.filter((s) => s.status === 'done').length;
                const total = ss.length;
                const pts = ss.filter((s) => s.status === 'done').reduce((a, s) => a + s.storyPoints, 0);
                const totalPts = ss.reduce((a, s) => a + s.storyPoints, 0);
                return (
                  <div className="space-y-1">
                    <p className="text-xs text-brand-800">{activeSprint.name}</p>
                    <div className="w-full bg-brand-200 rounded-full h-1.5">
                      <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${totalPts > 0 ? (pts / totalPts) * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs text-brand-700">{done}/{total} stories · {pts}/{totalPts} pts</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, label, description, onClick, output }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  output?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <button
        onClick={onClick}
        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        Run
      </button>
      {output && (
        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
          {output}
        </div>
      )}
    </div>
  );
}
