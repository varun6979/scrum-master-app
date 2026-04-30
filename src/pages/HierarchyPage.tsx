import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, X, Check,
  Layers3, BookOpen, FileText, GitBranch, Flag, ExternalLink,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Initiative, Epic, Feature, Story, Priority, InitiativeStatus, TeamMember } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIATIVE_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  active: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  backlog: 'bg-slate-100 text-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', active: 'Active', in_progress: 'In Progress',
  completed: 'Completed', done: 'Done', cancelled: 'Cancelled', backlog: 'Backlog',
};

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-amber-400', low: 'bg-blue-400',
};

const STORY_STATUS_COLORS: Record<string, string> = {
  backlog: 'text-slate-400', todo: 'text-blue-500', in_progress: 'text-purple-600',
  review: 'text-amber-500', blocked: 'text-red-500', done: 'text-green-600',
};

// ─── Inline Edit Input ────────────────────────────────────────────────────────

function InlineEdit({ value, onSave, onCancel, className }: {
  value: string; onSave: (v: string) => void; onCancel: () => void; className?: string;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-1.5">
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(v); if (e.key === 'Escape') onCancel(); }}
        className={`border border-brand-300 rounded px-2 py-0.5 text-sm outline-none focus:ring-2 focus:ring-brand-300 ${className ?? ''}`} />
      <button onClick={() => onSave(v)} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
      <button onClick={onCancel} className="text-slate-400 hover:text-red-500"><X size={13} /></button>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

// ─── Story Row ────────────────────────────────────────────────────────────────

function StoryRow({ story, members, depth = 4 }: { story: Story; members: TeamMember[]; depth?: number }) {
  const assignee = members.find((m) => m.id === story.assigneeId);
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 hover:bg-slate-50 rounded-lg group" style={{ paddingLeft: `${depth * 16}px` }}>
      <FileText size={12} className={`flex-shrink-0 ${STORY_STATUS_COLORS[story.status]}`} />
      <span className="text-sm text-slate-700 flex-1 truncate">{story.title}</span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {story.priority && <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[story.priority]}`} title={story.priority} />}
        <span className="text-xs text-slate-400">{story.storyPoints}pt</span>
        {assignee && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: assignee.avatarColor, fontSize: '9px' }}>
            {assignee.avatarInitials}
          </div>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[story.status]}`}>
          {STATUS_LABELS[story.status]}
        </span>
      </div>
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────

