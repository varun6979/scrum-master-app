import { useState } from 'react';
import {
  Repeat, Plus, Trash2, Edit2, X, Play, Pause, CheckCircle2,
  ChevronRight, Zap, Bell, GitBranch, Users, Flag, Clock,
  ToggleLeft, ToggleRight, Info, Search, Filter,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { generateId } from '../lib/idgen';

// ─── Types ───────────────────────────────────────────────────────────────────

type TriggerType =
  | 'story_status_changed'
  | 'story_created'
  | 'story_assigned'
  | 'sprint_started'
  | 'sprint_completed'
  | 'story_points_changed'
  | 'blocker_added'
  | 'due_date_approaching';

type ActionType =
  | 'assign_to_member'
  | 'change_status'
  | 'set_priority'
  | 'add_label'
  | 'move_to_sprint'
  | 'send_notification'
  | 'set_story_points';

interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than';
  value: string;
}

interface AutomationAction {
  type: ActionType;
  value: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: TriggerType;
  triggerValue?: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  runCount: number;
  lastRun?: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  story_status_changed: 'Story status is changed',
  story_created: 'Story is created',
  story_assigned: 'Story is assigned',
  sprint_started: 'Sprint is started',
  sprint_completed: 'Sprint is completed',
  story_points_changed: 'Story points are changed',
  blocker_added: 'Blocker is added',
  due_date_approaching: 'Due date is approaching (3 days)',
};

const TRIGGER_ICONS: Record<TriggerType, typeof Zap> = {
  story_status_changed: GitBranch,
  story_created: Plus,
  story_assigned: Users,
  sprint_started: Play,
  sprint_completed: CheckCircle2,
  story_points_changed: Flag,
  blocker_added: X,
  due_date_approaching: Clock,
};

const ACTION_LABELS: Record<ActionType, string> = {
  assign_to_member: 'Assign to member',
  change_status: 'Change status to',
  set_priority: 'Set priority to',
  add_label: 'Add label',
  move_to_sprint: 'Move to sprint',
  send_notification: 'Send notification',
  set_story_points: 'Set story points to',
};

const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const TEMPLATES: Omit<AutomationRule, 'id' | 'runCount' | 'createdAt'>[] = [
  {
    name: 'Auto-assign to SM when blocked',
    description: 'When a story is marked as blocked, automatically assign it to the Scrum Master for resolution.',
    trigger: 'story_status_changed',
    triggerValue: 'blocked',
    conditions: [],
    actions: [{ type: 'send_notification', value: 'Story is blocked and needs attention' }],
    enabled: true,
    lastRun: undefined,
  },
  {
    name: 'Move to In Progress on assignment',
    description: 'When a story is assigned to someone and is in "Todo", automatically move it to In Progress.',
    trigger: 'story_assigned',
    triggerValue: '',
    conditions: [{ field: 'status', operator: 'equals', value: 'todo' }],
    actions: [{ type: 'change_status', value: 'in_progress' }],
    enabled: true,
    lastRun: undefined,
  },
  {
    name: 'Flag critical priority when due date approaching',
    description: 'Escalate priority to Critical when a story\'s due date is within 3 days and it\'s not done.',
    trigger: 'due_date_approaching',
    triggerValue: '',
    conditions: [{ field: 'status', operator: 'not_equals', value: 'done' }],
    actions: [{ type: 'set_priority', value: 'critical' }, { type: 'send_notification', value: 'Story due soon — escalated to Critical' }],
    enabled: true,
    lastRun: undefined,
  },
  {
    name: 'Set story to Review when sprint ends',
    description: 'When a sprint completes, move all In Progress stories to Review for PO sign-off.',
    trigger: 'sprint_completed',
    triggerValue: '',
    conditions: [{ field: 'status', operator: 'equals', value: 'in_progress' }],
    actions: [{ type: 'change_status', value: 'review' }],
    enabled: false,
    lastRun: undefined,
  },
  {
    name: 'Add "Needs Estimate" label to new stories',
    description: 'When any story is created with 0 story points, tag it for estimation.',
    trigger: 'story_created',
    triggerValue: '',
    conditions: [{ field: 'storyPoints', operator: 'equals', value: '0' }],
    actions: [{ type: 'add_label', value: 'needs-estimate' }],
    enabled: true,
    lastRun: undefined,
  },
  {
    name: 'Notify team when sprint starts',
    description: 'Send a team notification with the sprint goal when a new sprint begins.',
    trigger: 'sprint_started',
    triggerValue: '',
    conditions: [],
    actions: [{ type: 'send_notification', value: 'New sprint started — check your assigned stories' }],
    enabled: true,
    lastRun: undefined,
  },
];

