import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Map, ShieldAlert, BarChart2, CalendarCheck, Layers,
  TrendingDown, BookOpen, Sparkles, LayoutGrid, Search, Users,
  CheckCircle2, XCircle, AlertCircle, Code2, MessageCircle, Rocket,
  Share2, Zap, Building2, Crown, Star, Shield, Globe, Clock,
  ArrowRight, Play, ChevronDown, ChevronRight, Bot, GitBranch,
  Bell, Repeat, Lock, Award, TrendingUp, Target, Cpu, Hash, Plane,
} from 'lucide-react';

// ─── Data ───────────────────────────────────────────────────────────────────

const features = [
  { icon: LayoutDashboard, title: 'Sprint Board', desc: 'Kanban with WIP limits, swimlanes, and drag-and-drop.' },
  { icon: Map, title: 'Story Map', desc: 'Visual backlog organized by epic, feature, or sprint.' },
  { icon: ShieldAlert, title: 'Risk Register', desc: '5×5 probability × impact matrix for proactive risk management.' },
  { icon: BarChart2, title: 'Monte Carlo Forecast', desc: '10,000-run delivery simulation for data-driven forecasting.' },
  { icon: CalendarCheck, title: 'Ceremony Board', desc: 'Retro, Planning, Standup, PI Planning with timer & voting.' },
  { icon: Layers, title: 'Work Hierarchy', desc: 'Initiative → Epic → Feature → Story, fully navigable.' },
  { icon: TrendingDown, title: 'Burndown Charts', desc: 'Real-time velocity and sprint progress visualizations.' },
  { icon: BookOpen, title: 'Decision Log', desc: 'Architecture Decision Records, fully searchable and versioned.' },
  { icon: Bot, title: 'AI Assistant', desc: 'Sprint-specific Agile coach — not generic writing help.' },
  { icon: Repeat, title: 'Automation Rules', desc: 'Auto-assign, notify, and move stories based on triggers.' },
  { icon: LayoutGrid, title: 'Custom Dashboard', desc: 'Drag-and-drop widget builder tailored to your workflow.' },
  { icon: Search, title: 'Query Builder', desc: 'JQL-style filters with saved queries and shareable views.' },
];

const personas = [
  {
    icon: Target,
    role: 'Scrum Masters',
    headline: 'Run better ceremonies in half the time',
    points: [
      'AI-powered standup summaries and blockers detection',
      'Built-in retro templates (4Ls, Sailboat, Mad-Sad-Glad)',
      'PI Planning board with ROAM risks and dependencies',
      'Team health score and velocity trends at a glance',
    ],
    color: '#4F6EF7',
    bg: 'from-blue-50 to-indigo-50',
  },
  {
    icon: TrendingUp,
    role: 'Product Owners',
    headline: 'Prioritize ruthlessly, ship confidently',
    points: [
      'WSJF and MoSCoW prioritization built-in',
      'Monte Carlo forecast — know your real delivery date',
      'Story hierarchy from Initiative down to subtask',
      'Stakeholder-ready roadmap in one click',
    ],
    color: '#10B981',
    bg: 'from-emerald-50 to-teal-50',
  },
  {
    icon: Cpu,
    role: 'Engineering Teams',
    headline: 'Ship faster with less ceremony overhead',
    points: [
      'GitHub PR linking on every story',
      'Feature flags tied to user stories',
      'DORA metrics and cycle time analytics',
      'Automation rules — zero manual status updates',
    ],
    color: '#8B5CF6',
    bg: 'from-purple-50 to-violet-50',
  },
];

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Scrum Master · 14-person startup',
    avatar: 'SK',
    color: '#4F6EF7',
    quote: 'We switched from Jira 3 months ago. Our retros went from 90 minutes to 45. The ceremony board alone was worth it.',
    stars: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Engineering Lead · Series A',
    avatar: 'MT',
    color: '#10B981',
    quote: 'The Monte Carlo forecast finally gave us a defensible answer to "when will it ship?" without a spreadsheet.',
    stars: 5,
  },
  {
    name: 'Priya R.',
    role: 'Product Owner · SaaS company',
    avatar: 'PR',
    color: '#F59E0B',
    quote: 'Finally a tool that actually understands Scrum instead of forcing Kanban concepts into everything.',
    stars: 5,
  },
  {
    name: 'James L.',
    role: 'CTO · Remote-first team',
    avatar: 'JL',
    color: '#EF4444',
    quote: 'The risk register + dependency graph caught a cross-team blocker 2 weeks before it would have hit us.',
    stars: 5,
  },
  {
    name: 'Ana M.',
    role: 'Agile Coach · Consulting',
    avatar: 'AM',
    color: '#8B5CF6',
    quote: 'I recommend this to every client now. The AI Assistant actually knows SAFe and PI Planning — that\'s rare.',
    stars: 5,
  },
  {
    name: 'David W.',
    role: 'VP Engineering · 40-person org',
    avatar: 'DW',
    color: '#06B6D4',
    quote: 'We cut our sprint planning meetings by 30%. The backlog prioritization and story point tracking are spot-on.',
    stars: 5,
  },
];

