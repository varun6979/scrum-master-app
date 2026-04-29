import { useState, useMemo } from 'react';
import { Search, X, Plus, GitCompare, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Minus } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Story, StoryType } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_STORIES = 3;

const TYPE_COLORS: Record<StoryType, string> = {
  story: 'bg-blue-100 text-blue-700',
  bug: 'bg-red-100 text-red-700',
  task: 'bg-green-100 text-green-700',
  spike: 'bg-purple-100 text-purple-700',
  tech_debt: 'bg-amber-100 text-amber-700',
};

const TYPE_LABELS: Record<StoryType, string> = {
  story: '📖 Story',
  bug: '🐛 Bug',
  task: '✅ Task',
  spike: '🔍 Spike',
  tech_debt: '🔧 Tech Debt',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 font-semibold',
  high: 'text-orange-500 font-semibold',
  medium: 'text-amber-600',
  low: 'text-blue-500',
};

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  review: 'bg-amber-100 text-amber-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
};

const QA_COLORS: Record<string, string> = {
  not_started: 'text-slate-400',
  in_qa: 'text-blue-600',
  passed: 'text-green-600',
  failed: 'text-red-600',
};

const QA_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_qa: 'In QA',
  passed: '✓ Passed',
  failed: '✗ Failed',
};

// ─── Story Picker ─────────────────────────────────────────────────────────────