// ─── Rule Form ───────────────────────────────────────────────────────────────

function RuleForm({ rule, onSave, onCancel }: {
  rule?: AutomationRule | null;
  onSave: (r: Omit<AutomationRule, 'id' | 'runCount' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { members } = useScrumStore();
  const [name, setName] = useState(rule?.name ?? '');
  const [description, setDescription] = useState(rule?.description ?? '');
  const [trigger, setTrigger] = useState<TriggerType>(rule?.trigger ?? 'story_status_changed');
  const [triggerValue, setTriggerValue] = useState(rule?.triggerValue ?? '');
  const [conditions, setConditions] = useState<AutomationCondition[]>(rule?.conditions ?? []);
  const [actions, setActions] = useState<AutomationAction[]>(rule?.actions ?? [{ type: 'change_status', value: 'in_progress' }]);

  const addCondition = () => setConditions([...conditions, { field: 'status', operator: 'equals', value: 'todo' }]);
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, updates: Partial<AutomationCondition>) =>
    setConditions(conditions.map((c, idx) => idx === i ? { ...c, ...updates } : c));

  const addAction = () => setActions([...actions, { type: 'change_status', value: 'in_progress' }]);
  const removeAction = (i: number) => setActions(actions.filter((_, idx) => idx !== i));
  const updateAction = (i: number, updates: Partial<AutomationAction>) =>
    setActions(actions.map((a, idx) => idx === i ? { ...a, ...updates } : a));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || actions.length === 0) return;
    onSave({ name, description, trigger, triggerValue, conditions, actions, enabled: rule?.enabled ?? true, lastRun: rule?.lastRun });
  };

  const selectClass = "w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rule Name *</label>
          <input className={selectClass} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Auto-assign when blocked" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <input className={selectClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule do?" />
        </div>
      </div>

      {/* TRIGGER */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1.5"><Zap size={12} /> WHEN THIS HAPPENS (Trigger)</p>
        <select className={selectClass} value={trigger} onChange={(e) => setTrigger(e.target.value as TriggerType)}>
          {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {trigger === 'story_status_changed' && (
          <div className="mt-2">
            <label className="text-xs text-slate-500">To status:</label>
            <select className={`${selectClass} mt-1`} value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)}>
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* CONDITIONS */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><Filter size={12} /> IF THESE CONDITIONS ARE MET (optional)</p>
          <button type="button" onClick={addCondition} className="text-xs text-amber-600 hover:text-amber-800 font-medium">+ Add condition</button>
        </div>
        {conditions.length === 0 && <p className="text-xs text-amber-600 italic">No conditions — rule will run for every trigger</p>}
        {conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <select className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={c.field} onChange={(e) => updateCondition(i, { field: e.target.value })}>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="storyPoints">Story Points</option>
              <option value="assigneeId">Assignee</option>
            </select>
            <select className="border border-surface-border rounded px-2 py-1.5 text-xs" value={c.operator} onChange={(e) => updateCondition(i, { operator: e.target.value as AutomationCondition['operator'] })}>
              <option value="equals">equals</option>
              <option value="not_equals">not equals</option>
              <option value="contains">contains</option>
              <option value="greater_than">greater than</option>
            </select>
            <input className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={c.value} onChange={(e) => updateCondition(i, { value: e.target.value })} placeholder="value" />
            <button type="button" onClick={() => removeCondition(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-green-700 flex items-center gap-1.5"><Play size={12} /> THEN DO THIS (Actions)</p>
          <button type="button" onClick={addAction} className="text-xs text-green-600 hover:text-green-800 font-medium">+ Add action</button>
        </div>
        {actions.map((a, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <select className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={a.type} onChange={(e) => updateAction(i, { type: e.target.value as ActionType, value: '' })}>
              {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {(a.type === 'change_status') && (
              <select className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={a.value} onChange={(e) => updateAction(i, { value: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            )}
            {a.type === 'set_priority' && (
              <select className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={a.value} onChange={(e) => updateAction(i, { value: e.target.value })}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {a.type === 'assign_to_member' && (
              <select className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={a.value} onChange={(e) => updateAction(i, { value: e.target.value })}>
                <option value="">Select member</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {(a.type === 'add_label' || a.type === 'send_notification' || a.type === 'set_story_points' || a.type === 'move_to_sprint') && (
              <input className="border border-surface-border rounded px-2 py-1.5 text-xs flex-1" value={a.value} onChange={(e) => updateAction(i, { value: e.target.value })} placeholder={a.type === 'send_notification' ? 'Notification message' : 'Value'} />
            )}
            <button type="button" onClick={() => removeAction(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
          </div>
        ))}
        {actions.length === 0 && <p className="text-xs text-red-500 italic">At least one action required</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Rule</button>
      </div>
    </form>
  );
}

// ─── Rule Card ───────────────────────────────────────────────────────────────

function RuleCard({ rule, onToggle, onEdit, onDelete, onRun }: {
  rule: AutomationRule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRun: () => void;
}) {
  const TriggerIcon = TRIGGER_ICONS[rule.trigger];

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${rule.enabled ? 'border-surface-border' : 'border-slate-200 opacity-60'}`}>
      <div className={`h-1 ${rule.enabled ? 'bg-brand-500' : 'bg-slate-300'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${rule.enabled ? 'bg-brand-50' : 'bg-slate-100'}`}>
              <TriggerIcon size={16} className={rule.enabled ? 'text-brand-500' : 'text-slate-400'} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{rule.name}</h3>
              {rule.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{rule.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onRun} title="Run now" className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Play size={13} /></button>
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
            <button onClick={onToggle} className="ml-1">
              {rule.enabled
                ? <ToggleRight size={22} className="text-brand-500" />
                : <ToggleLeft size={22} className="text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Rule summary */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
            <Zap size={10} /> When: {TRIGGER_LABELS[rule.trigger]}{rule.triggerValue ? ` → ${rule.triggerValue}` : ''}
          </span>
          {rule.conditions.length > 0 && (
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-medium">
              {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
            </span>
          )}
          {rule.actions.map((a, i) => (
            <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
              <ChevronRight size={10} /> {ACTION_LABELS[a.type]}{a.value ? ` "${a.value}"` : ''}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Play size={10} /> {rule.runCount} runs</span>
          {rule.lastRun && <span className="flex items-center gap-1"><Clock size={10} /> Last: {rule.lastRun}</span>}
          <span className={`ml-auto font-semibold ${rule.enabled ? 'text-green-500' : 'text-slate-400'}`}>
            {rule.enabled ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AutomationPage() {
  const today = new Date().toISOString().split('T')[0];

  const [rules, setRules] = useState<AutomationRule[]>(() =>
    TEMPLATES.slice(0, 3).map((t) => ({
      ...t,
      id: generateId(),
      runCount: Math.floor(Math.random() * 40),
      lastRun: today,
      createdAt: today,
    }))
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const editingRule = editingId ? rules.find((r) => r.id === editingId) : null;

  const filteredRules = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  const addRule = (data: Omit<AutomationRule, 'id' | 'runCount' | 'createdAt'>) => {
    setRules([...rules, { ...data, id: generateId(), runCount: 0, createdAt: today }]);
    setShowForm(false);
    setEditingId(null);
  };

  const updateRule = (id: string, data: Omit<AutomationRule, 'id' | 'runCount' | 'createdAt'>) => {
    setRules(rules.map((r) => r.id === id ? { ...r, ...data } : r));
    setEditingId(null);
  };

  const toggleRule = (id: string) => setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: string) => { if (window.confirm('Delete this rule?')) setRules(rules.filter((r) => r.id !== id)); };

  const runNow = (id: string) => {
    setRunningId(id);
    setTimeout(() => {
      setRules(rules.map((r) => r.id === id ? { ...r, runCount: r.runCount + 1, lastRun: today } : r));
      setRunningId(null);
    }, 1200);
  };

  const addFromTemplate = (template: Omit<AutomationRule, 'id' | 'runCount' | 'createdAt'>) => {
    setRules([...rules, { ...template, id: generateId(), runCount: 0, createdAt: today }]);
    setShowTemplates(false);
  };

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalRuns = rules.reduce((s, r) => s + r.runCount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <Repeat size={20} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Automation Rules</h1>
            <p className="text-sm text-slate-500">{activeCount} active · {rules.length} total · {totalRuns} total runs</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Zap size={15} /> Templates
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            <Plus size={16} /> New Rule
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
        <Info size={15} className="text-purple-500 mt-0.5 shrink-0" />
        <p className="text-xs text-purple-700">
          Automation rules run automatically when their trigger conditions are met. Use them to eliminate manual status updates, auto-assign stories, and keep your team notified without lifting a finger.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Create / Edit form */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Zap size={14} className="text-brand-500" />
              {editingId ? 'Edit Rule' : 'Create Rule'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <RuleForm
            rule={editingRule}
            onSave={(data) => {
              if (editingId) updateRule(editingId, data);
              else addRule(data);
            }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        </div>
      )}

      {/* Templates modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-border">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-brand-500" /> Rule Templates</h3>
              <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {TEMPLATES.map((t, i) => {
                const alreadyAdded = rules.some((r) => r.name === t.name);
                return (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">When: {TRIGGER_LABELS[t.trigger]}</span>
                        {t.actions.map((a, j) => (
                          <span key={j} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">→ {ACTION_LABELS[a.type]}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => !alreadyAdded && addFromTemplate(t)}
                      disabled={alreadyAdded}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${alreadyAdded ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
                    >
                      {alreadyAdded ? 'Added' : 'Use'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rules list */}
      {filteredRules.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Repeat size={36} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">{rules.length === 0 ? 'No automation rules yet' : 'No rules match your search'}</p>
          {rules.length === 0 && (
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={() => setShowTemplates(true)} className="text-sm text-brand-500 hover:underline">Browse templates</button>
              <span className="text-slate-300">·</span>
              <button onClick={() => setShowForm(true)} className="text-sm text-brand-500 hover:underline">Create from scratch</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <div key={rule.id} className={runningId === rule.id ? 'opacity-60 pointer-events-none' : ''}>
              <RuleCard
                rule={rule}
                onToggle={() => toggleRule(rule.id)}
                onEdit={() => { setEditingId(rule.id); setShowForm(false); }}
                onDelete={() => deleteRule(rule.id)}
                onRun={() => runNow(rule.id)}
              />
              {runningId === rule.id && (
                <div className="text-xs text-center text-brand-500 mt-1 animate-pulse">Running rule…</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {rules.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Active Rules', value: activeCount, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Runs', value: totalRuns, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Time Saved (est.)', value: `${totalRuns * 3}m`, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