const integrations = [
  { name: 'GitHub', icon: Code2, color: '#1e293b' },
  { name: 'Slack', icon: Hash, color: '#4A154B' },
  { name: 'Jira', icon: Globe, color: '#0052CC' },
  { name: 'Confluence', icon: BookOpen, color: '#172B4D' },
  { name: 'Figma', icon: Layers, color: '#F24E1E' },
  { name: 'Notion', icon: BookOpen, color: '#000000' },
  { name: 'Linear', icon: GitBranch, color: '#5E6AD2' },
  { name: 'Discord', icon: MessageCircle, color: '#5865F2' },
];

const trustSignals = [
  { icon: Shield, label: 'SOC 2 Type II', sub: 'Enterprise ready' },
  { icon: Lock, label: 'GDPR Compliant', sub: 'EU data residency' },
  { icon: Globe, label: '99.9% Uptime', sub: 'SLA guaranteed' },
  { icon: Award, label: 'ISO 27001', sub: 'Certified security' },
];

const comparisonRows = [
  { feature: 'Sprint Board & Backlog', us: 'check', jira: 'check', monday: 'check' },
  { feature: 'Risk Register (5×5)', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Monte Carlo Forecast', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Ceremony Board', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Decision Log (ADR)', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Work Hierarchy', us: 'check', jira: 'paid', monday: 'paid' },
  { feature: 'Automation Rules', us: 'check', jira: 'paid', monday: 'paid' },
  { feature: 'AI Sprint Intelligence', us: 'check', jira: 'warn', monday: 'warn' },
  { feature: 'Vacation & Capacity Planning', us: 'check', jira: 'cross', monday: 'warn' },
  { feature: 'OOO Visibility in Standup', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Project Health Score', us: 'check', jira: 'cross', monday: 'cross' },
  { feature: 'Price / user / mo', us: 'from $6', jira: '$16', monday: '$12' },
];

const PLANS = [
  {
    id: 'starter', name: 'Starter', icon: Zap, color: '#64748b',
    monthlyPrice: 0, annualPrice: 0,
    description: 'For individuals and very small teams just getting started.',
    seats: 'Up to 3 users', cta: 'Start Free', ctaLink: '/', highlight: false,
    features: ['Sprint Board & Backlog', 'Story Map', 'Burndown Charts', 'Up to 3 active sprints', 'Basic reports', '1 project', 'Community support'],
    missing: ['Risk Register', 'Monte Carlo Forecast', 'AI Assistant', 'Automation Rules', 'Custom Dashboard', 'Priority support'],
  },
  {
    id: 'team', name: 'Team', icon: Users, color: '#4F6EF7',
    monthlyPrice: 8, annualPrice: 6,
    description: 'For growing Scrum teams who need the full facilitation toolkit.',
    seats: 'Per user · up to 25', cta: 'Start 14-day Trial', ctaLink: '/', highlight: true, badge: 'Most Popular',
    features: ['Everything in Starter', 'Risk Register (5×5 matrix)', 'Ceremony Board (Retro, Planning, Standup)', 'Work Hierarchy (Initiative → Story)', 'Decision Log (ADR format)', 'Monte Carlo Delivery Forecast', 'Automation Rules (20 rules)', 'Custom Dashboard builder', 'Vacation & Capacity Planning', 'Query Builder (JQL-style)', 'Unlimited projects & sprints', 'CSV export & import', 'Email support'],
    missing: ['AI Sprint Intelligence', 'SSO / SAML', 'SLA support', 'On-premise deployment'],
  },
  {
    id: 'business', name: 'Business', icon: Building2, color: '#8B5CF6',
    monthlyPrice: 15, annualPrice: 12,
    description: 'For teams that need AI-powered insights and advanced security.',
    seats: 'Per user · unlimited', cta: 'Start 14-day Trial', ctaLink: '/', highlight: false,
    features: ['Everything in Team', 'AI Sprint Intelligence', 'AI story breakdown suggestions', 'AI risk identification', 'Unlimited automation rules', 'Advanced audit log', 'Granular permissions (6-level)', 'Time tracking & reports', 'Compare stories side-by-side', 'Priority email support', 'Dedicated onboarding call'],
    missing: ['SSO / SAML', 'SLA guarantee', 'On-premise deployment'],
  },
  {
    id: 'enterprise', name: 'Enterprise', icon: Crown, color: '#F59E0B',
    monthlyPrice: null, annualPrice: null,
    description: 'For large organisations with compliance, SSO, and on-premise needs.',
    seats: 'Unlimited users', cta: 'Contact Sales', ctaLink: '#contact', highlight: false,
    features: ['Everything in Business', 'SAML SSO (Okta, Azure AD, Google)', 'On-premise Docker deployment', 'Custom data residency', 'SLA guarantee (99.9% uptime)', 'Dedicated customer success manager', 'Custom onboarding & training', 'Volume discounts', 'Invoice billing', 'Security review & pen-test reports'],
    missing: [],
  },
];

const howItWorks = [
  { step: '01', title: 'Create your workspace', desc: 'Invite your team in under 2 minutes. No IT ticket, no 40-page admin guide.' },
  { step: '02', title: 'Import from Jira or CSV', desc: 'Bring your backlog over instantly. Your stories, epics, and history come with you.' },
  { step: '03', title: 'Plan your sprint', desc: 'AI suggests story points, flags risks, and auto-calculates capacity from vacation calendars.' },
  { step: '04', title: 'Run ceremonies, ship faster', desc: 'Standup, retro, review — all in the tool. Blockers auto-surface. Nothing falls through the cracks.' },
];

// ─── Product Preview ─────────────────────────────────────────────────────────

const PREVIEW_TABS = [
  {
    id: 'board',
    label: 'Sprint Board',
    icon: LayoutDashboard,
    color: '#4F6EF7',
    headline: 'Real-time Kanban with intelligence built in',
    points: ['WIP limits enforce flow discipline', 'Blocked stories surface instantly with red alerts', 'Drag stories across columns — status syncs everywhere', 'Assignee avatars, story points, and priority at a glance'],
    mockup: [
      { col: 'To Do', color: '#64748b', stories: ['User login flow (5pt)', 'Password reset email (3pt)', 'Rate limiting (8pt)'] },
      { col: 'In Progress', color: '#4F6EF7', stories: ['OAuth integration (8pt) 🔴', 'Dashboard redesign (5pt)'] },
      { col: 'Review', color: '#F59E0B', stories: ['API auth middleware (3pt)'] },
      { col: 'Done', color: '#10B981', stories: ['DB schema migration (5pt)', 'CI pipeline setup (2pt)'] },
    ],
  },
  {
    id: 'ai',
    label: 'AI Sprint Coach',
    icon: Bot,
    color: '#8B5CF6',
    headline: 'The only Agile AI that knows SAFe, PI Planning, and your data',
    points: ['Ask "create next 6 sprints" — done in seconds', 'Detects overloaded team members automatically', 'Explains WSJF, ROAM risks, velocity drops in plain English', 'Executes actions: create sprints, assign stories, flag risks'],
    chat: [
      { role: 'user', msg: 'Create the next 3 sprints starting today with 2-week cadence' },
      { role: 'ai', msg: '✅ Created Sprint 4 (Apr 30 – May 13), Sprint 5 (May 14 – May 27), Sprint 6 (May 28 – Jun 10). Goal set to "Continues from Sprint 3 velocity of 42pts." Want me to assign the top backlog stories?' },
      { role: 'user', msg: 'Who is over capacity this sprint?' },
      { role: 'ai', msg: '⚠️ Bob Martinez is at 38pt assigned vs 30pt capacity (127%). Alice Chen and Carol Kim are within range. Suggest moving "Rate limiting (8pt)" from Bob to Carol who has 12pt headroom.' },
    ],
  },
  {
    id: 'risk',
    label: 'Risk Register',
    icon: ShieldAlert,
    color: '#EF4444',
    headline: 'The 5×5 risk matrix Jira Premium doesn\'t have',
    points: ['Plot every risk on probability × impact matrix', 'ROAM categorization built-in (Resolved, Owned, Accepted, Mitigated)', 'Auto-surface risks linked to blocked stories', 'Risk score auto-calculated — no spreadsheet needed'],
    risks: [
      { title: 'Auth service single point of failure', prob: 'High', impact: 'Critical', score: 20, status: 'open' },
      { title: 'Third-party API rate limit', prob: 'Medium', impact: 'Major', score: 12, status: 'mitigated' },
      { title: 'Release dependency on DevOps', prob: 'Low', impact: 'Major', score: 8, status: 'owned' },
    ],
  },
  {
    id: 'forecast',
    label: 'Monte Carlo',
    icon: BarChart2,
    color: '#10B981',
    headline: '10,000 simulations. One honest delivery date.',
    points: ['Based on your actual historical velocity — not guesses', 'P50 / P85 / P95 confidence bands', '"When will we ship?" answered in seconds', 'Beats every Jira add-on at half the cost'],
    forecast: { p50: 'May 14', p85: 'May 27', p95: 'Jun 3', velocity: 42, remaining: 187 },
  },
  {
    id: 'vacation',
    label: 'Capacity Planner',
    icon: Users,
    color: '#F59E0B',
    headline: 'The OOO visibility gap Jira never solved',
    points: ['Team vacation calendar linked directly to sprint capacity', 'Capacity auto-adjusts: 4 days OOO = proportional point reduction', 'OOO banner appears during standups — no more assigning to absent members', 'Sprint capacity impact shown per-sprint, per-member'],
    capacity: [
      { name: 'Alice Chen', base: 30, adj: 30, ooo: 0 },
      { name: 'Bob Martinez', base: 30, adj: 18, ooo: 4 },
      { name: 'Carol Kim', base: 25, adj: 25, ooo: 0 },
      { name: 'David Lee', base: 20, adj: 12, ooo: 4 },
    ],
  },
];

function ProductPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = PREVIEW_TABS[activeTab];

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-slate-800">
        {PREVIEW_TABS.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? 'border-brand-400 text-white bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={14} style={{ color: activeTab === i ? t.color : undefined }} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[380px]">
        {/* Left: description */}
        <div className="lg:col-span-2 p-8 flex flex-col justify-center border-r border-slate-800">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${tab.color}20` }}>
            <tab.icon size={20} style={{ color: tab.color }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 leading-snug">{tab.headline}</h3>
          <ul className="space-y-3">
            {tab.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: tab.color }} />
                {p}
              </li>
            ))}
          </ul>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: tab.color }}>
            Try it free <ArrowRight size={14} />
          </Link>
        </div>

        {/* Right: visual mockup */}
        <div className="lg:col-span-3 p-6 overflow-auto">
          {tab.id === 'board' && tab.mockup && (
            <div className="grid grid-cols-4 gap-3 h-full">
              {tab.mockup.map((col) => (
                <div key={col.col} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-xs font-bold text-slate-300">{col.col}</span>
                    <span className="ml-auto text-xs text-slate-500">{col.stories.length}</span>
                  </div>
                  {col.stories.map((s) => (
                    <div key={s} className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 text-xs text-slate-200 leading-snug hover:border-slate-500 transition-colors">
                      {s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {tab.id === 'ai' && tab.chat && (
            <div className="space-y-3 max-w-lg">
              {tab.chat.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-xs rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.msg}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <input className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-500" placeholder="Ask anything about your sprint..." readOnly />
                <button className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#8B5CF6' }}>Send</button>
              </div>
            </div>
          )}

          {tab.id === 'risk' && tab.risks && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5 text-xs text-slate-500 font-semibold px-1 mb-2">
                <span>Risk</span><span className="text-center">Probability × Impact</span><span className="text-center">Status</span>
              </div>
              {tab.risks.map((r) => (
                <div key={r.title} className="bg-slate-800 border border-slate-700 rounded-xl p-4 grid grid-cols-3 gap-3 items-center">
                  <p className="text-xs text-slate-200 font-medium col-span-1 line-clamp-2">{r.title}</p>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1 text-xs">
                      <span className="bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded">{r.prob}</span>
                      <span className="text-slate-500">×</span>
                      <span className="bg-orange-900/40 text-orange-300 px-1.5 py-0.5 rounded">{r.impact}</span>
                    </div>
                    <div className="text-lg font-black mt-1" style={{ color: r.score >= 15 ? '#EF4444' : r.score >= 8 ? '#F59E0B' : '#10B981' }}>{r.score}</div>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'open' ? 'bg-red-900/40 text-red-300' : r.status === 'mitigated' ? 'bg-green-900/40 text-green-300' : 'bg-blue-900/40 text-blue-300'}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-red-500" />Score ≥ 15: Critical</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-amber-400" />8–14: High</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-green-400" />&lt;8: Low</div>
              </div>
            </div>
          )}

          {tab.id === 'forecast' && tab.forecast && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Remaining: {tab.forecast.remaining}pt · Avg velocity: {tab.forecast.velocity}pt/sprint</p>
                <p className="text-xs text-slate-400">Based on 10,000 Monte Carlo simulations</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                {[
                  { label: '50% likely by', date: tab.forecast.p50, color: '#10B981', desc: 'Best case' },
                  { label: '85% likely by', date: tab.forecast.p85, color: '#F59E0B', desc: 'Plan for this' },
                  { label: '95% likely by', date: tab.forecast.p95, color: '#EF4444', desc: 'Buffer date' },
                ].map(({ label, date, color, desc }) => (
                  <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-2">{label}</p>
                    <p className="text-xl font-black" style={{ color }}>{date}</p>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="w-full max-w-md bg-slate-800 rounded-xl p-4 border border-slate-700">
                <p className="text-xs text-slate-400 mb-3">Probability distribution</p>
                <div className="flex items-end gap-1 h-16">
                  {[2, 4, 8, 14, 22, 28, 18, 12, 8, 4, 2, 1].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t transition-all" style={{ height: `${(h / 28) * 100}%`, backgroundColor: i < 5 ? '#10B981' : i < 8 ? '#F59E0B' : '#EF4444', opacity: 0.7 + i * 0.02 }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab.id === 'vacation' && tab.capacity && (
            <div className="space-y-4">
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-300">
                <Plane size={14} />
                <span>2 team members OOO this sprint — capacity auto-adjusted</span>
              </div>
              <div className="space-y-3">
                {tab.capacity.map((m) => {
                  const pct = Math.round((m.adj / m.base) * 100);
                  return (
                    <div key={m.name} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-200">{m.name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          {m.ooo > 0 && <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1"><Plane size={10} /> {m.ooo} days OOO</span>}
                          <span className={`font-bold ${m.adj < m.base ? 'text-amber-400' : 'text-green-400'}`}>{m.adj}pt <span className="text-slate-500 font-normal">/ {m.base}pt</span></span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: m.adj < m.base ? '#F59E0B' : '#10B981' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total sprint capacity</span>
                  <span className="font-bold text-white">85pt <span className="text-slate-400 font-normal">/ 105pt base</span></span>
                </div>
                <p className="text-xs text-amber-400 mt-1">Plan ~85 story points for this sprint</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function CellIcon({ value }: { value: string }) {
  if (value === 'check') return <CheckCircle2 size={18} className="text-green-500 mx-auto" />;
  if (value === 'cross') return <XCircle size={18} className="text-red-400 mx-auto" />;
  if (value === 'warn') return <span className="flex items-center justify-center gap-1 text-yellow-600 text-xs font-medium"><AlertCircle size={14} /> add-on</span>;
  if (value === 'paid') return <span className="text-xs text-slate-500 font-medium">paid tier</span>;
  return <span className="text-sm font-semibold text-slate-700">{value}</span>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function LandingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'How is ScrumBoard Pro different from Jira?', a: 'Jira is an ecosystem built for enterprise configurability — it takes weeks to set up properly and costs $16/user/mo at scale. ScrumBoard Pro is purpose-built for Scrum practitioners: you get a Risk Register, Monte Carlo forecasting, Ceremony Board, and AI Sprint Intelligence out of the box, at a third of the price. No plugin marketplace, no certification required.' },
    { q: 'Can I migrate from Jira?', a: 'Yes. Export your Jira backlog as a CSV and import it into ScrumBoard Pro in minutes. Epics, stories, labels, story points, and assignees all carry over. We also support direct Jira API sync in the Business plan.' },
    { q: 'Is my data private?', a: 'Your data stays yours. We are SOC 2 Type II certified and GDPR compliant. Enterprise plans support on-premise deployment and custom data residency. We never sell or share your data.' },
    { q: 'Does the free plan expire?', a: 'No. The Starter plan is free forever for up to 3 users. You only pay when your team grows or you need advanced features like AI, automation rules, or SSO.' },
    { q: 'Do you support SAFe and PI Planning?', a: 'Yes — the AI Assistant has deep SAFe 6.0 knowledge including PI Planning, ART sync, ROAM risks, and WSJF prioritization. The Ceremony Board includes a PI Planning template with a program board and dependency tracker.' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-slate-900 text-lg">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            ScrumBoard Pro
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-500 transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-brand-500 transition-colors">Compare</a>
            <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-brand-500 transition-colors">Sign in</Link>
            <Link to="/" className="text-sm font-bold px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors">
              Get started free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2C42C2 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-white/20">
            <Sparkles size={12} /> Free forever · No signup required · Built for Scrum practitioners
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-6 tracking-tight">
            The Scrum Tool<br />
            <span style={{ color: '#93C5FD' }}>Jira Forgot to Build</span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Monte Carlo forecasting. Risk Register. AI Sprint Coach. Ceremony Board.
            Features Jira Premium charges $16/seat for — we ship them free.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-blue-900/40" style={{ background: '#4F6EF7' }}>
              Try it free — no card needed <ArrowRight size={16} />
            </Link>
            <a href="#demo" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all active:scale-95">
              <Play size={15} /> Watch 2-min demo
            </a>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['37 Features built-in', 'From $6/user/mo', '< 5 min setup', 'SOC 2 Type II', '3× faster than Jira'].map((badge) => (
              <span key={badge} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-blue-100 border border-white/20">{badge}</span>
            ))}
          </div>
        </div>

        {/* Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none" style={{ background: '#4F6EF7', filter: 'blur(100px)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10 pointer-events-none" style={{ background: '#93C5FD', filter: 'blur(80px)', transform: 'translate(-30%, 30%)' }} />
      </section>

      {/* ── PRODUCT PREVIEW ── */}
      <section className="bg-slate-950 py-20 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-3">See it in action</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Not just a Kanban board.<br />A complete Scrum operating system.
            </h2>
            <p className="text-slate-400 text-lg">Everything your team needs — in one tab, not 12 different tools.</p>
          </div>
          <ProductPreview />
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="bg-slate-50 border-b border-slate-200 py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm font-semibold text-slate-500">Teams switching from:</span>
          {['Jira', 'Linear', 'Asana', 'Monday.com', 'ClickUp', 'Trello'].map((tool) => (
            <span key={tool} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-400 line-through decoration-red-400">{tool}</span>
          ))}
          <span className="text-sm font-bold text-brand-500">→ ScrumBoard Pro</span>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section className="bg-white py-10 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustSignals.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Up and running in minutes</h2>
            <p className="text-slate-500 text-lg">Not weeks. Not a Jira admin certification.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-5xl font-black text-slate-100 mb-3">{step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                {step !== '04' && (
                  <ChevronRight size={20} className="text-slate-300 absolute top-8 -right-3 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Built for every role on the team</h2>
            <p className="text-slate-500 text-lg">One tool. Zero role conflicts.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map(({ icon: Icon, role, headline, points, color, bg }) => (
              <div key={role} className={`rounded-2xl bg-gradient-to-br ${bg} border border-slate-200 p-7`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>{role}</p>
                <h3 className="text-xl font-extrabold text-slate-900 mb-4 leading-snug">{headline}</h3>
                <ul className="space-y-2.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Everything a Scrum team actually needs</h2>
          <p className="text-slate-500 text-lg">37 features. All included. No plugin marketplace.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-500 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <Icon size={20} style={{ color: '#4F6EF7' }} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-brand-500 transition-colors">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Works with your existing stack</h2>
          <p className="text-slate-500 text-sm mb-10">Connect the tools you already use. No ripping and replacing.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {integrations.map(({ name, icon: Icon, color }) => (
              <div key={name} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-5 py-3 hover:shadow-sm transition-shadow">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-slate-700">{name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 bg-white border border-dashed border-slate-300 rounded-xl px-5 py-3">
              <span className="text-sm text-slate-400">+ more coming</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Loved by Scrum teams worldwide</h2>
            <p className="text-slate-500 text-lg">Real feedback. No cherry-picked enterprise logos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map(({ name, role, avatar, color, quote, stars }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                <StarRating count={stars} />
                <p className="text-sm text-slate-700 leading-relaxed mt-4 flex-1">"{quote}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>{avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section id="compare" className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">How we stack up</h2>
            <p className="text-slate-500 text-lg">Feature-for-feature. No asterisks.</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold w-2/5">Feature</th>
                  <th className="text-center px-4 py-4 font-bold w-1/5" style={{ color: '#93C5FD' }}>ScrumBoard Pro</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-400 w-1/5">Jira Premium</th>
                  <th className="text-center px-4 py-4 font-semibold text-slate-400 w-1/5">Monday.com</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-3 font-medium text-slate-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center" style={{ background: 'rgba(79,110,247,0.06)' }}><CellIcon value={row.us} /></td>
                    <td className="px-4 py-3 text-center"><CellIcon value={row.jira} /></td>
                    <td className="px-4 py-3 text-center"><CellIcon value={row.monday} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-slate-500 text-lg mb-6">No per-feature add-ons. No surprise overages. Cancel any time.</p>
            <div className="inline-flex items-center gap-3 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${!annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                Annual <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save 25%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${plan.highlight ? 'shadow-xl' : 'border-slate-200 bg-white'}`}
                  style={plan.highlight ? { borderColor: plan.color, background: 'linear-gradient(180deg,#f0f4ff 0%,#fff 60%)' } : {}}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">{plan.badge}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}18` }}>
                      <Icon size={16} style={{ color: plan.color }} />
                    </div>
                    <span className="font-bold text-slate-900">{plan.name}</span>
                  </div>
                  <div className="mb-2">
                    {price === null ? (
                      <div className="text-3xl font-black text-slate-900">Custom</div>
                    ) : price === 0 ? (
                      <div className="text-4xl font-black" style={{ color: plan.color }}>Free</div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black" style={{ color: plan.color }}>${price}</span>
                        <span className="text-sm text-slate-400 mb-1.5">/user/mo</span>
                      </div>
                    )}
                    {price !== null && price > 0 && <p className="text-xs text-slate-400 mt-0.5">{annual ? 'billed annually' : 'billed monthly'}</p>}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1">{plan.description}</p>
                  <p className="text-xs font-semibold mb-5" style={{ color: plan.color }}>{plan.seats}</p>
                  <Link to={plan.ctaLink} className="block text-center py-2.5 rounded-xl font-bold text-sm mb-6 transition-all hover:opacity-90"
                    style={plan.highlight ? { background: plan.color, color: '#fff' } : { background: `${plan.color}18`, color: plan.color }}>
                    {plan.cta}
                  </Link>
                  <div className="flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />{f}
                      </div>
                    ))}
                    {plan.missing.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-slate-400">
                        <XCircle size={13} className="flex-shrink-0 mt-0.5 text-slate-300" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">
            All plans include a 14-day free trial. No credit card required for Starter or Trial. Annual plans billed once per year. Prices in USD.
          </p>
        </div>
      </section>

      {/* ── ROI CALLOUT ── */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">What's the ROI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {[
              { stat: '30%', label: 'Less time in sprint planning', sub: 'AI pre-populates story points and flags risks' },
              { stat: '2×', label: 'Faster retros', sub: 'Structured templates replace blank Confluence pages' },
              { stat: '$10/seat', label: 'Savings vs Jira Premium', sub: 'Per user per month — multiply by your team size' },
            ].map(({ stat, label, sub }) => (
              <div key={stat} className="text-center">
                <div className="text-5xl font-black text-blue-200 mb-2">{stat}</div>
                <p className="font-bold text-white text-lg">{label}</p>
                <p className="text-sm text-blue-200 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {q}
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Join the community</h2>
            <p className="text-slate-500">Follow, contribute, and shape what we build next.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Code2, label: 'GitHub', sub: 'Star & contribute', color: '#1e293b' },
              { icon: MessageCircle, label: 'Discord', sub: 'Join the community', color: '#5865F2' },
              { icon: Rocket, label: 'Product Hunt', sub: 'Vote for us', color: '#DA552F' },
              { icon: Share2, label: 'Twitter / X', sub: 'Follow updates', color: '#000000' },
            ].map(({ icon: Icon, label, sub, color }) => (
              <a key={label} href="#" className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-slate-300 transition-all group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-slate-900 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-white mb-4">Stop paying $16/seat for Jira.</h2>
          <p className="text-slate-400 text-lg mb-8">Start free. Import your backlog in 5 minutes. Your team will thank you.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base" style={{ background: '#4F6EF7' }}>
              Start free today <ArrowRight size={16} />
            </Link>
            <Link to="/market-comparison" className="px-8 py-4 rounded-xl font-bold text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors">
              See full comparison →
            </Link>
          </div>
          <p className="text-slate-600 text-xs mt-6">No credit card · SOC 2 certified · Cancel any time</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 text-slate-500 text-sm py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center"><Sparkles size={12} className="text-white" /></div>
            ScrumBoard Pro
          </div>
          <div className="flex flex-wrap gap-5 text-xs">
            {['Privacy Policy', 'Terms of Service', 'Security', 'Status', 'Changelog'].map((l) => (
              <a key={l} href="#" className="hover:text-slate-300 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs">© 2026 ScrumBoard Pro · Built for Scrum Masters</p>
        </div>
      </footer>
    </div>
  );
}
