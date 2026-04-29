import { useState, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Timer, ThumbsUp, Layout, ChevronDown,
  Play, Pause, RotateCcw, Layers, Megaphone, Target,
  BarChart2, CheckCircle2, X, Edit2, Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
type CeremonyType = 'retro' | 'planning' | 'standup' | 'pi';

interface StickyNote {
  id: string;
  text: string;
  color: NoteColor;
  votes: number;
  sectionId: string;
  author: string;
}

interface BoardSection {
  id: string;
  title: string;
  icon: string;
  color: string;
  notes: StickyNote[];
}

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: Record<CeremonyType, { label: string; icon: typeof Target; sections: Omit<BoardSection, 'notes'>[] }> = {
  retro: {
    label: 'Retrospective',
    icon: RotateCcw,
    sections: [
      { id: 'went_well', title: 'Went Well 🎉', icon: '🎉', color: '#10B981' },
      { id: 'improve', title: 'To Improve 🔧', icon: '🔧', color: '#F59E0B' },
      { id: 'action', title: 'Action Items ✅', icon: '✅', color: '#3B82F6' },
      { id: 'shoutouts', title: 'Shoutouts 🙌', icon: '🙌', color: '#8B5CF6' },
    ],
  },
  planning: {
    label: 'Sprint Planning',
    icon: Target,
    sections: [
      { id: 'goal', title: 'Sprint Goal 🎯', icon: '🎯', color: '#4F6EF7' },
      { id: 'committed', title: 'Committed Stories 📋', icon: '📋', color: '#10B981' },
      { id: 'risks', title: 'Risks & Blockers ⚠️', icon: '⚠️', color: '#EF4444' },
      { id: 'capacity', title: 'Capacity Notes 🗓', icon: '🗓', color: '#F59E0B' },
    ],
  },
  standup: {
    label: 'Daily Standup',
    icon: Megaphone,
    sections: [
      { id: 'yesterday', title: 'Yesterday ✔️', icon: '✔️', color: '#6366F1' },
      { id: 'today', title: 'Today 🔨', icon: '🔨', color: '#10B981' },
      { id: 'blockers', title: 'Blockers 🚧', icon: '🚧', color: '#EF4444' },
    ],
  },
  pi: {
    label: 'PI Planning',
    icon: BarChart2,
    sections: [
      { id: 'vision', title: 'Vision 🔭', icon: '🔭', color: '#4F6EF7' },
      { id: 'features', title: 'Features 🧩', icon: '🧩', color: '#8B5CF6' },
      { id: 'dependencies', title: 'Dependencies 🔗', icon: '🔗', color: '#F59E0B' },
      { id: 'objectives', title: 'PI Objectives 🏆', icon: '🏆', color: '#10B981' },
      { id: 'risks_pi', title: 'ROAM Risks ⚠️', icon: '⚠️', color: '#EF4444' },
    ],
  },
};

const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; text: string }> = {
  yellow:  { bg: '#FEF9C3', border: '#FDE047', text: '#713F12' },
  blue:    { bg: '#DBEAFE', border: '#93C5FD', text: '#1E3A8A' },
  green:   { bg: '#DCFCE7', border: '#86EFAC', text: '#14532D' },
  pink:    { bg: '#FCE7F3', border: '#F9A8D4', text: '#831843' },
  purple:  { bg: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' },
  orange:  { bg: '#FFEDD5', border: '#FDBA74', text: '#7C2D12' },
};

const COLOR_OPTIONS: NoteColor[] = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'];

// ─── Timer ────────────────────────────────────────────────────────────────────

function CeremonyTimer() {
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);
  const [preset, setPreset] = useState(300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const pause = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
  };

  const reset = () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setSeconds(preset);
  };

  const setPresetTime = (s: number) => { setPreset(s); setSeconds(s); clearInterval(intervalRef.current!); setRunning(false); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const urgent = seconds <= 30 && seconds > 0;
  const done = seconds === 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${done ? 'bg-red-50 border-red-300' : urgent ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
      <Timer size={16} className={done ? 'text-red-500' : urgent ? 'text-amber-500' : 'text-slate-400'} />
      <span className={`font-mono text-lg font-bold ${done ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-slate-700'}`}>{mm}:{ss}</span>
      <div className="flex gap-1">
        {[1, 2, 5, 10, 15].map((m) => (
          <button key={m} onClick={() => setPresetTime(m * 60)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${preset === m * 60 ? 'bg-brand-500 text-white border-brand-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {m}m
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {!running ? (
          <button onClick={start} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"><Play size={13} /></button>
        ) : (
          <button onClick={pause} className="p-1.5 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200"><Pause size={13} /></button>
        )}
        <button onClick={reset} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><RotateCcw size={13} /></button>
      </div>
      {done && <span className="text-xs font-bold text-red-500 animate-pulse">TIME'S UP!</span>}
    </div>
  );
}

// ─── Sticky Note ──────────────────────────────────────────────────────────────

function StickyNoteCard({ note, onVote, onDelete, onEdit, votingMode }: {
  note: StickyNote;
  onVote: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
  votingMode: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const { bg, border, text } = NOTE_COLORS[note.color];

  const save = () => { onEdit(draft); setEditing(false); };

  return (
    <div
      className="relative rounded-lg p-3 shadow-sm min-h-[90px] flex flex-col justify-between group transition-shadow hover:shadow-md"
      style={{ backgroundColor: bg, borderWidth: '1.5px', borderStyle: 'solid', borderColor: border }}
    >
      {/* Actions */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1 rounded bg-white/70 hover:bg-white text-slate-500">
            <Edit2 size={10} />
          </button>
        )}
        <button onClick={onDelete} className="p-1 rounded bg-white/70 hover:bg-white text-red-400">
          <X size={10} />
        </button>
      </div>

      {/* Text */}
      {editing ? (
        <div className="flex-1">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full text-xs resize-none bg-transparent outline-none"
            style={{ color: text, minHeight: '60px' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) save(); if (e.key === 'Escape') setEditing(false); }}
          />
          <div className="flex gap-1 mt-1">
            <button onClick={save} className="p-1 rounded bg-white/80 text-green-600"><Check size={10} /></button>
            <button onClick={() => setEditing(false)} className="p-1 rounded bg-white/80 text-slate-400"><X size={10} /></button>
          </div>
        </div>
      ) : (
        <p className="text-xs leading-relaxed flex-1 whitespace-pre-wrap" style={{ color: text }}>{note.text || <span className="opacity-40 italic">Click edit to add text</span>}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs opacity-50" style={{ color: text }}>{note.author}</span>
        {votingMode ? (
          <button onClick={onVote}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/70 hover:bg-white transition-colors"
            style={{ color: text }}>
            <ThumbsUp size={10} /> {note.votes}
          </button>
        ) : (
          note.votes > 0 && (
            <span className="flex items-center gap-1 text-xs opacity-60" style={{ color: text }}>
              <ThumbsUp size={9} /> {note.votes}
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

let idCounter = 1;
const uid = () => `note_${Date.now()}_${idCounter++}`;

export function CeremonyBoardPage() {
  const [ceremony, setCeremony] = useState<CeremonyType>('retro');
  const [sections, setSections] = useState<BoardSection[]>(() =>
    TEMPLATES.retro.sections.map((s) => ({ ...s, notes: [] }))
  );
  const [votingMode, setVotingMode] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [activeColor, setActiveColor] = useState<NoteColor>('yellow');
  const [authorName, setAuthorName] = useState('You');
  const menuRef = useRef<HTMLDivElement>(null);

  const loadTemplate = useCallback((type: CeremonyType) => {
    setCeremony(type);
    setSections(TEMPLATES[type].sections.map((s) => ({ ...s, notes: [] })));
    setShowTemplateMenu(false);
    setVotingMode(false);
  }, []);

  const addNote = (sectionId: string) => {
    const newNote: StickyNote = { id: uid(), text: '', color: activeColor, votes: 0, sectionId, author: authorName };
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, notes: [...s.notes, newNote] } : s));
  };

  const deleteNote = (sectionId: string, noteId: string) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) } : s));
  };

  const voteNote = (sectionId: string, noteId: string) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, notes: s.notes.map((n) => n.id === noteId ? { ...n, votes: n.votes + 1 } : n) } : s));
  };

  const editNote = (sectionId: string, noteId: string, text: string) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, notes: s.notes.map((n) => n.id === noteId ? { ...n, text } : n) } : s));
  };

  const clearBoard = () => {
    setSections((prev) => prev.map((s) => ({ ...s, notes: [] })));
  };

  const totalNotes = sections.reduce((acc, s) => acc + s.notes.length, 0);
  const totalVotes = sections.reduce((acc, s) => acc + s.notes.reduce((a, n) => a + n.votes, 0), 0);
  const topNote = sections.flatMap((s) => s.notes).sort((a, b) => b.votes - a.votes)[0];

  const tmpl = TEMPLATES[ceremony];
  const TmplIcon = tmpl.icon;

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <TmplIcon size={20} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ceremony Board</h1>
            <p className="text-sm text-slate-500">{tmpl.label} · {totalNotes} notes{totalVotes > 0 ? ` · ${totalVotes} votes` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Author */}
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-28 outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Your name"
          />

          {/* Color picker */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setActiveColor(c)}
                className={`w-5 h-5 rounded-full transition-all ${activeColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                style={{ backgroundColor: NOTE_COLORS[c].bg, borderWidth: 1.5, borderColor: NOTE_COLORS[c].border }}
                title={c}
              />
            ))}
          </div>

          {/* Voting toggle */}
          <button
            onClick={() => setVotingMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${votingMode ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <ThumbsUp size={14} /> {votingMode ? 'Voting ON' : 'Vote Mode'}
          </button>

          {/* Template switcher */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowTemplateMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Layout size={14} /> Template <ChevronDown size={12} />
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {(Object.entries(TEMPLATES) as [CeremonyType, typeof TEMPLATES[CeremonyType]][]).map(([key, t]) => {
                  const Icon = t.icon;
                  return (
                    <button key={key} onClick={() => loadTemplate(key)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${ceremony === key ? 'text-brand-600 font-semibold bg-brand-50' : 'text-slate-700'}`}>
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clear */}
          <button onClick={clearBoard} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50">
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-5">
        <CeremonyTimer />
      </div>

      {/* Stats (voting summary) */}
      {votingMode && totalVotes > 0 && topNote && (
        <div className="mb-5 bg-brand-50 border border-brand-200 rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-brand-500" />
            <span className="text-sm font-semibold text-brand-700">Top Voted:</span>
            <span className="text-sm text-slate-700 line-clamp-1 max-w-xs">"{topNote.text}"</span>
          </div>
          <span className="text-sm text-brand-600 font-bold">{topNote.votes} votes</span>
          <span className="text-xs text-slate-400 ml-auto">{totalVotes} total votes across {totalNotes} notes</span>
        </div>
      )}

      {/* Board sections grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(sections.length, 4)}, minmax(220px, 1fr))` }}
      >
        {sections.map((section) => {
          const sortedNotes = votingMode
            ? [...section.notes].sort((a, b) => b.votes - a.votes)
            : section.notes;

          return (
            <div key={section.id} className="flex flex-col min-h-[400px]">
              {/* Section header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                  <h3 className="text-sm font-bold text-slate-700">{section.title}</h3>
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{section.notes.length}</span>
                </div>
                <button
                  onClick={() => addNote(section.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                  title="Add note"
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Notes column */}
              <div
                className="flex-1 rounded-xl p-3 space-y-2.5 border-2 border-dashed min-h-[380px] transition-colors"
                style={{ borderColor: section.color + '40', backgroundColor: section.color + '08' }}
              >
                {sortedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-3xl mb-2">{section.icon}</p>
                    <p className="text-xs text-slate-400">Click + to add a note</p>
                  </div>
                ) : (
                  sortedNotes.map((note) => (
                    <StickyNoteCard
                      key={note.id}
                      note={note}
                      votingMode={votingMode}
                      onVote={() => voteNote(section.id, note.id)}
                      onDelete={() => deleteNote(section.id, note.id)}
                      onEdit={(text) => editNote(section.id, note.id, text)}
                    />
                  ))
                )}

                {/* Quick add */}
                <button
                  onClick={() => addNote(section.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-white/60 border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                >
                  <Plus size={12} /> Add sticky note
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 flex-wrap text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><Layers size={12} /> Template sections auto-reset when switching ceremonies</span>
        <span className="flex items-center gap-1.5"><ThumbsUp size={12} /> Enable Vote Mode to dot-vote on notes</span>
        <span className="flex items-center gap-1.5"><Timer size={12} /> Use the timer to timebox each agenda item</span>
        <span className="flex items-center gap-1.5"><Edit2 size={12} /> Hover a note and click the pencil to edit</span>
      </div>
    </div>
  );
}
