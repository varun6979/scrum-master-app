import { useState } from 'react';
import { ShieldAlert, Plus, X, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Risk, RiskProbability, RiskImpact, RiskStatus } from '../types';
import { formatDate } from '../lib/dateUtils';

const PROB_LABELS: Record<RiskProbability, string> = {
  very_low: 'Very Low', low: 'Low', medium: 'Medium', high: 'High', very_high: 'Very High',
};
const PROB_INDEX: Record<RiskProbability, number> = {
  very_low: 1, low: 2, medium: 3, high: 4, very_high: 5,
};
const IMPACT_LABELS: Record<RiskImpact, string> = {
  negligible: 'Negligible', minor: 'Minor', moderate: 'Moderate', major: 'Major', critical: 'Critical',
};
const IMPACT_INDEX: Record<RiskImpact, number> = {
  negligible: 1, minor: 2, moderate: 3, major: 4, critical: 5,
};
const STATUS_CONFIG: Record<RiskStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-red-600', bg: 'bg-red-50' },
  mitigated: { label: 'Mitigated', color: 'text-blue-600', bg: 'bg-blue-50' },
  accepted: { label: 'Accepted', color: 'text-amber-600', bg: 'bg-amber-50' },
  closed: { label: 'Closed', color: 'text-green-600', bg: 'bg-green-50' },
};

const CATEGORIES = ['Technical', 'Resource', 'Schedule', 'Scope', 'External', 'Infrastructure', 'Security', 'Financial'];

