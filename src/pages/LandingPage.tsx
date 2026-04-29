import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  BarChart2,
  CalendarCheck,
  Layers,
  TrendingDown,
  BookOpen,
  Sparkles,
  LayoutGrid,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  MessageCircle,
  Rocket,
  Share2,
  Zap,
  Building2,
  Crown,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Sprint Board',
    desc: 'Kanban with WIP limits, swimlanes, and drag-and-drop.',
  },
  {
    icon: Map,
    title: 'Story Map',
    desc: 'Visual backlog organized by epic, feature, or sprint.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Register',
    desc: '5×5 probability × impact matrix for proactive risk management.',
  },
  {
    icon: BarChart2,
    title: 'Monte Carlo Forecast',
    desc: '10,000-run delivery simulation for data-driven forecasting.',
  },
  {
    icon: CalendarCheck,
    title: 'Ceremony Board',
    desc: 'Retro, Planning, Standup, PI Planning with timer & voting.',
  },
  {
    icon: Layers,
    title: 'Work Hierarchy',
    desc: 'Initiative → Epic → Feature → Story, fully navigable.',
  },
  {
    icon: TrendingDown,
    title: 'Burndown Charts',
    desc: 'Real-time velocity and sprint progress visualizations.',
  },
  {
    icon: BookOpen,
    title: 'Decision Log',
    desc: 'Architecture Decision Records, fully searchable and versioned.',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    desc: 'Sprint-specific intelligence — not generic writing help.',
  },
  {
    icon: LayoutGrid,
    title: 'Custom Dashboard',
    desc: 'Drag-and-drop widget builder tailored to your workflow.',
  },
  {
    icon: Search,
    title: 'Query Builder',
    desc: 'JQL-style filters with saved queries and shareable views.',
  },
  {
    icon: Users,
    title: 'Team Management',
    desc: 'Roles, permissions, capacity planning and member analytics.',
  },
];

const comparisonRows = [
  { feature: 'Sprint Board', us: 'check', jira: 'check' },
  { feature: 'Risk Register', us: 'check', jira: 'cross' },
  { feature: 'Monte Carlo Forecast', us: 'check', jira: 'cross' },
  { feature: 'Ceremony Board', us: 'check', jira: 'cross' },
  { feature: 'Decision Log', us: 'check', jira: 'cross' },
  { feature: 'Work Hierarchy', us: 'check', jira: 'paid' },
  { feature: 'Project Health Score', us: 'check', jira: 'cross' },
  { feature: 'AI Sprint Intelligence', us: 'check', jira: 'warn' },
  { feature: 'Licensing Cost', us: 'from $6/user/mo', jira: '$16/user/mo' },
  { feature: 'Local Data Privacy', us: 'check', jira: 'cross' },
];

const communityLinks = [
  { icon: Code2, label: 'GitHub', sub: 'Star us on GitHub', href: '#github', color: '#1e293b' },
  { icon: MessageCircle, label: 'Discord', sub: 'Join the Community', href: '#discord', color: '#5865F2' },
  { icon: Rocket, label: 'Product Hunt', sub: 'Vote on Product Hunt', href: '#producthunt', color: '#DA552F' },
  { icon: Share2, label: 'Twitter / X', sub: 'Follow updates', href: '#twitter', color: '#000000' },
];

