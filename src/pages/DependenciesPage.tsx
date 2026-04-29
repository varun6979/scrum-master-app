import { useState } from 'react';
import { GitBranch, Plus, Trash2, AlertCircle, ArrowRight, Link2, Copy } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Dependency, DependencyType, Story } from '../types';

const TYPE_CONFIG: Record<DependencyType, { label: string; color: string; bg: string; description: string }> = {
  blocks: { label: 'Blocks', color: 'text-red-600', bg: 'bg-red-50', description: 'This story blocks another story' },
  blocked_by: { label: 'Blocked By', color: 'text-orange-600', bg: 'bg-orange-50', description: 'This story is blocked by another' },
  relates_to: { label: 'Relates To', color: 'text-blue-600', bg: 'bg-blue-50', description: 'These stories are related' },
  duplicates: { label: 'Duplicates', color: 'text-slate-600', bg: 'bg-slate-100', description: 'This story duplicates another' },
};

const STATUS_DOT: Record<string, string> = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-400',
  in_progress: 'bg-purple-500',
  review: 'bg-amber-400',
  done: 'bg-green-500',
};

function StoryPill({ story }: { story: Story }) {
  const { epics } = useScrumStore();
  const epic = epics.find((e) => e.id === story.epicId);
  return (
    <div className="flex items-center gap-2 bg-white border border-surface-border rounded-lg px-3 py-2 min-w-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[story.status] ?? 'bg-slate-400'}`} />
      {epic && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />}
      <span className="text-xs font-medium text-slate-700 truncate">{story.title}</span>
      <span className="text-xs text-slate-400 flex-shrink-0">{story.storyPoints}pt</span>
    </div>
  );
}

