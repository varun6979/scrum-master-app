import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Flag, AlertCircle, Layers, Settings2 } from 'lucide-react';
import { useScrumStore, useActiveSprint } from '../store/useScrumStore';
import { KanbanBoard, SwimlaneBy } from '../components/board/KanbanBoard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { formatDate, getDaysLeft, sprintProgress } from '../lib/dateUtils';

const SWIMLANE_OPTIONS: { value: SwimlaneBy; label: string }[] = [
  { value: 'none', label: 'No Swimlanes' },
  { value: 'assignee', label: 'By Assignee' },
  { value: 'priority', label: 'By Priority' },
  { value: 'epic', label: 'By Epic' },
];

const WIP_COLUMNS = ['todo', 'in_progress', 'review', 'blocked'];

export function SprintBoard() {
  const { stories, completeSprint, settings, updateSettings } = useScrumStore();
  const activeSprint = useActiveSprint();
  const [confirming, setConfirming] = useState(false);
  const [swimlaneBy, setSwimlaneBy] = useState<SwimlaneBy>('none');
  const [showWipEditor, setShowWipEditor] = useState(false);
  const wipLimits: Record<string, number> = ((settings as unknown) as Record<string, unknown>).wipLimits as Record<string, number> ?? {};

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No Active Sprint</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm">
          There's no active sprint right now. Go to Sprint Management to create and start a sprint.
        </p>
        <Link to="/sprints">
          <Button variant="primary">Manage Sprints</Button>
        </Link>
      </div>
    );
  }

  const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id);
  const totalPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
  const donePoints = sprintStories
    .filter((s) => s.status === 'done')
    .reduce((sum, s) => sum + s.storyPoints, 0);
  const progress = sprintProgress(activeSprint.startDate, activeSprint.endDate);
  const daysLeft = getDaysLeft(activeSprint.endDate);

  const handleComplete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    completeSprint(activeSprint.id);
    setConfirming(false);
  };

  return (
    <div className="space-y-5">
      {/* Sprint header */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{activeSprint.name}</h1>
              <Badge variant="sprint" value={activeSprint.status} />
            </div>
            {activeSprint.goal && (
              <p className="text-sm text-slate-500 flex items-start gap-1.5 mt-1">
                <Flag size={13} className="mt-0.5 flex-shrink-0 text-brand-400" />
                {activeSprint.goal}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>{formatDate(activeSprint.startDate)} – {formatDate(activeSprint.endDate)}</span>
              <span className="font-medium text-slate-600">{daysLeft} days left</span>
              <span>{donePoints} / {totalPoints} pts done</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {confirming && (
              <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            )}
            <Button
              variant={confirming ? 'danger' : 'secondary'}
              size="sm"
              onClick={handleComplete}
            >
              <CheckSquare size={14} />
              {confirming ? 'Confirm Complete' : 'Complete Sprint'}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Sprint Progress</span>
            <span>{progress}% elapsed</span>
          </div>
          <ProgressBar value={progress} size="md" />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Points: {donePoints}/{totalPoints}</span>
            <span>{totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}% completed</span>
          </div>
        </div>
      </div>

      {/* Board controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Swimlanes:</span>
          <div className="flex items-center gap-1 bg-white border border-surface-border rounded-lg p-1">
            {SWIMLANE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setSwimlaneBy(opt.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${swimlaneBy === opt.value ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowWipEditor((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-surface-border rounded-lg text-slate-500 hover:bg-slate-50 bg-white">
          <Settings2 size={13} /> WIP Limits
        </button>
        {showWipEditor && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-xs font-semibold text-amber-700">WIP Limits:</span>
            {WIP_COLUMNS.map((col) => (
              <label key={col} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="capitalize">{col.replace('_', ' ')}:</span>
                <input type="number" min={0} max={50}
                  value={wipLimits[col] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    const next = { ...wipLimits };
                    if (val === undefined) delete next[col]; else next[col] = val;
                    updateSettings({ wipLimits: next } as Parameters<typeof updateSettings>[0]);
                  }}
                  placeholder="∞"
                  className="w-12 border border-amber-300 rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-amber-400 bg-white" />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Kanban board */}
      <KanbanBoard sprintId={activeSprint.id} swimlaneBy={swimlaneBy} wipLimits={wipLimits} />
    </div>
  );
}
