import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  Flag, Plus, CheckCircle2, AlertTriangle, Clock, Zap, XCircle,
  ChevronDown, ChevronUp, Trash2, Edit2, X
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Milestone, MilestoneStatus } from '../types';
import { generateId } from '../lib/idgen';
import { getTodayISO } from '../lib/dateUtils';

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_started: { label: 'Not Started', color: 'text-slate-500', bg: 'bg-slate-100', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50', icon: Zap },
  at_risk: { label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  missed: { label: 'Missed', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

function MilestoneForm({ milestone, onSave, onCancel }: {
  milestone?: Milestone | null;
  onSave: (data: Omit<Milestone, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { epics, sprints, members } = useScrumStore();
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? '');
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? 'not_started');
  const [ownerId, setOwnerId] = useState(milestone?.ownerId ?? '');
  const [epicIds, setEpicIds] = useState<string[]>(milestone?.epicIds ?? []);
  const [sprintId, setSprintId] = useState(milestone?.sprintId ?? '');
  const [criteria, setCriteria] = useState<string[]>(milestone?.successCriteria ?? ['']);
  const [newCriterion, setNewCriterion] = useState('');

  const toggleEpic = (id: string) =>
    setEpicIds((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const addCriterion = () => {
    if (newCriterion.trim()) { setCriteria((c) => [...c, newCriterion.trim()]); setNewCriterion(''); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    onSave({
      title: title.trim(),
      description,
      dueDate,
      status,
      ownerId: ownerId || undefined,
      epicIds,
      sprintId: sprintId || undefined,
      successCriteria: criteria.filter(Boolean),
      completedAt: status === 'completed' ? (milestone?.completedAt ?? getTodayISO()) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
        <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Milestone title" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this milestone represent?" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Due Date *</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Owner</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">No owner</option>
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
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">Linked Epics</label>
        <div className="flex flex-wrap gap-2">
          {epics.map((epic) => (
            <button key={epic.id} type="button" onClick={() => toggleEpic(epic.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${epicIds.includes(epic.id) ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              style={epicIds.includes(epic.id) ? { backgroundColor: epic.color, borderColor: epic.color } : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: epic.color }} />
              {epic.title}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">Success Criteria</label>
        <div className="space-y-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="flex-1 border border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={c} onChange={(e) => setCriteria((prev) => prev.map((x, j) => j === i ? e.target.value : x))} placeholder={`Criterion ${i + 1}`} />
              <button type="button" onClick={() => setCriteria((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="flex-1 border border-dashed border-surface-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={newCriterion} onChange={(e) => setNewCriterion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCriterion(); } }} placeholder="Add criterion and press Enter" />
            <button type="button" onClick={addCriterion} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200">Add</button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Milestone</button>
      </div>
    </form>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const { members, epics, updateMilestone, deleteMilestone } = useScrumStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const cfg = STATUS_CONFIG[milestone.status];
  const Icon = cfg.icon;
  const owner = members.find((m) => m.id === milestone.ownerId);
  const linkedEpics = epics.filter((e) => milestone.epicIds.includes(e.id));
  const today = new Date();
  const due = parseISO(milestone.dueDate);
  const daysLeft = differenceInDays(due, today);
  const overdue = daysLeft < 0 && milestone.status !== 'completed';

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <MilestoneForm
          milestone={milestone}
          onSave={(data) => { updateMilestone(milestone.id, data); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const completedCount = milestone.successCriteria.filter((_, i) => milestone.status === 'completed' || i < Math.floor(milestone.successCriteria.length * (milestone.status === 'in_progress' ? 0.5 : 0))).length;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${overdue ? 'border-red-200' : 'border-surface-border'}`}>
      {/* Top color strip */}
      <div className="h-1" style={{ backgroundColor: milestone.status === 'completed' ? '#10B981' : milestone.status === 'at_risk' ? '#F59E0B' : milestone.status === 'missed' ? '#EF4444' : '#4F6EF7' }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon size={16} className={cfg.color} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm">{milestone.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{milestone.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => deleteMilestone(milestone.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
            <Icon size={11} />
            {cfg.label}
          </span>
          <span className={`text-xs font-medium ${overdue ? 'text-red-500' : daysLeft <= 5 ? 'text-amber-500' : 'text-slate-500'}`}>
            {milestone.status === 'completed'
              ? `Completed ${milestone.completedAt ? format(parseISO(milestone.completedAt), 'MMM d, yyyy') : ''}`
              : overdue
              ? `${Math.abs(daysLeft)}d overdue`
              : `Due ${format(due, 'MMM d, yyyy')} · ${daysLeft}d left`
            }
          </span>
          {owner && <span className="text-xs text-slate-500">Owner: <span className="font-medium text-slate-700">{owner.name}</span></span>}
        </div>

        {/* Epic chips */}
        {linkedEpics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {linkedEpics.map((epic) => (
              <span key={epic.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: epic.color }}>
                {epic.title}
              </span>
            ))}
          </div>
        )}

        {/* Success criteria preview */}
        {milestone.successCriteria.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Success Criteria ({milestone.status === 'completed' ? milestone.successCriteria.length : 0}/{milestone.successCriteria.length} met)
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1.5">
                {milestone.successCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={13} className={`mt-0.5 flex-shrink-0 ${milestone.status === 'completed' ? 'text-green-500' : 'text-slate-300'}`} />
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MilestonesPage() {
  const { milestones, addMilestone } = useScrumStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<MilestoneStatus | 'all'>('all');

  const filtered = filter === 'all' ? milestones : milestones.filter((m) => m.status === filter);
  const counts = {
    all: milestones.length,
    not_started: milestones.filter((m) => m.status === 'not_started').length,
    in_progress: milestones.filter((m) => m.status === 'in_progress').length,
    at_risk: milestones.filter((m) => m.status === 'at_risk').length,
    completed: milestones.filter((m) => m.status === 'completed').length,
    missed: milestones.filter((m) => m.status === 'missed').length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Flag size={20} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Milestones</h1>
            <p className="text-sm text-slate-500">Track key project milestones and deliverables</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          New Milestone
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          const count = counts[status as MilestoneStatus] ?? 0;
          return (
            <button
              key={status}
              onClick={() => setFilter(status === filter ? 'all' : status as MilestoneStatus)}
              className={`bg-white rounded-xl border p-3 text-left transition-all ${filter === status ? 'border-brand-500 ring-1 ring-brand-500' : 'border-surface-border hover:border-slate-300'}`}
            >
              <div className={`flex items-center gap-1.5 ${cfg.color} mb-1`}>
                <Icon size={13} />
                <span className="text-xs font-medium">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
            </button>
          );
        })}
      </div>

      {/* New milestone form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Milestone</h3>
          <MilestoneForm
            onSave={(data) => { addMilestone(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Milestone list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
            <Flag size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No milestones yet. Create your first milestone to track key deliverables.</p>
          </div>
        ) : (
          filtered.map((ms) => <MilestoneCard key={ms.id} milestone={ms} />)
        )}
      </div>
    </div>
  );
}
