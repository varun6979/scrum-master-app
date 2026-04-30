import { NavLink } from 'react-router-dom';
import {
  Zap, LayoutDashboard, Columns2, ListTodo, Layers, Users,
  TrendingDown, MessageSquare, BarChart3, Flag, ShieldAlert,
  GitBranch, CalendarRange, BookMarked, ChevronDown, ChevronRight,
  Trophy, RotateCcw, Heart, Activity, TrendingUp, Sparkles, Upload, GitCompare,
  Layers3, Clock, ScrollText, ShieldCheck, Map, Presentation, Search, LayoutGrid,
  Rocket, Globe, Power, Package, Gauge, Users2, X, Repeat,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useScrumStore, useActiveSprint } from '../../store/useScrumStore';
import { CommandPaletteHint } from '../CommandPalette';

const coreNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/board', label: 'Sprint Board', icon: Columns2 },
  { to: '/backlog', label: 'Backlog', icon: ListTodo },
  { to: '/sprints', label: 'Sprints', icon: Layers },
  { to: '/standup', label: 'Daily Standup', icon: MessageSquare },
  { to: '/workload', label: 'Team Workload', icon: Users2 },
  { to: '/vacation', label: 'Vacation Planner', icon: CalendarRange },
  { to: '/automation', label: 'Automation', icon: Repeat },
];

const planningNav = [
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/hierarchy', label: 'Work Hierarchy', icon: Layers3 },
  { to: '/story-map', label: 'Story Map', icon: Presentation },
  { to: '/ceremony', label: 'Ceremony Board', icon: Users },
  { to: '/timeline', label: 'Timeline', icon: CalendarRange },
  { to: '/releases', label: 'Releases', icon: Package },
  { to: '/milestones', label: 'Milestones', icon: Flag },
  { to: '/dependencies', label: 'Dependencies', icon: GitBranch },
  { to: '/decisions', label: 'Decision Log', icon: BookMarked },
  { to: '/compare', label: 'Compare Stories', icon: GitCompare },
  { to: '/import', label: 'Import', icon: Upload },
];

const insightsNav = [
  { to: '/velocity', label: 'Velocity', icon: Gauge },
  { to: '/burndown', label: 'Burndown', icon: TrendingDown },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/risks', label: 'Risk Register', icon: ShieldAlert },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/retrospective', label: 'Retrospective', icon: RotateCcw },
  { to: '/health', label: 'Health Score', icon: Heart },
  { to: '/metrics', label: 'Flow Metrics', icon: Activity },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
  { to: '/time-report', label: 'Time Reports', icon: Clock },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
  { to: '/permissions', label: 'Permissions', icon: ShieldCheck },
  { to: '/query', label: 'Query Builder', icon: Search },
  { to: '/custom-dashboard', label: 'Custom Dashboard', icon: LayoutGrid },
  { to: '/feature-flags', label: 'Feature Flags', icon: Power },
];

const launchNav = [
  { to: '/landing', label: 'Landing Page', icon: Globe },
  { to: '/launch-hub', label: 'Launch Hub', icon: Rocket },
  { to: '/market-comparison', label: 'Market Analysis', icon: Trophy },
];

function NavSection({ title, items, defaultOpen = true, onNavClick }: { title: string; items: typeof coreNav; defaultOpen?: boolean; onNavClick?: () => void }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-400"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavClick}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const activeSprint = useActiveSprint();
  const { settings, risks, milestones } = useScrumStore();

  const openRisks = risks.filter((r) => r.status === 'open').length;
  const atRiskMilestones = milestones.filter((m) => m.status === 'at_risk').length;

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen w-60 flex flex-col z-40 transition-transform duration-300',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ backgroundColor: '#1E293B' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">{settings.projectName}</p>
          <p className="text-slate-500 text-xs">Scrum Master</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 flex-shrink-0">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Active sprint badge */}
      {activeSprint && (
        <div className="px-4 pt-3 pb-1">
          <div className="bg-brand-600/20 border border-brand-600/30 rounded-lg px-3 py-2">
            <p className="text-brand-200 text-xs font-medium">Active Sprint</p>
            <p className="text-white text-xs truncate mt-0.5">{activeSprint.name}</p>
          </div>
        </div>
      )}

      {/* Alert badges */}
      {(openRisks > 0 || atRiskMilestones > 0) && (
        <div className="px-4 pt-2 flex gap-2">
          {openRisks > 0 && (
            <NavLink to="/risks" className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/30">
              <ShieldAlert size={10} />
              {openRisks} risks
            </NavLink>
          )}
          {atRiskMilestones > 0 && (
            <NavLink to="/milestones" className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/30">
              <Flag size={10} />
              {atRiskMilestones} at risk
            </NavLink>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-2">
        <NavSection title="Core" items={coreNav} defaultOpen={true} onNavClick={onClose} />
        <NavSection title="Planning" items={planningNav} defaultOpen={false} onNavClick={onClose} />
        <NavSection title="Insights" items={insightsNav} defaultOpen={false} onNavClick={onClose} />
        <NavSection title="🚀 Go-to-Market" items={launchNav} defaultOpen={false} onNavClick={onClose} />
      </nav>

      {/* Footer: command palette hint + version */}
      <div className="px-3 py-3 border-t border-slate-700 space-y-2">
        <CommandPaletteHint />
        <p className="text-slate-600 text-xs text-center">ScrumBoard Pro v1.0</p>
      </div>
    </aside>
  );
}
