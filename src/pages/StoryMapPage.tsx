import { useState, useMemo } from 'react';
import { Plus, X, Map, ChevronRight } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Story } from '../types';
import { StoryModal } from '../components/story/StoryModal';

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-600 border-slate-200',
  todo: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  blocked: 'bg-red-100 text-red-700 border-red-200',
  done: 'bg-green-100 text-green-700 border-green-200',
};

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-amber-400', low: 'bg-blue-400',
};

function StoryCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const { members, epics } = useScrumStore();
  const assignee = members.find((m) => m.id === story.assigneeId);
  const epic = epics.find((e) => e.id === story.epicId);
  return (
    <div
      onClick={onClick}
      className="bg-white border border-surface-border rounded-lg p-2.5 cursor-pointer hover:shadow-md hover:border-brand-300 transition-all min-w-[160px] max-w-[190px] flex-shrink-0"
    >
      {epic && <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: epic.color }} />}
      <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2 mb-2">{story.title}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[story.status]}`}>
          {story.status.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-1.5">
          {story.priority && <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[story.priority]}`} />}
          <span className="text-xs text-slate-400 font-medium">{story.storyPoints}pt</span>
          {assignee && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
              style={{ backgroundColor: assignee.avatarColor, fontSize: '8px' }}>
              {assignee.avatarInitials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoryMapPage() {
  const { stories, epics, features, sprints } = useScrumStore();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupBy, setGroupBy] = useState<'epic' | 'feature' | 'sprint'>('epic');

  // Build the map: rows = groups (epics/features/sprints), cols = stories
  const rows = useMemo(() => {
    if (groupBy === 'epic') {
      return epics.map((epic) => ({
        id: epic.id,
        label: epic.title,
        color: epic.color,
        stories: stories.filter((s) => s.epicId === epic.id),
      }));
    }
    if (groupBy === 'feature') {
      const featureList = features ?? [];
      const rows = featureList.map((f) => ({
        id: f.id,
        label: f.title,
        color: epics.find((e) => e.id === f.epicId)?.color ?? '#94A3B8',
        stories: stories.filter((s) => s.featureId === f.id || f.storyIds.includes(s.id)),
      }));
      const linkedIds = new Set(rows.flatMap((r) => r.stories.map((s) => s.id)));
      const unlinked = stories.filter((s) => !linkedIds.has(s.id));
      if (unlinked.length) rows.push({ id: '__none__', label: 'No Feature', color: '#94A3B8', stories: unlinked });
      return rows;
    }
    // sprint
    const sprintRows = sprints.map((sp) => ({
      id: sp.id,
      label: sp.name,
      color: sp.status === 'active' ? '#4F6EF7' : sp.status === 'completed' ? '#10B981' : '#F59E0B',
      stories: stories.filter((s) => s.sprintId === sp.id),
    }));
    const backlog = stories.filter((s) => !s.sprintId);
    if (backlog.length) sprintRows.push({ id: '__backlog__', label: 'Backlog', color: '#94A3B8', stories: backlog });
    return sprintRows;
  }, [groupBy, epics, features, stories, sprints]);

  const totalStories = stories.length;
  const doneStories = stories.filter((s) => s.status === 'done').length;
  const totalPoints = stories.reduce((sum, s) => sum + s.storyPoints, 0);

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Map size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Story Map</h1>
            <p className="text-sm text-slate-500">Visual backlog organized by {groupBy}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm text-slate-500 mr-2">
            <span><span className="font-bold text-slate-700">{doneStories}</span>/{totalStories} done</span>
            <span><span className="font-bold text-slate-700">{totalPoints}</span> pts total</span>
          </div>
          <div className="flex items-center gap-1 bg-white border border-surface-border rounded-lg p-1">
            {(['epic', 'feature', 'sprint'] as const).map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${groupBy === g ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {/* Map grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {rows.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-surface-border">
              <Map size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">No data to display</p>
            </div>
          )}

          {rows.map((row) => {
            const doneCount = row.stories.filter((s) => s.status === 'done').length;
            const pct = row.stories.length ? Math.round((doneCount / row.stories.length) * 100) : 0;
            return (
              <div key={row.id} className="mb-4">
                {/* Row header */}
                <div className="flex items-center gap-3 mb-2 sticky left-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} />
                  <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-slate-100 rounded-full w-20 overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{doneCount}/{row.stories.length}</span>
                  </div>
                  <ChevronRight size={13} className="text-slate-300" />
                </div>

                {/* Story cards row */}
                <div className="flex gap-3 flex-wrap">
                  {row.stories.length === 0 ? (
                    <div className="flex items-center justify-center w-44 h-20 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-300">No stories</p>
                    </div>
                  ) : (
                    row.stories.map((story) => (
                      <StoryCard key={story.id} story={story} onClick={() => { setSelectedStory(story); setModalOpen(true); }} />
                    ))
                  )}
                  <button
                    onClick={() => { setSelectedStory(null); setModalOpen(true); }}
                    className="flex items-center justify-center w-12 h-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 hover:border-brand-300 hover:text-brand-400 transition-colors flex-shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="h-px bg-slate-100 mt-4" />
              </div>
            );
          })}
        </div>
      </div>

      <StoryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedStory(null); }}
        story={selectedStory}
      />
    </div>
  );
}
