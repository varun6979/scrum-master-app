import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Play, Download, Save, BookOpen, X, ChevronDown, Search,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Story, StoryStatus, Priority, StoryType, QAStatus } from '../types';
import { format } from 'date-fns';

// ─── Field definitions ────────────────────────────────────────────────────────

type FieldType = 'enum' | 'number' | 'boolean' | 'date' | 'text';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STORY_TYPE_OPTIONS = [
  { value: 'story', label: 'Story' },
  { value: 'bug', label: 'Bug' },
  { value: 'task', label: 'Task' },
  { value: 'spike', label: 'Spike' },
  { value: 'tech_debt', label: 'Tech Debt' },
];

const QA_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_qa', label: 'In QA' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
];

const FIELDS: FieldDef[] = [
  { key: 'status', label: 'Status', type: 'enum', options: STATUS_OPTIONS },
  { key: 'priority', label: 'Priority', type: 'enum', options: PRIORITY_OPTIONS },
  { key: 'assigneeId', label: 'Assignee', type: 'enum', options: [] },
  { key: 'sprintId', label: 'Sprint', type: 'enum', options: [] },
  { key: 'epicId', label: 'Epic', type: 'enum', options: [] },
  { key: 'storyType', label: 'Story Type', type: 'enum', options: STORY_TYPE_OPTIONS },
  { key: 'storyPoints', label: 'Story Points', type: 'number' },
  { key: 'tags', label: 'Tags', type: 'text' },
  { key: 'blockerFlag', label: 'Has Blocker', type: 'boolean' },
  { key: 'dueDate', label: 'Due Date', type: 'date' },
  { key: 'qaStatus', label: 'QA Status', type: 'enum', options: QA_STATUS_OPTIONS },
  { key: 'businessValue', label: 'Business Value', type: 'number' },
  { key: 'components', label: 'Components', type: 'text' },
];

const OPERATORS_BY_TYPE: Record<FieldType, { value: string; label: string }[]> = {
  enum: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'is_in', label: 'is in' },
    { value: 'is_not_in', label: 'is not in' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '!=' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  date: [
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is', label: 'is' },
  ],
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
  ],
};

// ─── Rule types ───────────────────────────────────────────────────────────────

interface QueryRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SavedQuery {
  id: string;
  name: string;
  rules: QueryRule[];
  logic: 'AND' | 'OR';
  savedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2);
}