function getRiskColor(score: number) {
  if (score >= 15) return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' };
  if (score >= 9) return { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50' };
  if (score >= 4) return { bg: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50' };
  return { bg: 'bg-green-400', text: 'text-green-700', light: 'bg-green-50' };
}
function getRiskLevel(score: number) {
  if (score >= 15) return 'Critical';
  if (score >= 9) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function RiskForm({ risk, onSave, onCancel }: {
  risk?: Risk | null;
  onSave: (data: Omit<Risk, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const { members, stories } = useScrumStore();
  const [title, setTitle] = useState(risk?.title ?? '');
  const [description, setDescription] = useState(risk?.description ?? '');
  const [category, setCategory] = useState(risk?.category ?? 'Technical');
  const [probability, setProbability] = useState<RiskProbability>(risk?.probability ?? 'medium');
  const [impact, setImpact] = useState<RiskImpact>(risk?.impact ?? 'moderate');
  const [status, setStatus] = useState<RiskStatus>(risk?.status ?? 'open');
  const [ownerId, setOwnerId] = useState(risk?.ownerId ?? '');
  const [mitigation, setMitigation] = useState(risk?.mitigation ?? '');
  const [contingency, setContingency] = useState(risk?.contingency ?? '');
  const [storyIds, setStoryIds] = useState<string[]>(risk?.storyIds ?? []);
  const [identifiedDate, setIdentifiedDate] = useState(risk?.identifiedDate ?? new Date().toISOString().split('T')[0]);
  const [reviewDate, setReviewDate] = useState(risk?.reviewDate ?? '');

  const riskScore = PROB_INDEX[probability] * IMPACT_INDEX[impact];

  const toggleStory = (id: string) =>
    setStoryIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, category, probability, impact, riskScore, status, ownerId: ownerId || undefined, mitigation, contingency, storyIds, identifiedDate, reviewDate: reviewDate || undefined });
  };

  const colors = getRiskColor(riskScore);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Risk Title *</label>
          <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Describe the risk..." />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={status} onChange={(e) => setStatus(e.target.value as RiskStatus)}>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Probability</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={probability} onChange={(e) => setProbability(e.target.value as RiskProbability)}>
            {Object.entries(PROB_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Impact</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={impact} onChange={(e) => setImpact(e.target.value as RiskImpact)}>
            {Object.entries(IMPACT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Identified Date</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={identifiedDate} onChange={(e) => setIdentifiedDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Next Review Date</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
        </div>
      </div>

      {/* Risk score preview */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${colors.light}`}>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center text-white font-bold text-lg`}>{riskScore}</div>
        <div>
          <p className={`font-semibold text-sm ${colors.text}`}>{getRiskLevel(riskScore)} Risk</p>
          <p className="text-xs text-slate-500">Score = {PROB_LABELS[probability]} × {IMPACT_LABELS[impact]}</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Owner</label>
        <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">No owner</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Mitigation Plan</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={mitigation} onChange={(e) => setMitigation(e.target.value)} placeholder="How will you reduce the probability or impact?" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Contingency Plan</label>
        <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={contingency} onChange={(e) => setContingency(e.target.value)} placeholder="What to do if the risk occurs?" />
      </div>

      {/* Affected stories */}
      {stories.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Affected Stories</label>
          <div className="max-h-36 overflow-y-auto border border-surface-border rounded-lg divide-y divide-surface-border">
            {stories.slice(0, 20).map((s) => (
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
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Risk</button>
      </div>
    </form>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const { members, stories, updateRisk, deleteRisk } = useScrumStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const colors = getRiskColor(risk.riskScore);
  const statusCfg = STATUS_CONFIG[risk.status];
  const owner = members.find((m) => m.id === risk.ownerId);
  const affectedStories = stories.filter((s) => risk.storyIds.includes(s.id));

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <RiskForm risk={risk} onSave={(data) => { updateRisk(risk.id, data); setEditing(false); }} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${risk.status === 'open' && risk.riskScore >= 12 ? 'border-red-200' : 'border-surface-border'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {risk.riskScore}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-800 text-sm">{risk.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{risk.category}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{risk.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => deleteRisk(risk.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          <span><span className="font-medium text-slate-700">Probability:</span> {PROB_LABELS[risk.probability]}</span>
          <span>·</span>
          <span><span className="font-medium text-slate-700">Impact:</span> {IMPACT_LABELS[risk.impact]}</span>
          <span>·</span>
          <span><span className={`font-medium ${colors.text}`}>{getRiskLevel(risk.riskScore)} Risk</span></span>
          {owner && <><span>·</span><span>Owner: <span className="font-medium text-slate-700">{owner.name}</span></span></>}
          {risk.reviewDate && <><span>·</span><span>Review: <span className="font-medium">{formatDate(risk.reviewDate)}</span></span></>}
        </div>

        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1.5 mt-3 text-xs font-medium text-slate-500 hover:text-slate-700">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Hide' : 'Show'} plans & details
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {risk.mitigation && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Mitigation Plan</p>
                <p className="text-xs text-blue-800">{risk.mitigation}</p>
              </div>
            )}
            {risk.contingency && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Contingency Plan</p>
                <p className="text-xs text-amber-800">{risk.contingency}</p>
              </div>
            )}
            {affectedStories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Affected Stories ({affectedStories.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {affectedStories.map((s) => (
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

// 5x5 risk matrix
function RiskMatrix({ risks }: { risks: Risk[] }) {
  const probs: RiskProbability[] = ['very_high', 'high', 'medium', 'low', 'very_low'];
  const impacts: RiskImpact[] = ['negligible', 'minor', 'moderate', 'major', 'critical'];

  const getCellRisks = (p: RiskProbability, imp: RiskImpact) =>
    risks.filter((r) => r.probability === p && r.impact === imp && r.status === 'open');

  const getCellColor = (p: RiskProbability, imp: RiskImpact) => {
    const score = PROB_INDEX[p] * IMPACT_INDEX[imp];
    if (score >= 15) return 'bg-red-100 border-red-200';
    if (score >= 9) return 'bg-amber-100 border-amber-200';
    if (score >= 4) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Matrix (Open Risks)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-500 font-medium w-20">Prob \ Impact</th>
              {impacts.map((imp) => (
                <th key={imp} className="p-2 text-center text-slate-500 font-medium capitalize">{IMPACT_LABELS[imp]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {probs.map((prob) => (
              <tr key={prob}>
                <td className="p-2 text-slate-500 font-medium capitalize whitespace-nowrap">{PROB_LABELS[prob]}</td>
                {impacts.map((imp) => {
                  const cellRisks = getCellRisks(prob, imp);
                  return (
                    <td key={imp} className={`p-2 border rounded-lg text-center ${getCellColor(prob, imp)}`}>
                      {cellRisks.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {cellRisks.map((r) => (
                            <div key={r.id} className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold" title={r.title}>
                              {r.riskScore}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-3">
        {[{ label: 'Critical (15-25)', color: 'bg-red-100' }, { label: 'High (9-14)', color: 'bg-amber-100' }, { label: 'Medium (4-8)', color: 'bg-yellow-50' }, { label: 'Low (1-3)', color: 'bg-green-50' }].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className={`w-3 h-3 rounded ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RisksPage() {
  const { risks, addRisk } = useScrumStore();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const categories = ['all', ...Array.from(new Set(risks.map((r) => r.category)))];

  let filtered = risks
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .filter((r) => filterCategory === 'all' || r.category === filterCategory);
  filtered = [...filtered].sort((a, b) =>
    sortBy === 'score' ? b.riskScore - a.riskScore : b.identifiedDate.localeCompare(a.identifiedDate)
  );

  const openCount = risks.filter((r) => r.status === 'open').length;
  const criticalCount = risks.filter((r) => r.status === 'open' && r.riskScore >= 15).length;
  const highCount = risks.filter((r) => r.status === 'open' && r.riskScore >= 9 && r.riskScore < 15).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Risk Register</h1>
            <p className="text-sm text-slate-500">Identify, assess, and mitigate project risks</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} />
          Add Risk
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Open Risks', value: openCount, color: 'text-slate-800' },
          { label: 'Critical', value: criticalCount, color: 'text-red-600' },
          { label: 'High', value: highCount, color: 'text-amber-600' },
          { label: 'Mitigated', value: risks.filter((r) => r.status === 'mitigated').length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-border p-4">
            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Risk matrix */}
      <div className="mb-6">
        <RiskMatrix risks={risks} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as RiskStatus | 'all')}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </select>
        <select className="border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}>
          <option value="score">Sort by risk score</option>
          <option value="date">Sort by date identified</option>
        </select>
      </div>

      {/* New risk form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Risk</h3>
          <RiskForm onSave={(data) => { addRisk(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Risk list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
            <ShieldAlert size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No risks match the current filters.</p>
          </div>
        ) : (
          filtered.map((risk) => <RiskCard key={risk.id} risk={risk} />)
        )}
      </div>
    </div>
  );
}
