import { useState, useMemo } from 'react';
import {
  Plus, ThumbsUp, ThumbsDown, Trash2, Edit2, Check, X,
  Download, ChevronDown, TrendingUp, Users, Zap, BarChart2,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { RetroCategory, RetroItemStatus, RetroItem } from '../types';
import { Button } from '../components/ui/Button';

// ─── Column config ─────────────────────────────────────────────────────────────
const COLUMN_CONFIG: {
  category: RetroCategory;
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  headerBg: string;
  addBtnClass: string;
}[] = [
  {
    category: 'went_well',
    label: 'What Went Well',
    icon: <TrendingUp size={16} />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    headerBg: 'bg-green-100',
    addBtnClass: 'border-green-300 text-green-700 hover:bg-green-100',
  },
  {
    category: 'improvement',
    label: 'Needs Improvement',
    icon: <Zap size={16} />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    headerBg: 'bg-amber-100',
    addBtnClass: 'border-amber-300 text-amber-700 hover:bg-amber-100',
  },
  {
    category: 'action_item',
    label: 'Action Items',
    icon: <BarChart2 size={16} />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    headerBg: 'bg-blue-100',
    addBtnClass: 'border-blue-300 text-blue-700 hover:bg-blue-100',
  },
];

const STATUS_LABELS: Record<RetroItemStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
};

const STATUS_COLORS: Record<RetroItemStatus, string> = {
  open: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  done: 'bg-green-100 text-green-700 border-green-200',
};

// ─── Avatar helper ─────────────────────────────────────────────────────────────
function MemberAvatar({ memberId, members }: { memberId?: string; members: { id: string; avatarInitials: string; avatarColor: string; name: string }[] }) {
  const member = members.find(m => m.id === memberId);
  if (!member) return null;
  return (
    <span
      title={member.name}
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: member.avatarColor }}
    >
      {member.avatarInitials}
    </span>
  );
}

