import { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  LayoutDashboard,
  LayoutGrid,
  Map,
  ShieldAlert,
  BarChart2,
  CalendarCheck,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = 'Critical' | 'High' | 'Medium';
type Status = 'Ready' | 'Missing' | 'In Progress';

interface Asset {
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  actionLabel: string;
  actionHref: string;
  actionExternal: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const assets: Asset[] = [
  {
    name: 'Landing Page',
    description: 'Public-facing marketing page with hero, features, pricing',
    priority: 'Critical',
    status: 'Ready',
    actionLabel: 'View Page →',
    actionHref: '/landing',
    actionExternal: false,
  },
  {
    name: 'Market Comparison PDF',
    description: '10-section competitive analysis report, printable',
    priority: 'Critical',
    status: 'Ready',
    actionLabel: 'Open Report →',
    actionHref: '/market-comparison',
    actionExternal: false,
  },
  {
    name: 'Demo Video',
    description: '2–3 min product walkthrough for investors and PMs',
    priority: 'High',
    status: 'In Progress',
    actionLabel: 'Record with Loom',
    actionHref: 'https://loom.com',
    actionExternal: true,
  },
  {
    name: 'GitHub Repository',
    description: 'Open-source the codebase to build trust and drive adoption',
    priority: 'Critical',
    status: 'Missing',
    actionLabel: 'Create Repo →',
    actionHref: 'https://github.com/new',
    actionExternal: true,
  },
  {
    name: 'Discord Community',
    description: 'Community for users, feedback, and support',
    priority: 'Medium',
    status: 'Missing',
    actionLabel: 'Create Server →',
    actionHref: 'https://discord.com/create',
    actionExternal: true,
  },
  {
    name: 'Product Hunt Launch',
    description: 'Submit and launch on Product Hunt for visibility',
    priority: 'High',
    status: 'Missing',
    actionLabel: 'Submit →',
    actionHref: 'https://producthunt.com/posts/new',
    actionExternal: true,
  },
];

const timelineColumns = [
  {
    title: 'Week 1',
    color: '#4F6EF7',
    bg: '#EEF2FF',
    tasks: [
      'Launch on Product Hunt',
      'Post in r/agile and r/scrum',
      'Publish "Show HN" post',
      'Open-source on GitHub',
      'Share on LinkedIn',
    ],
  },
  {
    title: 'Month 1',
    color: '#F97316',
    bg: '#FFF7ED',
    tasks: [
      'Record "Jira vs ScrumBoard Pro" YouTube video',
      'Write technical blog post on Dev.to',
      'Set up email waitlist',
      'Record 5 tutorial videos',
      'Reach out to 10 Scrum Master blogs',
    ],
  },
  {
    title: 'Month 2–3',
    color: '#10B981',
    bg: '#ECFDF5',
    tasks: [
      'Partner with Scrum Alliance community',
      'Guest post on agile blogs',
      'Build "Made with ScrumBoard Pro" showcase',
      'Ship 3+ user-requested features',
      'Collect 5 case studies',
    ],
  },
];

const marketingMessages = [
  'The Scrum tool Jira forgot to build',
  'Free forever. No per-seat pricing. All the features Jira Premium charges $16/user/month for.',
  'Monte Carlo delivery forecasting, a 5×5 risk register, and ceremony support — in one free tool. None of these exist in Jira at any price.',
];

const screenshotCards = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Sprint Board', icon: LayoutGrid },
  { label: 'Story Map', icon: Map },
  { label: 'Risk Register', icon: ShieldAlert },
  { label: 'Delivery Forecast', icon: BarChart2 },
  { label: 'Ceremony Board', icon: CalendarCheck },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const priorityStyles: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const statusStyles: Record<Status, string> = {
  Ready: 'bg-green-100 text-green-700 border border-green-200',
  Missing: 'bg-red-100 text-red-700 border border-red-200',
  'In Progress': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

function AssetActionButton({ asset }: { asset: Asset }) {
  if (asset.actionExternal) {
    return (
      <a
        href={asset.actionHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#4F6EF7' }}
      >
        {asset.actionLabel}
        <ExternalLink size={13} />
      </a>
    );
  }
  return (
    <a
      href={asset.actionHref}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
      style={{ background: '#4F6EF7' }}
    >
      {asset.actionLabel}
    </a>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-slate-50 active:scale-95"
      style={{ borderColor: copied ? '#10B981' : '#e2e8f0', color: copied ? '#10B981' : '#64748b' }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LaunchHubPage() {
  // Timeline checkbox state
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleTask = (colTitle: string, task: string) => {
    const key = `${colTitle}::${task}`;
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Readiness score
  const readyCount = assets.filter((a) => a.status === 'Ready').length;
  const total = assets.length;
  const readinessPct = Math.round((readyCount / total) * 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FFF7ED' }}
          >
            <Rocket size={24} style={{ color: '#F97316' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Launch Hub</h1>
            <p className="text-slate-500 text-sm mt-0.5">Go-to-market readiness tracker</p>
          </div>
        </div>

        {/* ── LAUNCH READINESS SCORE ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Launch Readiness Score</h2>

          <div className="flex flex-wrap items-center gap-8">
            {/* Big number */}
            <div className="text-center">
              <div className="text-5xl font-black" style={{ color: '#4F6EF7' }}>
                {readyCount}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                / {total} assets ready
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Overall Readiness</span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: readinessPct >= 80 ? '#ECFDF5' : readinessPct >= 50 ? '#FFF7ED' : '#FEF2F2',
                    color: readinessPct >= 80 ? '#10B981' : readinessPct >= 50 ? '#F97316' : '#EF4444',
                  }}
                >
                  {readinessPct}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${readinessPct}%`,
                    background: readinessPct >= 80 ? '#10B981' : readinessPct >= 50 ? '#F97316' : '#EF4444',
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['Ready', 'In Progress', 'Missing'] as Status[]).map((s) => {
                  const count = assets.filter((a) => a.status === s).length;
                  return (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusStyles[s]}`}>
                      {count} {s}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ASSET CHECKLIST ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Asset Checklist</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="px-6 py-5 flex flex-wrap items-center gap-4"
              >
                {/* Name + description */}
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-slate-900 text-sm">{asset.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {asset.description}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex-shrink-0">
                  <Badge label={asset.priority} style={priorityStyles[asset.priority]} />
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <Badge label={asset.status} style={statusStyles[asset.status]} />
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  <AssetActionButton asset={asset} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── GO-TO-MARKET TIMELINE ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Go-To-Market Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {timelineColumns.map((col) => (
              <div
                key={col.title}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div
                  className="px-5 py-4 font-bold text-sm"
                  style={{ background: col.bg, color: col.color }}
                >
                  {col.title}
                </div>
                <ul className="divide-y divide-slate-100">
                  {col.tasks.map((task) => {
                    const key = `${col.title}::${task}`;
                    const done = !!checked[key];
                    return (
                      <li key={task} className="px-4 py-3">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleTask(col.title, task)}
                            className="sr-only"
                          />
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 flex-shrink-0 transition-colors"
                            style={{ color: done ? col.color : '#CBD5E1' }}
                          />
                          <span
                            className={`text-sm leading-snug transition-colors ${
                              done ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-slate-900'
                            }`}
                          >
                            {task}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── MARKETING MESSAGES ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Key Marketing Messages</h2>
          <div className="space-y-4">
            {marketingMessages.map((msg) => (
              <div
                key={msg}
                className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex items-start justify-between gap-4"
              >
                <p className="text-slate-800 text-sm leading-relaxed font-medium flex-1">{msg}</p>
                <div className="flex-shrink-0">
                  <CopyButton text={msg} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DEMO SCREENSHOTS GALLERY ── */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-5">Demo Screenshots Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {screenshotCards.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                {/* Placeholder image area */}
                <div
                  className="h-40 flex flex-col items-center justify-center gap-3"
                  style={{ background: '#F8FAFC' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: '#EEF2FF' }}
                  >
                    <Icon size={22} style={{ color: '#4F6EF7' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Screenshot placeholder</span>
                </div>

                {/* Caption */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{label}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    Screenshot Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