function applyRule(story: Story, rule: QueryRule): boolean {
  const field = FIELDS.find((f) => f.key === rule.field);
  if (!field) return true;

  const raw = (story as unknown as Record<string, unknown>)[rule.field];

  if (field.type === 'boolean') {
    const val = Boolean(raw);
    return rule.operator === 'is_true' ? val : !val;
  }

  if (field.type === 'number') {
    const num = typeof raw === 'number' ? raw : 0;
    const cmp = parseFloat(rule.value);
    if (isNaN(cmp)) return true;
    switch (rule.operator) {
      case 'eq': return num === cmp;
      case 'neq': return num !== cmp;
      case 'gt': return num > cmp;
      case 'lt': return num < cmp;
      case 'gte': return num >= cmp;
      case 'lte': return num <= cmp;
      default: return true;
    }
  }

  if (field.type === 'date') {
    const dateStr = typeof raw === 'string' ? raw : '';
    if (!dateStr || !rule.value) return true;
    const d = dateStr.slice(0, 10);
    const v = rule.value.slice(0, 10);
    switch (rule.operator) {
      case 'before': return d < v;
      case 'after': return d > v;
      case 'is': return d === v;
      default: return true;
    }
  }

  if (field.type === 'text') {
    const arrVal = Array.isArray(raw) ? (raw as string[]).join(' ') : String(raw ?? '');
    const lower = arrVal.toLowerCase();
    const q = rule.value.toLowerCase();
    return rule.operator === 'contains' ? lower.includes(q) : !lower.includes(q);
  }

  // enum
  const strVal = String(raw ?? '');
  if (rule.operator === 'is') return strVal === rule.value;
  if (rule.operator === 'is_not') return strVal !== rule.value;
  if (rule.operator === 'is_in') return rule.value.split(',').map((v) => v.trim()).includes(strVal);
  if (rule.operator === 'is_not_in') return !rule.value.split(',').map((v) => v.trim()).includes(strVal);
  return true;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StoryStatus, string> = {
  backlog: 'bg-slate-100 text-slate-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  review: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }: { status: StoryStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QueryPage() {
  const { stories, members, sprints, epics } = useScrumStore();

  const [rules, setRules] = useState<QueryRule[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<Story[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Build dynamic options for assignee/sprint/epic
  const dynamicFields = useMemo<FieldDef[]>(() => {
    return FIELDS.map((f) => {
      if (f.key === 'assigneeId') {
        return { ...f, options: members.map((m) => ({ value: m.id, label: m.name })) };
      }
      if (f.key === 'sprintId') {
        return { ...f, options: sprints.map((s) => ({ value: s.id, label: s.name })) };
      }
      if (f.key === 'epicId') {
        return { ...f, options: epics.map((e) => ({ value: e.id, label: e.title })) };
      }
      return f;
    });
  }, [members, sprints, epics]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: genId(), field: 'status', operator: 'is', value: '' },
    ]);
  };

  const updateRule = (id: string, patch: Partial<QueryRule>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        // reset operator when field changes
        if (patch.field && patch.field !== r.field) {
          const fieldDef = dynamicFields.find((f) => f.key === patch.field);
          const ops = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type] : [];
          updated.operator = ops[0]?.value ?? '';
          updated.value = '';
        }
        return updated;
      })
    );
  };

  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));

  const runQuery = useCallback(() => {
    if (rules.length === 0) {
      setResults(stories);
      setHasRun(true);
      return;
    }
    const filtered = stories.filter((story) => {
      const matches = rules.map((r) => applyRule(story, r));
      return logic === 'AND' ? matches.every(Boolean) : matches.some(Boolean);
    });
    setResults(filtered);
    setHasRun(true);
  }, [stories, rules, logic]);

  const exportCSV = () => {
    const headers = ['Title', 'Status', 'Priority', 'Assignee', 'Sprint', 'Story Points', 'Epic', 'Due Date'];
    const rows = results.map((s) => {
      const assignee = members.find((m) => m.id === s.assigneeId)?.name ?? '';
      const sprint = sprints.find((sp) => sp.id === s.sprintId)?.name ?? '';
      const epic = epics.find((e) => e.id === s.epicId)?.title ?? '';
      return [s.title, s.status, s.priority, assignee, sprint, s.storyPoints, epic, s.dueDate ?? ''];
    });
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveQuery = () => {
    if (!saveName.trim()) return;
    const newQuery: SavedQuery = {
      id: genId(),
      name: saveName.trim(),
      rules,
      logic,
      savedAt: new Date().toISOString(),
    };
    setSavedQueries((prev) => [newQuery, ...prev].slice(0, 10));
    setSaveModalOpen(false);
    setSaveName('');
  };

  const loadQuery = (q: SavedQuery) => {
    setRules(q.rules);
    setLogic(q.logic);
    setHasRun(false);
  };

  const deleteSavedQuery = (id: string) => {
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <BookOpen size={16} className="text-indigo-500" />
          Saved Queries
        </div>
        {savedQueries.length === 0 ? (
          <p className="text-xs text-slate-400 text-center mt-4">No saved queries yet.</p>
        ) : (
          <ul className="space-y-1">
            {savedQueries.map((q) => (
              <li
                key={q.id}
                className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50 cursor-pointer"
                onClick={() => loadQuery(q)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{q.name}</p>
                  <p className="text-xs text-slate-400">{q.rules.length} rule{q.rules.length !== 1 ? 's' : ''} · {q.logic}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSavedQuery(q.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 ml-1 transition-opacity"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-slate-800">Query Builder</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build JQL-style filters to find stories across your backlog and sprints.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Filter builder card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            {/* Logic toggle + add rule */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Combine rules with:</span>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  {(['AND', 'OR'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLogic(l)}
                      className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                        logic === l
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addRule}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Plus size={15} />
                Add Filter
              </button>
            </div>

            {/* Rules list */}
            <div className="px-6 py-4 space-y-3">
              {rules.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                  <Search size={36} className="opacity-30" />
                  <p className="text-sm">No filters added yet. Click <strong>Add Filter</strong> to get started.</p>
                </div>
              ) : (
                rules.map((rule, idx) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    index={idx}
                    fields={dynamicFields}
                    logic={logic}
                    onChange={(patch) => updateRule(rule.id, patch)}
                    onRemove={() => removeRule(rule.id)}
                  />
                ))
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={runQuery}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Play size={14} />
                Run Query
              </button>
              {hasRun && (
                <>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setSaveModalOpen(true)}
                    className="flex items-center gap-2 border border-indigo-300 hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Save size={14} />
                    Save Query
                  </button>
                </>
              )}
              {hasRun && (
                <span className="ml-auto text-sm text-slate-500 font-medium">
                  {results.length} {results.length === 1 ? 'story' : 'stories'} match
                </span>
              )}
            </div>
          </div>

          {/* Results table */}
          {hasRun && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">Results</h2>
                <span className="text-xs text-slate-400">{results.length} stories</span>
              </div>
              {results.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No stories match your filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        {['Title', 'Status', 'Priority', 'Assignee', 'Sprint', 'Points', 'Epic', 'Due Date'].map((col) => (
                          <th key={col} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.map((story) => {
                        const assignee = members.find((m) => m.id === story.assigneeId);
                        const sprint = sprints.find((s) => s.id === story.sprintId);
                        const epic = epics.find((e) => e.id === story.epicId);
                        return (
                          <tr key={story.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{story.title}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={story.status} /></td>
                            <td className="px-4 py-3 whitespace-nowrap"><PriorityBadge priority={story.priority} /></td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {assignee ? (
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
                                    style={{ backgroundColor: assignee.avatarColor }}
                                  >
                                    {assignee.avatarInitials}
                                  </span>
                                  {assignee.name}
                                </span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{sprint?.name ?? <span className="text-slate-400">—</span>}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                {story.storyPoints}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {epic ? (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: epic.color }}
                                >
                                  {epic.title}
                                </span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {story.dueDate ? format(new Date(story.dueDate), 'MMM d, yyyy') : <span className="text-slate-400">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save query modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 space-y-4">
            <h3 className="font-semibold text-slate-800 text-lg">Save Query</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Query name..."
              autoFocus
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && saveQuery()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuery}
                disabled={!saveName.trim()}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rule row component ───────────────────────────────────────────────────────

interface RuleRowProps {
  rule: QueryRule;
  index: number;
  fields: FieldDef[];
  logic: 'AND' | 'OR';
  onChange: (patch: Partial<QueryRule>) => void;
  onRemove: () => void;
}

function RuleRow({ rule, index, fields, logic, onChange, onRemove }: RuleRowProps) {
  const fieldDef = fields.find((f) => f.key === rule.field);
  const operators = fieldDef ? OPERATORS_BY_TYPE[fieldDef.type] : [];

  const renderValueInput = () => {
    if (!fieldDef) return null;

    if (fieldDef.type === 'boolean') {
      return null; // operator is the value
    }

    if (fieldDef.type === 'date') {
      return (
        <input
          type="date"
          value={rule.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    if (fieldDef.type === 'number') {
      return (
        <input
          type="number"
          value={rule.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Value..."
          className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    if (fieldDef.type === 'text') {
      return (
        <input
          type="text"
          value={rule.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Value..."
          className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    // enum — single select for is/is_not, text input for is_in/is_not_in
    if (rule.operator === 'is_in' || rule.operator === 'is_not_in') {
      return (
        <input
          type="text"
          value={rule.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Comma-separated values..."
          className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      );
    }

    return (
      <div className="relative flex-1 min-w-0">
        <select
          value={rule.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
        >
          <option value="">Select...</option>
          {fieldDef.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      {/* Logic indicator */}
      <div className="w-10 flex-shrink-0 text-center">
        {index === 0 ? (
          <span className="text-xs font-semibold text-slate-400 uppercase">Where</span>
        ) : (
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${logic === 'AND' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
            {logic}
          </span>
        )}
      </div>

      {/* Field selector */}
      <div className="relative w-44 flex-shrink-0">
        <select
          value={rule.field}
          onChange={(e) => onChange({ field: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
        >
          {fields.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Operator selector */}
      <div className="relative w-36 flex-shrink-0">
        <select
          value={rule.operator}
          onChange={(e) => onChange({ operator: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white pr-8"
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {/* Value input */}
      <div className="flex-1 flex">
        {renderValueInput()}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
