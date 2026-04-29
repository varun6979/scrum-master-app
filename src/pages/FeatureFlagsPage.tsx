import { useState } from 'react';
import { Plus, X, Power, Zap, AlertCircle, CheckCircle2, Edit2, Trash2, Tag } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Button } from '../components/ui/Button';
import { FeatureFlag, FlagEnvironment, FlagStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { generateId } from '../lib/idgen';

const ENV_LIST: FlagEnvironment[] = ['development', 'staging', 'production'];

const STATUS_CONFIG: Record<FlagStatus, { label: string; color: string; icon: React.ElementType }> = {
  enabled: { label: 'Enabled', color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 },
  disabled: { label: 'Disabled', color: 'text-slate-500 bg-slate-100 border-slate-200', icon: Power },
  rollout: { label: 'Rollout', color: 'text-amber-700 bg-amber-100 border-amber-200', icon: Zap },
};

const ENV_COLORS: Record<FlagEnvironment, string> = {
  development: 'text-blue-600 bg-blue-50 border-blue-200',
  staging: 'text-amber-600 bg-amber-50 border-amber-200',
  production: 'text-red-600 bg-red-50 border-red-200',
};

const BLANK_FLAG: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  status: 'disabled',
  environments: { development: false, staging: false, production: false },
  rolloutPercentage: undefined,
  linkedStoryId: undefined,
  ownerId: undefined,
  tags: [],
};

export function FeatureFlagsPage() {
  const { featureFlags, addFeatureFlag, updateFeatureFlag, deleteFeatureFlag, stories, members } = useScrumStore();
  const flags = featureFlags ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>>(BLANK_FLAG);
  const [tagInput, setTagInput] = useState('');
  const [envFilter, setEnvFilter] = useState<FlagEnvironment | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('all');

  const openCreate = () => {
    setEditId(null);
    setForm(BLANK_FLAG);
    setTagInput('');
    setShowForm(true);
  };

  const openEdit = (flag: FeatureFlag) => {
    setEditId(flag.id);
    setForm({
      name: flag.name,
      description: flag.description,
      status: flag.status,
      environments: { ...flag.environments },
      rolloutPercentage: flag.rolloutPercentage,
      linkedStoryId: flag.linkedStoryId,
      ownerId: flag.ownerId,
      tags: [...flag.tags],
    });
    setTagInput('');
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      updateFeatureFlag(editId, form);
    } else {
      addFeatureFlag(form);
    }
    setShowForm(false);
    setEditId(null);
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !form.tags.includes(v)) setForm(f => ({ ...f, tags: [...f.tags, v] }));
    setTagInput('');
  };

  const toggleEnv = (env: FlagEnvironment, checked: boolean) => {
    setForm(f => ({ ...f, environments: { ...f.environments, [env]: checked } }));
  };

  const filtered = flags.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (envFilter !== 'all' && !f.environments[envFilter]) return false;
    return true;
  });

  const enabledCount = flags.filter(f => f.status === 'enabled').length;
  const rolloutCount = flags.filter(f => f.status === 'rollout').length;
  const prodCount = flags.filter(f => f.environments.production).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
          <p className="text-slate-500 text-sm mt-1">Manage feature toggles across environments</p>
        </div>
        <Button variant="primary" onClick={openCreate}><Plus size={16} /> New Flag</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Enabled', value: enabledCount, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
          { label: 'In Rollout', value: rolloutCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: Zap },
          { label: 'In Production', value: prodCount, color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(['all', 'enabled', 'disabled', 'rollout'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-surface-border hover:border-slate-300'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', ...ENV_LIST] as const).map(env => (
            <button key={env} onClick={() => setEnvFilter(env)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${envFilter === env ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-surface-border hover:border-slate-300'}`}>
              {env === 'all' ? 'All Envs' : env.charAt(0).toUpperCase() + env.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Flags table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Power size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No feature flags found</p>
            <button onClick={openCreate} className="mt-2 text-brand-500 text-sm hover:underline">+ Create your first flag</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Flag</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Environments</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((flag, idx) => {
                const owner = members.find(m => m.id === flag.ownerId);
                const statusCfg = STATUS_CONFIG[flag.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={flag.id} className={`hover:bg-slate-50 transition-colors ${idx < filtered.length - 1 ? 'border-b border-surface-border' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-slate-800 mb-0.5">{flag.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{flag.description}</p>
                      {flag.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flag.tags.map(t => <span key={t} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon size={11} /> {statusCfg.label}
                        {flag.status === 'rollout' && flag.rolloutPercentage !== undefined && (
                          <span className="ml-1">({flag.rolloutPercentage}%)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        {ENV_LIST.map(env => (
                          <div key={env} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${flag.environments[env] ? ENV_COLORS[env] : 'text-slate-300 bg-slate-50 border border-slate-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${flag.environments[env] ? 'bg-current' : 'bg-slate-300'}`} />
                            {env.slice(0, 3)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs text-slate-600">{owner?.name ?? '—'}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs text-slate-400">{format(parseISO(flag.updatedAt), 'MMM d')}</p>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(flag)} className="p-1.5 text-slate-400 hover:text-brand-500 rounded-lg hover:bg-slate-100"><Edit2 size={13} /></button>
                        <button onClick={() => { if (window.confirm(`Delete "${flag.name}"?`)) deleteFeatureFlag(flag.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">{editId ? 'Edit Feature Flag' : 'New Feature Flag'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Flag Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))} placeholder="e.g. enable_new_checkout" className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="What does this flag control?" />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <div className="flex gap-2">
                  {(['enabled', 'disabled', 'rollout'] as FlagStatus[]).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.status === s ? STATUS_CONFIG[s].color : 'bg-white text-slate-500 border-surface-border hover:border-slate-300'}`}>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rollout % */}
              {form.status === 'rollout' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rollout % {form.rolloutPercentage !== undefined && <span className="text-brand-600 font-bold ml-1">{form.rolloutPercentage}%</span>}</label>
                  <input type="range" min={0} max={100} step={5} value={form.rolloutPercentage ?? 0} onChange={e => setForm(f => ({ ...f, rolloutPercentage: Number(e.target.value) }))} className="w-full accent-brand-500" />
                </div>
              )}

              {/* Environments */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Environments</label>
                <div className="flex gap-3">
                  {ENV_LIST.map(env => (
                    <label key={env} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.environments[env]} onChange={e => toggleEnv(env, e.target.checked)} className="rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                      <span className="text-sm text-slate-700 capitalize">{env}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Owner */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Owner</label>
                <select value={form.ownerId ?? ''} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value || undefined }))} className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">None</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1"><Tag size={11} className="inline mr-1" />Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full">
                      {t}<button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag, press Enter" className="flex-1 px-2.5 py-1.5 border border-surface-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <button onClick={addTag} className="px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200">Add</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
              <Button variant="secondary" size="md" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!form.name.trim()}>{editId ? 'Save Changes' : 'Create Flag'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