function CellIcon({ value }: { value: string }) {
  if (value === 'check')
    return <CheckCircle2 size={20} className="text-green-500 mx-auto" />;
  if (value === 'cross')
    return <XCircle size={20} className="text-red-400 mx-auto" />;
  if (value === 'warn')
    return (
      <span className="flex items-center justify-center gap-1 text-yellow-600 text-sm font-medium">
        <AlertCircle size={16} /> generic
      </span>
    );
  if (value === 'paid')
    return <span className="text-xs text-slate-500 font-medium">✅ (paid)</span>;
  return <span className="text-sm font-semibold text-slate-700">{value}</span>;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    color: '#64748b',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'For individuals and very small teams just getting started.',
    seats: 'Up to 3 users',
    cta: 'Start Free',
    ctaLink: '/',
    highlight: false,
    features: [
      'Sprint Board & Backlog',
      'Story Map',
      'Burndown Charts',
      'Up to 3 active sprints',
      'Basic reports',
      '1 project',
      'Community support',
    ],
    missing: ['Risk Register', 'Monte Carlo Forecast', 'AI Assistant', 'Ceremony Board', 'Custom Dashboard', 'Priority support'],
  },
  {
    id: 'team',
    name: 'Team',
    icon: Users,
    color: '#4F6EF7',
    monthlyPrice: 8,
    annualPrice: 6,
    description: 'For growing Scrum teams who need the full facilitation toolkit.',
    seats: 'Per user · up to 25',
    cta: 'Start 14-day Trial',
    ctaLink: '/',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Risk Register (5×5 matrix)',
      'Ceremony Board (Retro, Planning, Standup)',
      'Work Hierarchy (Initiative → Story)',
      'Decision Log (ADR format)',
      'Monte Carlo Delivery Forecast',
      'Custom Dashboard builder',
      'Query Builder (JQL-style)',
      'Unlimited projects & sprints',
      'CSV export & import',
      'Email support',
    ],
    missing: ['AI Sprint Intelligence', 'SSO / SAML', 'SLA support', 'On-premise deployment'],
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    color: '#8B5CF6',
    monthlyPrice: 15,
    annualPrice: 12,
    description: 'For teams that need AI-powered insights and advanced security.',
    seats: 'Per user · unlimited',
    cta: 'Start 14-day Trial',
    ctaLink: '/',
    highlight: false,
    features: [
      'Everything in Team',
      'AI Sprint Intelligence',
      'AI story breakdown suggestions',
      'AI risk identification',
      'Advanced audit log',
      'Granular permissions (6-level)',
      'Time tracking & reports',
      'Compare stories side-by-side',
      'Priority email support',
      'Dedicated onboarding call',
    ],
    missing: ['SSO / SAML', 'SLA guarantee', 'On-premise deployment'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Crown,
    color: '#F59E0B',
    monthlyPrice: null,
    annualPrice: null,
    description: 'For large organisations with compliance, SSO, and on-premise needs.',
    seats: 'Unlimited users',
    cta: 'Contact Sales',
    ctaLink: '#contact',
    highlight: false,
    features: [
      'Everything in Business',
      'SAML SSO (Okta, Azure AD, Google)',
      'On-premise Docker deployment',
      'Custom data residency',
      'SLA guarantee (99.9% uptime)',
      'Dedicated customer success manager',
      'Custom onboarding & training',
      'Volume discounts',
      'Invoice billing',
      'Security review & pen-test reports',
    ],
    missing: [],
  },
];