function FeatureRow({ feature, stories, members, onUpdate, onDelete }: {
  feature: Feature;
  stories: Story[];
  members: TeamMember[];
  onUpdate: (id: string, updates: Partial<Feature>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const featureStories = stories.filter((s) => s.featureId === feature.id || feature.storyIds.includes(s.id));
  const doneCount = featureStories.filter((s) => s.status === 'done').length;

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-green-50/50 rounded-lg group" style={{ paddingLeft: '48px' }}>
        <button onClick={() => setOpen((o) => !o)} className="text-slate-400 flex-shrink-0">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <GitBranch size={13} className="text-green-500 flex-shrink-0" />

        {editing ? (
          <InlineEdit value={feature.title} onSave={(v) => { onUpdate(feature.id, { title: v }); setEditing(false); }} onCancel={() => setEditing(false)} className="flex-1" />
        ) : (
          <>
            <span className="text-sm font-medium text-slate-700 flex-1 truncate">{feature.title}</span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <ProgressBar done={doneCount} total={featureStories.length} color="#10B981" />
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[feature.status]}`}>{STATUS_LABELS[feature.status]}</span>
              <span className="text-xs text-slate-400">{featureStories.length} stories</span>
              <button onClick={() => setEditing(true)} className="p-0.5 text-slate-400 hover:text-brand-600"><Pencil size={11} /></button>
              <button onClick={() => { if (window.confirm('Delete feature?')) onDelete(feature.id); }} className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
            </div>
          </>
        )}
      </div>

      {open && (
        <div>
          {featureStories.map((s) => <StoryRow key={s.id} story={s} members={members} depth={4} />)}
          {featureStories.length === 0 && (
            <div className="text-xs text-slate-300 italic py-1" style={{ paddingLeft: '80px' }}>No stories linked to this feature</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Epic Row ─────────────────────────────────────────────────────────────────

function EpicRow({ epic, features, stories, members, onUpdateFeature, onDeleteFeature, onAddFeature }: {
  epic: Epic;
  features: Feature[];
  stories: Story[];
  members: TeamMember[];
  onUpdateFeature: (id: string, u: Partial<Feature>) => void;
  onDeleteFeature: (id: string) => void;
  onAddFeature: (epicId: string, title: string) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');

  const epicFeatures = features.filter((f) => f.epicId === epic.id);
  const epicStories = stories.filter((s) => s.epicId === epic.id && !s.featureId && !epicFeatures.some((f) => f.storyIds.includes(s.id)));
  const allEpicStories = stories.filter((s) => s.epicId === epic.id);
  const doneCount = allEpicStories.filter((s) => s.status === 'done').length;

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 hover:bg-blue-50/50 rounded-lg group" style={{ paddingLeft: '32px' }}>
        <button onClick={() => setOpen((o) => !o)} className="text-slate-400 flex-shrink-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: epic.color }} />
        <span className="text-sm font-semibold text-slate-700 flex-1 truncate">{epic.title}</span>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <ProgressBar done={doneCount} total={allEpicStories.length} color={epic.color} />
          <span className="text-xs text-slate-400">{epicFeatures.length} features · {allEpicStories.length} stories</span>
          <button onClick={() => navigate(`/epics/${epic.id}`)} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 px-2 py-0.5 rounded-full">
            <ExternalLink size={10} /> Detail
          </button>
          <button onClick={() => setAddingFeature(true)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
            <Plus size={10} /> Feature
          </button>
        </div>
      </div>

      {open && (
        <div>
          {epicFeatures.map((f) => (
            <FeatureRow key={f.id} feature={f} stories={stories} members={members}
              onUpdate={onUpdateFeature} onDelete={onDeleteFeature} />
          ))}

          {/* Unfeature-linked stories */}
          {epicStories.length > 0 && (
            <div>
              <div className="flex items-center gap-1 py-1" style={{ paddingLeft: '64px' }}>
                <span className="text-xs text-slate-400 italic">Unlinked stories</span>
              </div>
              {epicStories.map((s) => <StoryRow key={s.id} story={s} members={members} depth={4} />)}
            </div>
          )}

          {/* Add feature form */}
          {addingFeature && (
            <div className="flex items-center gap-2 py-1.5 px-3" style={{ paddingLeft: '64px' }}>
              <GitBranch size={13} className="text-green-400 flex-shrink-0" />
              <input autoFocus value={newFeatureTitle} onChange={(e) => setNewFeatureTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFeatureTitle.trim()) { onAddFeature(epic.id, newFeatureTitle.trim()); setNewFeatureTitle(''); setAddingFeature(false); }
                  if (e.key === 'Escape') { setAddingFeature(false); setNewFeatureTitle(''); }
                }}
                placeholder="Feature name, press Enter..."
                className="flex-1 border border-green-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-green-300" />
              <button onClick={() => { setAddingFeature(false); setNewFeatureTitle(''); }} className="text-slate-400 hover:text-red-500"><X size={13} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Initiative Row ───────────────────────────────────────────────────────────

function InitiativeRow({ initiative, epics, features, stories, members, onUpdate, onDelete, onUpdateFeature, onDeleteFeature, onAddFeature }: {
  initiative: Initiative;
  epics: Epic[];
  features: Feature[];
  stories: Story[];
  members: TeamMember[];
  onUpdate: (id: string, u: Partial<Initiative>) => void;
  onDelete: (id: string) => void;
  onUpdateFeature: (id: string, u: Partial<Feature>) => void;
  onDeleteFeature: (id: string) => void;
  onAddFeature: (epicId: string, title: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const initEpics = epics.filter((e) => initiative.epicIds.includes(e.id));
  const initStories = stories.filter((s) => initEpics.some((e) => e.id === s.epicId));
  const doneCount = initStories.filter((s) => s.status === 'done').length;
  const totalPoints = initStories.reduce((sum, s) => sum + s.storyPoints, 0);

  return (
    <div className="mb-3 bg-white rounded-2xl border border-surface-border shadow-sm overflow-hidden">
      {/* Initiative header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" style={{ borderLeft: `4px solid ${initiative.color}` }}>
        <button onClick={() => setOpen((o) => !o)} className="text-slate-400 flex-shrink-0">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <Layers3 size={16} style={{ color: initiative.color }} className="flex-shrink-0" />

        {editing ? (
          <InlineEdit value={initiative.title} onSave={(v) => { onUpdate(initiative.id, { title: v }); setEditing(false); }} onCancel={() => setEditing(false)} className="flex-1" />
        ) : (
          <>
            <span className="font-bold text-slate-800 flex-1">{initiative.title}</span>
            <div className="flex items-center gap-3 ml-auto">
              <ProgressBar done={doneCount} total={initStories.length} color={initiative.color} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[initiative.status]}`}>{STATUS_LABELS[initiative.status]}</span>
              <span className="text-xs text-slate-400">{initEpics.length} epics · {initStories.length} stories · {totalPoints}pt</span>
              <div className="flex items-center gap-1">
                <select
                  value={initiative.status}
                  onChange={(e) => onUpdate(initiative.id, { status: e.target.value as InitiativeStatus })}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs border border-slate-200 rounded px-1.5 py-0.5 outline-none bg-white"
                >
                  {['draft', 'active', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="p-1 text-slate-400 hover:text-brand-600"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete initiative?')) onDelete(initiative.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Epics inside */}
      {open && (
        <div className="pb-2 pt-1 border-t border-slate-50">
          {initEpics.length === 0 ? (
            <p className="text-xs text-slate-300 italic py-3 pl-10">No epics linked to this initiative</p>
          ) : initEpics.map((epic) => (
            <EpicRow key={epic.id} epic={epic} features={features} stories={stories} members={members}
              onUpdateFeature={onUpdateFeature} onDeleteFeature={onDeleteFeature} onAddFeature={onAddFeature} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function HierarchyPage() {
  const { initiatives, epics, features, stories, members,
    addInitiative, updateInitiative, deleteInitiative,
    addFeature, updateFeature, deleteFeature,
  } = useScrumStore();

  const [showAddInit, setShowAddInit] = useState(false);
  const [newInitTitle, setNewInitTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(INITIATIVE_COLORS[0]);

  // Stories not under any initiative's epics
  const coveredEpicIds = new Set(initiatives.flatMap((i) => i.epicIds));
  const uncoveredEpics = epics.filter((e) => !coveredEpicIds.has(e.id));

  const stats = useMemo(() => {
    const total = stories.length;
    const done = stories.filter((s) => s.status === 'done').length;
    const inProgress = stories.filter((s) => s.status === 'in_progress').length;
    const blocked = stories.filter((s) => s.status === 'blocked').length;
    return { total, done, inProgress, blocked };
  }, [stories]);

  const handleAddInitiative = () => {
    if (!newInitTitle.trim()) return;
    addInitiative({
      title: newInitTitle.trim(), description: '', color: selectedColor,
      status: 'active', epicIds: [],
    });
    setNewInitTitle(''); setShowAddInit(false);
  };

  const handleAddFeature = (epicId: string, title: string) => {
    addFeature({ title, description: '', epicId, status: 'backlog', priority: 'medium', storyIds: [] });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Layers3 size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Work Hierarchy</h1>
            <p className="text-sm text-slate-500">Initiative → Epic → Feature → Story → Subtask</p>
          </div>
        </div>
        <button onClick={() => setShowAddInit(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
          <Plus size={16} /> New Initiative
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Stories', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Blocked', value: stats.blocked, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Done', value: stats.done, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl px-4 py-3 border border-surface-border`}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Add Initiative form */}
      {showAddInit && (
        <div className="mb-4 bg-white border-2 border-purple-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">New Initiative</p>
          <div className="flex gap-3 items-center">
            <div className="flex gap-1.5 flex-shrink-0">
              {INITIATIVE_COLORS.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-slate-600 scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <input autoFocus value={newInitTitle} onChange={(e) => setNewInitTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddInitiative(); if (e.key === 'Escape') setShowAddInit(false); }}
              placeholder="Initiative title..."
              className="flex-1 border border-surface-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
            <button onClick={handleAddInitiative} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Create</button>
            <button onClick={() => setShowAddInit(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><Layers3 size={12} className="text-purple-400" /> Initiative</div>
        <div className="flex items-center gap-1.5"><BookOpen size={12} className="text-blue-400" /> Epic</div>
        <div className="flex items-center gap-1.5"><GitBranch size={12} className="text-green-400" /> Feature</div>
        <div className="flex items-center gap-1.5"><FileText size={12} className="text-slate-400" /> Story</div>
      </div>

      {/* Tree */}
      {initiatives.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-border">
          <Layers3 size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No initiatives yet</p>
          <p className="text-sm text-slate-400 mt-1">Create an initiative to start organising your work hierarchy</p>
        </div>
      )}

      {initiatives.map((init) => (
        <InitiativeRow key={init.id} initiative={init} epics={epics} features={features ?? []}
          stories={stories} members={members}
          onUpdate={updateInitiative} onDelete={deleteInitiative}
          onUpdateFeature={updateFeature} onDeleteFeature={deleteFeature}
          onAddFeature={handleAddFeature} />
      ))}

      {/* Uncovered epics */}
      {uncoveredEpics.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-dashed border-slate-300 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-500">Epics not linked to an Initiative</span>
              <span className="text-xs bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">{uncoveredEpics.length}</span>
            </div>
          </div>
          <div className="py-2">
            {uncoveredEpics.map((epic) => (
              <EpicRow key={epic.id} epic={epic} features={features ?? []} stories={stories} members={members}
                onUpdateFeature={updateFeature} onDeleteFeature={deleteFeature} onAddFeature={handleAddFeature} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