function AddDependencyForm({ onSave, onCancel }: {
  onSave: (data: Omit<Dependency, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { stories } = useScrumStore();
  const [fromStoryId, setFromStoryId] = useState('');
  const [toStoryId, setToStoryId] = useState('');
  const [type, setType] = useState<DependencyType>('blocked_by');
  const [description, setDescription] = useState('');

  const activeSprints = stories.filter((s) => s.sprintId || s.status !== 'done');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStoryId || !toStoryId || fromStoryId === toStoryId) return;
    onSave({ fromStoryId, toStoryId, type, description: description || undefined });
  };

  const typeCfg = TYPE_CONFIG[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Story</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={fromStoryId} onChange={(e) => setFromStoryId(e.target.value)} required>
            <option value="">Select story...</option>
            {activeSprints.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Relationship Type</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={type} onChange={(e) => setType(e.target.value as DependencyType)}>
            {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${typeCfg.bg} ${typeCfg.color}`}>
        <AlertCircle size={13} />
        <span>{typeCfg.description}</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Related Story</label>
        <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={toStoryId} onChange={(e) => setToStoryId(e.target.value)} required>
          <option value="">Select story...</option>
          {activeSprints.filter((s) => s.id !== fromStoryId).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
        <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why does this dependency exist?" />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Add Dependency</button>
      </div>
    </form>
  );
}

function DependencyRow({ dep }: { dep: Dependency }) {
  const { stories, deleteDependency } = useScrumStore();
  const fromStory = stories.find((s) => s.id === dep.fromStoryId);
  const toStory = stories.find((s) => s.id === dep.toStoryId);
  const cfg = TYPE_CONFIG[dep.type];

  if (!fromStory || !toStory) return null;

  // Is the dependency creating a blocker situation?
  const isBlocking = (dep.type === 'blocks' || dep.type === 'blocked_by') &&
    fromStory.status !== 'done' && toStory.status !== 'done';

  return (
    <div className={`bg-white rounded-xl border p-4 ${isBlocking ? 'border-orange-200' : 'border-surface-border'}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <StoryPill story={fromStory} />
        </div>

        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} whitespace-nowrap`}>
            {cfg.label}
          </span>
          <ArrowRight size={14} className="text-slate-400" />
        </div>

        <div className="flex-1 min-w-0">
          <StoryPill story={toStory} />
        </div>

        <button
          onClick={() => deleteDependency(dep.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {dep.description && (
        <p className="text-xs text-slate-500 mt-2 pl-1">{dep.description}</p>
      )}

      {isBlocking && (dep.type === 'blocked_by' ? fromStory.status !== 'done' : toStory.status !== 'done') && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 rounded-lg px-2.5 py-1.5">
          <AlertCircle size={12} />
          <span>Active blocker — {dep.type === 'blocked_by' ? `"${fromStory.title}"` : `"${toStory.title}"`} must complete first</span>
        </div>
      )}
    </div>
  );
}

// Story dependency summary card
function StoryDependencySummary({ story, deps }: { story: Story; deps: Dependency[] }) {
  const { stories, epics } = useScrumStore();
  const epic = epics.find((e) => e.id === story.epicId);
  const blockedByCount = deps.filter((d) => d.fromStoryId === story.id && d.type === 'blocked_by').length;
  const blocksCount = deps.filter((d) => d.fromStoryId === story.id && d.type === 'blocks').length;

  const isCurrentlyBlocked = deps.some((d) => {
    if (d.fromStoryId !== story.id || d.type !== 'blocked_by') return false;
    const blocker = stories.find((s) => s.id === d.toStoryId);
    return blocker && blocker.status !== 'done';
  });

  return (
    <div className={`bg-white rounded-lg border p-3 ${isCurrentlyBlocked ? 'border-orange-200 bg-orange-50/30' : 'border-surface-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {epic && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: epic.color }} />}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[story.status]}`} />
          <span className="text-xs font-medium text-slate-700 truncate">{story.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {blockedByCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
              {blockedByCount} blocked by
            </span>
          )}
          {blocksCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
              blocks {blocksCount}
            </span>
          )}
          {isCurrentlyBlocked && <AlertCircle size={13} className="text-orange-500" />}
        </div>
      </div>
    </div>
  );
}

export function DependenciesPage() {
  const { dependencies, addDependency, stories } = useScrumStore();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<DependencyType | 'all'>('all');

  const filtered = filterType === 'all' ? dependencies : dependencies.filter((d) => d.type === filterType);

  // Stories with dependencies
  const storiesWithDeps = stories.filter((s) =>
    dependencies.some((d) => d.fromStoryId === s.id || d.toStoryId === s.id)
  );

  // Active blockers
  const activeBlockers = dependencies.filter((d) => {
    if (d.type !== 'blocked_by' && d.type !== 'blocks') return false;
    const from = stories.find((s) => s.id === d.fromStoryId);
    const to = stories.find((s) => s.id === d.toStoryId);
    return from && to && from.status !== 'done' && to.status !== 'done';
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <GitBranch size={20} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dependencies</h1>
            <p className="text-sm text-slate-500">Track story dependencies, blockers, and relationships</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          Add Dependency
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Dependencies', value: dependencies.length },
          { label: 'Active Blockers', value: activeBlockers.length, alert: activeBlockers.length > 0 },
          { label: 'Stories Linked', value: storiesWithDeps.length },
          { label: 'Blocking Chains', value: dependencies.filter((d) => d.type === 'blocks').length },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border p-4 ${s.alert ? 'border-orange-200' : 'border-surface-border'}`}>
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.alert ? 'text-orange-500' : 'text-slate-800'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Active blockers alert */}
      {activeBlockers.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-orange-700">Active Blockers ({activeBlockers.length})</h3>
          </div>
          <p className="text-xs text-orange-600 mb-3">These dependencies are actively blocking in-progress work:</p>
          <div className="space-y-2">
            {activeBlockers.map((dep) => {
              const from = stories.find((s) => s.id === dep.fromStoryId);
              const to = stories.find((s) => s.id === dep.toStoryId);
              if (!from || !to) return null;
              return (
                <div key={dep.id} className="flex items-center gap-2 text-xs text-orange-700">
                  <span className="font-medium truncate max-w-48">"{from.title}"</span>
                  <ArrowRight size={12} />
                  <span className="text-orange-500 font-medium">{TYPE_CONFIG[dep.type].label}</span>
                  <ArrowRight size={12} />
                  <span className="font-medium truncate max-w-48">"{to.title}"</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add dependency form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Dependency</h3>
          <AddDependencyForm
            onSave={(data) => { addDependency(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dependency list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">All Dependencies</h2>
            <select
              className="border border-surface-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DependencyType | 'all')}
            >
              <option value="all">All types</option>
              {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
                <Link2 size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No dependencies yet. Link related stories to track dependencies.</p>
              </div>
            ) : (
              filtered.map((dep) => <DependencyRow key={dep.id} dep={dep} />)
            )}
          </div>
        </div>

        {/* Stories with deps sidebar */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Stories with Dependencies</h2>
          <div className="space-y-2">
            {storiesWithDeps.length === 0 ? (
              <div className="bg-white rounded-xl border border-surface-border p-6 text-center">
                <p className="text-xs text-slate-400">No stories linked yet</p>
              </div>
            ) : (
              storiesWithDeps.map((story) => (
                <StoryDependencySummary
                  key={story.id}
                  story={story}
                  deps={dependencies.filter((d) => d.fromStoryId === story.id || d.toStoryId === story.id)}
                />
              ))
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-xl border border-surface-border p-4">
            <h3 className="text-xs font-semibold text-slate-600 mb-3">Dependency Types</h3>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color} flex-shrink-0 mt-0.5`}>{cfg.label}</span>
                  <span className="text-xs text-slate-500">{cfg.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