// ─── Add Item Form ─────────────────────────────────────────────────────────────
function AddItemForm({
  category,
  sprintId,
  members,
  onClose,
}: {
  category: RetroCategory;
  sprintId: string;
  members: { id: string; name: string; avatarInitials: string; avatarColor: string }[];
  onClose: () => void;
}) {
  const addRetroItem = useScrumStore(s => s.addRetroItem);
  const [text, setText] = useState('');
  const [authorId, setAuthorId] = useState(members[0]?.id ?? '');
  const [actionItem, setActionItem] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addRetroItem({
      sprintId,
      category,
      text: text.trim(),
      authorId: authorId || undefined,
      votes: 0,
      actionItem: category === 'action_item' ? actionItem.trim() || undefined : undefined,
      assigneeId: category === 'action_item' ? assigneeId || undefined : undefined,
      status: 'open',
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 rounded-lg border border-slate-200 bg-white shadow-sm space-y-3">
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe this item..."
        className="w-full text-sm border border-slate-200 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
        rows={3}
      />
      <div className="flex flex-col gap-2">
        <select
          value={authorId}
          onChange={e => setAuthorId(e.target.value)}
          className="text-sm border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">— Author (optional) —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {category === 'action_item' && (
          <>
            <input
              type="text"
              value={actionItem}
              onChange={e => setActionItem(e.target.value)}
              placeholder="Concrete next step..."
              className="text-sm border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="text-sm border border-slate-200 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">— Assignee (optional) —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X size={14} /> Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!text.trim()}>
          <Check size={14} /> Add
        </Button>
      </div>
    </form>
  );
}

// ─── Retro Card ────────────────────────────────────────────────────────────────
function RetroCard({
  item,
  members,
  colCfg,
}: {
  item: RetroItem;
  members: { id: string; name: string; avatarInitials: string; avatarColor: string }[];
  colCfg: typeof COLUMN_CONFIG[number];
}) {
  const updateRetroItem = useScrumStore(s => s.updateRetroItem);
  const deleteRetroItem = useScrumStore(s => s.deleteRetroItem);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [editActionItem, setEditActionItem] = useState(item.actionItem ?? '');
  const [editAssigneeId, setEditAssigneeId] = useState(item.assigneeId ?? '');

  function handleSave() {
    updateRetroItem(item.id, {
      text: editText.trim() || item.text,
      actionItem: editActionItem.trim() || undefined,
      assigneeId: editAssigneeId || undefined,
    });
    setEditing(false);
  }

  function handleVote(delta: number) {
    updateRetroItem(item.id, { votes: Math.max(0, item.votes + delta) });
  }

  function handleStatusChange(status: RetroItemStatus) {
    updateRetroItem(item.id, { status });
  }

  const assignee = members.find(m => m.id === item.assigneeId);

  return (
    <div className={`rounded-lg border ${colCfg.border} ${colCfg.bg} p-3 shadow-sm`}>
      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
            rows={3}
          />
          {item.category === 'action_item' && (
            <>
              <input
                type="text"
                value={editActionItem}
                onChange={e => setEditActionItem(e.target.value)}
                placeholder="Concrete next step..."
                className="w-full text-sm border border-slate-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <select
                value={editAssigneeId}
                onChange={e => setEditAssigneeId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">— Assignee —</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
            <button onClick={handleSave} className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium">
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-800 leading-snug">{item.text}</p>

          {item.category === 'action_item' && item.actionItem && (
            <p className="text-xs text-blue-600 mt-1 font-medium">→ {item.actionItem}</p>
          )}

          <div className="mt-2 flex items-center justify-between flex-wrap gap-1">
            {/* Left: author + assignee */}
            <div className="flex items-center gap-1.5">
              <MemberAvatar memberId={item.authorId} members={members} />
              {item.category === 'action_item' && assignee && (
                <>
                  <span className="text-xs text-slate-400">→</span>
                  <MemberAvatar memberId={item.assigneeId} members={members} />
                  <span className="text-xs text-slate-500">{assignee.name}</span>
                </>
              )}
            </div>

            {/* Right: vote controls + edit/delete */}
            <div className="flex items-center gap-1">
              {item.category === 'action_item' && (
                <select
                  value={item.status}
                  onChange={e => handleStatusChange(e.target.value as RetroItemStatus)}
                  className={`text-xs rounded-full border px-2 py-0.5 font-medium ${STATUS_COLORS[item.status]} focus:outline-none`}
                >
                  {(Object.keys(STATUS_LABELS) as RetroItemStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleVote(-1)}
                className="p-1 rounded hover:bg-white/60 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove vote"
              >
                <ThumbsDown size={13} />
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[20px] text-center">{item.votes}</span>
              <button
                onClick={() => handleVote(1)}
                className="p-1 rounded hover:bg-white/60 text-slate-400 hover:text-green-600 transition-colors"
                title="Upvote"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1 rounded hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors"
                title="Edit"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => deleteRetroItem(item.id)}
                className="p-1 rounded hover:bg-white/60 text-slate-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Retro Column ──────────────────────────────────────────────────────────────
function RetroColumn({
  cfg,
  items,
  sprintId,
  members,
}: {
  cfg: typeof COLUMN_CONFIG[number];
  items: RetroItem[];
  sprintId: string;
  members: { id: string; name: string; avatarInitials: string; avatarColor: string }[];
}) {
  const [adding, setAdding] = useState(false);
  const sorted = [...items].sort((a, b) => b.votes - a.votes);

  return (
    <div className="flex flex-col min-w-0">
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${cfg.headerBg} border ${cfg.border} border-b-0`}>
        <div className={`flex items-center gap-1.5 font-semibold text-sm ${cfg.text}`}>
          {cfg.icon}
          {cfg.label}
        </div>
        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className={`flex-1 rounded-b-lg border ${cfg.border} ${cfg.bg} p-2 space-y-2 min-h-[300px]`}>
        {sorted.map(item => (
          <RetroCard key={item.id} item={item} members={members} colCfg={cfg} />
        ))}

        {adding ? (
          <AddItemForm
            category={cfg.category}
            sprintId={sprintId}
            members={members}
            onClose={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className={`w-full flex items-center gap-1.5 text-sm font-medium rounded-lg border border-dashed px-3 py-2 transition-colors ${cfg.addBtnClass}`}
          >
            <Plus size={14} /> Add item
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Trend View ────────────────────────────────────────────────────────────────
function TrendView({ allItems, sprints, members }: {
  allItems: RetroItem[];
  sprints: { id: string; name: string }[];
  members: { id: string; name: string; avatarInitials: string; avatarColor: string }[];
}) {
  // Count theme repetitions: same keyword across multiple sprints
  const themeCounts: Record<string, { count: number; sprints: string[]; category: RetroCategory }> = {};

  allItems.forEach(item => {
    const words = item.text.toLowerCase().split(/\W+/).filter(w => w.length > 5);
    words.forEach(word => {
      if (!themeCounts[word]) {
        themeCounts[word] = { count: 0, sprints: [], category: item.category };
      }
      themeCounts[word].count += 1;
      if (!themeCounts[word].sprints.includes(item.sprintId)) {
        themeCounts[word].sprints.push(item.sprintId);
      }
    });
  });

  const repeatedThemes = Object.entries(themeCounts)
    .filter(([, v]) => v.sprints.length >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  if (repeatedThemes.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No repeated themes yet. Run more retrospectives to see trends.
      </div>
    );
  }

  const categoryColor: Record<RetroCategory, string> = {
    went_well: 'bg-green-100 text-green-700',
    improvement: 'bg-amber-100 text-amber-700',
    action_item: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Themes that appear in multiple sprints (from all retro items).</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {repeatedThemes.map(([theme, data]) => (
          <div key={theme} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-800 capitalize">{theme}</span>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${categoryColor[data.category]}`}>
                {data.category === 'went_well' ? 'Went Well' : data.category === 'improvement' ? 'Improvement' : 'Action'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Appeared in {data.sprints.length} sprint{data.sprints.length > 1 ? 's' : ''}:{' '}
              {data.sprints.map(sid => sprints.find(sp => sp.id === sid)?.name ?? sid).join(', ')}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, (data.count / allItems.length) * 500)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">{data.count}×</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Summary Section ───────────────────────────────────────────────────────────
function RetroSummary({ items, members }: {
  items: RetroItem[];
  members: { id: string; name: string; avatarInitials: string; avatarColor: string }[];
}) {
  const byCategory = (cat: RetroCategory) => items.filter(i => i.category === cat);
  const topVoted = (cat: RetroCategory) =>
    byCategory(cat).sort((a, b) => b.votes - a.votes).slice(0, 3);

  const CATS: { cat: RetroCategory; label: string; color: string }[] = [
    { cat: 'went_well', label: 'What Went Well', color: 'text-green-700' },
    { cat: 'improvement', label: 'Needs Improvement', color: 'text-amber-700' },
    { cat: 'action_item', label: 'Action Items', color: 'text-blue-700' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Retrospective Summary</h3>
      <div className="grid gap-6 md:grid-cols-3">
        {CATS.map(({ cat, label, color }) => {
          const catItems = byCategory(cat);
          const top = topVoted(cat);
          return (
            <div key={cat}>
              <div className={`font-semibold text-sm ${color} mb-2`}>
                {label} ({catItems.length})
              </div>
              {top.length === 0 ? (
                <p className="text-xs text-slate-400">No items yet.</p>
              ) : (
                <ul className="space-y-2">
                  {top.map(item => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-slate-500 mt-0.5 w-5 shrink-0">{item.votes}▲</span>
                      <p className="text-xs text-slate-700 leading-snug">{item.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              {cat === 'action_item' && catItems.length > 0 && (
                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div>Open: {catItems.filter(i => i.status === 'open').length}</div>
                  <div>In Progress: {catItems.filter(i => i.status === 'in_progress').length}</div>
                  <div>Done: {catItems.filter(i => i.status === 'done').length}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Export helper ─────────────────────────────────────────────────────────────
function exportRetroSummary(items: RetroItem[], sprintName: string) {
  const lines: string[] = [`# Retrospective Summary – ${sprintName}`, ''];

  const sections: { cat: RetroCategory; label: string }[] = [
    { cat: 'went_well', label: 'What Went Well' },
    { cat: 'improvement', label: 'Needs Improvement' },
    { cat: 'action_item', label: 'Action Items' },
  ];

  sections.forEach(({ cat, label }) => {
    const catItems = items.filter(i => i.category === cat).sort((a, b) => b.votes - a.votes);
    lines.push(`## ${label}`);
    if (catItems.length === 0) {
      lines.push('*(none)*');
    } else {
      catItems.forEach(item => {
        lines.push(`- [${item.votes}▲] ${item.text}`);
        if (item.actionItem) lines.push(`  → Next step: ${item.actionItem}`);
        if (item.status && cat === 'action_item') lines.push(`  Status: ${item.status}`);
      });
    }
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retro-${sprintName.replace(/\s+/g, '-').toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RetrospectivePage() {
  const sprints = useScrumStore(s => s.sprints);
  const retroItems = useScrumStore(s => s.retroItems ?? []);
  const members = useScrumStore(s => s.members);
  const activeSprintId = useScrumStore(s => s.activeSprintId);

  const completedSprints = sprints.filter(s => s.status === 'completed' || s.status === 'active');
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    activeSprintId ?? completedSprints[completedSprints.length - 1]?.id ?? sprints[0]?.id ?? ''
  );
  const [activeTab, setActiveTab] = useState<'board' | 'trends'>('board');

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);
  const sprintItems = retroItems.filter(i => i.sprintId === selectedSprintId);

  const allItems = retroItems;

  const sprintOptions = useMemo(() =>
    [...sprints].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [sprints]
  );

  if (sprints.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-lg font-semibold mb-2">No sprints yet</p>
        <p className="text-sm">Create a sprint first to run a retrospective.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retrospective</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Capture what went well, what to improve, and commit to action items.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sprint selector */}
          <div className="relative">
            <select
              value={selectedSprintId}
              onChange={e => setSelectedSprintId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {sprintOptions.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Export */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportRetroSummary(sprintItems, selectedSprint?.name ?? 'Sprint')}
          >
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['board', 'trends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'board' ? 'Board' : 'Trends'}
          </button>
        ))}
      </div>

      {activeTab === 'board' ? (
        <>
          {/* Sprint goal banner */}
          {selectedSprint?.goal && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sprint Goal</span>
              <p className="text-sm text-slate-700 mt-0.5">{selectedSprint.goal}</p>
            </div>
          )}

          {/* 3-column board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMN_CONFIG.map(cfg => (
              <RetroColumn
                key={cfg.category}
                cfg={cfg}
                items={sprintItems.filter(i => i.category === cfg.category)}
                sprintId={selectedSprintId}
                members={members}
              />
            ))}
          </div>

          {/* Summary */}
          {sprintItems.length > 0 && (
            <RetroSummary items={sprintItems} members={members} />
          )}
        </>
      ) : (
        <TrendView allItems={allItems} sprints={sprints} members={members} />
      )}
    </div>
  );
}
