import { useState } from 'react';
import { Package, Plus, X, CheckCircle2, Clock, AlertTriangle, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type ReleaseStatus = 'planned' | 'in_progress' | 'released' | 'cancelled';

interface Release {
  id: string;
  name: string;
  version: string;
  description: string;
  status: ReleaseStatus;
  targetDate: string;
  releasedDate?: string;
  storyIds: string[];
  createdAt: string;
}

const STATUS_CONFIG: Record<ReleaseStatus, { label: string; color: string; icon: React.ElementType }> = {
  planned: { label: 'Planned', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-700 bg-blue-100 border-blue-200', icon: Clock },
  released: { label: 'Released', color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: X },
};

const STORAGE_KEY = 'scrumboard-releases';

function loadReleases(): Release[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveReleases(r: Release[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

export function ReleasesPage() {
  const { stories, epics } = useScrumStore();
  const [releases, setReleases] = useState<Release[]>(loadReleases);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [linkingRelease, setLinkingRelease] = useState<string | null>(null);

  const blank = (): Omit<Release, 'id' | 'createdAt'> => ({
    name: '', version: '', description: '', status: 'planned', targetDate: '', storyIds: [],
  });
  const [form, setForm] = useState(blank());

  const save = (r: Release[]) => { setReleases(r); saveReleases(r); };

  const handleSave = () => {
    if (!form.name.trim() || !form.version.trim()) return;
    if (editId) {
      save(releases.map(r => r.id === editId ? { ...r, ...form } : r));
    } else {
      save([...releases, { ...form, id: `rel-${Date.now()}`, createdAt: new Date().toISOString() }]);
    }
    setShowForm(false); setEditId(null); setForm(blank());
  };

  const openEdit = (rel: Release) => {
    setEditId(rel.id);
    setForm({ name: rel.name, version: rel.version, description: rel.description, status: rel.status, targetDate: rel.targetDate, releasedDate: rel.releasedDate, storyIds: [...rel.storyIds] });
    setShowForm(true);
  };

  const toggleStory = (releaseId: string, storyId: string) => {
    save(releases.map(r => r.id === releaseId ? {
      ...r, storyIds: r.storyIds.includes(storyId) ? r.storyIds.filter(id => id !== storyId) : [...r.storyIds, storyId],
    } : r));
  };

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const unassignedStories = stories.filter(s => !releases.some(r => r.storyIds.includes(s.id)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Package size={22} className="text-brand-500" /> Releases</h1>
          <p className="text-slate-500 text-sm mt-1">Track versions, release notes, and story bundles</p>
        </div>
        <Button variant="primary" onClick={() => { setEditId(null); setForm(blank()); setShowForm(true); }}><Plus size={16} /> New Release</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['planned', 'in_progress', 'released', 'cancelled'] as ReleaseStatus[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = releases.filter(r => r.status === s).length;
          return (
            <div key={s} className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${cfg.color}`}>
                <cfg.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Release list */}
      <div className="space-y-3">
        {releases.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-border py-16 text-center">
            <Package size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No releases yet</p>
            <button onClick={() => setShowForm(true)} className="mt-2 text-brand-500 text-sm hover:underline">+ Create your first release</button>
          </div>
        ) : releases.map(rel => {
          const cfg = STATUS_CONFIG[rel.status];
          const Icon = cfg.icon;
          const relStories = stories.filter(s => rel.storyIds.includes(s.id));
          const done = relStories.filter(s => s.status === 'done').length;
          const pct = relStories.length > 0 ? Math.round((done / relStories.length) * 100) : 0;
          const isExpanded = expanded.has(rel.id);

          return (
            <div key={rel.id} className="bg-white rounded-xl border border-surface-border overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button onClick={() => toggleExpand(rel.id)} className="text-slate-400">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.color}`}>
                  <Icon size={11} /> {cfg.label}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{rel.name}</span>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{rel.version}</span>
                  </div>
                  {rel.description && <p className="text-xs text-slate-500 truncate mt-0.5">{rel.description}</p>}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {relStories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{done}/{relStories.length}</span>
                    </div>
                  )}
                  <span className="text-xs text-slate-400">{rel.targetDate || 'No date'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(rel)} className="p-1.5 text-slate-400 hover:text-brand-500 rounded hover:bg-slate-100"><Edit2 size={13} /></button>
                    <button onClick={() => save(releases.filter(r => r.id !== rel.id))} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-surface-border px-5 py-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-600">Stories in this release ({relStories.length})</p>
                    <button onClick={() => setLinkingRelease(linkingRelease === rel.id ? null : rel.id)} className="text-xs text-brand-500 hover:text-brand-700 font-medium">+ Add stories</button>
                  </div>

                  {linkingRelease === rel.id && (
                    <div className="mb-3 bg-white rounded-lg border border-surface-border p-3 max-h-40 overflow-y-auto space-y-1">
                      {unassignedStories.length === 0 ? <p className="text-xs text-slate-400">All stories are assigned to a release.</p>
                        : unassignedStories.map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                          <input type="checkbox" checked={rel.storyIds.includes(s.id)} onChange={() => toggleStory(rel.id, s.id)} className="rounded border-slate-300 text-brand-500" />
                          <Badge variant="priority" value={s.priority} />
                          <span className="text-xs text-slate-700 flex-1 truncate">{s.title}</span>
                          <span className="text-xs text-slate-400">{s.storyPoints}pt</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {relStories.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">No stories linked yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {relStories.map(s => (
                        <div key={s.id} className="flex items-center gap-2 py-1">
                          <Badge variant="priority" value={s.priority} />
                          <span className={`flex-1 text-xs truncate ${s.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{s.title}</span>
                          <span className="text-xs text-slate-400">{s.storyPoints}pt</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.status.replace('_', ' ')}</span>
                          <button onClick={() => toggleStory(rel.id, s.id)} className="text-slate-400 hover:text-red-500"><X size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">{editId ? 'Edit Release' : 'New Release'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Release Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Q1 Release" className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Version *</label>
                  <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="e.g. v2.4.0" className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="What's in this release?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ReleaseStatus }))} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {(Object.keys(STATUS_CONFIG) as ReleaseStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target Date</label>
                  <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              {form.status === 'released' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Released Date</label>
                  <input type="date" value={form.releasedDate ?? ''} onChange={e => setForm(f => ({ ...f, releasedDate: e.target.value }))} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
              <Button variant="secondary" size="md" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!form.name.trim() || !form.version.trim()}>{editId ? 'Save' : 'Create Release'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
