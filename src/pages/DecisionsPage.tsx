import { useState } from 'react';
import { BookMarked, Plus, Trash2, Edit2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Decision } from '../types';
import { formatDate } from '../lib/dateUtils';
import { getTodayISO } from '../lib/dateUtils';

function DecisionForm({ decision, onSave, onCancel }: {
  decision?: Decision | null;
  onSave: (data: Omit<Decision, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { members, stories, sprints } = useScrumStore();
  const [title, setTitle] = useState(decision?.title ?? '');
  const [context, setContext] = useState(decision?.context ?? '');
  const [dec, setDec] = useState(decision?.decision ?? '');
  const [alternatives, setAlternatives] = useState<string[]>(decision?.alternatives ?? ['']);
  const [rationale, setRationale] = useState(decision?.rationale ?? '');
  const [consequences, setConsequences] = useState(decision?.consequences ?? '');
  const [ownerId, setOwnerId] = useState(decision?.ownerId ?? '');
  const [sprintId, setSprintId] = useState(decision?.sprintId ?? '');
  const [storyIds, setStoryIds] = useState<string[]>(decision?.storyIds ?? []);
  const [date, setDate] = useState(decision?.date ?? getTodayISO());
  const [newAlt, setNewAlt] = useState('');

  const addAlt = () => { if (newAlt.trim()) { setAlternatives((a) => [...a, newAlt.trim()]); setNewAlt(''); } };
  const toggleStory = (id: string) => setStoryIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, context, decision: dec, alternatives: alternatives.filter(Boolean), rationale, consequences, ownerId: ownerId || undefined, storyIds, sprintId: sprintId || undefined, date });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Decision Title *</label>
        <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What was decided?" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Context — Why was this decision needed?</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Background and problem statement..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Decision — What was decided?</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={dec} onChange={(e) => setDec(e.target.value)} placeholder="The specific decision made..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">Alternatives Considered</label>
        <div className="space-y-2">
          {alternatives.map((alt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="flex-1 border border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={alt} onChange={(e) => setAlternatives((prev) => prev.map((a, j) => j === i ? e.target.value : a))} placeholder={`Alternative ${i + 1}`} />
              <button type="button" onClick={() => setAlternatives((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="flex-1 border border-dashed border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={newAlt} onChange={(e) => setNewAlt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAlt(); } }} placeholder="Add alternative and press Enter" />
            <button type="button" onClick={addAlt} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200">Add</button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Rationale — Why this option?</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Why was this the best option?" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Consequences & Trade-offs</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={consequences} onChange={(e) => setConsequences(e.target.value)} placeholder="Expected outcomes, trade-offs, risks accepted..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Decision Maker</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Sprint</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
            <option value="">No sprint</option>
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      {stories.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Related Stories</label>
          <div className="max-h-32 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border">
            {stories.slice(0, 25).map((s) => (
              <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={storyIds.includes(s.id)} onChange={() => toggleStory(s.id)} className="rounded" />
                <span className="text-xs text-slate-700 truncate">{s.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Decision</button>
      </div>
    </form>
  );
}

function DecisionCard({ decision }: { decision: Decision }) {
  const { members, stories, sprints, updateDecision, deleteDecision } = useScrumStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const owner = members.find((m) => m.id === decision.ownerId);
  const sprint = sprints.find((s) => s.id === decision.sprintId);
  const relatedStories = stories.filter((s) => decision.storyIds.includes(s.id));

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <DecisionForm
          decision={decision}
          onSave={(data) => { updateDecision(decision.id, data); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
      <div className="h-0.5 bg-gradient-to-r from-brand-500 to-purple-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-slate-800 text-sm">{decision.title}</h3>
              {sprint && <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">{sprint.name}</span>}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatDate(decision.date)}</span>
              {owner && <><span>·</span><span>by <span className="font-medium text-slate-700">{owner.name}</span></span></>}
              {relatedStories.length > 0 && <><span>·</span><span>{relatedStories.length} related stories</span></>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => deleteDecision(decision.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Decision summary */}
        {decision.decision && (
          <div className="mt-3 p-3 bg-brand-50 rounded-lg border-l-2 border-brand-500">
            <p className="text-xs font-semibold text-brand-700 mb-1">Decision</p>
            <p className="text-xs text-brand-800">{decision.decision}</p>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 mt-3 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide' : 'Show'} full context & rationale
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {decision.context && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Context</p>
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">{decision.context}</p>
              </div>
            )}
            {decision.alternatives.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Alternatives Considered</p>
                <ul className="space-y-1">
                  {decision.alternatives.map((alt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-center text-xs flex-shrink-0 flex items-center justify-center mt-0.5">{i + 1}</span>
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {decision.rationale && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Rationale</p>
                <p className="text-xs text-slate-600 bg-green-50 rounded-lg p-3">{decision.rationale}</p>
              </div>
            )}
            {decision.consequences && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Consequences & Trade-offs</p>
                <p className="text-xs text-slate-600 bg-amber-50 rounded-lg p-3">{decision.consequences}</p>
              </div>
            )}
            {relatedStories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Related Stories</p>
                <div className="flex flex-wrap gap-1.5">
                  {relatedStories.map((s) => (
                    <span key={s.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-48">{s.title}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DecisionsPage() {
  const { decisions, addDecision, sprints } = useScrumStore();
  const [showForm, setShowForm] = useState(false);
  const [sprintFilter, setSprintFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = decisions
    .filter((d) => sprintFilter === 'all' || d.sprintId === sprintFilter)
    .filter((d) => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.decision.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookMarked size={20} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Decision Log</h1>
            <p className="text-sm text-slate-500">Record architectural and product decisions with full context</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          Log Decision
        </button>
      </div>

      {/* Why decision logs matter */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
        <p className="text-xs text-purple-700">
          <span className="font-semibold">Why this matters:</span> Decision logs capture the "why" behind choices — something Jira doesn't track. When team members leave, new joiners can understand past decisions without lengthy onboarding. This prevents re-litigating settled debates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <p className="text-xs text-slate-400 font-medium">Total Decisions</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{decisions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <p className="text-xs text-slate-400 font-medium">This Sprint</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{decisions.filter((d) => d.sprintId === sprints.find((s) => s.status === 'active')?.id).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-border p-4">
          <p className="text-xs text-slate-400 font-medium">With Alternatives</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{decisions.filter((d) => d.alternatives.length > 0).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Search decisions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
        >
          <option value="all">All sprints</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* New decision form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Log a Decision</h3>
          <DecisionForm onSave={(data) => { addDecision(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Decision list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
            <BookMarked size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No decisions logged yet. Start capturing your team's decisions for future reference.</p>
          </div>
        ) : (
          filtered.map((d) => <DecisionCard key={d.id} decision={d} />)
        )}
      </div>
    </div>
  );
}