export function LandingPage() {
  const [annual, setAnnual] = useState(true);
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── HERO ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #2C42C2 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-white/20">
            <Sparkles size={12} /> Free forever · No signup required
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            The Scrum Tool<br />
            <span style={{ color: '#93C5FD' }}>Jira Forgot to Build</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Free forever. Purpose-built for Scrum Masters. Monte Carlo forecasting, Risk Register,
            Ceremony Board — features Jira Premium doesn&apos;t offer at any price.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#4F6EF7' }}
            >
              Try it Free →
            </Link>
            <Link
              to="/market-comparison"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base border border-white/30 hover:bg-white/10 transition-all active:scale-95"
            >
              View Market Analysis →
            </Link>
          </div>

          {/* Metric badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['13+ Unique Features', 'From $6/user/mo', '< 5 min Setup', '100% Local Data', '$11.2B Market'].map(
              (badge) => (
                <span
                  key={badge}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-blue-100 border border-white/20"
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>

        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: '#4F6EF7', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: '#93C5FD', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }}
        />
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
          <span className="font-semibold text-slate-700 mr-2">Trusted alternative to:</span>
          {['Jira', 'Linear', 'Asana', 'Monday.com', 'ClickUp'].map((tool) => (
            <span
              key={tool}
              className="px-3 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-400 line-through decoration-red-400"
            >
              {tool}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURE GRID ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
            Everything a Scrum Master Actually Needs
          </h2>
          <p className="text-slate-500 text-lg">
            13 purpose-built features. Zero per-seat fees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#EEF2FF' }}
              >
                <Icon size={20} style={{ color: '#4F6EF7' }} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-brand-500 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
              How We Stack Up
            </h2>
            <p className="text-slate-500 text-lg">
              Feature-for-feature against the market leader.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left px-6 py-4 font-semibold w-1/2">Feature</th>
                  <th className="text-center px-6 py-4 font-bold w-1/4" style={{ color: '#93C5FD' }}>
                    ScrumBoard Pro
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-400 w-1/4">
                    Jira Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-6 py-3 font-medium text-slate-700">{row.feature}</td>
                    <td
                      className="px-6 py-3 text-center"
                      style={{ background: 'rgba(79,110,247,0.06)' }}
                    >
                      <CellIcon value={row.us} />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <CellIcon value={row.jira} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 text-lg mb-6">Scale as your team grows. Cancel any time.</p>

            {/* Annual / Monthly toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${!annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Annual
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save 25%</span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${plan.highlight ? 'shadow-xl' : 'border-slate-200 bg-white'}`}
                  style={plan.highlight ? { borderColor: plan.color, background: 'linear-gradient(180deg,#f0f4ff 0%,#fff 60%)' } : {}}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${plan.color}18` }}>
                      <Icon size={16} style={{ color: plan.color }} />
                    </div>
                    <span className="font-bold text-slate-900">{plan.name}</span>
                  </div>

                  {/* Price */}
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
                    {price !== null && price > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{annual ? 'billed annually' : 'billed monthly'}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-1">{plan.description}</p>
                  <p className="text-xs font-semibold mb-5" style={{ color: plan.color }}>{plan.seats}</p>

                  {/* CTA */}
                  <Link
                    to={plan.ctaLink}
                    className="block text-center py-2.5 rounded-xl font-bold text-sm mb-6 transition-all hover:opacity-90"
                    style={plan.highlight ? { background: plan.color, color: '#fff' } : { background: `${plan.color}18`, color: plan.color }}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <div className="flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                        {f}
                      </div>
                    ))}
                    {plan.missing.map((f) => (
                      <div key={f} className="flex items-start gap-2 text-xs text-slate-400">
                        <XCircle size={13} className="flex-shrink-0 mt-0.5 text-slate-300" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote */}
          <p className="text-center text-xs text-slate-400 mt-8">
            All plans include a 14-day free trial. No credit card required for Starter or Trial.
            Annual plans are billed once per year. Prices in USD.
          </p>
        </div>
      </section>

      {/* ── PRICING COMPARISON DETAIL ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-8">What's Included in Each Plan</h3>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left px-5 py-3.5 font-semibold w-1/3">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="text-center px-3 py-3.5 font-semibold text-xs" style={{ color: p.color === '#64748b' ? '#94a3b8' : p.color }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Sprint Board & Kanban', true, true, true, true],
                  ['Story Map', true, true, true, true],
                  ['Burndown & Velocity Charts', true, true, true, true],
                  ['Risk Register (5×5)', false, true, true, true],
                  ['Monte Carlo Forecasting', false, true, true, true],
                  ['Ceremony Board', false, true, true, true],
                  ['Work Hierarchy', false, true, true, true],
                  ['Decision Log', false, true, true, true],
                  ['Custom Dashboard', false, true, true, true],
                  ['AI Sprint Intelligence', false, false, true, true],
                  ['Advanced Audit Log', false, false, true, true],
                  ['Granular Permissions', false, false, true, true],
                  ['SSO / SAML', false, false, false, true],
                  ['On-premise Deployment', false, false, false, true],
                  ['SLA Guarantee', false, false, false, true],
                  ['Dedicated CSM', false, false, false, true],
                ].map(([feat, ...vals], i) => (
                  <tr key={String(feat)} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-5 py-2.5 text-slate-700 font-medium text-xs">{feat}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="px-3 py-2.5 text-center">
                        {v ? (
                          <CheckCircle2 size={15} className="mx-auto" style={{ color: PLANS[j].color }} />
                        ) : (
                          <XCircle size={15} className="mx-auto text-slate-200" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY / LINKS ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Join the Community</h2>
            <p className="text-slate-500">Follow, contribute, and shape what we build next.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {communityLinks.map(({ icon: Icon, label, sub, href, color }) => (
              <a
                key={label}
                href={href}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <div className="text-center">
                  <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 text-center text-sm py-8">
        ScrumBoard Pro · From $6/user/mo · Built for Scrum Masters · April 2026
      </footer>
    </div>
  );
}