function StoryPicker({
  selected,
  onSelect,
  excluded,
}: {
  selected: Story | null;
  onSelect: (s: Story | null) => void;
  excluded: string[];
}) {
  const { stories, epics, sprints } = useScrumStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return stories
      .filter((s) => !excluded.includes(s.id) && (s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [stories, excluded, query]);

  if (selected) {
    const epic = epics.find((e) => e.id === selected.epicId);
    const sprint = sprints.find((sp) => sp.id === selected.sprintId);
    return (
      <div className="relative">
        <div className="flex items-center justify-between bg-white border border-surface-border rounded-xl p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[selected.storyType ?? 'story']}`}>
                {TYPE_LABELS[selected.storyType ?? 'story']}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{selected.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{epic?.title ?? 'No epic'} {sprint ? `• ${sprint.name}` : ''}</p>
          </div>
          <button onClick={() => onSelect(null)} className="ml-3 p-1 text-slate-400 hover:text-red-500 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
      >
        <Plus size={16} />
        <span className="text-sm font-medium">Add story to compare</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-border rounded-xl shadow-xl z-20">
          <div className="p-2 border-b border-surface-border">
            <div className="flex items-center gap-2 px-2">
              <Search size={14} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stories..."
                className="flex-1 text-sm text-slate-800 outline-none py-1.5 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No stories found</p>
            ) : filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s); setOpen(false); setQuery(''); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[s.storyType ?? 'story']}`}>
                    {s.storyType ?? 'story'}
                  </span>
                  <span className="text-xs text-slate-400">{s.storyPoints} pts</span>
                </div>
                <p className="text-sm text-slate-800 truncate">{s.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comparison cell value renderer ──────────────────────────────────────────

type CellValue = string | number | boolean | string[] | null | undefined;

function CellContent({ value, type, highlight }: { value: CellValue; type?: string; highlight?: boolean }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 text-xs">—</span>;
  }
  if (type === 'status') {
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[value as string] ?? 'bg-slate-100 text-slate-600'}`}>{STATUS_LABELS[value as string] ?? value}</span>;
  }
  if (type === 'priority') {
    return <span className={`text-sm ${PRIORITY_COLORS[value as string] ?? ''}`}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}</span>;
  }
  if (type === 'type') {
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[value as StoryType] ?? ''}`}>{TYPE_LABELS[value as StoryType] ?? value}</span>;
  }
  if (type === 'qa') {
    return <span className={`text-sm font-medium ${QA_COLORS[value as string] ?? ''}`}>{QA_LABELS[value as string] ?? value}</span>;
  }
  if (type === 'points') {
    return <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${highlight ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-700'}`}>{value}</span>;
  }
  if (type === 'bool') {
    return value
      ? <span className="flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle2 size={14} /> Yes</span>
      : <span className="flex items-center gap-1 text-slate-400 text-sm"><Minus size={14} /> No</span>;
  }
  if (type === 'tags' && Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((t) => <span key={t} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded-full">{t}</span>)}
      </div>
    );
  }
  if (type === 'criteria' && Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <ul className="space-y-1">
        {(value as string[]).map((c, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-slate-700">
            <span className="text-brand-400 font-bold flex-shrink-0">{i + 1}.</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (type === 'business_value') {
    const n = Number(value);
    const color = n >= 8 ? 'bg-green-500' : n >= 5 ? 'bg-amber-500' : 'bg-slate-400';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${(n / 10) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-slate-700">{n}/10</span>
      </div>
    );
  }
  return <span className="text-sm text-slate-700">{String(value)}</span>;
}

// ─── Section helpers ──────────────────────────────────────────────────────────

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <tr className="bg-slate-50 cursor-pointer select-none" onClick={onToggle}>
      <td colSpan={100} className="px-5 py-2.5">
        <div className="flex items-center gap-2">
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StoryComparePage() {
  const { epics, sprints, members } = useScrumStore();
  const [slots, setSlots] = useState<(Story | null)[]>([null, null]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true, description: true, dev: false, business: true, quality: true,
  });

  const selected = slots.filter(Boolean) as Story[];
  const excluded = selected.map((s) => s.id);

  const setSlot = (idx: number, s: Story | null) => {
    setSlots((prev) => { const n = [...prev]; n[idx] = s; return n; });
  };

  const addSlot = () => {
    if (slots.length < MAX_STORIES) setSlots((prev) => [...prev, null]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSection = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  // Highlight the "best" value in a row (e.g., highest points)
  const best = (values: (number | undefined | null)[], highest = true): number => {
    const nums = values.map((v) => v ?? 0);
    const target = highest ? Math.max(...nums) : Math.min(...nums.filter((n) => n > 0));
    return nums.findIndex((n) => n === target);
  };

  const memberName = (id?: string) => id ? (members.find((m) => m.id === id)?.name ?? 'Unknown') : '—';
  const epicName = (id?: string) => id ? (epics.find((e) => e.id === id)?.title ?? 'No epic') : 'No epic';
  const sprintName = (id?: string) => id ? (sprints.find((sp) => sp.id === id)?.name ?? 'Backlog') : 'Backlog';

  type Row = {
    label: string;
    values: CellValue[];
    type?: string;
    highlights?: number[];
    note?: string;
  };

  const overviewRows: Row[] = [
    { label: 'Type', values: slots.map((s) => s?.storyType ?? null), type: 'type' },
    { label: 'Status', values: slots.map((s) => s?.status ?? null), type: 'status' },
    { label: 'Priority', values: slots.map((s) => s?.priority ?? null), type: 'priority' },
    { label: 'Severity', values: slots.map((s) => s?.severity ?? null) },
    { label: 'Story Points', values: slots.map((s) => s?.storyPoints ?? null), type: 'points', highlights: selected.length > 1 ? [best(slots.map(s => s?.storyPoints))] : [] },
    { label: 'Business Value', values: slots.map((s) => s?.businessValue ?? null), type: 'business_value' },
    { label: 'Epic', values: slots.map((s) => epicName(s?.epicId)) },
    { label: 'Sprint', values: slots.map((s) => sprintName(s?.sprintId)) },
    { label: 'Assignee', values: slots.map((s) => memberName(s?.assigneeId)) },
    { label: 'Reporter', values: slots.map((s) => memberName(s?.reporterId)) },
    { label: 'Due Date', values: slots.map((s) => s?.dueDate ?? null) },
  ];

  const descRows: Row[] = [
    { label: 'Description', values: slots.map((s) => s?.description ?? null) },
    { label: 'Acceptance Criteria', values: slots.map((s) => s?.acceptanceCriteria ?? []), type: 'criteria' },
    { label: 'Test Notes', values: slots.map((s) => s?.testNotes ?? null) },
  ];

  const devRows: Row[] = [
    { label: 'Branch', values: slots.map((s) => s?.branchName ?? null) },
    { label: 'Pull Request', values: slots.map((s) => s?.pullRequestUrl ?? null) },
    { label: 'Fix Version', values: slots.map((s) => s?.fixVersion ?? null) },
    { label: 'Environment', values: slots.map((s) => s?.environment ?? null) },
    { label: 'Deployed To', values: slots.map((s) => s?.deployedTo ?? []), type: 'tags' },
    { label: 'Build Status', values: slots.map((s) => s?.buildStatus ?? null) },
    { label: 'Feature Flag', values: slots.map((s) => s?.featureFlagStatus ?? null) },
    { label: 'Tags', values: slots.map((s) => s?.tags ?? []), type: 'tags' },
    { label: 'Components', values: slots.map((s) => s?.components ?? []), type: 'tags' },
  ];

  const bizRows: Row[] = [
    { label: 'Customer Impact', values: slots.map((s) => s?.customerImpact ?? null) },
    { label: 'Revenue Impact ($)', values: slots.map((s) => s?.revenueImpact ?? null) },
    { label: 'OKR / Objective', values: slots.map((s) => s?.okrLink ?? null) },
    { label: 'Persona', values: slots.map((s) => s?.persona ?? null) },
    { label: 'Problem Statement', values: slots.map((s) => s?.problemStatement ?? null) },
    { label: 'Success Metrics', values: slots.map((s) => s?.successMetrics ?? []), type: 'tags' },
    { label: 'Effort Confidence', values: slots.map((s) => s?.effortConfidenceScore != null ? `${s.effortConfidenceScore}%` : null) },
  ];

  const qualityRows: Row[] = [
    { label: 'QA Status', values: slots.map((s) => s?.qaStatus ?? null), type: 'qa' },
    { label: 'Approval Status', values: slots.map((s) => s?.approvalStatus ?? null) },
    { label: 'Resolution', values: slots.map((s) => s?.resolution ?? null) },
    { label: 'Dependency Risk', values: slots.map((s) => s?.dependencyRiskLevel ?? null) },
    { label: 'Blocker', values: slots.map((s) => s?.blockerFlag ?? false), type: 'bool' },
    { label: 'Cross-Team Dep.', values: slots.map((s) => s?.crossTeamDependency ?? false), type: 'bool' },
    { label: 'DoD Items', values: slots.map((s) => { const items = s?.definitionOfDone ?? []; return items.length === 0 ? null : `${items.filter(d => d.checked).length}/${items.length} done`; }) },
  ];

  const colWidth = slots.length === 2 ? 'w-[38%]' : 'w-[28%]';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <GitCompare size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Story Comparison</h1>
          <p className="text-sm text-slate-500">Compare up to {MAX_STORIES} stories side by side</p>
        </div>
        {selected.length >= 2 && (
          <div className="ml-auto flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            <CheckCircle2 size={15} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">Comparing {selected.length} stories</span>
          </div>
        )}
      </div>

      {/* Story Pickers */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
        {slots.map((s, idx) => (
          <div key={idx} className="relative">
            <StoryPicker
              selected={s}
              onSelect={(story) => setSlot(idx, story)}
              excluded={excluded.filter((id) => id !== s?.id)}
            />
            {slots.length > 2 && (
              <button
                onClick={() => removeSlot(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {slots.length < MAX_STORIES && (
          <button
            onClick={addSlot}
            className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
          >
            <Plus size={18} />
            <span className="text-xs font-medium">Add 3rd story</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {selected.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-surface-border">
          <GitCompare size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-1">No stories selected</p>
          <p className="text-sm text-slate-400">Pick at least 2 stories above to start comparing</p>
        </div>
      )}

      {selected.length === 1 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-5 py-4">
          <AlertCircle size={18} className="text-brand-500 flex-shrink-0" />
          <p className="text-sm text-brand-700">Select one more story to start the comparison</p>
        </div>
      )}

      {/* Comparison table */}
      {selected.length >= 2 && (
        <div className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm">
          <table className="w-full">
            <colgroup>
              <col className="w-[20%]" />
              {slots.map((_, i) => <col key={i} className={colWidth} />)}
            </colgroup>

            {/* Sticky story title header */}
            <thead>
              <tr className="border-b border-surface-border bg-slate-50">
                <th className="px-5 py-4 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field</span>
                </th>
                {slots.map((s, idx) => (
                  <th key={idx} className="px-5 py-4 text-left border-l border-surface-border">
                    {s ? (
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{s.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">#{s.id.slice(-6)}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Empty slot</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {/* ── Overview Section ── */}
              <SectionHeader label="Overview" open={openSections.overview} onToggle={() => toggleSection('overview')} />
              {openSections.overview && overviewRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500">{row.label}</td>
                  {slots.map((s, idx) => (
                    <td key={idx} className="px-5 py-3 border-l border-slate-100">
                      <CellContent
                        value={row.values[idx]}
                        type={row.type}
                        highlight={row.highlights?.includes(idx)}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Description Section ── */}
              <SectionHeader label="Description & Criteria" open={openSections.description} onToggle={() => toggleSection('description')} />
              {openSections.description && descRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 align-top">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500 pt-4">{row.label}</td>
                  {slots.map((s, idx) => (
                    <td key={idx} className="px-5 py-3 border-l border-slate-100 text-xs text-slate-600 leading-relaxed max-w-xs">
                      <CellContent value={row.values[idx]} type={row.type} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Dev & Release Section ── */}
              <SectionHeader label="Dev & Release" open={openSections.dev} onToggle={() => toggleSection('dev')} />
              {openSections.dev && devRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500">{row.label}</td>
                  {slots.map((s, idx) => (
                    <td key={idx} className="px-5 py-3 border-l border-slate-100">
                      <CellContent value={row.values[idx]} type={row.type} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Business Context Section ── */}
              <SectionHeader label="Business Context" open={openSections.business} onToggle={() => toggleSection('business')} />
              {openSections.business && bizRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500">{row.label}</td>
                  {slots.map((s, idx) => (
                    <td key={idx} className="px-5 py-3 border-l border-slate-100">
                      <CellContent value={row.values[idx]} type={row.type} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* ── Quality Section ── */}
              <SectionHeader label="Quality & Risk" open={openSections.quality} onToggle={() => toggleSection('quality')} />
              {openSections.quality && qualityRows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500">{row.label}</td>
                  {slots.map((s, idx) => (
                    <td key={idx} className="px-5 py-3 border-l border-slate-100">
                      <CellContent value={row.values[idx]} type={row.type} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
