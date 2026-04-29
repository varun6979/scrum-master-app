import { useState, useMemo } from 'react';
import { Search, Plus, GripVertical, ChevronDown, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { StoryModal } from '../components/story/StoryModal';
import { Story, StoryStatus, Priority } from '../types';

export function Backlog() {
  const { stories, epics, members, sprints, assignStoryToSprint, updateStory, deleteStory } = useScrumStore();
  const [search, setSearch] = useState('');
  const [epicFilter, setEpicFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStory, setEditStory] = useState<Story | null>(null);
  const [sprintDropdown, setSprintDropdown] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSprintDropdown, setBulkSprintDropdown] = useState(false);

  const backlogStories = useMemo(
    () => stories.filter((s) => !s.sprintId || s.status === 'backlog'),
    [stories]
  );

  const filtered = useMemo(() => {
    return backlogStories.filter((s) => {
      const matchesSearch =
        !search || s.title.toLowerCase().includes(search.toLowerCase());
      const matchesEpic = epicFilter === 'all' || s.epicId === epicFilter;
      return matchesSearch && matchesEpic;
    });
  }, [backlogStories, search, epicFilter]);

  // Group by epic
  const grouped = useMemo(() => {
    const groups: Record<string, Story[]> = {};
    filtered.forEach((s) => {
      const key = s.epicId || 'no-epic';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [filtered]);

  const planningAndActiveSprints = sprints.filter(
    (sp) => sp.status === 'planning' || sp.status === 'active'
  );

  const handleAddToSprint = (storyId: string, sprintId: string) => {
    assignStoryToSprint(storyId, sprintId);
    setSprintDropdown(null);
  };

  const handleEdit = (story: Story) => {
    setEditStory(story);
    setIsModalOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkAssignSprint = (sprintId: string) => {
    selectedIds.forEach(id => assignStoryToSprint(id, sprintId));
    clearSelection();
    setBulkSprintDropdown(false);
  };

  const bulkSetPriority = (priority: Priority) => {
    selectedIds.forEach(id => updateStory(id, { priority }));
    clearSelection();
  };

  const bulkSetStatus = (status: StoryStatus) => {
    selectedIds.forEach(id => updateStory(id, { status }));
    clearSelection();
  };

  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selectedIds.size} stories? This cannot be undone.`)) return;
    selectedIds.forEach(id => deleteStory(id));
    clearSelection();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Backlog</h1>
          <p className="text-slate-500 text-sm mt-1">{backlogStories.length} stories in backlog</p>
        </div>
        <Button variant="primary" onClick={() => { setEditStory(null); setIsModalOpen(true); }}>
          <Plus size={16} /> Create Story
        </Button>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex-wrap">
          <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
          <span className="text-sm font-semibold text-brand-700">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-brand-200" />

          {/* Assign to sprint */}
          <div className="relative">
            <button onClick={() => setBulkSprintDropdown(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-300 rounded-lg text-xs font-medium text-brand-700 hover:bg-brand-50">
              Add to Sprint <ChevronDown size={11} />
            </button>
            {bulkSprintDropdown && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg border border-surface-border shadow-lg z-30">
                {planningAndActiveSprints.length === 0
                  ? <p className="text-xs text-slate-400 px-3 py-2">No sprints</p>
                  : planningAndActiveSprints.map(sp => (
                      <button key={sp.id} onClick={() => bulkAssignSprint(sp.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-medium text-slate-700">{sp.name}</button>
                    ))
                }
              </div>
            )}
          </div>

          {/* Change priority */}
          <select onChange={e => { if (e.target.value) bulkSetPriority(e.target.value as Priority); e.target.value = ''; }} defaultValue="" className="px-2 py-1.5 bg-white border border-brand-300 rounded-lg text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer focus:outline-none">
            <option value="" disabled>Set Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Change status */}
          <select onChange={e => { if (e.target.value) bulkSetStatus(e.target.value as StoryStatus); e.target.value = ''; }} defaultValue="" className="px-2 py-1.5 bg-white border border-brand-300 rounded-lg text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer focus:outline-none">
            <option value="" disabled>Set Status</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-300 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 ml-auto">
            <Trash2 size={13} /> Delete {selectedIds.size}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="w-full pl-9 pr-3 py-2 border border-surface-border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setEpicFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              epicFilter === 'all'
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-slate-600 border-surface-border hover:border-slate-300'
            }`}
          >
            All Epics
          </button>
          {epics.map((e) => (
            <button
              key={e.id}
              onClick={() => setEpicFilter(epicFilter === e.id ? 'all' : e.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                epicFilter === e.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-600 border-surface-border hover:border-slate-300'
              }`}
              style={epicFilter === e.id ? { backgroundColor: e.color, borderColor: e.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: e.color }}
              />
              {e.title}
            </button>
          ))}
        </div>
      </div>

      {/* Select all row */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600">
            {selectedIds.size === filtered.length && filtered.length > 0
              ? <CheckSquare size={14} className="text-brand-500" />
              : <Square size={14} />
            }
            {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect all' : `Select all (${filtered.length})`}
          </button>
        </div>
      )}

      {/* Story list grouped by epic */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Search size={20} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No stories found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([epicId, epicStories]) => {
            const epic = epics.find((e) => e.id === epicId);
            return (
              <div key={epicId}>
                {/* Epic header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: epic?.color ?? '#94A3B8' }}
                  />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {epic?.title ?? 'No Epic'}
                  </h3>
                  <span className="text-xs text-slate-400">({epicStories.length})</span>
                </div>

                {/* Story rows */}
                <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                  {epicStories.map((story, idx) => {
                    const assignee = story.assigneeId
                      ? members.find((m) => m.id === story.assigneeId)
                      : null;
                    return (
                      <div
                        key={story.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                          idx < epicStories.length - 1 ? 'border-b border-surface-border' : ''
                        } ${selectedIds.has(story.id) ? 'bg-brand-50' : ''}`}
                      >
                        <button onClick={() => toggleSelect(story.id)} className="flex-shrink-0 text-slate-400 hover:text-brand-500">
                          {selectedIds.has(story.id) ? <CheckSquare size={14} className="text-brand-500" /> : <Square size={14} />}
                        </button>
                        <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />

                        <div
                          className="w-2.5 h-full min-h-[20px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: epic?.color ?? '#94A3B8' }}
                        />

                        <Badge variant="priority" value={story.priority} />

                        <button
                          className="flex-1 text-sm font-medium text-slate-800 text-left hover:text-brand-600 truncate"
                          onClick={() => handleEdit(story)}
                        >
                          {story.title}
                        </button>

                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-2 py-0.5 flex-shrink-0">
                          {story.storyPoints}pt
                        </span>

                        {assignee ? (
                          <Avatar
                            initials={assignee.avatarInitials}
                            color={assignee.avatarColor}
                            size="sm"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-dashed border-slate-300 flex-shrink-0" />
                        )}

                        {/* Add to sprint dropdown */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() =>
                              setSprintDropdown(sprintDropdown === story.id ? null : story.id)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-surface-border rounded-lg hover:border-brand-300 hover:text-brand-600 text-slate-500 transition-colors"
                          >
                            Add to Sprint <ChevronDown size={11} />
                          </button>
                          {sprintDropdown === story.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-surface-border shadow-lg z-20">
                              {planningAndActiveSprints.length === 0 ? (
                                <p className="text-xs text-slate-400 px-3 py-2">No sprints available</p>
                              ) : (
                                planningAndActiveSprints.map((sp) => (
                                  <button
                                    key={sp.id}
                                    onClick={() => handleAddToSprint(story.id, sp.id)}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                                  >
                                    <span className="font-medium text-slate-700">{sp.name}</span>
                                    <Badge variant="sprint" value={sp.status} />
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StoryModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditStory(null); }}
        story={editStory}
      />
    </div>
  );
}
