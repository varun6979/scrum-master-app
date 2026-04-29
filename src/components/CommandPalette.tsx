import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Columns2, ListTodo, Layers, Users,
  TrendingDown, MessageSquare, BarChart3, Flag, ShieldAlert,
  GitBranch, CalendarRange, BookMarked, Activity, TrendingUp,
  Sparkles, Upload, Plus, PlayCircle, CheckCircle2, AlertTriangle,
  ClipboardList, Keyboard, GitCompare,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords: string[];
}

// ─── Highlight matching text ───────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-100 text-brand-800 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── CommandPalette ────────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const {
    addStory, addSprint, addRisk, addMilestone,
    startSprint, completeSprint, sprints, activeSprintId, stories, epics,
  } = useScrumStore();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIdx(0);
  }, []);

  const activeSprint = sprints.find((sp) => sp.id === activeSprintId);
  const planningSprint = sprints.find((sp) => sp.status === 'planning');

  // Build commands
  const commands = useMemo<Command[]>(() => {
    const nav = (path: string) => () => { navigate(path); close(); };

    return [
      // Navigation
      { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to overview', icon: LayoutDashboard, action: nav('/'), category: 'Navigation', keywords: ['home', 'overview', 'dash'] },
      { id: 'nav-board', label: 'Sprint Board', description: 'Kanban board view', icon: Columns2, action: nav('/board'), category: 'Navigation', keywords: ['kanban', 'board', 'cards'] },
      { id: 'nav-backlog', label: 'Backlog', description: 'Manage product backlog', icon: ListTodo, action: nav('/backlog'), category: 'Navigation', keywords: ['stories', 'backlog', 'list'] },
      { id: 'nav-sprints', label: 'Sprints', description: 'Sprint management', icon: Layers, action: nav('/sprints'), category: 'Navigation', keywords: ['sprint', 'iterations'] },
      { id: 'nav-team', label: 'Team', description: 'Team members & capacity', icon: Users, action: nav('/team'), category: 'Navigation', keywords: ['members', 'people', 'capacity'] },
      { id: 'nav-burndown', label: 'Burndown', description: 'Sprint burndown chart', icon: TrendingDown, action: nav('/burndown'), category: 'Navigation', keywords: ['chart', 'burndown', 'progress'] },
      { id: 'nav-reports', label: 'Reports', description: 'Sprint reports & export', icon: BarChart3, action: nav('/reports'), category: 'Navigation', keywords: ['pdf', 'export', 'report'] },
      { id: 'nav-milestones', label: 'Milestones', description: 'Project milestones', icon: Flag, action: nav('/milestones'), category: 'Navigation', keywords: ['milestone', 'target', 'deadline'] },
      { id: 'nav-risks', label: 'Risk Register', description: 'Manage project risks', icon: ShieldAlert, action: nav('/risks'), category: 'Navigation', keywords: ['risk', 'issue', 'danger'] },
      { id: 'nav-deps', label: 'Dependencies', description: 'Story dependencies', icon: GitBranch, action: nav('/dependencies'), category: 'Navigation', keywords: ['depends', 'blocks', 'link'] },
      { id: 'nav-decisions', label: 'Decision Log', description: 'Architecture decisions', icon: BookMarked, action: nav('/decisions'), category: 'Navigation', keywords: ['adr', 'decision', 'log'] },
      { id: 'nav-timeline', label: 'Timeline', description: 'Project timeline view', icon: CalendarRange, action: nav('/timeline'), category: 'Navigation', keywords: ['gantt', 'timeline', 'calendar'] },
      { id: 'nav-standup', label: 'Daily Standup', description: 'Log standup entries', icon: MessageSquare, action: nav('/standup'), category: 'Navigation', keywords: ['standup', 'daily', 'scrum'] },
      { id: 'nav-metrics', label: 'Flow Metrics', description: 'Cycle time & throughput', icon: Activity, action: nav('/metrics'), category: 'Navigation', keywords: ['metrics', 'cycle', 'lead', 'flow'] },
      { id: 'nav-forecast', label: 'Forecast', description: 'Monte Carlo delivery forecast', icon: TrendingUp, action: nav('/forecast'), category: 'Navigation', keywords: ['forecast', 'prediction', 'estimate'] },
      { id: 'nav-ai', label: 'AI Assistant', description: 'Sprint intelligence & insights', icon: Sparkles, action: nav('/ai'), category: 'Navigation', keywords: ['ai', 'assistant', 'claude', 'intelligence'] },
      { id: 'nav-import', label: 'Import', description: 'Import stories from CSV', icon: Upload, action: nav('/import'), category: 'Navigation', keywords: ['import', 'csv', 'upload', 'jira'] },
      { id: 'nav-compare', label: 'Compare Stories', description: 'Side-by-side story comparison', icon: GitCompare, action: nav('/compare'), category: 'Navigation', keywords: ['compare', 'side by side', 'diff', 'stories'] },

      // Actions
      {
        id: 'action-story',
        label: 'Create Story',
        description: 'Add a new story to the backlog',
        icon: Plus,
        action: () => {
          addStory({ epicId: '', title: 'New Story', description: '', acceptanceCriteria: [], storyPoints: 3, priority: 'medium', status: 'backlog', labels: [], order: 0, tags: [], components: [], deployedTo: [], externalLinks: [], watchers: [], subtaskIds: [], definitionOfDone: [], qaStatus: 'not_started', stakeholderIds: [], successMetrics: [], blockerFlag: false, crossTeamDependency: false, attachments: [] });
          navigate('/backlog');
          close();
        },
        category: 'Actions',
        keywords: ['create', 'new', 'story', 'add'],
      },
      {
        id: 'action-sprint',
        label: 'Create Sprint',
        description: 'Add a new sprint in planning',
        icon: Plus,
        action: () => {
          const today = new Date().toISOString().split('T')[0];
          const end = new Date();
          end.setDate(end.getDate() + 14);
          const endStr = end.toISOString().split('T')[0];
          addSprint({ name: 'New Sprint', goal: '', status: 'planning', startDate: today, endDate: endStr });
          navigate('/sprints');
          close();
        },
        category: 'Actions',
        keywords: ['create', 'sprint', 'new', 'iteration'],
      },
      {
        id: 'action-risk',
        label: 'Add Risk',
        description: 'Register a new project risk',
        icon: AlertTriangle,
        action: () => { navigate('/risks'); close(); },
        category: 'Actions',
        keywords: ['risk', 'add', 'register', 'new'],
      },
      {
        id: 'action-milestone',
        label: 'Add Milestone',
        description: 'Create a project milestone',
        icon: Flag,
        action: () => { navigate('/milestones'); close(); },
        category: 'Actions',
        keywords: ['milestone', 'add', 'deadline', 'goal'],
      },
      {
        id: 'action-standup',
        label: 'Log Standup',
        description: 'Record today\'s standup entries',
        icon: ClipboardList,
        action: () => { navigate('/standup'); close(); },
        category: 'Actions',
        keywords: ['standup', 'log', 'daily', 'blockers'],
      },
      {
        id: 'action-start-sprint',
        label: 'Start Active Sprint',
        description: planningSprint ? `Start "${planningSprint.name}"` : 'No planning sprint available',
        icon: PlayCircle,
        action: () => {
          if (planningSprint) { startSprint(planningSprint.id); navigate('/board'); }
          close();
        },
        category: 'Actions',
        keywords: ['start', 'sprint', 'begin', 'activate'],
      },
      {
        id: 'action-complete-sprint',
        label: 'Complete Active Sprint',
        description: activeSprint ? `Complete "${activeSprint.name}"` : 'No active sprint',
        icon: CheckCircle2,
        action: () => {
          if (activeSprint) { completeSprint(activeSprint.id); navigate('/sprints'); }
          close();
        },
        category: 'Actions',
        keywords: ['complete', 'finish', 'end', 'sprint'],
      },
    ];
  }, [navigate, close, addStory, addSprint, addRisk, addMilestone, startSprint, completeSprint, activeSprint, planningSprint]);

  // Story search results (when query >= 3 chars)
  const storyResults = useMemo(() => {
    if (query.trim().length < 3) return [];
    const q = query.toLowerCase();
    return stories
      .filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(s => {
        const epic = epics.find(e => e.id === s.epicId);
        return {
          id: `story-${s.id}`,
          label: s.title,
          description: `${epic?.title ?? 'No epic'} · ${s.status.replace('_', ' ')} · ${s.storyPoints}pts`,
          icon: ListTodo,
          action: () => { navigate('/backlog'); close(); },
          category: 'Stories',
          keywords: [],
        } as Command;
      });
  }, [query, stories, epics, navigate, close]);

  // Filter commands by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      (cmd.description ?? '').toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // All results combined (story results first if searching)
  const allResults = useMemo(() => [...storyResults, ...filtered], [storyResults, filtered]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, Command[]> = {};
    allResults.forEach((cmd) => {
      if (!map[cmd.category]) map[cmd.category] = [];
      map[cmd.category].push(cmd);
    });
    return map;
  }, [allResults]);

  // Flat index for arrow navigation
  const flatList = useMemo(() => allResults, [allResults]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  // Reset selection when query changes
  useEffect(() => setSelectedIdx(0), [query]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatList[selectedIdx];
      if (cmd) cmd.action();
    }
  }

  if (!open) return null;

  // Build flat idx → command mapping
  const flatIndexMap: Record<string, number> = {};
  let counter = 0;
  Object.values(grouped).forEach((cmds) => {
    cmds.forEach((cmd) => {
      flatIndexMap[cmd.id] = counter++;
    });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, stories..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-96">
          {flatList.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              <Search size={24} className="mx-auto mb-2" />
              <p className="text-sm">No results for "{query}"</p>
              {query.length > 0 && query.length < 3 && <p className="text-xs mt-1">Type 3+ characters to search stories</p>}
            </div>
          )}
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                {category}
              </div>
              {cmds.map((cmd) => {
                const idx = flatIndexMap[cmd.id];
                const isSelected = idx === selectedIdx;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    data-idx={idx}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-brand-600' : 'bg-slate-100'
                    }`}>
                      <Icon size={15} className={isSelected ? 'text-white' : 'text-slate-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                        <HighlightMatch text={cmd.label} query={query} />
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-slate-500 truncate">{cmd.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200 flex-shrink-0">
                        ↵ to open
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400 bg-slate-50">
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ─── CommandPaletteHint — sidebar button ───────────────────────────────────────

export function CommandPaletteHint() {
  return (
    <button
      onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
    >
      <Keyboard size={13} />
      <span>Command palette</span>
      <kbd className="ml-auto bg-slate-700 border border-slate-600 text-slate-400 px-1.5 py-0.5 rounded text-xs">⌘K</kbd>
    </button>
  );
}
